package com.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

import java.util.TimeZone;

@SpringBootApplication
@EnableCaching
public class EcommerceApplication {

    public static void main(String[] args) {
        // Fix for Postgres 15 failing to recognize Windows 'Asia/Calcutta'
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(EcommerceApplication.class, args);
    }

}
