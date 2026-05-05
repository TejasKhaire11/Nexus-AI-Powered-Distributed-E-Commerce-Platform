package com.ecommerce.service;

import com.ecommerce.dto.OrderRequest;
import com.ecommerce.model.Order;
import com.ecommerce.model.Product;
import com.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    
    private static final String ORDER_TOPIC = "order-events";

    public Order placeOrder(OrderRequest request) {
        Product product = productService.getProductById(request.getProductId());
        
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setProductId(request.getProductId());
        order.setQuantity(request.getQuantity());
        order.setTotalPrice(product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())));
        order.setStatus("PENDING");
        
        order = orderRepository.save(order);
        
        // Push Async Event to Kafka for Inventory and Notification microservices
        String eventPayload = String.format("{\"order_id\":%d, \"product_id\":%d, \"quantity\":%d, \"user_id\":%d}", 
            order.getId(), order.getProductId(), order.getQuantity(), order.getUserId());
        kafkaTemplate.send(ORDER_TOPIC, String.valueOf(order.getId()), eventPayload);
        
        return order;
    }
}
