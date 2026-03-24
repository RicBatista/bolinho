# ── Estágio 1: build do React ──────────────────────────────
FROM node:20-alpine AS builder

# Railway: variável com "Available at Build Time" (URL pública do backend, sem barra final)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# ── Estágio 2: Nginx serve os arquivos estáticos ───────────
FROM nginx:alpine

# Copia o build gerado
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx.conf = sem proxy (Railway). Compose: build-arg NGINX_CONF=nginx.compose.conf
ARG NGINX_CONF=nginx.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh 2>/dev/null || true; chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
