.PHONY: up down restart build rebuild logs clean clean-all shell load-prod-dump

up:
	docker compose up -d

down:
	docker compose down

rebuild:
	docker compose up -d --build --remove-orphans
	docker image prune -f

rebuild-fresh:
	docker compose build --no-cache
	docker compose up -d --force-recreate
	docker image prune -f

logs:
	docker compose logs -f

restart:
	docker compose restart

clean:
	docker compose down --remove-orphans
	docker image prune -f

clean-all:
	docker compose down --volumes --remove-orphans
	docker system prune -af --volumes

shell:
	docker exec -it cse135 /bin/sh

# Loads database/analytics_db_dump.sql into the running local mysql-db
# container. On-demand only -- NOT part of database/init/, since that
# directory is the reproducible baseline (a fresh `down -v && up` should
# always give the clean seed data, not whatever happened to be in
# production when the dump was taken). Run this only when you specifically
# want to test against real data; it overwrites local's current
# users/events/sessions tables.
load-prod-dump:
	docker exec -i mysql_service mysql -u root -prootpassword analytics_db < database/analytics_db_dump.sql