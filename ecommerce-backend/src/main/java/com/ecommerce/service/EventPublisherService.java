package com.ecommerce.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EventPublisherService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final String TOPIC = "user-product-events";

    public void publishUserProductEvent(String userId, String productId, String eventType) {
        // Simple JSON payload creation (could use ObjectMapper in real app)
        String payload = String.format("{\"user_id\":\"%s\",\"product_id\":\"%s\",\"event\":\"%s\"}", userId, productId, eventType);
        kafkaTemplate.send(TOPIC, userId, payload);
    }
}
