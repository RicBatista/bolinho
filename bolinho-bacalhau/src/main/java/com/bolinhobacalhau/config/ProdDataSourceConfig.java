package com.bolinhobacalhau.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.util.StringUtils;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Produção: aceita
 * <ul>
 *   <li>{@code SPRING_DATASOURCE_URL} (jdbc:postgresql://...) + user/senha — Docker Compose</li>
 *   <li>{@code PGHOST}, {@code PGPORT}, {@code PGDATABASE}, {@code PGUSER}, {@code PGPASSWORD} — Railway ao ligar PostgreSQL</li>
 *   <li>{@code DATABASE_URL} como {@code postgresql://...} — converte para JDBC (Railway/Render)</li>
 *   <li>{@code DATABASE_URL} como {@code jdbc:postgresql://...} + {@code DATABASE_USERNAME} / {@code DATABASE_PASSWORD}</li>
 * </ul>
 */
@Configuration
@Profile("prod")
public class ProdDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(
            @Value("${SPRING_DATASOURCE_URL:}") String springDsUrl,
            @Value("${SPRING_DATASOURCE_USERNAME:}") String springUser,
            @Value("${SPRING_DATASOURCE_PASSWORD:}") String springPass,
            @Value("${PGHOST:}") String pgHost,
            @Value("${PGPORT:5432}") String pgPort,
            @Value("${PGDATABASE:}") String pgDatabase,
            @Value("${PGUSER:}") String pgUser,
            @Value("${PGPASSWORD:}") String pgPassword,
            @Value("${DATABASE_URL:}") String databaseUrl,
            @Value("${DATABASE_USERNAME:}") String databaseUsername,
            @Value("${DATABASE_PASSWORD:}") String databasePassword
    ) {
        // 1) JDBC explícito (docker-compose)
        if (StringUtils.hasText(springDsUrl) && springDsUrl.startsWith("jdbc:postgresql:")) {
            return build(springDsUrl, springUser, springPass);
        }
        // 2) Variáveis PG* (Railway)
        if (StringUtils.hasText(pgHost) && StringUtils.hasText(pgDatabase)) {
            String port = StringUtils.hasText(pgPort) ? pgPort : "5432";
            String jdbc = String.format("jdbc:postgresql://%s:%s/%s", pgHost, port, pgDatabase);
            return build(jdbc, pgUser, pgPassword);
        }
        // 3) DATABASE_URL legado
        if (StringUtils.hasText(databaseUrl)) {
            if (databaseUrl.startsWith("jdbc:postgresql:")) {
                return build(databaseUrl, databaseUsername, databasePassword);
            }
            if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                Parsed p = parsePostgresUri(databaseUrl);
                return build(p.jdbcUrl, p.user, p.pass);
            }
        }
        throw new IllegalStateException(
                "Configure o PostgreSQL: ligue o serviço no Railway (PGHOST, PGDATABASE, …) ou defina "
                        + "SPRING_DATASOURCE_URL (jdbc:postgresql://…) ou DATABASE_URL (postgresql://… ou jdbc:…).");
    }

    private static DataSource build(String jdbcUrl, String username, String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        if (StringUtils.hasText(username)) {
            ds.setUsername(username);
        }
        if (StringUtils.hasText(password)) {
            ds.setPassword(password);
        }
        ds.setMaximumPoolSize(10);
        return ds;
    }

    private static Parsed parsePostgresUri(String url) {
        try {
            String normalized = url.replaceFirst("^postgres(ql)?://", "http://");
            URI uri = URI.create(normalized);
            String host = uri.getHost();
            if (host == null) {
                throw new IllegalArgumentException("host ausente");
            }
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();
            String db = path != null && path.startsWith("/") ? path.substring(1) : path;
            if (db == null || db.isEmpty()) {
                throw new IllegalArgumentException("nome da base ausente");
            }
            if (db.contains("?")) {
                db = db.substring(0, db.indexOf('?'));
            }
            String userInfo = uri.getRawUserInfo();
            String user = "";
            String pass = "";
            if (StringUtils.hasText(userInfo)) {
                int colon = userInfo.indexOf(':');
                if (colon >= 0) {
                    user = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
                    pass = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
                } else {
                    user = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                }
            }
            Parsed p = new Parsed();
            p.jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, db);
            p.user = user;
            p.pass = pass;
            return p;
        } catch (Exception e) {
            throw new IllegalArgumentException("DATABASE_URL inválido para PostgreSQL: " + url, e);
        }
    }

    private static final class Parsed {
        String jdbcUrl;
        String user;
        String pass;
    }
}
