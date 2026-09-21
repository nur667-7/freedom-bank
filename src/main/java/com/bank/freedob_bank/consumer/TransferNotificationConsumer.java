package com.bank.freedob_bank.consumer;

import com.bank.freedob_bank.config.KafkaTopicConfig;
import com.bank.freedob_bank.dto.TransferCompletedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TransferNotificationConsumer {

    private final ObjectMapper objectMapper;

    /**
     * Асинхронный консьюмер уведомлений. Слушает топик transfers.completed.
     * В реальном банке отправляет SMS / Push в мобильное приложение.
     */
    @KafkaListener(topics = KafkaTopicConfig.TRANSFERS_TOPIC, groupId = "notification-service-group")
    public void consumeTransferEvent(String payload) {
        try {
            TransferCompletedEvent event = objectMapper.readValue(payload, TransferCompletedEvent.class);
            log.info("📩 [NOTIFICATION SERVICE] SMS sent: Transfer of {} {} from account {} to {} completed! (Transfer ID: {})",
                event.amount(), event.currency(), event.sourceAccountId(), event.targetAccountId(), event.transferId());
        } catch (Exception ex) {
            log.error("Failed to process transfer notification event: {}", ex.getMessage());
        }
    }
}
