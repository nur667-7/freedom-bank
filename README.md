# Freedom Bank Clone

Полнофункциональный веб-сервис банковской системы на базе **Spring Boot** и **React**. Реализует учет клиентов, банковских счетов, проведение финансовых транзакций, управление филиалами и кредитованием.

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.3-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🏗 Архитектура и стек технологий

```text
React Frontend (SPA)
        │
   HTTP / REST (JSON)
        ▼
Spring Boot REST Controllers (Account, Customer, Transaction, Loan, Branch)
        │
   Service Layer (Business Logic & Transactions)
        │
   Spring Data JPA (Repositories)
        ▼
PostgreSQL Database
```

- **Backend:** Java 17, Spring Boot 4.0.3, Spring Data JPA, Spring WebMVC, Lombok, Maven.
- **Frontend:** React, React Router, CSS3 / Modern UI.
- **База данных:** PostgreSQL (реляционная схема со связями Foreign Keys).
- **Развертывание:** Конфигурация для Railway (`railway.json`).

---

## ⚡️ Модули и возможности

| Модуль | Описание |
|---|---|
| **Customers** | Регистрация клиентов, профиль, контактные данные. |
| **Accounts** | Открытие и ведение счетов, проверка и обновление баланса. |
| **Transactions** | Переводы между счетами, пополнение, снятие, история операций. |
| **Loans** | Подача заявок на кредиты, расчет сумм, графики погашения. |
| **Branches & Staff** | Структура филиалов банка и привязка сотрудников. |

---

## 🔌 Основные REST API эндпоинты

- **Клиенты (`/api/customers`):**
  - `GET /api/customers` — список всех клиентов
  - `POST /api/customers` — создание нового клиента
  - `GET /api/customers/{id}` — получение профиля
- **Счета (`/api/accounts`):**
  - `GET /api/accounts` — список счетов
  - `POST /api/accounts` — открытие нового счета
  - `GET /api/accounts/{id}` — баланс и детали счета
- **Транзакции (`/api/transactions`):**
  - `POST /api/transactions` — проведение операции перевода / списания
  - `GET /api/transactions` — история финансовых транзакций
- **Кредиты (`/api/loans`):**
  - `GET /api/loans` / `POST /api/loans` — управление кредитными договорами
- **Филиалы и сотрудники:**
  - `/api/branches`, `/api/employees`

---

## 🚀 Запуск и разработка

### Требования
- JDK 17+
- Node.js 18+ и npm
- PostgreSQL 14+

### 1. Настройка базы данных
Создайте базу данных в PostgreSQL:
```sql
CREATE DATABASE freedom_bank;
```

Настройте доступ в `src/main/resources/application.properties` (или через переменные окружения):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/freedom_bank
spring.datasource.username=postgres
spring.datasource.password=your_password
```

### 2. Запуск Backend
```bash
./mvnw clean spring-boot:run
```
Бэкенд запустится по адресу: `http://localhost:8080`.

### 3. Запуск Frontend
```bash
cd frontend
npm install
npm start
```
Фронтенд запустится по адресу: `http://localhost:3000`.
