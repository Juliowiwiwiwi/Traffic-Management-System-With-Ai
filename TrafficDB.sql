CREATE DATABASE TrafficDB;
USE TrafficDB;
CREATE TABLE Vehicle (
    VehicleID INT PRIMARY KEY AUTO_INCREMENT,
    OwnerName VARCHAR(255) NOT NULL,
    LicensePlate VARCHAR(50) UNIQUE NOT NULL,
    VehicleType VARCHAR(50),
    Contact VARCHAR(20),
    Address TEXT
);

CREATE TABLE Violations (
    ViolationID INT PRIMARY KEY AUTO_INCREMENT,
    VehicleID INT,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    ViolationType VARCHAR(255),
    FineAmount DECIMAL(10,2),
    Status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    Location TEXT,
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID) ON DELETE CASCADE
);

CREATE TABLE Fines (
    FineID INT PRIMARY KEY AUTO_INCREMENT,
    ViolationID INT,
    PaymentStatus ENUM('Pending', 'Completed') DEFAULT 'Pending',
    PaymentMethod VARCHAR(50),
    DatePaid DATETIME,
    FOREIGN KEY (ViolationID) REFERENCES Violations(ViolationID) ON DELETE CASCADE
);

CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('admin', 'user') NOT NULL DEFAULT 'user'
);

CREATE TABLE loginuser (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

ALTER TABLE loginuser ADD COLUMN role ENUM('admin', 'officer', 'user') NOT NULL DEFAULT 'user';
ALTER TABLE Vehicle ADD COLUMN RegisteredBy VARCHAR(80);
ALTER TABLE Violations ADD COLUMN ReportedBy VARCHAR(80);

ALTER TABLE Violations ADD COLUMN evidence_image VARCHAR(255);

ALTER TABLE Fines ADD COLUMN Amount DECIMAL(10, 2);

UPDATE loginuser SET role = 'admin' WHERE username = 'devAdmin';