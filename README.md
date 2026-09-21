# Freedom Bank — Highload Payment & Transfer Gateway

[![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring_Boot-3.4.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_/_18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-3.8_KRaft-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Redis 7](https://img.shields.io/badge/Redis-7_In--Memory-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Flyway](https://img.shields.io/badge/Flyway-Migrations-CC0200?style=for-the-badge&logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

Промышленный, отказоустойчивый финансовый шлюз межбанковских переводов и транзакций с защитой от **Race Condition (Double Spending)**, двухфакторной идемпотентностью через **Redis**, гарантией доставки событий по паттерну **Transactional Outbox**, асинхронным стримингом в **Apache Kafka** и интерактивным интерфейсом на **React 19**.

---

## 🏛 Архитектура системы

```mermaid
flowchart TD
    Client["Client App / Web (React 19) / Mobile"] -->|POST /api/v1/transfers\nHeader: X-Idempotency-Key| Gateway["Spring Boot 3 API Gateway"]
    
    subgraph L1 ["Уровень 1: In-Memory кэш и блокировки (Redis 7)"]
        Gateway -->|1. Check Cache & SET NX EX 60s| Redis[("Redis 7 (In-Memory)")]
        Redis -- "Conflict (409)" --> Client
    end
    
    subgraph L2 ["Уровень 2: Реляционная ACID транзакция (PostgreSQL)"]
        Gateway -->|2. Lock Accounts (PESSIMISTIC_WRITE)| Postgres[("PostgreSQL 16/18")]
        Postgres -->|3. Update Balances & CHECK balance >= 0| Postgres
        Postgres -->|4. Save Transfer Record| Postgres
        Postgres -->|5. Insert Event (status=PENDING)| OutboxTable[("Table: outbox_events")]
    end
    
    Gateway -->|6. Cache Result 24h| Redis
    Gateway -->|200 OK / 201 Created| Client

    subgraph L3 ["Уровень 3: Event-Driven Асинхронный стриминг (Kafka)"]
        OutboxPoller["Outbox Publisher (@Scheduled)"] -->|7. Poll PENDING Events| OutboxTable
        OutboxPoller -->|8. Publish Event| KafkaTopic["Kafka Topic: transfers.completed"]
        KafkaTopic -->|ACK| OutboxPoller
        OutboxPoller -->|9. Update status=SENT| OutboxTable
        
        KafkaTopic --> Consumer1["Notification Service (SMS / Push)"]
        KafkaTopic --> Consumer2["Audit & Central Ledger Service"]
    end
```

---

## 📂 Структура репозитория

Проект разделен на изолированные слои по каноническому стандарту Enterprise-монорепозиториев:

```text
freedom-bank/
├── frontend/                          # Web UI (React 19 SPA)
│   ├── package.json                   # Зависимости фронтенда (React 19, Lucide, Axios)
│   ├── public/                        # Статические ассеты и HTML
│   └── src/                           # Исходный код интерфейса
│       ├── components/                # UI-компоненты (Dashboard, Accounts, Transfers, Branches)
│       ├── context/                   # Управление состоянием (AppContext)
│       └── services/                  # HTTP-клиент к REST API бэкенда (api.js)
│
├── src/                               # Backend (Spring Boot 3 / Java 21 LTS)
│   ├── main/
│   │   ├── java/com/bank/freedob_bank/
│   │   │   ├── config/                # Конфигурации (Kafka, Redis, CORS, Jackson)
│   │   │   ├── consumer/              # Kafka-консьюмеры (TransferNotificationConsumer)
│   │   │   ├── controller/            # REST API контроллеры (Transfer, Account, Branch)
│   │   │   ├── dto/                   # DTO-рекорды (TransferRequest, TransferResponse)
│   │   │   ├── entity/                # JPA сущности (Account, Transfer, OutboxEvent)
│   │   │   ├── exception/             # RFC 7807 GlobalExceptionHandler и доменные ошибки
│   │   │   ├── repository/            # Spring Data JPA репозитории (@Lock FOR UPDATE)
│   │   │   └── service/               # Бизнес-логика (TransferService, OutboxPublisherService)
│   │   └── resources/
│   │       ├── application.properties # Конфигурация подключений и профилей
│   │       └── db/migration/          # Версионированные миграции Flyway (V1, V2)
│   └── test/                          # Unit и интеграционные автотесты (JUnit 5, Mockito)
│
├── docker-compose.yml                 # Кластер: PostgreSQL 16, Redis 7, Kafka 3.8 (KRaft)
├── Dockerfile                         # Multi-stage сборка backend-образа
└── pom.xml                            # Maven конфигурация зависимостей Java 21
```

---

## ⚡️ Ключевые Enterprise-паттерны

### 1. Двухуровневая идемпотентность (Idempotency)
- **Уровень 1 (Redis In-Memory):**
  Атомарная блокировка `SET idemp:lock:<key> "IN_PROGRESS" NX EX 60`.
  Параллельные клики пользователя за одну миллисекунду мгновенно отсекаются с кодом `409 Conflict` без нагрузки на PostgreSQL.
  Успешный ответ сохраняется в Redis на 24 часа. При повторном запросе с тем же ключом клиент получает закешированный ответ за **<1 мс** без повторного списания баланса.
- **Уровень 2 (PostgreSQL Data Integrity):**
  Уникальный констрейнт `idempotency_key UNIQUE` в таблице `transfers` служит второй линией защиты при недоступности кэша.

### 2. Защита от Race Condition & Double Spending
- Чтение баланса счетов выполняется под пессимистичной блокировкой:
  ```sql
  SELECT * FROM account WHERE account_id = ? FOR UPDATE
  ```
  Метод репозитория аннотирован `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
- Ни один конкурирующий поток не может изменить баланс счета, пока текущая транзакция не зафиксирует `COMMIT`.
- Защита на уровне ядра базы данных: констрейнт `CHECK (balance >= 0)`.

### 3. Предотвращение Deadlock (Взаимных блокировок)
- При встречных одновременных переводах (Алишер -> Бакыт и Бакыт -> Алишер) блокировки счетов всегда захватываются в строгом математическом порядке:
  ```java
  Long firstId = Math.min(fromId, toId);
  Long secondId = Math.max(fromId, toId);
  ```
  Оба потока блокируют один и тот же счет первым — условие взаимного ожидания исключено.

### 4. Transactional Outbox Pattern + Apache Kafka
- Исключена проблема распределенной транзакции (**Dual Write**): отправка в брокер не вызывается посреди транзакции БД.
- Списание со счетов и вставка события в таблицу `outbox_events` происходят в единой неделимой ACID-транзакции PostgreSQL.
- Фоновый компонент `OutboxPublisherService` каждые 2 секунды сканирует таблицу по частичному индексу `WHERE status = 'PENDING'` и пушит события в Kafka с семантикой **At-Least-Once Delivery**.

### 5. Версионированные миграции Flyway
- Опасный `ddl-auto=update` заменен на строгий `ddl-auto=validate`.
- Вся эволюция схемы версионируется SQL-файлами:
  - `V1__init_banking_schema.sql` — счета, клиенты, сотрудники, переводы, ограничения `CHECK` и B-Tree индексы.
  - `V2__add_outbox_events_schema.sql` — таблица `outbox_events` с частичным индексом для ускорения поллера.

### 6. RFC 7807 ProblemDetail Error Handling
- Единый формат ошибок для всех API-ответов с деталями, кодами статусов и валидационными ошибками (`GlobalExceptionHandler`).

## 🏦 Банковские модули и бизнес-домен

Система объединяет классический Core-банкинг и высоконагруженный платежный шлюз:

| Модуль | REST Эндпоинты | Описание и гарантии |
| :--- | :--- | :--- |
| **Highload Transfers** | `/api/v1/transfers` | Межбанковские переводы с пессимистичной блокировкой (`FOR UPDATE`), защитой от Deadlock, Redis-идемпотентностью и публикацией событий в Kafka через Transactional Outbox. |
| **Accounts** | `/api/accounts` | Открытие и обслуживание счетов, проверка баланса, аудит версий (`@Version`). |
| **Transactions & Ledger** | `/api/transactions` | Бухгалтерский аудит операций двойной записи (`DEBIT` / `CREDIT`), история проводок. |
| **Loans** | `/api/loans` | Управление кредитными договорами, процентные ставки, контроль погашения. |
| **Customers & CRM** | `/api/customers` | Регистрация клиентов, валидация паспортных данных, управление профилями. |
| **Branches & Staff** | `/api/branches`, `/api/employees` | Структура филиальной сети банка и привязка ответственных сотрудников. |

---

## 🛠 Технологический стек

| Слой | Технологии |
| :--- | :--- |
| **Backend Core** | Java 21 LTS, Spring Boot 3.4.x, Spring Data JPA, Spring Validation |
| **Frontend UI** | React 19, Lucide React, Context API, CSS Variables |
| **In-Memory Store** | Redis 7 (Spring Data Redis, Lettuce) |
| **Event Streaming** | Apache Kafka 3.8 (Spring Kafka, KRaft mode, 3 partitions) |
| **Database** | PostgreSQL 16 / 18 (ACID, Partial Indexes, Check Constraints) |
| **Database Migration** | Flyway Core + Flyway PostgreSQL |
| **JSON Serialization** | Jackson 2 / JSR-310 (JavaTimeModule) |
| **Тестирование** | JUnit 5, Mockito, Spring Boot Test |
| **Контейнеризация** | Multi-stage Dockerfile (Generational ZGC), Docker Compose |

---

## 🚀 Запуск проекта

### Вариант 1: Полный запуск через Docker Compose
Одной командой поднимается весь кластер (PostgreSQL, Redis, Kafka, Backend):
```bash
docker compose up -d
```
Проверить статус контейнеров:
```bash
docker compose ps
```

---

### Вариант 2: Локальная разработка (Local Development)

#### 1. База данных (PostgreSQL)
Убедитесь, что PostgreSQL запущен на порту `5432` с базой `Freedob_Bank` (пользователь `postgres`, пароль `00000`).

#### 2. Запуск бэкенда (Spring Boot)
```bash
# Windows
.\mvnw.cmd clean spring-boot:run

# Linux / macOS
./mvnw clean spring-boot:run
```
Бэкенд доступен по адресу: **`http://localhost:8080`**.  
- Flyway автоматически применит миграции `V1` и `V2`.
- Hibernate выполнит валидацию схемы (`validate`).
- Outbox Poller начнет периодический мониторинг событий.

#### 3. Запуск фронтенда (React 19)
В отдельном терминале:
```bash
cd frontend
npm install
npm start
```
Фронтенд откроется в браузере по адресу: **`http://localhost:3000`**.

---

### Запуск автотестов
```bash
# Windows
.\mvnw.cmd test

# Linux / macOS
./mvnw test
```
Тесты проверяют:
- Изоляцию балансов при переводах (`TransferServiceTest`).
- Обработку недостатка средств и неактивных счетов.
- Атомарную публикацию событий через Outbox (`OutboxPublisherServiceTest`).

---

## 📡 REST API: Примеры запросов

### 1. Выполнение перевода средств

```bash
curl -X POST http://localhost:8080/api/v1/transfers \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: 9f59ce0e-a645-471e-9bf4-33db0bac4485" \
  -d '{
    "sourceAccountId": 1,
    "targetAccountId": 2,
    "amount": 5000.00,
    "currency": "KZT",
    "idempotencyKey": "9f59ce0e-a645-471e-9bf4-33db0bac4485"
  }'
```

#### Ответ `200 OK` (Первичная обработка):
```json
{
  "transferId": "9f59ce0e-a645-471e-9bf4-33db0bac4485",
  "sourceAccountId": 1,
  "targetAccountId": 2,
  "amount": 5000.00,
  "currency": "KZT",
  "status": "COMPLETED",
  "idempotencyKey": "9f59ce0e-a645-471e-9bf4-33db0bac4485",
  "createdAt": "2026-09-21T18:13:05.774+05:00",
  "message": "Transfer successfully processed"
}
```

---

### 2. Повторный запрос (Idempotent Replay)
При отправке точно такого же запроса с тем же `idempotencyKey`:
```json
{
  "transferId": "9f59ce0e-a645-471e-9bf4-33db0bac4485",
  "sourceAccountId": 1,
  "targetAccountId": 2,
  "amount": 5000.00,
  "currency": "KZT",
  "status": "COMPLETED",
  "idempotencyKey": "9f59ce0e-a645-471e-9bf4-33db0bac4485",
  "createdAt": "2026-09-21T18:13:05.774+05:00",
  "message": "Transfer already processed (Idempotent replay)"
}
```
*Запрос перехвачен до обращения к счетам; баланс не списывается повторно.*

---

### 3. Ошибка нехватки средств (`422 Unprocessable Entity`)
```json
{
  "type": "https://freedombank.kz/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Insufficient funds on account 1. Current balance: 1000.00, Requested: 50000.00",
  "instance": "/api/v1/transfers"
}
```

---

### 4. Ошибка валидации параметров (`400 Bad Request`)
```json
{
  "type": "https://freedombank.kz/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/transfers",
  "errors": {
    "amount": "must be greater than 0",
    "idempotencyKey": "Idempotency key is required"
  }
}
```

---

## 👨‍💻 Автор
**Сайдуали Нурбек**  
Международный университет IT (МУИТ / IITU, Алматы)  
Специальность: Computer Science  
- **GitHub:** [github.com/nur667-7](https://github.com/nur667-7)  
- **LinkedIn:** [linkedin.com/in/nurbek-saiduali](https://www.linkedin.com/in/nurbek-saiduali)  
- **Telegram:** [@nigerusl](https://t.me/nigerusl)  
- **Email:** sajdualievnurbek@gmail.com
