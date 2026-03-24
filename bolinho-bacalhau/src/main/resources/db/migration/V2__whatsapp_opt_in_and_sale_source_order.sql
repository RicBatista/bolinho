-- PostgreSQL (produção): colunas que o Hibernate pode não aplicar em bases já populadas.
-- Idempotente: IF NOT EXISTS / checagem de constraint.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

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
