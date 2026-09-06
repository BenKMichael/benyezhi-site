CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password: Test1234!
INSERT INTO users (username, email, password_hash, role)
VALUES
    ('yezhi', 'yew020@ucsd.edu', '$2b$10$O1WZNKWIL3gfO/Tk4ZOzYO/Ep/b6rgv7Np73wfdnq3/Aib0SFGs1S', 'superadmin')
ON DUPLICATE KEY UPDATE username=username;

-- Password: grader_user
INSERT INTO users (username, email, password_hash, role)
VALUES
    ('grader_user', 'grader_user@example.com', '$2b$10$FrUxApaISa3FA/oiK/RdPeMMkM16L5Mvr.Fu44IoWzny3zyNDl7Re', 'viewer')
ON DUPLICATE KEY UPDATE username=username;

-- Password: grader_admin
INSERT INTO users (username, email, password_hash, role)
VALUES
    ('grader_admin', 'grader_admin@example.com', '$2b$10$6HOrpkAEtJVoV5CNCBvuH.kiy6Yr6M5VsaSmlRhQfmo2x6vFbMKae', 'superadmin')
ON DUPLICATE KEY UPDATE username=username;
