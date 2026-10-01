-- =========================================================
-- HOSTELSYNC DATABASE
-- =========================================================

CREATE DATABASE IF NOT EXISTS hostelsync;

USE hostelsync;


-- =========================================================
-- 1. BLOCKS
-- =========================================================

CREATE TABLE blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,

    block_name VARCHAR(100) NOT NULL,

    CONSTRAINT uq_block_name
        UNIQUE (block_name)
);


-- =========================================================
-- 2. ROOM TYPES
-- =========================================================
-- All rooms currently have the same type.
-- base_rate has deliberately been removed.
-- This table is retained because room_type is part of
-- the existing HostelSync design.
-- =========================================================

CREATE TABLE room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,

    type_name VARCHAR(50) NOT NULL,

    capacity INT NOT NULL,

    CONSTRAINT uq_room_type_name
        UNIQUE (type_name),

    CONSTRAINT chk_room_type_capacity
        CHECK (capacity > 0)
);


-- =========================================================
-- 3. ROOMS
-- =========================================================
-- current_occupants has been REMOVED.
--
-- Occupancy will be calculated from:
--     COUNT(users.room_id)
--
-- Therefore users.room_id is the single source of truth.
-- =========================================================

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,

    room_number VARCHAR(20) NOT NULL,

    block_id INT NOT NULL,

    room_type_id INT NOT NULL,

    CONSTRAINT fk_room_block
        FOREIGN KEY (block_id)
        REFERENCES blocks(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_room_type
        FOREIGN KEY (room_type_id)
        REFERENCES room_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_room_number_per_block
        UNIQUE (block_id, room_number)
);


-- =========================================================
-- 4. USERS
-- =========================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('ADMIN', 'BOARDER') NOT NULL,

    room_id INT NULL,

    CONSTRAINT uq_user_email
        UNIQUE (email),

    CONSTRAINT fk_user_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- =========================================================
-- 5. ROOM SWAP REQUESTS
-- =========================================================

CREATE TABLE room_swap_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    sender_id INT NOT NULL,

    receiver_id INT NOT NULL,

    admin_id INT NULL,

    status ENUM(
        'PENDING_B',
        'PENDING_ADM',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING_B',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_swap_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_swap_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_swap_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_swap_different_users
        CHECK (sender_id <> receiver_id)
);


-- =========================================================
-- 6. MESS REBATES
-- =========================================================

CREATE TABLE mess_rebates (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    approved_by_id INT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rebate_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_rebate_approver
        FOREIGN KEY (approved_by_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_rebate_dates
        CHECK (end_date >= start_date)
);


-- =========================================================
-- 7. MESS BILLS
-- =========================================================

CREATE TABLE mess_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    bill_month DATE NOT NULL,

    base_fee DECIMAL(10,2) NOT NULL,

    rebate_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    due_date DATE NOT NULL,

    status ENUM(
        'PAID',
        'UNPAID'
    ) NOT NULL DEFAULT 'UNPAID',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bill_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_bill_base_fee
        CHECK (base_fee >= 0),

    CONSTRAINT chk_bill_rebate
        CHECK (rebate_amount >= 0),

    CONSTRAINT chk_bill_fine
        CHECK (fine_amount >= 0),

    -- One bill per user per month
    CONSTRAINT uq_user_bill_month
        UNIQUE (user_id, bill_month)
);


-- =========================================================
-- 8. FEE / FINE DETAILS
-- =========================================================

CREATE TABLE fee_fine_details (
    id INT AUTO_INCREMENT PRIMARY KEY,

    bill_id INT NOT NULL,

    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    fine_date DATE NOT NULL,

    fine_reason VARCHAR(255),

    CONSTRAINT fk_fine_bill
        FOREIGN KEY (bill_id)
        REFERENCES mess_bills(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_fine_amount
        CHECK (fine_amount >= 0)
);


-- =========================================================
-- 9. PAYMENTS
-- =========================================================
-- Workflow:
--
-- BOARDER
--    |
--    | submits transaction/payment ID
--    v
-- PENDING
--    |
--    +------> VERIFIED
--    |
--    +------> FLAGGED
--
-- Payment is associated with the logged-in user and
-- the relevant mess bill.
-- =========================================================

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    payment_reference VARCHAR(100) NOT NULL,

    user_id INT NOT NULL,

    bill_id INT NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'PENDING',
        'VERIFIED',
        'FLAGGED'
    ) NOT NULL DEFAULT 'PENDING',

    verified_at TIMESTAMP NULL,

    verified_by_id INT NULL,

    CONSTRAINT uq_payment_reference
        UNIQUE (payment_reference),

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id)
        REFERENCES mess_bills(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_verifier
        FOREIGN KEY (verified_by_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0)
);


-- =========================================================
-- 10. NOTICES
-- =========================================================

CREATE TABLE notices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    admin_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notice_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- =========================================================
-- 11. EVENTS
-- =========================================================

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,

    admin_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    event_date DATETIME NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);