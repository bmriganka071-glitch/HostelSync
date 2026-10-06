-- =========================================================
-- HOSTELSYNC DEVELOPMENT SEED DATA
-- =========================================================

USE hostelsync;


-- =========================================================
-- 1. BLOCKS
-- =========================================================

INSERT INTO blocks (block_name)
VALUES
    ('Block A'),
    ('Block B');


-- =========================================================
-- 2. ROOM TYPES
-- =========================================================

INSERT INTO room_types (type_name, capacity)
VALUES
    ('SINGLE', 1),
    ('DOUBLE', 2);


-- =========================================================
-- 3. ROOMS
-- =========================================================

INSERT INTO rooms (room_number, block_id, room_type_id)
VALUES
    ('101', 1, 2),
    ('102', 1, 2),
    ('103', 1, 2),
    ('104', 1, 2),
    ('201', 2, 1),
    ('202', 2, 1),
    ('203', 2, 2),
    ('204', 2, 2);


-- =========================================================
-- 4. USERS
-- =========================================================
-- Development credentials:
--
-- Admin:
-- admin@hostelsync.com
-- Admin@123
--
-- Boarders:
-- boarder1@hostelsync.com
-- boarder2@hostelsync.com
-- boarder3@hostelsync.com
-- boarder4@hostelsync.com
-- boarder5@hostelsync.com
-- boarder6@hostelsync.com
--
-- All boarders use:
-- Boarder@123
--
-- Development use only.


INSERT INTO users
    (name, email, password_hash, role, room_id)
VALUES
(
    'Hostel Admin',
    'admin@hostelsync.com',
    'scrypt:32768:8:1$AtrTfRbwluWD1QT5$7b59ce9387e22db0ec7467c20e6f53e03fb94acbadf457805f2788aba7aea3bdda9b0ed304b8e0e66a52838b7fac20b338115850f5c59afa3386bea956d2cc79',
    'ADMIN',
    NULL
),
(
    'Aarav Sharma',
    'boarder1@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    1
),
(
    'Rohan Das',
    'boarder2@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    1
),
(
    'Aditya Singh',
    'boarder3@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    2
),
(
    'Rahul Kumar',
    'boarder4@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    3
),
(
    'Arjun Das',
    'boarder5@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    5
),
(
    'Vivek Sharma',
    'boarder6@hostelsync.com',
    'scrypt:32768:8:1$yOirlC93QrNnZTpC$18015b13f3d7ba2dbc0559c592e20aa57ccb9831501206c56f645ab4fe8488433d08507818bd8fe64ab5fbd0cd188678399d5c8e032ba0c8cc2ca5fda1412a3e',
    'BOARDER',
    7
);


-- =========================================================
-- 5. MESS REBATES
-- =========================================================

INSERT INTO mess_rebates
    (user_id, start_date, end_date, status, approved_by_id)
VALUES
    (2, '2026-10-10', '2026-10-14', 'APPROVED', 1),
    (3, '2026-10-20', '2026-10-22', 'PENDING', NULL);


-- =========================================================
-- 6. MESS BILLS
-- =========================================================

INSERT INTO mess_bills
    (
        user_id,
        bill_month,
        base_fee,
        rebate_amount,
        fine_amount,
        due_date,
        status
    )
VALUES
    (2, '2026-10-01', 3540.00, 500.00, 0.00, '2026-10-10', 'UNPAID'),
    (3, '2026-10-01', 3540.00, 0.00, 0.00, '2026-10-10', 'UNPAID'),
    (4, '2026-10-01', 3540.00, 300.00, 0.00, '2026-10-10', 'UNPAID'),
    (5, '2026-10-01', 3540.00, 0.00, 100.00, '2026-10-10', 'UNPAID'),
    (6, '2026-10-01', 3540.00, 0.00, 0.00, '2026-10-10', 'UNPAID');


-- =========================================================
-- 7. FEE / FINE DETAILS
-- =========================================================

INSERT INTO fee_fine_details
    (bill_id, fine_amount, fine_date, fine_reason)
VALUES
    (
        4,
        100.00,
        '2026-10-05',
        'Late hostel fee payment'
    );


-- =========================================================
-- 8. SAMPLE PAYMENT
-- =========================================================

INSERT INTO payments
    (
        payment_reference,
        user_id,
        bill_id,
        amount,
        status
    )
VALUES
    (
        'DEV-UTR-001',
        2,
        1,
        3040.00,
        'PENDING'
    );


-- =========================================================
-- 9. NOTICES
-- =========================================================

INSERT INTO notices
    (admin_id, title, content)
VALUES
    (
        1,
        'Mess Timing Update',
        'Dinner timing will be from 7:00 PM to 8:00 PM from Monday onwards.'
    ),
    (
        1,
        'Hostel Maintenance',
        'Water maintenance work will be carried out in Block A on 12 October 2026.'
    );


-- =========================================================
-- 10. EVENTS
-- =========================================================

INSERT INTO events
    (admin_id, title, description, event_date)
VALUES
    (
        1,
        'Hostel Sports Day',
        'Annual hostel sports event for all boarders.',
        '2026-10-15 10:00:00'
    ),
    (
        1,
        'Cultural Evening',
        'Hostel cultural programme and student performances.',
        '2026-10-25 18:00:00'
    );