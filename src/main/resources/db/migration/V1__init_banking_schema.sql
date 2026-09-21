-- V1__init_banking_schema.sql
-- Полная инициализация банковской схемы Freedom Bank

-- 1. Таблица отделений банка (Branch)
CREATE TABLE IF NOT EXISTS branch (
    branch_id BIGSERIAL PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50)
);

-- 2. Таблица клиентов (Customer)
CREATE TABLE IF NOT EXISTS customer (
    customer_id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    passport_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address VARCHAR(255),
    registration_date DATE DEFAULT CURRENT_DATE
);

-- 3. Таблица сотрудников (Employee)
CREATE TABLE IF NOT EXISTS employee (
    employee_id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    salary NUMERIC(15, 2),
    hire_date DATE DEFAULT CURRENT_DATE,
    branch_id BIGINT REFERENCES branch(branch_id)
);

-- 4. Таблица банковских счетов (Account)
CREATE TABLE IF NOT EXISTS account (
    account_id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(34) UNIQUE NOT NULL,
    account_type VARCHAR(50) DEFAULT 'CURRENT',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    open_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    branch_id BIGINT REFERENCES branch(branch_id),
    version BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE account ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 5. Таблица кредитов (Loan)
CREATE TABLE IF NOT EXISTS loan (
    loan_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customer(customer_id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    interest_rate NUMERIC(5, 2) NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- 6. Таблица единичных проводок (Transaction)
CREATE TABLE IF NOT EXISTS transaction (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT REFERENCES account(account_id),
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255)
);

-- 7. Таблица межбанковских / межкабинетных переводов (Transfers)
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_account_id BIGINT NOT NULL REFERENCES account(account_id),
    target_account_id BIGINT NOT NULL REFERENCES account(account_id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'KZT',
    status VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для ускорения поиска и защиты от перегрузок
CREATE INDEX IF NOT EXISTS idx_account_number ON account(account_number);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON transfers(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_target ON transfers(target_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_idempotency ON transfers(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_transaction_account ON transaction(account_id);
