CREATE DATABASE IF NOT EXISTS hostelsync;
USE hostelsync;


-- =========================================================
-- 1. BLOCK
-- =========================================================

CREATE TABLE blocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    block_name VARCHAR(100) NOT NULL UNIQUE
);


-- =========================================================
-- 2. ROOM_TYPE
-- =========================================================

CREATE TABLE room_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,

    CHECK (capacity > 0),
    CHECK (base_rate >= 0)
);


-- =========================================================
-- 3. ROOMS
-- =========================================================

CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,

    room_number VARCHAR(20) NOT NULL,

    block_id INT NOT NULL,
    room_type_id INT NOT NULL,

    current_occupants INT NOT NULL DEFAULT 0,

    FOREIGN KEY (block_id)
        REFERENCES blocks(id),

    FOREIGN KEY (room_type_id)
        REFERENCES room_types(id),

    CHECK (current_occupants >= 0),

    UNIQUE (block_id, room_number)
);


-- =========================================================
-- 4. USERS
-- =========================================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('ADMIN', 'BOARDER') NOT NULL,

    room_id INT,

    FOREIGN KEY (room_id)
        REFERENCES rooms(id)
);


-- =========================================================
-- 5. ROOM SWAP REQUESTS
-- =========================================================

CREATE TABLE room_swap_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,

    sender_id INT NOT NULL,

    receiver_id INT NOT NULL,

    admin_id INT,

    status ENUM(
        'PENDING_B',
        'PENDING_ADM',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING_B',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id)
        REFERENCES users(id),

    FOREIGN KEY (receiver_id)
        REFERENCES users(id),

    FOREIGN KEY (admin_id)
        REFERENCES users(id),

    CHECK (sender_id <> receiver_id)
);


-- =========================================================
-- 6. MESS REBATES
-- =========================================================

CREATE TABLE mess_rebates (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    approved_by_id INT,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (approved_by_id)
        REFERENCES users(id),

    CHECK (end_date >= start_date)
);


-- =========================================================
-- 7. MESS BILLS
-- =========================================================

CREATE TABLE mess_bills (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT NOT NULL,

    bill_month DATE NOT NULL,

    base_fee DECIMAL(10,2) NOT NULL,

    rebate_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    due_date DATE NOT NULL,

    status ENUM(
        'PAID',
        'UNPAID'
    ) NOT NULL DEFAULT 'UNPAID',

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    CHECK (base_fee >= 0),

    CHECK (rebate_amount >= 0),

    CHECK (fine_amount >= 0),

    UNIQUE (user_id, bill_month)
);


-- =========================================================
-- 8. FEE / FINE DETAILS
-- =========================================================

CREATE TABLE fee_fine_details (
    id INT PRIMARY KEY AUTO_INCREMENT,

    bill_id INT NOT NULL,

    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    fine_date DATE,

    fine_reason VARCHAR(255),

    FOREIGN KEY (bill_id)
        REFERENCES mess_bills(id),

    CHECK (fine_amount >= 0)
);


-- =========================================================
-- 9. NOTICES
-- =========================================================

CREATE TABLE notices (
    id INT PRIMARY KEY AUTO_INCREMENT,

    admin_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES users(id)
);


-- =========================================================
-- 10. EVENTS
-- =========================================================

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,

    admin_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    event_date DATETIME NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES users(id)
);