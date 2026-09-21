-- V2__add_outbox_events_schema.sql
-- Таблица для реализации Transactional Outbox Pattern (гарантия доставки событий в Kafka)

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Частичный индекс (Partial Index) для мгновенной выборки неотправленных событий
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(created_at) WHERE status = 'PENDING';
