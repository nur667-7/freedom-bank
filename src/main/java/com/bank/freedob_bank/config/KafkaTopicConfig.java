package com.bank.freedob_bank.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TRANSFERS_TOPIC = "transfers.completed";

    @Bean
    public NewTopic transfersCompletedTopic() {
        return TopicBuilder.name(TRANSFERS_TOPIC)
            .partitions(3)
            .replicas(1)
            .build();
    }
}
