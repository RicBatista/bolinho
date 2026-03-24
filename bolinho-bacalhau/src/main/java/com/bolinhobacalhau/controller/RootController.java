package com.bolinhobacalhau.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * A API não embute o frontend; sem isto, GET / cai no handler de recursos estáticos e gera
 * {@code No static resource .} (500). Útil também para abrir a URL do Railway no browser.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
                "service", "bolinho-bacalhau",
                "health", "/api/health",
                "docs", "/swagger-ui.html"));
    }
}
