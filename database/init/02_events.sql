CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT,
    client_timestamp DATETIME(3),
    server_timestamp DATETIME(3),
    ip VARCHAR(45),
    data JSON,
    INDEX idx_session_id (session_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
