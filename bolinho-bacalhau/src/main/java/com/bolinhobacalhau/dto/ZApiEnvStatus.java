package com.bolinhobacalhau.dto;

/**
 * Indica se o ambiente está pronto para chamar a Z-API (sem expor segredos).
 */
public record ZApiEnvStatus(
        boolean envioAtivado,
        boolean instanceIdDefinido,
        boolean tokenDefinido,
        boolean telefoneDonoDefinido,
        boolean prontoParaEnviar
) {}
