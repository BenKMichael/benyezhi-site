CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_db.users TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_db.events TO 'app_user'@'%';
FLUSH PRIVILEGES;
