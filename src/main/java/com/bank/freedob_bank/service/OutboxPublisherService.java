package com.bank.freedob_bank.service;

import com.bank.freedob_bank.config.KafkaTopicConfig;
import com.bank.freedob_bank.entity.OutboxEvent;
import com.bank.freedob_bank.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboxPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    /**
     * Фоновый поллер: каждые 2 секунды читает пачку событий PENDING и пушит в Kafka.
     * Реализует семантику At-Least-Once доставки.
     */
    @Scheduled(fixedDelayString = "${banking.outbox.poll-interval-ms:2000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository
            .findByStatusOrderByCreatedAtAsc("PENDING", PageRequest.of(0, 50));

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Found {} pending outbox events to publish to Kafka", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            try {
                // Ключ партиционирования в Kafka = aggregateId (все события одного перевода попадут в одну партицию)
                kafkaTemplate.send(KafkaTopicConfig.TRANSFERS_TOPIC, event.getAggregateId(), event.getPayload())
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            event.setStatus("SENT");
                            event.setSentAt(OffsetDateTime.now());
                            outboxEventRepository.save(event);
                            log.info("Outbox event {} successfully published to Kafka topic {} [partition: {}, offset: {}]",
                                event.getId(), KafkaTopicConfig.TRANSFERS_TOPIC,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                        } else {
                            event.setRetryCount(event.getRetryCount() + 1);
                            if (event.getRetryCount() >= 5) {
                                event.setStatus("FAILED");
                            }
                            outboxEventRepository.save(event);
                            log.error("Failed to publish outbox event {} to Kafka: {}", event.getId(), ex.getMessage());
                        }
                    });
            } catch (Exception ex) {
                log.warn("Kafka broker unreachable while publishing event {}: {}", event.getId(), ex.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                outboxEventRepository.save(event);
            }
        }
    }
}
