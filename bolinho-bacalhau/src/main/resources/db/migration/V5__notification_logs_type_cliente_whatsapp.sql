-- Produção tinha CHECK em type sem o valor enum CLIENTE_WHATSAPP (notificações ao cliente).
ALTER TABLE notification_logs DROP CONSTRAINT IF EXISTS notification_logs_type_check;

ALTER TABLE notification_logs
    ADD CONSTRAINT notification_logs_type_check
    CHECK (type IN (
        'ESTOQUE_BAIXO',
        'CONTA_VENCENDO',
        'CONTA_VENCIDA',
        'RESUMO_DIARIO',
        'CLIENTE_WHATSAPP'
    ));
