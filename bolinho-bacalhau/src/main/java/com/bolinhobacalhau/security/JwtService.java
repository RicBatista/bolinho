package com.bolinhobacalhau.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;

@Service @Slf4j
public class JwtService {

    @Value("${jwt.secret:bolinho-bacalhau-super-secret-key-2024-change-in-production-min32}")
    private String secret;

    @Value("${jwt.expiration-hours:24}")
    private long expirationHours;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UserDetails user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getAuthorities().iterator().next().getAuthority());
        return Jwts.builder()
                .claims(claims).subject(user.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationHours * 3_600_000))
                .signWith(getKey()).compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isValid(String token, UserDetails user) {
        try {
            return extractUsername(token).equals(user.getUsername()) && !isExpired(token);
        } catch (JwtException e) {
            log.warn("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    private boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(
            Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload());
    }
}
