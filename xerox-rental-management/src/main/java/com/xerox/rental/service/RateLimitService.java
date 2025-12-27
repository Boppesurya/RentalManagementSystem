package com.xerox.rental.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.xerox.rental.config.RateLimitConfig;
import com.xerox.rental.entity.RateLimitEvent;
import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.RateLimitEventRepository;
import com.xerox.rental.repository.SubscriptionRepository;
import com.xerox.rental.repository.UserRepository;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

@Service

public class RateLimitService {
	private static final Logger logger = LoggerFactory.getLogger(RateLimitService.class);

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
    private final Map<String, RateLimitStats> statsCache = new ConcurrentHashMap<>();
    private final RateLimitConfig.RateLimitProperties properties;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final RateLimitEventRepository rateLimitEventRepository;

    @Value("${rate.limit.persist.events:true}")
    private boolean persistEvents;

    public RateLimitService(RateLimitConfig.RateLimitProperties properties,
                            UserRepository userRepository,
                            SubscriptionRepository subscriptionRepository,
                            RateLimitEventRepository rateLimitEventRepository) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.rateLimitEventRepository = rateLimitEventRepository;
    }

    public Bucket resolveBucket(String key, RateLimitType type, Long userId) {
        return cache.computeIfAbsent(key, k -> {
            double multiplier = getUserTierMultiplier(userId);
            return createNewBucket(type, multiplier);
        });
    }

    public boolean isWhitelisted(String identifier) {
        if (identifier == null) return false;

        if (identifier.startsWith("ip:")) {
            String ip = identifier.substring(3);
            return properties.getWhitelistedIps().contains(ip);
        } else if (identifier.startsWith("user:")) {
            String userId = identifier.substring(5);
            return properties.getWhitelistedUserIds().contains(userId);
        }

        return false;
    }

    public void recordRateLimitHit(String clientId, RateLimitType type, boolean allowed,
                                   String endpoint, String method, String ipAddress, String userAgent) {
        String key = clientId + ":" + type.name();
        RateLimitStats stats = statsCache.computeIfAbsent(key, k -> new RateLimitStats());

        stats.totalRequests++;
        if (!allowed) {
            stats.blockedRequests++;
            stats.lastBlockedAt = LocalDateTime.now();
        }
        stats.lastRequestAt = LocalDateTime.now();

        if (!allowed) {
            logger.warn("Rate limit exceeded - Client: {}, Type: {}, Total: {}, Blocked: {}",
                    clientId, type, stats.totalRequests, stats.blockedRequests);
        }

        if (persistEvents) {
            persistEventAsync(clientId, type, allowed, endpoint, method, ipAddress, userAgent);
        }
    }

    @Async
    protected void persistEventAsync(String clientId, RateLimitType type, boolean allowed,
                                    String endpoint, String method, String ipAddress, String userAgent) {
        try {
            RateLimitEvent event = new RateLimitEvent();
            event.setClientId(clientId);
            event.setEndpoint(endpoint);
            event.setLimitType(type.name());
            event.setBlocked(!allowed);
            event.setRequestMethod(method);
            event.setIpAddress(ipAddress);
            event.setUserAgent(userAgent);

            if (clientId.startsWith("user:")) {
                try {
                    Long userId = Long.parseLong(clientId.substring(5));
                    event.setUserId(userId);
                } catch (NumberFormatException e) {
                    logger.debug("Could not parse user ID from clientId: {}", clientId);
                }
            }

            rateLimitEventRepository.save(event);
        } catch (Exception e) {
            logger.error("Failed to persist rate limit event: {}", e.getMessage());
        }
    }

    public RateLimitStats getStats(String clientId, RateLimitType type) {
        String key = clientId + ":" + type.name();
        return statsCache.getOrDefault(key, new RateLimitStats());
    }

    public Map<String, RateLimitStats> getAllStats() {
        return new ConcurrentHashMap<>(statsCache);
    }

    public void clearStats() {
        statsCache.clear();
        logger.info("Rate limit statistics cleared");
    }

    private double getUserTierMultiplier(Long userId) {
        if (userId == null) {
            return 1.0;
        }

        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return 1.0;
            }

            Optional<Subscription> activeSubscription = subscriptionRepository
                    .findByUserIdAndStatus(userId, Subscription.Status.ACTIVE)
                    .stream()
                    .findFirst();

            if (activeSubscription.isPresent()) {
                SubscriptionPlan plan = activeSubscription.get().getPlan();
                String planName = plan.getName().toLowerCase();

                if (planName.contains("enterprise") || planName.contains("unlimited")) {
                    return properties.getEnterpriseMultiplier();
                } else if (planName.contains("premium") || planName.contains("professional") || planName.contains("pro")) {
                    return properties.getPremiumMultiplier();
                }
            }
        } catch (Exception e) {
            logger.error("Error determining user tier for userId {}: {}", userId, e.getMessage());
        }

        return 1.0;
    }

    private Bucket createNewBucket(RateLimitType type, double multiplier) {
        int baseLimit = getBaseLimitForType(type);
        int adjustedLimit = (int) Math.ceil(baseLimit * multiplier);
        Duration refillDuration = getRefillDuration(type);

        Bandwidth limit = Bandwidth.classic(adjustedLimit,
                Refill.intervally(adjustedLimit, refillDuration));

        logger.debug("Created bucket - Type: {}, BaseLimit: {}, Multiplier: {}, FinalLimit: {}",
                type, baseLimit, multiplier, adjustedLimit);

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private int getBaseLimitForType(RateLimitType type) {
        return switch (type) {
            case AUTHENTICATION -> properties.getAuthentication();
            case GENERAL_API -> properties.getGeneralApi();
            case SUBSCRIPTION -> properties.getSubscription();
            case PAYMENT -> properties.getPayment();
            case REPORT_GENERATION -> properties.getReportGeneration();
            case FILE_UPLOAD -> properties.getFileUpload();
            case EMAIL -> properties.getEmail();
            case PUBLIC -> properties.getPublicApi();
        };
    }

    private Duration getRefillDuration(RateLimitType type) {
        if (type == RateLimitType.EMAIL) {
            return Duration.ofHours(1);
        }
        return Duration.ofMinutes(1);
    }

    public enum RateLimitType {
        AUTHENTICATION,
        GENERAL_API,
        SUBSCRIPTION,
        PAYMENT,
        REPORT_GENERATION,
        FILE_UPLOAD,
        EMAIL,
        PUBLIC
    }

    public static class RateLimitStats {
        private long totalRequests = 0;
        private long blockedRequests = 0;
        private LocalDateTime lastRequestAt;
        private LocalDateTime lastBlockedAt;

        public long getTotalRequests() {
            return totalRequests;
        }

        public long getBlockedRequests() {
            return blockedRequests;
        }

        public LocalDateTime getLastRequestAt() {
            return lastRequestAt;
        }

        public LocalDateTime getLastBlockedAt() {
            return lastBlockedAt;
        }

        public double getBlockedPercentage() {
            if (totalRequests == 0) return 0.0;
            return (blockedRequests * 100.0) / totalRequests;
        }
    }

}
