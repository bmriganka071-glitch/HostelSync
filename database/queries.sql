-- =========================================================
-- HOSTELSYNC DATABASE QUERIES
-- =========================================================

USE hostelsync;


-- =========================================================
-- 1. VIEW ALL BOARDERS WITH ROOM DETAILS
-- =========================================================

SELECT
    u.id,
    u.name,
    u.email,
    r.room_number,
    b.block_name AS block
FROM users u
LEFT JOIN rooms r
    ON u.room_id = r.id
LEFT JOIN blocks b
    ON r.block_id = b.id
WHERE u.role = 'BOARDER'
ORDER BY u.id;


-- =========================================================
-- 2. ROOM OCCUPANCY
-- =========================================================

SELECT
    r.id,
    r.room_number,
    b.block_name AS block,
    rt.capacity,
    COUNT(u.id) AS occupants
FROM rooms r
JOIN blocks b
    ON r.block_id = b.id
JOIN room_types rt
    ON r.room_type_id = rt.id
LEFT JOIN users u
    ON u.room_id = r.id
GROUP BY
    r.id,
    r.room_number,
    b.block_name,
    rt.capacity
ORDER BY
    b.block_name,
    r.room_number;


-- =========================================================
-- 3. AVAILABLE ROOMS
-- =========================================================

SELECT
    r.id,
    r.room_number,
    b.block_name AS block,
    rt.capacity,
    COUNT(u.id) AS occupants
FROM rooms r
JOIN blocks b
    ON r.block_id = b.id
JOIN room_types rt
    ON r.room_type_id = rt.id
LEFT JOIN users u
    ON u.room_id = r.id
GROUP BY
    r.id,
    r.room_number,
    b.block_name,
    rt.capacity
HAVING COUNT(u.id) < rt.capacity
ORDER BY
    b.block_name,
    r.room_number;


-- =========================================================
-- 4. BOARDERS IN A PARTICULAR ROOM
-- =========================================================

SELECT
    u.id,
    u.name,
    u.email
FROM users u
WHERE u.room_id = 1;


-- =========================================================
-- 5. MESS BILL SUMMARY
-- =========================================================

SELECT
    mb.id,
    u.name,
    mb.bill_month,
    mb.base_fee,
    mb.rebate_amount,
    mb.fine_amount,
    (mb.base_fee - mb.rebate_amount + mb.fine_amount) AS total_amount,
    mb.status,
    mb.due_date
FROM mess_bills mb
JOIN users u
    ON mb.user_id = u.id
ORDER BY mb.bill_month DESC;


-- =========================================================
-- 6. PENDING PAYMENTS FOR ADMIN VERIFICATION
-- =========================================================

SELECT
    p.id,
    p.payment_reference,
    u.name AS user_name,
    u.email,
    p.bill_id,
    p.amount,
    p.status,
    p.submitted_at
FROM payments p
JOIN users u
    ON p.user_id = u.id
WHERE p.status = 'PENDING'
ORDER BY p.submitted_at;


-- =========================================================
-- 7. MESS REBATE REQUESTS
-- =========================================================

SELECT
    mr.id,
    u.name,
    mr.start_date,
    mr.end_date,
    mr.status,
    mr.approved_by_id
FROM mess_rebates mr
JOIN users u
    ON mr.user_id = u.id
ORDER BY mr.id DESC;


-- =========================================================
-- 8. ROOM SWAP REQUESTS
-- =========================================================

SELECT
    rs.id,
    sender.name AS sender,
    receiver.name AS receiver,
    rs.status,
    rs.created_at,
    rs.updated_at
FROM room_swap_requests rs
JOIN users sender
    ON rs.sender_id = sender.id
JOIN users receiver
    ON rs.receiver_id = receiver.id
ORDER BY rs.created_at DESC;


-- =========================================================
-- 9. NOTICES
-- =========================================================

SELECT
    n.id,
    n.title,
    n.content,
    u.name AS created_by,
    n.created_at
FROM notices n
JOIN users u
    ON n.admin_id = u.id
ORDER BY n.created_at DESC;


-- =========================================================
-- 10. UPCOMING EVENTS
-- =========================================================

SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    u.name AS created_by
FROM events e
JOIN users u
    ON e.admin_id = u.id
WHERE e.event_date >= NOW()
ORDER BY e.event_date;


-- =========================================================
-- 11. ROOM OCCUPANCY SUMMARY BY BLOCK
-- =========================================================

SELECT
    b.block_name,
    COUNT(r.id) AS total_rooms,
    SUM(rt.capacity) AS total_capacity,
    COUNT(u.id) AS occupied_beds
FROM blocks b
JOIN rooms r
    ON r.block_id = b.id
JOIN room_types rt
    ON r.room_type_id = rt.id
LEFT JOIN users u
    ON u.room_id = r.id
GROUP BY b.id, b.block_name
ORDER BY b.block_name;