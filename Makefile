.PHONY: install dev-api dev-web dev docker

install:
	cd apps/web && npm install
	cd apps/api && npm install

dev-web:
	cd apps/web && npm run dev

dev-api:
	cd apps/api && npm run dev

# Run docker compose using Docker V2
docker:
	docker compose up --build
