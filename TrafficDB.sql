CREATE DATABASE TrafficDB;
USE TrafficDB;

-- 1. Create the Authentication Table
CREATE TABLE loginuser (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'officer', 'user') NOT NULL DEFAULT 'user'
);

-- 2. Create the Vehicles Table
CREATE TABLE Vehicle (
    VehicleID INT PRIMARY KEY AUTO_INCREMENT,
    OwnerName VARCHAR(255) NOT NULL,
    LicensePlate VARCHAR(50) UNIQUE NOT NULL,
    VehicleType VARCHAR(50),
    Contact VARCHAR(20),
    Address TEXT,
    RegisteredBy VARCHAR(80)
);

-- 3. Create the Violations Table (Requires Vehicle table first!)
CREATE TABLE Violations (
    ViolationID INT PRIMARY KEY AUTO_INCREMENT,
    VehicleID INT,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    ViolationType VARCHAR(255),
    FineAmount DECIMAL(10,2),
    Status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    Location TEXT,
    ReportedBy VARCHAR(80),
    evidence_image VARCHAR(255),
    violation_hash VARCHAR(64),
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID) ON DELETE CASCADE
);

-- 4. Create the Fines Table (Requires Violations table first!)
CREATE TABLE Fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    ViolationID INT,
    PaymentStatus ENUM('Pending', 'Completed') DEFAULT 'Pending',
    PaymentMethod VARCHAR(50),
    DatePaid DATETIME,
    Amount DECIMAL(10, 2),
    FOREIGN KEY (ViolationID) REFERENCES Violations(ViolationID) ON DELETE CASCADE
);

UPDATE loginuser SET role = 'admin' WHERE username = 'devAdmin';

