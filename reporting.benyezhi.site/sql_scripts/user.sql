CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '65535 (0xFFFF): Admin, 1 (0x0001): Basic User',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password: Test1234!
INSERT INTO users (username, email, password_hash, is_admin)
VALUES 
    ('yezhi', 'yew020@ucsd.edu', '$2b$10$wJ2vUfO93KfZYw2Y3n/6gugv8M9f1dZlZke9H6qGqV0kC/d7V5d6K', 65535)
ON DUPLICATE KEY UPDATE username=username;