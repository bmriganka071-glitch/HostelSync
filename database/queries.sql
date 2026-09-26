-- =========================================================
-- HOSTELSYNC QUERY FILE
-- =========================================================
-- Execute these queries after schema.sql and seed.sql.
-- Queries are grouped by purpose for DBMS practice.
-- =========================================================

USE hostelsync;


-- =========================================================
-- A. BASIC RETRIEVAL
-- =========================================================

-- 1. Display all blocks.
SELECT * FROM blocks;

-- 2. Display all rooms.
SELECT * FROM rooms;

-- 3. Display all boarders.
SELECT id, name, email, room_id
FROM users
WHERE role = 'BOARDER';

-- 4. Display all administrators.
SELECT id, name, email
FROM users
WHERE role = 'ADMIN';

-- 5. Display unpaid mess bills.
SELECT *
FROM mess_bills
WHERE status = 'UNPAID';

-- 6. Display pending room-swap requests.
SELECT *
FROM room_swap_requests
WHERE status IN ('PENDING_B', 'PENDING_ADM');


-- =========================================================
-- B. WHERE / ORDER BY / DISTINCT
-- =========================================================

-- 7. Find rooms with at least two occupants.
SELECT *
FROM rooms
WHERE current_occupants >= 2;

-- 8. Find empty rooms.
SELECT *
FROM rooms
WHERE current_occupants = 0;

-- 9. Display rooms in ascending order of occupancy.
SELECT *
FROM rooms
ORDER BY current_occupants ASC;

-- 10. Display users alphabetically.
SELECT id, name, email
FROM users
ORDER BY name ASC;

-- 11. Display distinct bill statuses.
SELECT DISTINCT status
FROM mess_bills;

-- 12. Find bills having a rebate greater than 300.
SELECT *
FROM mess_bills
WHERE rebate_amount > 300;

-- 13. Find users whose names start with 'A'.
SELECT *
FROM users
WHERE name LIKE 'A%';

-- 14. Find rooms with occupancy between 1 and 3.
SELECT *
FROM rooms
WHERE current_occupants BETWEEN 1 AND 3;


-- =========================================================
-- C. JOINS
-- =========================================================

-- 15. Display each room with its block name.
SELECT r.id, r.room_number, b.block_name, r.current_occupants
FROM rooms r
JOIN blocks b ON r.block_id = b.id;

-- 16. Display each room with its block and room type.
SELECT
    r.room_number,
    b.block_name,
    rt.type_name,
    rt.capacity,
    r.current_occupants
FROM rooms r
JOIN blocks b ON r.block_id = b.id
JOIN room_types rt ON r.room_type_id = rt.id;

-- 17. Display each boarder with their room and block.
SELECT
    u.name,
    u.email,
    r.room_number,
    b.block_name
FROM users u
JOIN rooms r ON u.room_id = r.id
JOIN blocks b ON r.block_id = b.id
WHERE u.role = 'BOARDER';

-- 18. Display room-swap requests with sender and receiver names.
SELECT
    rs.id,
    sender.name AS sender,
    receiver.name AS receiver,
    rs.status,
    rs.created_at
FROM room_swap_requests rs
JOIN users sender ON rs.sender_id = sender.id
JOIN users receiver ON rs.receiver_id = receiver.id;

-- 19. Display room-swap requests together with the admin handling them.
SELECT
    rs.id,
    sender.name AS sender,
    receiver.name AS receiver,
    admin.name AS admin,
    rs.status
FROM room_swap_requests rs
JOIN users sender ON rs.sender_id = sender.id
JOIN users receiver ON rs.receiver_id = receiver.id
LEFT JOIN users admin ON rs.admin_id = admin.id;

-- 20. Display mess bills with boarder names.
SELECT
    mb.id,
    u.name,
    mb.bill_month,
    mb.base_fee,
    mb.rebate_amount,
    mb.fine_amount,
    mb.status
FROM mess_bills mb
JOIN users u ON mb.user_id = u.id;


-- =========================================================
-- D. AGGREGATE FUNCTIONS
-- =========================================================

-- 21. Count total users.
SELECT COUNT(*) AS total_users
FROM users;

-- 22. Count total boarders.
SELECT COUNT(*) AS total_boarders
FROM users
WHERE role = 'BOARDER';

-- 23. Count rooms in each block.
SELECT
    b.block_name,
    COUNT(r.id) AS number_of_rooms
FROM blocks b
LEFT JOIN rooms r ON b.id = r.block_id
GROUP BY b.id, b.block_name;

-- 24. Calculate total current occupants.
SELECT SUM(current_occupants) AS total_occupants
FROM rooms;

-- 25. Find average room occupancy.
SELECT AVG(current_occupants) AS average_occupancy
FROM rooms;

-- 26. Find maximum room occupancy.
SELECT MAX(current_occupants) AS maximum_occupancy
FROM rooms;

-- 27. Find minimum room occupancy.
SELECT MIN(current_occupants) AS minimum_occupancy
FROM rooms;

-- 28. Calculate total outstanding bill amount.
SELECT SUM(base_fee + fine_amount - rebate_amount) AS outstanding_amount
FROM mess_bills
WHERE status = 'UNPAID';


-- =========================================================
-- E. GROUP BY / HAVING
-- =========================================================

-- 29. Count boarders in each room.
SELECT
    r.room_number,
    COUNT(u.id) AS boarder_count
FROM rooms r
LEFT JOIN users u ON r.id = u.room_id
WHERE r.current_occupants > 0
GROUP BY r.id, r.room_number;

-- 30. Find blocks having more than 3 rooms.
SELECT
    b.block_name,
    COUNT(r.id) AS room_count
FROM blocks b
JOIN rooms r ON b.id = r.block_id
GROUP BY b.id, b.block_name
HAVING COUNT(r.id) > 3;

-- 31. Count room-swap requests by status.
SELECT status, COUNT(*) AS request_count
FROM room_swap_requests
GROUP BY status;

-- 32. Count mess bills by payment status.
SELECT status, COUNT(*) AS bill_count
FROM mess_bills
GROUP BY status;


-- =========================================================
-- F. SUBQUERIES
-- =========================================================

-- 33. Find rooms whose occupancy is greater than average occupancy.
SELECT *
FROM rooms
WHERE current_occupants >
      (SELECT AVG(current_occupants) FROM rooms);

-- 34. Find boarders who have unpaid bills.
SELECT name, email
FROM users
WHERE id IN (
    SELECT user_id
    FROM mess_bills
    WHERE status = 'UNPAID'
);

-- 35. Find the boarder(s) with the highest mess bill.
SELECT u.name, mb.base_fee, mb.fine_amount, mb.rebate_amount
FROM users u
JOIN mess_bills mb ON u.id = mb.user_id
WHERE (mb.base_fee + mb.fine_amount - mb.rebate_amount) = (
    SELECT MAX(base_fee + fine_amount - rebate_amount)
    FROM mess_bills
);

-- 36. Find rooms with occupancy equal to the maximum occupancy.
SELECT *
FROM rooms
WHERE current_occupants = (
    SELECT MAX(current_occupants)
    FROM rooms
);


-- =========================================================
-- G. EXISTS / NOT EXISTS
-- =========================================================

-- 37. Find users who have at least one mess rebate request.
SELECT u.id, u.name
FROM users u
WHERE EXISTS (
    SELECT 1
    FROM mess_rebates mr
    WHERE mr.user_id = u.id
);

-- 38. Find users who have never requested a mess rebate.
SELECT u.id, u.name
FROM users u
WHERE u.role = 'BOARDER'
AND NOT EXISTS (
    SELECT 1
    FROM mess_rebates mr
    WHERE mr.user_id = u.id
);


-- =========================================================
-- H. INSERT / UPDATE / DELETE
-- =========================================================

-- 39. Insert a new notice.
INSERT INTO notices (admin_id, title, content)
VALUES (
    1,
    'Library Timing',
    'The hostel library will remain open until 11 PM.'
);

-- 40. Mark a mess bill as paid.
UPDATE mess_bills
SET status = 'PAID'
WHERE id = 3;

-- 41. Approve a mess rebate.
UPDATE mess_rebates
SET status = 'APPROVED',
    approved_by_id = 1
WHERE id = 2;

-- 42. Update a room's occupancy.
UPDATE rooms
SET current_occupants = 2
WHERE id = 2;

-- 43. Reject a room-swap request.
UPDATE room_swap_requests
SET status = 'REJECTED',
    admin_id = 1
WHERE id = 5;

-- 44. Delete a notice.
-- Run only when the notice is no longer required.
DELETE FROM notices
WHERE id = 5;


-- =========================================================
-- I. CASE EXPRESSIONS
-- =========================================================

-- 45. Display payment condition for every bill.
SELECT
    id,
    user_id,
    base_fee,
    rebate_amount,
    fine_amount,
    CASE
        WHEN status = 'PAID' THEN 'Payment Completed'
        ELSE 'Payment Pending'
    END AS payment_condition
FROM mess_bills;

-- 46. Classify rooms according to occupancy.
SELECT
    room_number,
    current_occupants,
    CASE
        WHEN current_occupants = 0 THEN 'EMPTY'
        WHEN current_occupants < 3 THEN 'PARTIALLY OCCUPIED'
        ELSE 'HIGH OCCUPANCY'
    END AS occupancy_status
FROM rooms;


-- =========================================================
-- J. DATE FUNCTIONS
-- =========================================================

-- 47. Display all upcoming events.
SELECT *
FROM events
WHERE event_date >= CURRENT_TIMESTAMP
ORDER BY event_date;

-- 48. Display events in October 2026.
SELECT *
FROM events
WHERE event_date >= '2026-10-01'
  AND event_date < '2026-11-01';

-- 49. Display rebates lasting at least 5 days.
SELECT
    id,
    user_id,
    start_date,
    end_date,
    DATEDIFF(end_date, start_date) + 1 AS rebate_days
FROM mess_rebates
WHERE DATEDIFF(end_date, start_date) + 1 >= 5;


-- =========================================================
-- K. ROOM / CAPACITY ANALYSIS
-- =========================================================

-- 50. Display available capacity in every room.
SELECT
    r.room_number,
    rt.capacity,
    r.current_occupants,
    (rt.capacity - r.current_occupants) AS available_capacity
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id;

-- 51. Find rooms having at least one vacant bed.
SELECT
    r.room_number,
    rt.capacity,
    r.current_occupants
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.current_occupants < rt.capacity;

-- 52. Find completely full rooms.
SELECT
    r.room_number,
    rt.capacity,
    r.current_occupants
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id
WHERE r.current_occupants = rt.capacity;


-- =========================================================
-- L. VIEWS
-- =========================================================

-- 53. Create a view for boarder room information.
CREATE OR REPLACE VIEW boarder_room_details AS
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    r.room_number,
    b.block_name,
    rt.type_name,
    rt.capacity
FROM users u
JOIN rooms r ON u.room_id = r.id
JOIN blocks b ON r.block_id = b.id
JOIN room_types rt ON r.room_type_id = rt.id
WHERE u.role = 'BOARDER';

-- View the result.
SELECT * FROM boarder_room_details;

-- 54. Create a view for unpaid bills.
CREATE OR REPLACE VIEW unpaid_bill_details AS
SELECT
    mb.id AS bill_id,
    u.name,
    u.email,
    mb.bill_month,
    mb.base_fee,
    mb.rebate_amount,
    mb.fine_amount,
    (mb.base_fee + mb.fine_amount - mb.rebate_amount) AS net_amount,
    mb.due_date
FROM mess_bills mb
JOIN users u ON mb.user_id = u.id
WHERE mb.status = 'UNPAID';

-- View the result.
SELECT * FROM unpaid_bill_details;


-- =========================================================
-- M. TRANSACTION EXAMPLES
-- =========================================================

-- 55. Example: approve a room swap and update room occupants.
-- Check the affected records before committing.

START TRANSACTION;

UPDATE room_swap_requests
SET status = 'APPROVED',
    admin_id = 1
WHERE id = 1;

-- Review before committing.
SELECT *
FROM room_swap_requests
WHERE id = 1;

COMMIT;

-- If something is wrong before COMMIT, use:
-- ROLLBACK;


-- =========================================================
-- N. USEFUL ADMIN QUERIES
-- =========================================================

-- 56. Display all notices with administrator names.
SELECT
    n.id,
    n.title,
    n.content,
    u.name AS posted_by,
    n.created_at
FROM notices n
JOIN users u ON n.admin_id = u.id
ORDER BY n.created_at DESC;

-- 57. Display all events with administrator names.
SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    u.name AS created_by
FROM events e
JOIN users u ON e.admin_id = u.id
ORDER BY e.event_date;

-- 58. Display all pending administrative work.
SELECT
    'ROOM_SWAP' AS request_type,
    id,
    status
FROM room_swap_requests
WHERE status = 'PENDING_ADM'
UNION ALL
SELECT
    'MESS_REBATE' AS request_type,
    id,
    status
FROM mess_rebates
WHERE status = 'PENDING';


-- =========================================================
-- O. DATABASE INFORMATION / SCHEMA INSPECTION
-- =========================================================

-- 59. Show all tables.
SHOW TABLES;

-- 60. Describe a table.
DESCRIBE users;

-- 61. Show the complete CREATE TABLE statement.
SHOW CREATE TABLE rooms;

-- 62. Show the current database.
SELECT DATABASE();

-- =========================================================
-- END OF QUERY FILE
-- =========================================================
