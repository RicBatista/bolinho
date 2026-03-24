# ── Estágio 1: build do React ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# ── Estágio 2: Nginx serve os arquivos estáticos ───────────
FROM nginx:alpine

# Copia o build gerado
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do Nginx: proxy /api → backend:8080
#                        SPA fallback para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
