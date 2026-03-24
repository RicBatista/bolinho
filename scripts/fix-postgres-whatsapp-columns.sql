-- Executar manualmente no PostgreSQL do Railway se o deploy do Flyway não puder rodar.
-- (Conteúdo espelha db/migration/V2__whatsapp_opt_in_and_sale_source_order.sql.)

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Clientes (WhatsApp opt-in cadastro)
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS whatsapp_order_updates_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS source_order_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_sales_source_order_id ON sales (source_order_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sales_source_order'
    ) THEN
        ALTER TABLE sales
            ADD CONSTRAINT fk_sales_source_order
            FOREIGN KEY (source_order_id) REFERENCES orders (id);
    END IF;
END $$;

-- notification_logs: permite CLIENTE_WHATSAPP (igual a db/migration/V5)
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
