-- Garante coluna em clientes se V2 já tinha sido aplicada antes desta linha existir no script,
-- ou se apenas parte do esquema foi atualizado manualmente.

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS whatsapp_order_updates_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
