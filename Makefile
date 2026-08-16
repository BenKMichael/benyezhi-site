.PHONY: up down restart build rebuild logs clean clean-all shell

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