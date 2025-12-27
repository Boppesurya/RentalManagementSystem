package com.xerox.rental.controller;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.service.RateLimitService;

@RestController
@RequestMapping("/rate-limits")
public class RateLimitController {
	private final RateLimitService rateLimitService;

    public RateLimitController(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllStats() {
        Map<String, RateLimitService.RateLimitStats> stats = rateLimitService.getAllStats();

        Map<String, Object> response = new HashMap<>();
        response.put("totalClients", stats.size());
        response.put("stats", stats);

        long totalRequests = stats.values().stream()
                .mapToLong(RateLimitService.RateLimitStats::getTotalRequests)
                .sum();

        long totalBlocked = stats.values().stream()
                .mapToLong(RateLimitService.RateLimitStats::getBlockedRequests)
                .sum();

        response.put("totalRequests", totalRequests);
        response.put("totalBlocked", totalBlocked);
        response.put("blockedPercentage", totalRequests > 0 ? (totalBlocked * 100.0 / totalRequests) : 0.0);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/{clientId}/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RateLimitService.RateLimitStats> getClientStats(
            @PathVariable String clientId,
            @PathVariable RateLimitService.RateLimitType type) {

        RateLimitService.RateLimitStats stats = rateLimitService.getStats(clientId, type);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> clearStats() {
        rateLimitService.clearStats();
        return ResponseEntity.ok(Map.of("message", "Rate limit statistics cleared successfully"));
    }

    @GetMapping("/top-offenders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getTopOffenders(
            @RequestParam(defaultValue = "10") int limit) {

        Map<String, RateLimitService.RateLimitStats> allStats = rateLimitService.getAllStats();

        var topOffenders = allStats.entrySet().stream()
                .filter(e -> e.getValue().getBlockedRequests() > 0)
                .sorted((e1, e2) -> Long.compare(
                        e2.getValue().getBlockedRequests(),
                        e1.getValue().getBlockedRequests()))
                .limit(limit)
                .map(e -> {
                    Map<String, Object> offender = new HashMap<>();
                    offender.put("key", e.getKey());
                    offender.put("totalRequests", e.getValue().getTotalRequests());
                    offender.put("blockedRequests", e.getValue().getBlockedRequests());
                    offender.put("blockedPercentage", e.getValue().getBlockedPercentage());
                    offender.put("lastBlockedAt", e.getValue().getLastBlockedAt());
                    return offender;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("offenders", topOffenders);
        response.put("totalOffenders", topOffenders.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatsSummary() {
        Map<String, RateLimitService.RateLimitStats> allStats = rateLimitService.getAllStats();

        Map<RateLimitService.RateLimitType, StatsSummary> summaryByType = new HashMap<>();

        for (Map.Entry<String, RateLimitService.RateLimitStats> entry : allStats.entrySet()) {
            String key = entry.getKey();
            String[] parts = key.split(":");
            if (parts.length >= 2) {
                try {
                    RateLimitService.RateLimitType type = RateLimitService.RateLimitType.valueOf(parts[parts.length - 1]);
                    StatsSummary summary = summaryByType.computeIfAbsent(type, k -> new StatsSummary());

                    summary.totalRequests += entry.getValue().getTotalRequests();
                    summary.blockedRequests += entry.getValue().getBlockedRequests();
                    summary.uniqueClients++;
                } catch (IllegalArgumentException e) {
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("summaryByType", summaryByType);

        return ResponseEntity.ok(response);
    }

    private static class StatsSummary {
        public long totalRequests = 0;
        public long blockedRequests = 0;
        public int uniqueClients = 0;

        public double getBlockedPercentage() {
            return totalRequests > 0 ? (blockedRequests * 100.0 / totalRequests) : 0.0;
        }
    }

}
