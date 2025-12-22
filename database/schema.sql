-- Database Schema for Role-Based Company Portal

-- Create database
CREATE DATABASE IF NOT EXISTS company_portal;
USE company_portal;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'admin') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Register
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    entered_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Bill Register
CREATE TABLE bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Paid', 'Pending') DEFAULT 'Pending',
    entered_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Advance Register
CREATE TABLE advances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    advance_amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    remaining_due DECIMAL(10, 2) NOT NULL,
    entered_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Logs (Bonus Feature)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values TEXT,
    new_values TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data for testing
INSERT INTO users (username, password, role) VALUES 
('admin', '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456', 'admin'),  -- Password: admin123
('employee1', '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456', 'employee'),  -- Password: emp123
('employee2', '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456', 'employee');  -- Password: emp123

INSERT INTO transactions (transaction_id, date, description, amount, entered_by) VALUES 
('TXN001', '2025-12-01', 'Office supplies purchase', 250.00, 2),
('TXN002', '2025-12-05', 'Travel expenses', 1200.50, 3);

INSERT INTO bills (bill_number, vendor_name, date, amount, status, entered_by) VALUES 
('BILL001', 'ABC Suppliers', '2025-12-02', 500.00, 'Paid', 2),
('BILL002', 'XYZ Services', '2025-12-08', 1800.75, 'Pending', 3);

INSERT INTO advances (employee_id, advance_amount, date, remaining_due, entered_by) VALUES 
(2, 1000.00, '2025-12-03', 250.00, 2),
(3, 1500.00, '2025-12-07', 0.00, 3);