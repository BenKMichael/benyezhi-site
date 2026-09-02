-- Shared session store table (express-mysql-session's documented schema,
-- plus a custom user_id column it does not manage itself). Both auth and
-- reporting point their express-session middleware at this same table so
-- a login in auth is recognized by reporting too, using the same signed
-- analytics_sid cookie.
--
-- user_id is populated manually by auth right after login (the store
-- library only ever writes session_id/expires/data itself). The foreign
-- key with ON DELETE CASCADE means removing a user from `users` also
-- removes any of their active sessions automatically -- no extra query
-- needed in application code for that part.
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    user_id INT NULL,
    PRIMARY KEY (session_id),
    INDEX idx_user_id (user_id),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
