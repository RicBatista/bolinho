package com.bolinhobacalhau.enums;

public enum OrderStatus {
    PENDENTE,       // Encomenda recebida, aguardando confirmação
    CONFIRMADO,     // Sinal pago, produção confirmada
    EM_PREPARO,     // Está sendo produzida
    PRONTO,         // Pronto para retirada/entrega
    ENTREGUE,       // Entregue e pago
    CANCELADO       // Cancelado
}
