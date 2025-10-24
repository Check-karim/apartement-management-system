-- Apartment Management System Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS apartment_management_system;
USE apartment_management_system;

-- Users Table (Admin and Building Managers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Buildings Table
CREATE TABLE IF NOT EXISTS buildings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    manager_id INT,
    total_apartments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Apartments Table
CREATE TABLE IF NOT EXISTS apartments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    apartment_number VARCHAR(20) NOT NULL,
    floor_number INT,
    bedrooms INT DEFAULT 1,
    bathrooms INT DEFAULT 1,
    rent_amount DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    square_feet INT,
    is_occupied BOOLEAN DEFAULT FALSE,
    lease_start_date DATE,
    lease_end_date DATE,
    tenant_name VARCHAR(100),
    tenant_phone VARCHAR(20),
    tenant_email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_apartment (building_id, apartment_number)
);

-- Rent Payments Table
CREATE TABLE IF NOT EXISTS rent_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'check', 'bank_transfer', 'online') DEFAULT 'cash',
    receipt_number VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT,
    building_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('rent_due', 'rent_overdue', 'maintenance', 'general', 'emergency') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    reported_by VARCHAR(100),
    assigned_to INT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default admin user
-- Password: 'admin' (bcrypt hashed)
INSERT INTO users (username, password, role, full_name, email, phone) 
VALUES ('admin', '$2a$12$ahjGV9dDxGPFhJeZLgLlIOsJaZp4wimriac8texvR5ArIT9joeC3i', 'admin', 'System Administrator', 'admin@ams.com', '1234567890')
ON DUPLICATE KEY UPDATE username = username;

-- Create indexes for better performance
CREATE INDEX idx_apartments_building ON apartments(building_id);
CREATE INDEX idx_apartments_occupied ON apartments(is_occupied);
CREATE INDEX idx_apartments_tenant ON apartments(tenant_name);
CREATE INDEX idx_rent_payments_apartment ON rent_payments(apartment_id);
CREATE INDEX idx_rent_payments_date ON rent_payments(payment_date);
CREATE INDEX idx_notifications_apartment ON notifications(apartment_id);
CREATE INDEX idx_notifications_building ON notifications(building_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_sent ON notifications(is_sent);
CREATE INDEX idx_maintenance_apartment ON maintenance_requests(apartment_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_priority ON maintenance_requests(priority);

-- Sample data for testing (optional)
-- Insert a sample building manager
INSERT INTO users (username, password, role, full_name, email, phone) 
VALUES ('manager1', '$2a$12$ahjGV9dDxGPFhJeZLgLlIOsJaZp4wimriac8texvR5ArIT9joeC3i', 'manager', 'John Manager', 'manager@building1.com', '9876543210')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample buildings
INSERT INTO buildings (name, address, manager_id, total_apartments) 
VALUES 
('Sunset Apartments', '123 Main Street, City, State 12345', 2, 4),
('Riverside Complex', '456 Oak Avenue, City, State 12345', 2, 3)
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample apartments
INSERT INTO apartments (building_id, apartment_number, floor_number, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, is_occupied, tenant_name, tenant_phone, tenant_email, lease_start_date, lease_end_date) 
VALUES 
-- Sunset Apartments
(1, '101', 1, 2, 1, 1200.00, 1200.00, 850, TRUE, 'Alice Johnson', '555-0101', 'alice.johnson@email.com', '2024-01-01', '2024-12-31'),
(1, '102', 1, 1, 1, 900.00, 900.00, 650, FALSE, NULL, NULL, NULL, NULL, NULL),
(1, '201', 2, 2, 2, 1400.00, 1400.00, 950, TRUE, 'Bob Smith', '555-0102', 'bob.smith@email.com', '2024-03-01', '2025-02-28'),
(1, '202', 2, 3, 2, 1800.00, 1800.00, 1200, FALSE, NULL, NULL, NULL, NULL, NULL),
-- Riverside Complex
(2, 'A1', 1, 1, 1, 1000.00, 1000.00, 700, TRUE, 'Carol Davis', '555-0201', 'carol.davis@email.com', '2024-02-01', '2025-01-31'),
(2, 'A2', 1, 2, 1, 1300.00, 1300.00, 900, FALSE, NULL, NULL, NULL, NULL, NULL),
(2, 'B1', 2, 3, 2, 1600.00, 1600.00, 1100, TRUE, 'David Wilson', '555-0202', 'david.wilson@email.com', '2024-04-01', '2025-03-31')
ON DUPLICATE KEY UPDATE apartment_number = apartment_number;

-- Update building apartment counts
UPDATE buildings SET total_apartments = (
    SELECT COUNT(*) FROM apartments WHERE building_id = buildings.id
);

-- Insert sample rent payments
INSERT INTO rent_payments (apartment_id, payment_date, amount, payment_method, receipt_number, created_by)
VALUES
(1, '2024-01-01', 1200.00, 'bank_transfer', 'RCP-2024-001', 2),
(1, '2024-02-01', 1200.00, 'bank_transfer', 'RCP-2024-002', 2),
(3, '2024-03-01', 1400.00, 'online', 'RCP-2024-003', 2),
(5, '2024-02-01', 1000.00, 'cash', 'RCP-2024-004', 2),
(7, '2024-04-01', 1600.00, 'check', 'RCP-2024-005', 2)
ON DUPLICATE KEY UPDATE id = id;

-- Insert sample notifications
INSERT INTO notifications (building_id, title, message, notification_type, priority, created_by, is_sent)
VALUES
(1, 'Monthly Rent Reminder', 'This is a friendly reminder that your rent payment is due on the 1st of each month. Please ensure timely payment to avoid late fees.', 'rent_due', 'medium', 2, TRUE),
(1, 'Building Maintenance Notice', 'We will be conducting routine maintenance on the building elevators this weekend. Please use the stairs during maintenance hours.', 'maintenance', 'medium', 2, TRUE),
(2, 'Holiday Office Hours', 'Please note that our office will be closed on Monday for the holiday. Emergency contacts remain available 24/7.', 'general', 'low', 2, FALSE)
ON DUPLICATE KEY UPDATE id = id;

-- Insert sample maintenance requests
INSERT INTO maintenance_requests (apartment_id, title, description, priority, status, reported_by, assigned_to, estimated_cost)
VALUES
(1, 'Leaky Kitchen Faucet', 'The kitchen faucet has been dripping constantly for the past week. It needs immediate attention.', 'medium', 'pending', 'Alice Johnson', 2, 75.00),
(3, 'Broken Air Conditioning', 'The air conditioning unit is not cooling properly. Temperature control is not working.', 'high', 'in_progress', 'Bob Smith', 2, 250.00),
(5, 'Bathroom Light Fixture', 'The light fixture in the main bathroom is flickering and needs replacement.', 'low', 'completed', 'Carol Davis', 2, 45.00)
ON DUPLICATE KEY UPDATE id = id;

-- Create a view for apartment summary
CREATE OR REPLACE VIEW apartment_summary AS
SELECT 
    a.id,
    a.apartment_number,
    a.bedrooms,
    a.bathrooms,
    a.rent_amount,
    a.is_occupied,
    a.tenant_name,
    a.tenant_phone,
    b.name as building_name,
    b.address as building_address,
    u.full_name as manager_name,
    u.email as manager_email
FROM apartments a
JOIN buildings b ON a.building_id = b.id
LEFT JOIN users u ON b.manager_id = u.id;

-- Create a view for payment history
CREATE OR REPLACE VIEW payment_history AS
SELECT 
    rp.id,
    rp.payment_date,
    rp.amount,
    rp.payment_method,
    rp.receipt_number,
    a.apartment_number,
    b.name as building_name,
    a.tenant_name
FROM rent_payments rp
JOIN apartments a ON rp.apartment_id = a.id
JOIN buildings b ON a.building_id = b.id
ORDER BY rp.payment_date DESC;

-- Create stored procedure for calculating occupancy rate
DELIMITER //
CREATE PROCEDURE GetOccupancyRate(IN building_id INT)
BEGIN
    DECLARE total_apartments INT DEFAULT 0;
    DECLARE occupied_apartments INT DEFAULT 0;
    DECLARE occupancy_rate DECIMAL(5,2) DEFAULT 0;
    
    SELECT COUNT(*) INTO total_apartments
    FROM apartments 
    WHERE (building_id IS NULL OR apartments.building_id = building_id);
    
    SELECT COUNT(*) INTO occupied_apartments
    FROM apartments 
    WHERE is_occupied = TRUE 
    AND (building_id IS NULL OR apartments.building_id = building_id);
    
    IF total_apartments > 0 THEN
        SET occupancy_rate = (occupied_apartments / total_apartments) * 100;
    END IF;
    
    SELECT total_apartments, occupied_apartments, occupancy_rate;
END //
DELIMITER ;

-- Admin Interface Settings Tables
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Currencies Table
CREATE TABLE IF NOT EXISTS currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    position ENUM('before', 'after') DEFAULT 'before',
    decimal_places INT DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('currency_code', 'USD', 'string', 'Default currency code'),
('currency_symbol', '$', 'string', 'Currency symbol'),
('currency_position', 'before', 'string', 'Position of currency symbol (before/after)'),
('currency_decimal_places', '2', 'number', 'Number of decimal places for currency'),
('water_base_rate', '5.00', 'number', 'Base rate for water billing'),
('water_per_unit_rate', '0.50', 'number', 'Per unit rate for water consumption'),
('water_service_fee', '2.00', 'number', 'Service fee for water billing'),
('notification_email_enabled', 'true', 'boolean', 'Enable email notifications'),
('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, position, decimal_places, is_active, is_default) VALUES
('USD', 'US Dollar', '$', 'before', 2, TRUE, TRUE),
('EUR', 'Euro', '€', 'before', 2, TRUE, FALSE),
('GBP', 'British Pound', '£', 'before', 2, TRUE, FALSE),
('JPY', 'Japanese Yen', '¥', 'before', 0, TRUE, FALSE),
('CAD', 'Canadian Dollar', 'C$', 'before', 2, TRUE, FALSE),
('AUD', 'Australian Dollar', 'A$', 'before', 2, TRUE, FALSE),
('CHF', 'Swiss Franc', 'CHF', 'before', 2, TRUE, FALSE),
('CNY', 'Chinese Yuan', '¥', 'before', 2, TRUE, FALSE),
('INR', 'Indian Rupee', '₹', 'before', 2, TRUE, FALSE),
('MXN', 'Mexican Peso', '$', 'before', 2, TRUE, FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name), symbol = VALUES(symbol);

-- Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'manager' AND is_active = TRUE) as total_managers,
    (SELECT COUNT(*) FROM buildings) as total_buildings,
    (SELECT COUNT(*) FROM apartments) as total_apartments,
    (SELECT COUNT(*) FROM apartments WHERE is_occupied = TRUE) as occupied_apartments,
    (SELECT ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM apartments)), 2) 
     FROM apartments WHERE is_occupied = TRUE) as occupancy_rate,
    (SELECT SUM(rent_amount) FROM apartments WHERE is_occupied = TRUE) as total_monthly_revenue;

-- Create view for building performance
CREATE OR REPLACE VIEW building_performance AS
SELECT 
    b.id,
    b.name,
    b.address,
    b.total_apartments,
    COUNT(a.id) as actual_apartments,
    COUNT(CASE WHEN a.is_occupied = TRUE THEN 1 END) as occupied_count,
    ROUND((COUNT(CASE WHEN a.is_occupied = TRUE THEN 1 END) * 100.0 / COUNT(a.id)), 2) as occupancy_rate,
    SUM(CASE WHEN a.is_occupied = TRUE THEN a.rent_amount ELSE 0 END) as monthly_revenue,
    u.full_name as manager_name
FROM buildings b
LEFT JOIN apartments a ON b.id = a.building_id
LEFT JOIN users u ON b.manager_id = u.id
GROUP BY b.id, b.name, b.address, b.total_apartments, u.full_name;

-- Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') as month,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    AVG(amount) as average_payment,
    COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_payments,
    COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as bank_transfer_payments,
    COUNT(CASE WHEN payment_method = 'online' THEN 1 END) as online_payments,
    COUNT(CASE WHEN payment_method = 'check' THEN 1 END) as check_payments
FROM rent_payments
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month DESC;

-- Triggers for automatic apartment count updates
-- These triggers ensure the buildings.total_apartments field stays synchronized
-- They work alongside API route updates for redundancy and data consistency
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS after_apartment_insert
AFTER INSERT ON apartments
FOR EACH ROW
BEGIN
    UPDATE buildings 
    SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = NEW.building_id)
    WHERE id = NEW.building_id;
END$$

CREATE TRIGGER IF NOT EXISTS after_apartment_delete
AFTER DELETE ON apartments
FOR EACH ROW
BEGIN
    UPDATE buildings 
    SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = OLD.building_id)
    WHERE id = OLD.building_id;
END$$

CREATE TRIGGER IF NOT EXISTS after_apartment_update
AFTER UPDATE ON apartments
FOR EACH ROW
BEGIN
    -- Update old building if building changed
    IF OLD.building_id != NEW.building_id THEN
        UPDATE buildings 
        SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = OLD.building_id)
        WHERE id = OLD.building_id;
        
        -- Update new building
        UPDATE buildings 
        SET total_apartments = (SELECT COUNT(*) FROM apartments WHERE building_id = NEW.building_id)
        WHERE id = NEW.building_id;
    END IF;
END$$

DELIMITER ;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON apartment_management_system.* TO 'your_app_user'@'localhost';

-- Display setup completion message
SELECT 'Database setup completed successfully with admin interface support!' as message; 