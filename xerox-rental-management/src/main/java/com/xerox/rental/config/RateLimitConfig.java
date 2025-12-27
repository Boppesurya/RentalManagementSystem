package com.xerox.rental.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class RateLimitConfig {
	
	@Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("rateLimitBuckets");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(10000));
        return cacheManager;
    }

    @Component
    @ConfigurationProperties(prefix = "rate.limit")
    @Data
    public static class RateLimitProperties {
        private int authentication = 15;
        private int generalApi = 100;
        private int subscription = 20;
        private int payment = 10;
        private int reportGeneration = 5;
        private int fileUpload = 10;
        private int email = 20;
        private int publicApi = 50;

        private Set<String> whitelistedIps = new HashSet<>();
        private Set<String> whitelistedUserIds = new HashSet<>();

        private double premiumMultiplier = 2.0;
        private double enterpriseMultiplier = 5.0;
    }

}
