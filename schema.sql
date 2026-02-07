-- Driver History View Database Schema
-- Run this script to create the required tables

CREATE DATABASE IF NOT EXISTS driver_history;
USE driver_history;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- GPS tracks table (stores individual GPS points)
CREATE TABLE IF NOT EXISTS gps_tracks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6, 2),
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_timestamp (driver_id, timestamp),
    INDEX idx_timestamp (timestamp)
);

-- Stops table
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(36) PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    arrival_time DATETIME NOT NULL,
    departure_time DATETIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    stop_type ENUM('delivery', 'break', 'pickup', 'other') DEFAULT 'delivery',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_date (driver_id, arrival_time),
    INDEX idx_arrival (arrival_time)
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(36) PRIMARY KEY,
    stop_id VARCHAR(36) NOT NULL,
    address VARCHAR(500) NOT NULL,
    customer_name VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    completed_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_stop (stop_id)
);

-- Sample data insertion
-- Insert sample drivers
INSERT INTO drivers (id, name, vehicle_id) VALUES
    ('driver-001', 'Alex Thompson', 'VAN-001'),
    ('driver-002', 'Sarah Johnson', 'VAN-002'),
    ('driver-003', 'Mike Williams', 'VAN-003')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- View to get daily driver summary
CREATE OR REPLACE VIEW driver_daily_summary AS
SELECT
    d.id as driver_id,
    d.name as driver_name,
    DATE(s.arrival_time) as work_date,
    COUNT(DISTINCT s.id) as total_stops,
    COUNT(DISTINCT CASE WHEN s.stop_type = 'delivery' THEN s.id END) as delivery_stops,
    COUNT(DISTINCT CASE WHEN del.status = 'completed' THEN del.id END) as completed_deliveries,
    COUNT(DISTINCT CASE WHEN del.status = 'failed' THEN del.id END) as failed_deliveries,
    MIN(s.arrival_time) as first_stop,
    MAX(s.departure_time) as last_stop
FROM drivers d
LEFT JOIN stops s ON d.id = s.driver_id
LEFT JOIN deliveries del ON s.id = del.stop_id
GROUP BY d.id, d.name, DATE(s.arrival_time);
