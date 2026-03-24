# ============================================================
# Atalhos para o projeto Bolinho de Bacalhau
# Uso: make <comando>
# ============================================================

.PHONY: help up down build logs reset ps

help:
	@echo ""
	@echo "  Bolinho de Bacalhau — Docker Compose"
	@echo ""
	@echo "  make up       Sobe tudo (postgres + backend + frontend)"
	@echo "  make down     Para e remove os containers"
	@echo "  make build    Reconstrói as imagens do zero"
	@echo "  make logs     Mostra logs em tempo real"
	@echo "  make reset    Apaga tudo inclusive o banco e reconstrói"
	@echo "  make ps       Lista os containers e status"
	@echo ""

up:
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up -d
	@echo ""
	@echo "  Aguardando os serviços iniciarem..."
	@sleep 5
	@echo ""
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:8080"
	@echo "  Swagger:   http://localhost:8080/swagger-ui.html"
	@echo ""
	@echo "  Login: dono / bolinho123"
	@echo ""

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

reset:
	docker compose down -v
	docker compose build --no-cache
	docker compose up -d

ps:
	docker compose ps
