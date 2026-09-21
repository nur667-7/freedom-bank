# Freedom Bank — Highload Payment & Transfer Gateway

[![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring_Boot-3.4.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-3.8_KRaft-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7_In--Memory-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Отказоустойчивый финансовый шлюз межбанковских переводов и транзакций с защитой от **Race Condition (Double Spending)**, двухфакторной идемпотентностью через **Redis**, гарантией доставки событий по паттерну **Transactional Outbox** и асинхронным стримингом в **Apache Kafka**.

---

## 🏛 Архитектура системы

```mermaid
flowchart TD
    Client["Client App / Web / Mobile"] -->|POST /api/v1/transfers\nHeader: X-Idempotency-Key| Gateway["Spring Boot 3 API Gateway"]
    
    subgraph L1 ["Уровень 1: In-Memory кэш и блокировки"]
        Gateway -->|1. Check Cache & SET NX EX 60s| Redis[("Redis 7 (In-Memory)")]
        Redis -- "Conflict (409)" --> Client
    end
    
    subgraph L2 ["Уровень 2: Реляционная ACID транзакция"]
        Gateway -->|2. Lock Accounts (PESSIMISTIC_WRITE)| Postgres[("PostgreSQL 16")]
        Postgres -->|3. Update Balances & CHECK balance >= 0| Postgres
        Postgres -->|4. Save Transfer Record| Postgres
        Postgres -->|5. Insert Event (status=PENDING)| OutboxTable[("Table: outbox_events")]
    end
    
    Gateway -->|6. Cache Result 24h| Redis
    Gateway -->|201 Created| Client

    subgraph L3 ["Уровень 3: Event-Driven Асинхронный стриминг"]
        OutboxPoller["Outbox Publisher (@Scheduled)"] -->|7. Poll PENDING Events| OutboxTable
        OutboxPoller -->|8. Publish Event| KafkaTopic["Kafka Topic: transfers.completed"]
        KafkaTopic -->|ACK| OutboxPoller
        OutboxPoller -->|9. Update status=SENT| OutboxTable
        
        KafkaTopic --> Consumer1["Notification Service (SMS/Push)"]
        KafkaTopic --> Consumer2["Audit & Central Ledger Service"]
    end
```

---

## ⚡️ Реализованные Enterprise-паттерны

### 1. Двухуровневая идемпотентность (Idempotency)
- **Уровень Redis (In-Memory):**
  Атомарная команда `SET idemp:lock:<key> "IN_PROGRESS" NX EX 60`.
  Параллельные клики пользователя за одну миллисекунду мгновенно отсекаются с кодом `409 Conflict` без обращения к диску и PostgreSQL. Завершенные ответы кэшируются на 24 часа для отдачи за 0.5 мс.
- **Уровень PostgreSQL (Database):**
  Уникальный индекс `idempotency_key UNIQUE` в таблице `transfers` как резервная гарантия целостности.

### 2. Защита от Race Condition & Double Spending
- Чтение баланса счетов выполняется под пессимистичной блокировкой:
  `SELECT ... FROM account WHERE account_id = ? FOR UPDATE` (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
- Ни один поток не может изменить баланс счета, пока текущая транзакция не завершит `COMMIT`.
- Констрейнт на уровне ядра базы данных: `CHECK (balance >= 0)`.

### 3. Предотвращение Deadlock (Взаимных блокировок)
- При встречных переводах (Алишер -> Бакыт и Бакыт -> Алишер) блокировки счетов всегда захватываются в детерминированном порядке:
  `firstId = Math.min(fromId, toId); secondId = Math.max(fromId, toId);`
  Взаимный тупик математически исключен.

### 4. Transactional Outbox Pattern + Apache Kafka
- Исключена проблема **Dual Write**: отправка в Kafka не вызывается посреди транзакции БД.
- Изменение балансов и запись в `outbox_events` происходят в единой неделимой транзакции PostgreSQL.
- Фоновый диспетчер `OutboxPublisherService` читает события из базы и гарантированно передает их в Kafka с семантикой **At-Least-Once Delivery**.

### 5. Версионированные миграции Flyway
- Отключен опасный `ddl-auto=update`, включен строгий `ddl-auto=validate`.
- Вся эволюция схемы контролируется скриптами:
  - `V1__init_banking_schema.sql` — счета, клиенты, переводы, ограничения и B-Tree индексы.
  - `V2__add_outbox_events_schema.sql` — таблица `outbox_events` и частичный индекс для поллера.

---

## 🛠 Технологический стек

| Слой | Технологии |
| :--- | :--- |
| **Backend Core** | Java 21 LTS, Spring Boot 3.4.x, Spring Data JPA, Spring Web, Spring Validation |
| **In-Memory Store** | Redis 7 (Spring Data Redis, Lettuce) |
| **Event Streaming** | Apache Kafka 3.8 (Spring Kafka, KRaft mode, 3 partitions) |
| **Database** | PostgreSQL 16 (ACID, Partial Indexes, Check Constraints) |
| **Database Migration** | Flyway Core + Flyway PostgreSQL |
| **Тестирование** | JUnit 5, Mockito, Spring Boot Test |
| **DevOps** | Multi-stage Dockerfile (Generational ZGC), Docker Compose |

---

## 🚀 Быстрый запуск

### 1. Запуск инфраструктуры (PostgreSQL, Redis, Kafka)
Одной командой поднимается весь стек:
```bash
docker compose up -d
```

Проверить статус контейнеров:
```bash
docker compose ps
```

### 2. Запуск приложения
```bash
./mvnw clean spring-boot:run
```
Бэкенд запустится на порту `8080`. При старте:
- Flyway автоматически применит миграции `V1` и `V2`.
- Hibernate проверит соответствие схемы (`validate`).
- Kafka создаст топик `transfers.completed`.

### 3. Запуск тестов
```bash
./mvnw test
```

---

## 📡 REST API: Примеры запросов

### Выполнение межбанковского перевода

```bash
curl -X POST http://localhost:8080/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": 1,
    "targetAccountId": 2,
    "amount": 15000.00,
    "idempotencyKey": "tx-uuid-88992211",
    "description": "Оплата услуг"
  }'
```

#### Ответ `201 Created`:
```json
{
  "transferId": "4f9d2a31-6b83-4a37-b914-1e0e85a6db41",
  "sourceAccountId": 1,
  "targetAccountId": 2,
  "amount": 15000.00,
  "currency": "KZT",
  "status": "COMPLETED",
  "idempotencyKey": "tx-uuid-88992211",
  "createdAt": "2026-09-21T17:50:00+05:00",
  "message": "Transfer successfully processed"
}
```

#### Повторный запрос с тем же `idempotencyKey` (Idempotent Replay):
Мгновенный ответ `200 OK` из оперативной памяти Redis:
```json
{
  "transferId": "4f9d2a31-6b83-4a37-b914-1e0e85a6db41",
  "status": "COMPLETED",
  "message": "Transfer already processed (Idempotent replay)"
}
```

#### Ошибка при нехватке средств (`422 Unprocessable Entity`):
```json
{
  "type": "https://freedombank.kz/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Insufficient funds on account 1. Current balance: 5000.00, Requested: 15000.00"
}
```

---

## 👨‍💻 Автор
**Сайдуали Нурбек**  
Международный университет IT (МУИТ / IITU, Алматы)  
Специальность: Computer Science  
- GitHub: [github.com/nur667-7](https://github.com/nur667-7)  
- LinkedIn: [linkedin.com/in/nurbek-saiduali](https://www.linkedin.com/in/nurbek-saiduali)  
- Telegram: [@nigerusl](https://t.me/nigerusl)  
- Email: sajdualievnurbek@gmail.com
