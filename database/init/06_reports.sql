CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL,
    created_by INT NULL,
    creator_name VARCHAR(50) NOT NULL,
    range_start DATETIME NOT NULL,
    range_end DATETIME NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_reports_user
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

GRANT SELECT, INSERT, DELETE ON analytics_db.reports TO 'app_user'@'%';
FLUSH PRIVILEGES;
