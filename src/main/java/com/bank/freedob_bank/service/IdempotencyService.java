package com.bank.freedob_bank.service;

import com.bank.freedob_bank.dto.TransferResponse;
import java.util.Optional;

public interface IdempotencyService {
    /**
     * Атомарно захватывает ключ идемпотентности в Redis (SET ... NX EX ttl).
     * @param idempotencyKey уникальный ключ клиента
     * @param ttlSeconds время жизни замка в секундах
     * @return true если замок успешно получен; false если ключ уже обрабатывается
     */
    boolean tryAcquire(String idempotencyKey, long ttlSeconds);

    /**
     * Кэширует успешный результат перевода в Redis на длительный срок.
     * @param idempotencyKey уникальный ключ
     * @param response готовый DTO ответа
     * @param ttlHours срок хранения в часах
     */
    void saveResponse(String idempotencyKey, TransferResponse response, long ttlHours);

    /**
     * Возвращает закешированный результат из Redis, если он уже был выполнен.
     */
    Optional<TransferResponse> getResponse(String idempotencyKey);

    /**
     * Снимает временный замок при ошибке/откате.
     */
    void release(String idempotencyKey);
}
