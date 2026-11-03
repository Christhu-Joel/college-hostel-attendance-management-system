-- =============================================================
-- Hostel Attendance Management System - Login / Users
-- MySQL 8.0 / MariaDB 10.4
-- Run this once to enable the login page.
-- =============================================================

CREATE DATABASE IF NOT EXISTS hostel_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hostel_attendance;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'warden',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

-- Default login:  username = admin   password = admin123
-- Change the password after your first login.
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  'c354de8deb00e2f9d4c492459091862b:65dc953ddd1b3e2ad156f01c9e17feccab7983a131ba1baa52aceb0360a04b997d3f4b813276a55c0d0cd4e708f5a86ccc489a63da3d14f8a1aebba45197cc21',
  'warden'
)
ON DUPLICATE KEY UPDATE username = username;
