-- Least-privilege accounts, one per service, replacing the single
-- full-access app_user the mysql image would otherwise auto-create.
-- Runs after 01_users.sql, 02_events.sql, and 03_sessions.sql so the
-- target tables exist.

-- auth: full CRUD on users (login lookup, plus the admin-only add/edit/
-- remove pages on /users). Owns the shared sessions table: creates/
-- refreshes/deletes rows as people log in, stay active, and log out.
CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_db.users TO 'auth_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_db.sessions TO 'auth_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_db.events TO 'auth_user'@'%';

-- reporting: reads events, plus the admin add/remove endpoints for
-- POST/DELETE /api/static. Never touches the users table. Read-only on
-- sessions -- it only ever needs to look an existing session up, never
-- create or modify one (auth owns that).
CREATE USER IF NOT EXISTS 'reporting_user'@'%' IDENTIFIED BY 'reporting_password';
GRANT SELECT, INSERT, DELETE ON analytics_db.events TO 'reporting_user'@'%';
GRANT SELECT ON analytics_db.sessions TO 'reporting_user'@'%';

-- collector: write-only ingestion via POST /log. Never reads anything,
-- never touches the users or sessions tables.
CREATE USER IF NOT EXISTS 'collector_user'@'%' IDENTIFIED BY 'collector_password';
GRANT INSERT ON analytics_db.events TO 'collector_user'@'%';

FLUSH PRIVILEGES;
