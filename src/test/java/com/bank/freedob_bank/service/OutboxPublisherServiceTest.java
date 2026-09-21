package com.bank.freedob_bank.service;

import com.bank.freedob_bank.config.KafkaTopicConfig;
import com.bank.freedob_bank.entity.OutboxEvent;
import com.bank.freedob_bank.repository.OutboxEventRepository;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxPublisherServiceTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private OutboxPublisherService outboxPublisherService;

    @Test
    @DisplayName("Outbox Poller: чтение событий PENDING, отправка в Kafka и смена статуса на SENT")
    void publishPendingEvents_Success() {
        UUID eventId = UUID.randomUUID();
        OutboxEvent event = OutboxEvent.builder()
            .id(eventId)
            .aggregateType("TRANSFER")
            .aggregateId("tx-100")
            .eventType("TRANSFER_COMPLETED")
            .payload("{\"amount\":5000}")
            .status("PENDING")
            .retryCount(0)
            .createdAt(OffsetDateTime.now())
            .build();

        when(outboxEventRepository.findByStatusOrderByCreatedAtAsc(eq("PENDING"), any(PageRequest.class)))
            .thenReturn(List.of(event));

        RecordMetadata metadata = new RecordMetadata(
            new TopicPartition(KafkaTopicConfig.TRANSFERS_TOPIC, 0),
            0L, 0, System.currentTimeMillis(), 0, 0
        );
        SendResult<String, String> sendResult = new SendResult<>(null, metadata);
        CompletableFuture<SendResult<String, String>> future = CompletableFuture.completedFuture(sendResult);

        when(kafkaTemplate.send(eq(KafkaTopicConfig.TRANSFERS_TOPIC), eq("tx-100"), eq("{\"amount\":5000}")))
            .thenReturn(future);

        outboxPublisherService.publishPendingEvents();

        assertEquals("SENT", event.getStatus());
        assertNotNull(event.getSentAt());
        verify(outboxEventRepository).save(event);
    }
}
