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
    bathrooms DECIMAL(3, 1) DEFAULT 1,
    kitchen BOOLEAN DEFAULT TRUE,
    rent_amount DECIMAL(10, 2) NOT NULL,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    water_meter_reading DECIMAL(10, 2) DEFAULT 0,
    is_occupied BOOLEAN DEFAULT FALSE,
    lease_start_date DATE,
    lease_end_date DATE,
    tenant_name VARCHAR(100),
    tenant_id_passport VARCHAR(100),
    tenant_phone VARCHAR(20),
    tenant_phone_country_code VARCHAR(10) DEFAULT '+250',
    tenant_email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    tenant_id_document_path VARCHAR(255),
    tenant_contract_path VARCHAR(255),
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

-- Water Invoices Table (WASAC Bills)
CREATE TABLE IF NOT EXISTS water_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_m3 DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    price_per_m3 DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount / total_m3) STORED,
    invoice_file_path VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Pompe Electricity Settings (per building)
CREATE TABLE IF NOT EXISTS pompe_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL UNIQUE,
    total_price_per_period DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Water Bills Table (per apartment)
CREATE TABLE IF NOT EXISTS water_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    apartment_id INT NOT NULL,
    invoice_id INT NOT NULL,
    building_id INT NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    previous_meter_reading DECIMAL(10, 2) NOT NULL,
    current_meter_reading DECIMAL(10, 2) NOT NULL,
    used_m3 DECIMAL(10, 2) GENERATED ALWAYS AS (current_meter_reading - previous_meter_reading) STORED,
    price_per_m3 DECIMAL(10, 2) NOT NULL,
    water_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((current_meter_reading - previous_meter_reading) * price_per_m3) STORED,
    pompe_price_per_m3 DECIMAL(10, 2) DEFAULT 0,
    pompe_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((current_meter_reading - previous_meter_reading) * pompe_price_per_m3) STORED,
    total_amount DECIMAL(10, 2) GENERATED ALWAYS AS ((current_meter_reading - previous_meter_reading) * (price_per_m3 + pompe_price_per_m3)) STORED,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMP NULL,
    sms_delivery_status ENUM('pending', 'sent', 'failed', 'no_phone') DEFAULT 'pending',
    sms_error_message TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES water_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_water_bills_apartment (apartment_id),
    INDEX idx_water_bills_invoice (invoice_id),
    INDEX idx_water_bills_building (building_id),
    INDEX idx_water_bills_period (billing_period_start, billing_period_end),
    INDEX idx_water_bills_paid (is_paid),
    INDEX idx_water_bills_sms (sms_sent, sms_delivery_status)
);

-- SMS Notification Log
CREATE TABLE IF NOT EXISTS sms_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    water_bill_id INT,
    apartment_id INT,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'no_phone') DEFAULT 'pending',
    delivery_status VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (water_bill_id) REFERENCES water_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    INDEX idx_sms_water_bill (water_bill_id),
    INDEX idx_sms_apartment (apartment_id),
    INDEX idx_sms_status (status),
    INDEX idx_sms_sent_at (sent_at)
);

-- Contract Templates Table
CREATE TABLE IF NOT EXISTS contract_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
INSERT INTO apartments (building_id, apartment_number, floor_number, bedrooms, bathrooms, kitchen, rent_amount, deposit_amount, water_meter_reading, is_occupied, tenant_name, tenant_phone, tenant_email, lease_start_date, lease_end_date) 
VALUES 
-- Sunset Apartments
(1, '101', 1, 2, 1, TRUE, 1200.00, 1200.00, 0, TRUE, 'Alice Johnson', '555-0101', 'alice.johnson@email.com', '2024-01-01', '2024-12-31'),
(1, '102', 1, 1, 1, TRUE, 900.00, 900.00, 0, FALSE, NULL, NULL, NULL, NULL, NULL),
(1, '201', 2, 2, 2, TRUE, 1400.00, 1400.00, 0, TRUE, 'Bob Smith', '555-0102', 'bob.smith@email.com', '2024-03-01', '2025-02-28'),
(1, '202', 2, 3, 2, TRUE, 1800.00, 1800.00, 0, FALSE, NULL, NULL, NULL, NULL, NULL),
-- Riverside Complex
(2, 'A1', 1, 1, 1, TRUE, 1000.00, 1000.00, 0, TRUE, 'Carol Davis', '555-0201', 'carol.davis@email.com', '2024-02-01', '2025-01-31'),
(2, 'A2', 1, 2, 1, TRUE, 1300.00, 1300.00, 0, FALSE, NULL, NULL, NULL, NULL, NULL),
(2, 'B1', 2, 3, 2, TRUE, 1600.00, 1600.00, 0, TRUE, 'David Wilson', '555-0202', 'david.wilson@email.com', '2024-04-01', '2025-03-31')
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

-- Insert default pompe settings for buildings
INSERT INTO pompe_settings (building_id, total_price_per_period, is_active, notes)
VALUES
(1, 50000.00, TRUE, 'Monthly electricity cost for water pump'),
(2, 45000.00, TRUE, 'Monthly electricity cost for water pump')
ON DUPLICATE KEY UPDATE building_id = building_id;

-- Insert default contract template
INSERT INTO contract_templates (name, description, content, is_active, is_default, created_by)
VALUES (
    'Standard Lease Agreement',
    'Default lease agreement template for residential apartments',
    'RESIDENTIAL LEASE AGREEMENT\n\nThis Lease Agreement ("Agreement") is entered into on {{LEASE_START_DATE}} between:\n\nLANDLORD: {{BUILDING_NAME}}\nAddress: {{BUILDING_ADDRESS}}\nPhone: {{MANAGER_PHONE}}\n\nTENANT: {{TENANT_NAME}}\nID/Passport: {{TENANT_ID_PASSPORT}}\nPhone: {{TENANT_PHONE}}\nEmail: {{TENANT_EMAIL}}\n\nPREMISES\nApartment Number: {{APARTMENT_NUMBER}}\nFloor: {{FLOOR_NUMBER}}\nBedrooms: {{BEDROOMS}}\nBathrooms: {{BATHROOMS}}\n\nTERM\nLease Start Date: {{LEASE_START_DATE}}\nLease End Date: {{LEASE_END_DATE}}\n\nRENT\nMonthly Rent: {{RENT_AMOUNT}} {{CURRENCY_SYMBOL}}\nSecurity Deposit: {{DEPOSIT_AMOUNT}} {{CURRENCY_SYMBOL}}\nWater Bills: Calculated monthly based on meter readings\n\nPAYMENT TERMS\n- Rent is due on the 1st day of each month\n- Late payments after the 5th will incur a late fee\n- Water bills are calculated separately and due upon notification\n- All payments should be made to the building manager\n\nTENANT RESPONSIBILITIES\n- Maintain the apartment in good condition\n- Report any maintenance issues promptly\n- Pay rent and utilities on time\n- Comply with building rules and regulations\n- Provide accurate water meter readings when requested\n\nLANDLORD RESPONSIBILITIES\n- Maintain common areas and building facilities\n- Address maintenance requests in a timely manner\n- Provide 24-hour emergency contact\n- Calculate and notify water bills accurately\n\nTERMINATION\n- Either party may terminate with 30 days written notice\n- Tenant must return apartment in good condition\n- Security deposit will be returned within 14 days after move-out\n\nEMERGENCY CONTACT\nName: {{EMERGENCY_CONTACT_NAME}}\nPhone: {{EMERGENCY_CONTACT_PHONE}}\n\nBy signing below, both parties agree to the terms and conditions outlined in this Agreement.\n\n_________________________          _________________________\nLandlord Signature                 Tenant Signature\nDate: _______________              Date: _______________\n\nFor office use:\nWater Meter Reading at Move-in: {{WATER_METER_READING}} m³',
    TRUE,
    TRUE,
    1
)
ON DUPLICATE KEY UPDATE name = name;

-- Create a view for apartment summary
CREATE OR REPLACE VIEW apartment_summary AS
SELECT 
    a.id,
    a.apartment_number,
    a.bedrooms,
    a.bathrooms,
    a.kitchen,
    a.rent_amount,
    a.water_meter_reading,
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
('currency_code', 'RWF', 'string', 'Default currency code'),
('currency_symbol', 'FRw', 'string', 'Currency symbol'),
('currency_position', 'after', 'string', 'Position of currency symbol (before/after)'),
('currency_decimal_places', '2', 'number', 'Number of decimal places for currency'),
('notification_email_enabled', 'true', 'boolean', 'Enable email notifications'),
('notification_sms_enabled', 'false', 'boolean', 'Enable SMS notifications (requires TextBee API key)'),
('sms_api_provider', 'textbee', 'string', 'SMS API provider (textbee)'),
('sms_api_key', '', 'string', 'TextBee API Key (get from textbee.rw)'),
('sms_sender_name', 'AMS', 'string', 'SMS sender name (max 11 characters)')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, position, decimal_places, is_active, is_default) VALUES
('RWF', 'Rwandan Franc', 'FRw', 'after', 2, TRUE, TRUE),
('USD', 'US Dollar', '$', 'before', 2, TRUE, FALSE),
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

-- Create view for water billing summary
CREATE OR REPLACE VIEW water_billing_summary AS
SELECT 
    wb.id,
    wb.billing_period_start,
    wb.billing_period_end,
    a.apartment_number,
    a.tenant_name,
    a.tenant_phone,
    a.tenant_phone_country_code,
    b.name as building_name,
    wb.previous_meter_reading,
    wb.current_meter_reading,
    wb.used_m3,
    wb.price_per_m3,
    wb.water_amount,
    wb.pompe_price_per_m3,
    wb.pompe_amount,
    wb.total_amount,
    wb.is_paid,
    wb.payment_date,
    wb.sms_sent,
    wb.sms_delivery_status,
    wi.invoice_number
FROM water_bills wb
JOIN apartments a ON wb.apartment_id = a.id
JOIN buildings b ON wb.building_id = b.id
JOIN water_invoices wi ON wb.invoice_id = wi.id
ORDER BY wb.created_at DESC;

-- Create view for water billing analytics by building
CREATE OR REPLACE VIEW water_billing_analytics AS
SELECT 
    b.id as building_id,
    b.name as building_name,
    DATE_FORMAT(wb.billing_period_start, '%Y-%m') as billing_month,
    COUNT(wb.id) as total_bills,
    SUM(wb.used_m3) as total_m3_used,
    SUM(wb.water_amount) as total_water_amount,
    SUM(wb.pompe_amount) as total_pompe_amount,
    SUM(wb.total_amount) as total_amount,
    COUNT(CASE WHEN wb.is_paid = TRUE THEN 1 END) as paid_bills,
    COUNT(CASE WHEN wb.is_paid = FALSE THEN 1 END) as unpaid_bills,
    COUNT(CASE WHEN wb.sms_sent = TRUE THEN 1 END) as sms_sent_count,
    COUNT(CASE WHEN wb.sms_delivery_status = 'failed' THEN 1 END) as sms_failed_count
FROM buildings b
LEFT JOIN water_bills wb ON b.id = wb.building_id
GROUP BY b.id, b.name, DATE_FORMAT(wb.billing_period_start, '%Y-%m')
ORDER BY billing_month DESC, b.name;

-- Create view for apartments with tenant details
CREATE OR REPLACE VIEW apartment_tenant_details AS
SELECT 
    a.id,
    a.apartment_number,
    a.floor_number,
    a.bedrooms,
    a.bathrooms,
    a.kitchen,
    a.rent_amount,
    a.water_meter_reading,
    a.is_occupied,
    a.tenant_name,
    a.tenant_id_passport,
    a.tenant_phone,
    a.tenant_phone_country_code,
    CONCAT(a.tenant_phone_country_code, a.tenant_phone) as full_phone_number,
    a.tenant_email,
    a.tenant_id_document_path,
    a.tenant_contract_path,
    a.lease_start_date,
    a.lease_end_date,
    a.emergency_contact_name,
    a.emergency_contact_phone,
    b.id as building_id,
    b.name as building_name,
    b.address as building_address,
    u.full_name as manager_name,
    u.email as manager_email,
    u.phone as manager_phone
FROM apartments a
JOIN buildings b ON a.building_id = b.id
LEFT JOIN users u ON b.manager_id = u.id;

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