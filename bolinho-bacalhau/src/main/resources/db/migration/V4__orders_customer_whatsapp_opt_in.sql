-- Garante coluna em orders (encomendas) se migrações anteriores não a criaram
-- (ex.: V2 alterado após apply, ou apenas clients/sales aplicados manualmente).

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
