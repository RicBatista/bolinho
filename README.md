# Bolinho de Bacalhau — Sistema de Gestão

Backend Spring Boot + Frontend React + PostgreSQL.

## Rodar com Docker (recomendado)

### Pré-requisito
Docker Desktop instalado e **aberto/rodando**.

### 1 comando para subir tudo:
```bash
docker compose up -d
```

Aguarde ~3 minutos no primeiro build. Depois acesse:
- **Painel:** http://localhost:3000
- **Swagger:** http://localhost:8080/swagger-ui.html

### Usuários padrão
| Usuário | Senha       | Perfil       |
|---------|-------------|--------------|
| dono    | bolinho123  | Acesso total |
| gestor  | gestor123   | Estoque/compras |
| caixa   | caixa123    | Apenas PDV   |

### Comandos úteis
```bash
docker compose logs -f          # ver logs ao vivo
docker compose down             # parar
docker compose down -v          # parar e apagar banco
docker compose up -d --build    # rebuild após mudanças
```

## Deploy Railway (backend)
1. `git push` para o GitHub
2. Novo projeto → **Deploy from GitHub** → este repositório
3. O ficheiro **`railway.toml` na raiz** e o **`Dockerfile` na raiz** fazem o build com **Docker** (não Railpack). Não é preciso definir “Root Directory” para uma subpasta.
4. Adicionar o plugin **PostgreSQL** e copiar as variáveis `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` (ou mapear para `DATABASE_USERNAME` conforme `application-prod.properties`)
5. Definir pelo menos: `JWT_SECRET` (valor longo e aleatório), `CORS_ALLOWED_ORIGINS` (URL do teu frontend, ex. `https://xxx.up.railway.app`)
6. Em **Settings → Networking** gerar domínio para o serviço do backend

Se o deploy ainda tentar **Railpack**, confirma em **Settings → Build** que o builder é **Dockerfile** e o caminho `Dockerfile` na raiz.
