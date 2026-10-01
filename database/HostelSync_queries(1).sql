USE hostelsync;

-- =========================================================
-- HOSTELSYNC: COMMON APPLICATION / ADMIN QUERIES
-- MySQL 8+
-- =========================================================

-- 1. List all blocks
SELECT id, block_name
FROM blocks
ORDER BY block_name;


-- 2. List rooms with block, room type, capacity and live occupancy
-- Occupancy source of truth: users.room_id (BOARDER accounts only).
SELECT
    r.id AS room_id,
    b.block_name,
    r.room_number,
    rt.type_name,
    rt.capacity,
    COUNT(u.id) AS current_occupants,
    rt.capacity - COUNT(u.id) AS available_beds
FROM rooms AS r
JOIN blocks AS b ON b.id = r.block_id
JOIN room_types AS rt ON rt.id = r.room_type_id
LEFT JOIN users AS u
    ON u.room_id = r.id
   AND u.role = 'BOARDER'
GROUP BY r.id, b.block_name, r.room_number, rt.type_name, rt.capacity
ORDER BY b.block_name, r.room_number;


-- 3. List boarders and their current room (if allocated)
SELECT
    u.id,
    u.name,
    u.email,
    b.block_name,
    r.room_number
FROM users AS u
LEFT JOIN rooms AS r ON r.id = u.room_id
LEFT JOIN blocks AS b ON b.id = r.block_id
WHERE u.role = 'BOARDER'
ORDER BY u.name;


-- 4. Find rooms with at least one available bed
SELECT
    r.id,
    b.block_name,
    r.room_number,
    rt.capacity,
    COUNT(u.id) AS current_occupants,
    rt.capacity - COUNT(u.id) AS available_beds
FROM rooms AS r
JOIN blocks AS b ON b.id = r.block_id
JOIN room_types AS rt ON rt.id = r.room_type_id
LEFT JOIN users AS u
    ON u.room_id = r.id
   AND u.role = 'BOARDER'
GROUP BY r.id, b.block_name, r.room_number, rt.capacity
HAVING COUNT(u.id) < rt.capacity
ORDER BY b.block_name, r.room_number;


-- 5. Allocate an unassigned boarder to a room.
-- Run as a transaction; replace IDs with actual values.
START TRANSACTION;

SELECT id
FROM rooms
WHERE id = 2
FOR UPDATE;

SELECT id
FROM users
WHERE id = 10 AND role = 'BOARDER' AND room_id IS NULL
FOR UPDATE;

-- Application must first verify that room 2 has capacity.
UPDATE users
SET room_id = 2
WHERE id = 10
  AND role = 'BOARDER'
  AND room_id IS NULL;

-- Check ROW_COUNT() in the application; ROLLBACK if no row changed
-- or if the room-capacity validation failed.
COMMIT;


-- 6. Create a room-swap request
-- Sender and receiver IDs must be different boarders.
INSERT INTO room_swap_requests (sender_id, receiver_id, status)
SELECT sender.id, receiver.id, 'PENDING_B'
FROM users AS sender
JOIN users AS receiver
  ON receiver.id = 5
WHERE sender.id = 3
  AND sender.role = 'BOARDER'
  AND receiver.role = 'BOARDER'
  AND sender.id <> receiver.id
  AND sender.room_id IS NOT NULL
  AND receiver.room_id IS NOT NULL;


-- 7. Receiver accepts a pending request
UPDATE room_swap_requests
SET status = 'PENDING_ADM'
WHERE id = 1
  AND receiver_id = 5
  AND status = 'PENDING_B';


-- 8. Admin rejects a request
UPDATE room_swap_requests
SET status = 'REJECTED',
    admin_id = 1
WHERE id = 2
  AND status = 'PENDING_ADM';


-- 9. Admin approves and actually swaps two users' room assignments.
-- Execute this transaction from backend logic with validated IDs.
-- The backend should check that the actor is an ADMIN, the request
-- is PENDING_ADM, both users still have rooms, and any room rules
-- are satisfied. Lock rows in a consistent order to reduce deadlocks.
START TRANSACTION;

SELECT id, sender_id, receiver_id
FROM room_swap_requests
WHERE id = 2 AND status = 'PENDING_ADM'
FOR UPDATE;

SELECT id, room_id
FROM users
WHERE id IN (
    SELECT sender_id FROM room_swap_requests WHERE id = 2
    UNION
    SELECT receiver_id FROM room_swap_requests WHERE id = 2
)
ORDER BY id
FOR UPDATE;

-- Example for request 2 and users 6 and 7.
-- In the backend, obtain these IDs from the locked request row,
-- rather than trusting client-supplied IDs.
SELECT room_id INTO @sender_room
FROM users WHERE id = 6;

SELECT room_id INTO @receiver_room
FROM users WHERE id = 7;

-- Backend must validate that both values are non-NULL and that
-- capacity/hostel rules permit the exchange before this update.
UPDATE users
SET room_id = CASE id
    WHEN 6 THEN @receiver_room
    WHEN 7 THEN @sender_room
END
WHERE id IN (6, 7);

UPDATE room_swap_requests
SET status = 'APPROVED',
    admin_id = 1
WHERE id = 2
  AND status = 'PENDING_ADM';

-- Backend must verify the expected row counts and ROLLBACK if
-- any validation or update fails; otherwise COMMIT.
COMMIT;
-- Backend must ROLLBACK on any failed validation/update.
-- For production use, implement this as a stored procedure or a
-- parameterized backend transaction; do not blindly run the sample IDs.


-- 10. Submit a payment against a bill.
-- In the real application, user_id is taken from the authenticated
-- session, never trusted from a user-supplied form field.
INSERT INTO payments
    (payment_reference, user_id, bill_id, amount, status)
VALUES
    ('YOUR-UNIQUE-TRANSACTION-ID', 3, 1, 2700.00, 'PENDING');


-- 11. List pending payments for admin verification
SELECT
    p.id,
    p.payment_reference,
    u.name AS boarder_name,
    u.email,
    b.block_name,
    r.room_number,
    p.bill_id,
    p.amount,
    p.submitted_at,
    p.status
FROM payments AS p
JOIN users AS u ON u.id = p.user_id
LEFT JOIN rooms AS r ON r.id = u.room_id
LEFT JOIN blocks AS b ON b.id = r.block_id
WHERE p.status = 'PENDING'
ORDER BY p.submitted_at;


-- 12. Verify a payment
-- Verify bank reference/amount outside SQL first.
START TRANSACTION;

SELECT id, bill_id, user_id, amount, status
FROM payments
WHERE id = 1
FOR UPDATE;

UPDATE payments
SET status = 'VERIFIED',
    verified_at = CURRENT_TIMESTAMP,
    verified_by_id = 1
WHERE id = 1
  AND status = 'PENDING';

-- Backend should check that exactly one row was updated.
-- If this is the agreed rule that a verified payment settles the bill,
-- update the bill in the same transaction after validating amount:
-- UPDATE mess_bills SET status = 'PAID' WHERE id = <verified bill id>;
COMMIT;


-- 13. Flag a payment for follow-up
UPDATE payments
SET status = 'FLAGGED',
    verified_by_id = 1,
    verified_at = CURRENT_TIMESTAMP
WHERE id = 3
  AND status = 'PENDING';


-- 14. List bills for a particular boarder
SELECT
    id,
    bill_month,
    base_fee,
    rebate_amount,
    fine_amount,
    (base_fee - rebate_amount + fine_amount) AS total_payable,
    due_date,
    status
FROM mess_bills
WHERE user_id = 3
ORDER BY bill_month DESC;


-- 15. List unpaid bills and calculate total payable
SELECT
    mb.id AS bill_id,
    u.id AS user_id,
    u.name,
    mb.bill_month,
    mb.base_fee,
    mb.rebate_amount,
    mb.fine_amount,
    (mb.base_fee - mb.rebate_amount + mb.fine_amount) AS total_payable,
    mb.due_date
FROM mess_bills AS mb
JOIN users AS u ON u.id = mb.user_id
WHERE mb.status = 'UNPAID'
ORDER BY mb.due_date, u.name;


-- 16. Find overdue unpaid bills
SELECT
    mb.id AS bill_id,
    u.name,
    u.email,
    mb.bill_month,
    mb.due_date,
    DATEDIFF(CURRENT_DATE, mb.due_date) AS overdue_days,
    mb.fine_amount,
    (mb.base_fee - mb.rebate_amount + mb.fine_amount) AS total_payable
FROM mess_bills AS mb
JOIN users AS u ON u.id = mb.user_id
WHERE mb.status = 'UNPAID'
  AND mb.due_date < CURRENT_DATE
ORDER BY mb.due_date;


-- 17. List rebate requests awaiting admin decision
SELECT
    mr.id,
    u.name,
    mr.start_date,
    mr.end_date,
    DATEDIFF(mr.end_date, mr.start_date) + 1 AS requested_days,
    mr.status
FROM mess_rebates AS mr
JOIN users AS u ON u.id = mr.user_id
WHERE mr.status = 'PENDING'
ORDER BY mr.start_date;


-- 18. Approve a rebate request
UPDATE mess_rebates
SET status = 'APPROVED',
    approved_by_id = 1
WHERE id = 2
  AND status = 'PENDING';


-- 19. Reject a rebate request
UPDATE mess_rebates
SET status = 'REJECTED',
    approved_by_id = 1
WHERE id = 2
  AND status = 'PENDING';


-- 20. Create a monthly mess bill
-- Illustrative single-boarder insert; calculate approved rebates and
-- final amount in backend logic before insertion.
INSERT INTO mess_bills
    (user_id, bill_month, base_fee, rebate_amount, fine_amount, due_date, status)
VALUES
    (10, '2026-10-01', 3000.00, 0.00, 0.00, '2026-10-10', 'UNPAID');


-- 21. List notices with publisher
SELECT
    n.id,
    n.title,
    n.content,
    n.created_at,
    u.name AS published_by
FROM notices AS n
JOIN users AS u ON u.id = n.admin_id
ORDER BY n.created_at DESC;


-- 22. List upcoming events
SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    u.name AS published_by
FROM events AS e
JOIN users AS u ON u.id = e.admin_id
WHERE e.event_date >= CURRENT_TIMESTAMP
ORDER BY e.event_date;


-- 23. Admin dashboard: pending swaps, rebates and payments
SELECT 'ROOM_SWAP' AS task_type, id AS task_id, status,
       created_at AS submitted_at
FROM room_swap_requests
WHERE status IN ('PENDING_B', 'PENDING_ADM')
UNION ALL
SELECT 'MESS_REBATE', id, status, created_at
FROM mess_rebates
WHERE status = 'PENDING'
UNION ALL
SELECT 'PAYMENT', id, status, submitted_at
FROM payments
WHERE status = 'PENDING'
ORDER BY submitted_at;


-- 24. Delete a notice (if permitted by application policy)
DELETE FROM notices
WHERE id = 2;


-- 25. Inspect table definitions
SHOW TABLES;
DESCRIBE users;
DESCRIBE rooms;
DESCRIBE payments;
