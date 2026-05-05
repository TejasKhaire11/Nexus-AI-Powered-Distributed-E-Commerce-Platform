package com.ecommerce.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class AsyncOrderListeners {

    @KafkaListener(topics = "order-events", groupId = "inventory-group")
    public void handleInventoryUpdate(String orderEvent) {
        // Simulating an external Inventory Service consuming the event
        System.out.println("Inventory Service Received: Deducting inventory for order -> " + orderEvent);
    }

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void handleNotificationUpdate(String orderEvent) {
        // Simulating an external Notification Service consuming the event
        System.out.println("Notification Service Received: Sending order confirmation email/SMS -> " + orderEvent);
    }
}
