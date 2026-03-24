package com.bolinhobacalhau.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Proxy para ViaCEP (uso gratuito e razoável). Evita CORS no navegador e centraliza a consulta.
 */
@RestController
@RequestMapping("/api/cep")
@RequiredArgsConstructor
@Tag(name = "CEP")
public class CepController {

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper;

    @GetMapping("/{cep}")
    @Operation(summary = "Consultar endereço por CEP (ViaCEP)")
    public ResponseEntity<?> buscar(@PathVariable String cep) {
        String digits = cep == null ? "" : cep.replaceAll("\\D", "");
        if (digits.length() != 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", true, "mensagem", "O CEP deve ter 8 dígitos."));
        }
        try {
            String url = "https://viacep.com.br/ws/" + digits + "/json/";
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .header("Accept", "application/json")
                    .build();
            HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                return ResponseEntity.status(502)
                        .body(Map.of("erro", true, "mensagem", "Serviço de CEP indisponível. Tente de novo em instantes."));
            }
            JsonNode root = objectMapper.readTree(res.body());
            if (root.path("erro").asBoolean(false)) {
                return ResponseEntity.ok(Map.of("erro", true, "mensagem", "CEP não encontrado."));
            }
            return ResponseEntity.ok(root);
        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body(Map.of("erro", true, "mensagem", "Não foi possível consultar o CEP. Verifique a conexão."));
        }
    }
}
