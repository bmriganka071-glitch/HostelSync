-- =========================================================
-- HOSTELSYNC SEED DATA
-- =========================================================
-- Run after executing the schema.sql file.
-- The IDs are intentionally fixed through insertion order so that
-- foreign-key relationships remain consistent.

USE hostelsync;

-- ---------------------------------------------------------
-- 1. BLOCKS
-- ---------------------------------------------------------
INSERT INTO blocks (block_name) VALUES
('A Block'),
('B Block'),
('C Block'),
('D Block'),
('E Block');

-- ---------------------------------------------------------
-- 2. ROOM TYPES
-- ---------------------------------------------------------
INSERT INTO room_types (type_name, capacity, base_rate) VALUES
('Single', 1, 2500.00),
('Double', 2, 1800.00),
('Triple', 3, 1500.00),
('Four Seater', 4, 1200.00);

-- ---------------------------------------------------------
-- 3. ROOMS
-- ---------------------------------------------------------
INSERT INTO rooms
(room_number, block_id, room_type_id, current_occupants) VALUES
('101', 1, 2, 2),
('102', 1, 2, 1),
('103', 1, 3, 3),
('104', 1, 1, 1),

('201', 2, 4, 4),
('202', 2, 2, 2),
('203', 2, 3, 2),
('204', 2, 1, 0),

('301', 3, 2, 1),
('302', 3, 3, 3),
('303', 3, 4, 2),
('304', 3, 1, 1),

('401', 4, 2, 2),
('402', 4, 3, 2),
('403', 4, 4, 4),
('404', 4, 1, 0),

('501', 5, 2, 1),
('502', 5, 3, 2),
('503', 5, 4, 3),
('504', 5, 1, 0);

-- ---------------------------------------------------------
-- 4. USERS
-- ---------------------------------------------------------
-- Password hashes below are sample placeholders only.
-- Do NOT use these as real production password hashes.

INSERT INTO users
(name, email, password_hash, role, room_id) VALUES
('Mriganka Bhattacharyya', 'mriganka@hostelsync.com', 'HASH_ADMIN_001', 'ADMIN', NULL),
('Ananya Sharma', 'ananya@hostelsync.com', 'HASH_BOARDER_001', 'BOARDER', 1),
('Rahul Das', 'rahul@hostelsync.com', 'HASH_BOARDER_002', 'BOARDER', 1),
('Priya Singh', 'priya@hostelsync.com', 'HASH_BOARDER_003', 'BOARDER', 2),
('Arjun Kumar', 'arjun@hostelsync.com', 'HASH_BOARDER_004', 'BOARDER', 3),
('Sneha Roy', 'sneha@hostelsync.com', 'HASH_BOARDER_005', 'BOARDER', 5),
('Aditya Sharma', 'aditya@hostelsync.com', 'HASH_BOARDER_006', 'BOARDER', 6),
('Riya Das', 'riya@hostelsync.com', 'HASH_BOARDER_007', 'BOARDER', 7),
('Karan Singh', 'karan@hostelsync.com', 'HASH_BOARDER_008', 'BOARDER', 9),
('Neha Gupta', 'neha@hostelsync.com', 'HASH_BOARDER_009', 'BOARDER', 10),
('Vivek Paul', 'vivek@hostelsync.com', 'HASH_BOARDER_010', 'BOARDER', 11),
('Ishita Roy', 'ishita@hostelsync.com', 'HASH_BOARDER_011', 'BOARDER', 13),
('Rohan Das', 'rohan@hostelsync.com', 'HASH_BOARDER_012', 'BOARDER', 14),
('Meera Sharma', 'meera@hostelsync.com', 'HASH_BOARDER_013', 'BOARDER', 15),
('Aman Verma', 'aman@hostelsync.com', 'HASH_BOARDER_014', 'BOARDER', 17);

-- ---------------------------------------------------------
-- 5. ROOM SWAP REQUESTS
-- ---------------------------------------------------------
INSERT INTO room_swap_requests
(sender_id, receiver_id, admin_id, status) VALUES
(2, 3, NULL, 'PENDING_B'),
(4, 5, 1, 'PENDING_ADM'),
(6, 7, 1, 'APPROVED'),
(8, 9, 1, 'REJECTED'),
(10, 11, NULL, 'PENDING_B'),
(12, 13, 1, 'APPROVED');

-- ---------------------------------------------------------
-- 6. MESS REBATES
-- ---------------------------------------------------------
INSERT INTO mess_rebates
(user_id, start_date, end_date, status, approved_by_id) VALUES
(2, '2026-09-01', '2026-09-07', 'APPROVED', 1),
(3, '2026-09-10', '2026-09-15', 'PENDING', NULL),
(4, '2026-08-20', '2026-08-25', 'REJECTED', 1),
(5, '2026-09-12', '2026-09-20', 'APPROVED', 1),
(6, '2026-09-05', '2026-09-10', 'PENDING', NULL),
(7, '2026-08-01', '2026-08-05', 'APPROVED', 1),
(8, '2026-09-15', '2026-09-18', 'REJECTED', 1),
(9, '2026-09-01', '2026-09-03', 'PENDING', NULL),
(10, '2026-08-10', '2026-08-14', 'APPROVED', 1),
(11, '2026-09-20', '2026-09-25', 'PENDING', NULL);

-- ---------------------------------------------------------
-- 7. MESS BILLS
-- ---------------------------------------------------------
INSERT INTO mess_bills
(user_id, bill_month, base_fee, rebate_amount, fine_amount, due_date, status) VALUES
(2,  '2026-09-01', 3000.00, 500.00,   0.00, '2026-09-10', 'PAID'),
(3,  '2026-09-01', 3000.00,   0.00, 100.00, '2026-09-10', 'UNPAID'),
(4,  '2026-09-01', 3000.00, 300.00,   0.00, '2026-09-10', 'PAID'),
(5,  '2026-09-01', 3000.00, 600.00,   0.00, '2026-09-10', 'PAID'),
(6,  '2026-09-01', 3000.00,   0.00, 200.00, '2026-09-10', 'UNPAID'),
(7,  '2026-09-01', 3000.00, 400.00,   0.00, '2026-09-10', 'PAID'),
(8,  '2026-09-01', 3000.00,   0.00,   0.00, '2026-09-10', 'UNPAID'),
(9,  '2026-09-01', 3000.00, 200.00,  50.00, '2026-09-10', 'PAID'),
(10, '2026-09-01', 3000.00, 350.00,   0.00, '2026-09-10', 'PAID'),
(11, '2026-09-01', 3000.00,   0.00, 150.00, '2026-09-10', 'UNPAID'),
(12, '2026-09-01', 3000.00, 250.00,   0.00, '2026-09-10', 'PAID'),
(13, '2026-09-01', 3000.00,   0.00, 100.00, '2026-09-10', 'UNPAID'),
(14, '2026-09-01', 3000.00, 500.00,   0.00, '2026-09-10', 'PAID'),
(15, '2026-09-01', 3000.00,   0.00,   0.00, '2026-09-10', 'UNPAID');

-- ---------------------------------------------------------
-- 8. FEE / FINE DETAILS
-- ---------------------------------------------------------
INSERT INTO fee_fine_details
(bill_id, fine_amount, fine_date, fine_reason) VALUES
(2,  100.00, '2026-09-12', 'Late payment'),
(5,  200.00, '2026-09-14', 'Late payment'),
(8,   50.00, '2026-09-11', 'Late payment'),
(10, 150.00, '2026-09-15', 'Late payment'),
(13, 100.00, '2026-09-13', 'Late payment'),
(3,  75.00, '2026-09-16', 'Mess rule violation');

-- ---------------------------------------------------------
-- 9. NOTICES
-- ---------------------------------------------------------
INSERT INTO notices
(admin_id, title, content) VALUES
(1, 'Mess Timing Update',
 'Dinner will be served from 7:30 PM to 9:30 PM from this week.'),
(1, 'Room Inspection',
 'Routine room inspection will be conducted this Saturday.'),
(1, 'Fee Payment Reminder',
 'All boarders are requested to clear their mess bills before the due date.'),
(1, 'Water Supply Maintenance',
 'Water supply may be interrupted during scheduled maintenance.'),
(1, 'Hostel Cleanliness',
 'Boarders are requested to maintain cleanliness in rooms and common areas.');

-- ---------------------------------------------------------
-- 10. EVENTS
-- ---------------------------------------------------------
INSERT INTO events
(admin_id, title, description, event_date) VALUES
(1, 'Freshers Meet',
 'Welcome event for newly admitted boarders.',
 '2026-10-02 17:00:00'),
(1, 'Hostel Sports Day',
 'Inter-block sports competition.',
 '2026-10-10 09:00:00'),
(1, 'Cultural Evening',
 'Cultural programme organised by the hostel.',
 '2026-10-18 18:00:00'),
(1, 'Cleanliness Drive',
 'Hostel-wide cleanliness and awareness drive.',
 '2026-10-24 08:00:00'),
(1, 'Farewell Programme',
 'Farewell event for graduating boarders.',
 '2026-11-05 18:00:00');

-- =========================================================
-- END OF SEED DATA
-- =========================================================
