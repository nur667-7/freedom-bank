package com.bank.freedob_bank.service;

import com.bank.freedob_bank.dto.TransferResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisIdempotencyService implements IdempotencyService {

    private static final String LOCK_PREFIX = "idemp:lock:";
    private static final String RESPONSE_PREFIX = "idemp:resp:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public boolean tryAcquire(String idempotencyKey, long ttlSeconds) {
        String key = LOCK_PREFIX + idempotencyKey;
        try {
            // Атомарная операция: SET idemp:lock:key "IN_PROGRESS" NX EX ttlSeconds
            Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(key, "IN_PROGRESS", Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(acquired);
        } catch (Exception ex) {
            log.warn("Redis unavailable during tryAcquire for key {}. Degrading to DB lock: {}", idempotencyKey, ex.getMessage());
            // Graceful degradation: если Redis временно недоступен, разрешаем продолжить к блокировке в PostgreSQL
            return true;
        }
    }

    @Override
    public void saveResponse(String idempotencyKey, TransferResponse response, long ttlHours) {
        String key = RESPONSE_PREFIX + idempotencyKey;
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, Duration.ofHours(ttlHours));
            // Снимаем временный замок, так как готовый результат уже записан
            release(idempotencyKey);
            log.debug("Cached transfer response in Redis for key: {}", idempotencyKey);
        } catch (Exception ex) {
            log.warn("Failed to cache transfer response in Redis for key {}: {}", idempotencyKey, ex.getMessage());
        }
    }

    @Override
    public Optional<TransferResponse> getResponse(String idempotencyKey) {
        String key = RESPONSE_PREFIX + idempotencyKey;
        try {
            String json = redisTemplate.opsForValue().get(key);
            if (json != null && !json.isBlank()) {
                TransferResponse response = objectMapper.readValue(json, TransferResponse.class);
                return Optional.of(response);
            }
        } catch (Exception ex) {
            log.warn("Redis error while getting cached response for key {}: {}", idempotencyKey, ex.getMessage());
        }
        return Optional.empty();
    }

    @Override
    public void release(String idempotencyKey) {
        String key = LOCK_PREFIX + idempotencyKey;
        try {
            redisTemplate.delete(key);
        } catch (Exception ex) {
            log.warn("Failed to release Redis lock for key {}: {}", idempotencyKey, ex.getMessage());
        }
    }
}
