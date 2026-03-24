package com.bolinhobacalhau.enums;
public enum NotificationType {
    ESTOQUE_BAIXO,
    CONTA_VENCENDO,
    CONTA_VENCIDA,
    RESUMO_DIARIO,
    /** Atualização de pedido enviada ao cliente (somente com opt-in). */
    CLIENTE_WHATSAPP
}
