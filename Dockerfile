# Backend Spring Boot — contexto na raiz do monorepo (Railway / CI).
# O Dockerfile em bolinho-bacalhau/ continua válido quando o contexto é só essa pasta (Docker Compose).
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

COPY bolinho-bacalhau/pom.xml .
RUN mvn dependency:go-offline -B -q

COPY bolinho-bacalhau/src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache wget \
    && addgroup -S spring && adduser -S spring -G spring

USER spring:spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
