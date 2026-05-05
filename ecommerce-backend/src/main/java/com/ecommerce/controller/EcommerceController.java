package com.ecommerce.controller;

import com.ecommerce.service.EventPublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EcommerceController {

    private final EventPublisherService eventPublisherService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String AI_SERVICE_URL = "http://localhost:5000/recommendations/";

    @PostMapping("/events/view")
    public ResponseEntity<String> recordProductView(@RequestParam String userId, @RequestParam String productId) {
        eventPublisherService.publishUserProductEvent(userId, productId, "VIEW");
        return ResponseEntity.ok("Event recorded");
    }

    @GetMapping("/recommendations/{userId}")
    public ResponseEntity<String> getRecommendations(@PathVariable String userId) {
        // Calls the Python AI microservice
        String recommendations = restTemplate.getForObject(AI_SERVICE_URL + userId, String.class);
        return ResponseEntity.ok(recommendations);
    }
}
