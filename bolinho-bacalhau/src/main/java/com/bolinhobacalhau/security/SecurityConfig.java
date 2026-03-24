package com.bolinhobacalhau.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.*;
import java.util.*;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**","/api/health","/swagger-ui/**","/swagger-ui.html",
                    "/api-docs/**","/h2-console/**","/","/index.html",
                    "/assets/**","/*.js","/*.css","/*.ico").permitAll()
                .requestMatchers("/api/fornecedores/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers("/api/compras/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers("/api/notificacoes/**").hasRole("DONO")
                .requestMatchers("/api/dashboard/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers("/api/ingredientes/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers(HttpMethod.GET, "/api/clientes/**").hasAnyRole("DONO","GESTOR","CAIXA")
                .requestMatchers(HttpMethod.POST, "/api/clientes/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers(HttpMethod.PUT, "/api/clientes/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers(HttpMethod.DELETE, "/api/clientes/**").hasAnyRole("DONO","GESTOR")
                .requestMatchers("/api/produtos/**").hasAnyRole("DONO","GESTOR","CAIXA")
                .requestMatchers("/api/vendas/**").hasAnyRole("DONO","GESTOR","CAIXA")
                .requestMatchers("/api/encomendas/**").hasAnyRole("DONO","GESTOR","CAIXA")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(h -> h.frameOptions(f -> f.sameOrigin()))
            .build();
    }

    @Bean
    public DaoAuthenticationProvider authProvider() {
        var p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService);
        p.setPasswordEncoder(passwordEncoder());
        return p;
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration c) throws Exception {
        return c.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public CorsConfigurationSource corsSource() {
        var config = new CorsConfiguration();
        // Qualquer porta em localhost/127.0.0.1 (Vite muda de 3000, 5173, 3001, etc.)
        List<String> patterns = new ArrayList<>();
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");
        // Railway (front e API em *.up.railway.app) — evita 403/405 em preflight se CORS_ALLOWED_ORIGINS faltar
        patterns.add("https://*.up.railway.app");
        // Produção: front em HTTPS ou domínio (variável CORS_ALLOWED_ORIGINS)
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty()
                && !s.startsWith("http://localhost")
                && !s.startsWith("http://127.0.0.1"))
            .forEach(patterns::add);
        config.setAllowedOriginPatterns(patterns);
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
