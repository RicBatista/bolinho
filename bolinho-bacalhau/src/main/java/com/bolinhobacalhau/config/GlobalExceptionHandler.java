package com.bolinhobacalhau.config;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Evita 500 quando alguém faz GET em rota só-POST (ex.: abrir /api/auth/login no navegador). */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
            .body(Map.of(
                "status", 405,
                "message", ex.getMessage(),
                "timestamp", LocalDateTime.now().toString()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("status", 404, "message", ex.getMessage(), "timestamp", LocalDateTime.now().toString()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleBadState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("status", 400, "message", ex.getMessage(), "timestamp", LocalDateTime.now().toString()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(fe -> errors.put(fe.getField(), fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "inválido"));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "status", 400,
                "message", "Dados inválidos",
                "errors", errors,
                "timestamp", LocalDateTime.now().toString()
            ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("status", 500, "message", "Erro interno: " + ex.getMessage(), "timestamp", LocalDateTime.now().toString()));
    }
}
