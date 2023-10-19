CREATE DATABASE coulomb;
USE coulomb;
CREATE TABLE vehicle (
    vehicle_id INT PRIMARY KEY,
    model VARCHAR(255) NOT NULL,
    owner_id INT NOT NULL,
    coordinates_lat DECIMAL(8, 6) NOT NULL,
    coordinates_long DECIMAL(9, 6) NOT NULL,
    status ENUM('Active', 'Inactive', 'In Repair') NOT NULL,
    battery_percentage DECIMAL(5, 2) CHECK (battery_percentage >= 0 AND battery_percentage <= 100) NOT NULL,
    battery_health DECIMAL(5, 2) CHECK (battery_health >= 0 AND battery_health <= 100) NOT NULL
);
ALTER TABLE vehicle
ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;