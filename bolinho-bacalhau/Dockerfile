# =============================================
# Estágio 1: Build com Maven
# =============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copia o pom.xml primeiro e baixa as dependências
# Isso cria uma camada de cache — se o pom.xml não mudar,
# o Docker reutiliza essa camada e não baixa tudo de novo
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Agora copia o código-fonte e compila
COPY src ./src
RUN mvn clean package -DskipTests -B

# =============================================
# Estágio 2: Imagem final enxuta (só JRE)
# =============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# wget: healthcheck do Docker Compose (imagem JRE alpine não inclui por padrão)
RUN apk add --no-cache wget \
    && addgroup -S spring && adduser -S spring -G spring

USER spring:spring

# Copia apenas o JAR gerado
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.profiles.active=prod \
  -Dserver.port=${PORT:-8080} \
  -jar app.jar"]
