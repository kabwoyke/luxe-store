-- Run once in your local MySQL (root or an admin user). Change the password first.
CREATE DATABASE IF NOT EXISTS luxestore
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'luxe'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON luxestore.* TO 'luxe'@'localhost';
FLUSH PRIVILEGES;
