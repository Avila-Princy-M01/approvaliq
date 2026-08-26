.PHONY: up down build test lint format seed clean

up:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build

test:
	cd services/api && pytest -q
	cd services/matching && pytest -q
	cd services/ingestion && pytest -q

lint:
	ruff check services/ scripts/
	cd frontend && [ -f package.json ] && npm run lint || true

format:
	black services/ scripts/
	ruff check --fix services/ scripts/

seed:
	docker compose exec api python /app/scripts/seed_demo_data.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	docker compose down -v
