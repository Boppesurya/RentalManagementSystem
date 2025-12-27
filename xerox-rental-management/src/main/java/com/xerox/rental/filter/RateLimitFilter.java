package com.xerox.rental.filter;
import com.xerox.rental.service.RateLimitService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {
	 private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

	    private final RateLimitService rateLimitService;

	    public RateLimitFilter(RateLimitService rateLimitService) {
	        this.rateLimitService = rateLimitService;
	    }

	    @Override
	    protected void doFilterInternal(HttpServletRequest request,
	                                    HttpServletResponse response,
	                                    FilterChain filterChain) throws ServletException, IOException {

	        String path = request.getRequestURI();

	        if (shouldSkipRateLimiting(path)) {
	            filterChain.doFilter(request, response);
	            return;
	        }

	        RateLimitService.RateLimitType limitType = determineRateLimitType(path);
	        String clientId = getClientId(request);
	        Long userId = getUserId(request);

	        if (rateLimitService.isWhitelisted(clientId)) {
	            logger.debug("Whitelisted client bypassing rate limit: {}", clientId);
	            response.addHeader("X-Rate-Limit-Status", "whitelisted");
	            filterChain.doFilter(request, response);
	            return;
	        }

	        String key = clientId + ":" + limitType.name();
	        Bucket bucket = rateLimitService.resolveBucket(key, limitType, userId);
	        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

	        if (probe.isConsumed()) {
	            addRateLimitHeaders(response, probe, limitType);
	            rateLimitService.recordRateLimitHit(clientId, limitType, true,
	                    path, request.getMethod(), getIpAddress(request), request.getHeader("User-Agent"));
	            filterChain.doFilter(request, response);
	        } else {
	            handleRateLimitExceeded(response, probe, clientId, limitType);
	            rateLimitService.recordRateLimitHit(clientId, limitType, false,
	                    path, request.getMethod(), getIpAddress(request), request.getHeader("User-Agent"));
	        }
	    }

	    private boolean shouldSkipRateLimiting(String path) {
	        return path.equals("/api/health") ||
	               path.startsWith("/actuator/") ||
	               path.startsWith("/api/rate-limits/stats");
	    }

	    private RateLimitService.RateLimitType determineRateLimitType(String path) {
	        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
	            return RateLimitService.RateLimitType.AUTHENTICATION;
	        } else if (path.contains("/subscription")) {
	            return RateLimitService.RateLimitType.SUBSCRIPTION;
	        } else if (path.contains("/payment") || path.contains("/verify-payment")) {
	            return RateLimitService.RateLimitType.PAYMENT;
	        } else if (path.contains("/report") || path.contains("/pdf") || path.contains("/export")) {
	            return RateLimitService.RateLimitType.REPORT_GENERATION;
	        } else if (path.contains("/upload") || path.contains("/document")) {
	            return RateLimitService.RateLimitType.FILE_UPLOAD;
	        } else if (path.contains("/email") || path.contains("/send")) {
	            return RateLimitService.RateLimitType.EMAIL;
	        } else if (path.startsWith("/public/")) {
	            return RateLimitService.RateLimitType.PUBLIC;
	        } else {
	            return RateLimitService.RateLimitType.GENERAL_API;
	        }
	    }

	    private String getClientId(HttpServletRequest request) {
	        Long userId = getUserId(request);
	        if (userId != null) {
	            return "user:" + userId;
	        }

	        String xForwardedFor = request.getHeader("X-Forwarded-For");
	        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
	            return "ip:" + xForwardedFor.split(",")[0].trim();
	        }

	        return "ip:" + request.getRemoteAddr();
	    }

	    private Long getUserId(HttpServletRequest request) {
	        Object userIdAttr = request.getAttribute("userId");
	        if (userIdAttr instanceof Long) {
	            return (Long) userIdAttr;
	        }
	        return null;
	    }

	    private String getIpAddress(HttpServletRequest request) {
	        String xForwardedFor = request.getHeader("X-Forwarded-For");
	        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
	            return xForwardedFor.split(",")[0].trim();
	        }
	        return request.getRemoteAddr();
	    }

	    private void addRateLimitHeaders(HttpServletResponse response, ConsumptionProbe probe,
	                                     RateLimitService.RateLimitType type) {
	        response.addHeader("X-Rate-Limit-Type", type.name());
	        response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
	        response.addHeader("X-Rate-Limit-Retry-After-Seconds",
	                String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
	    }

	    private void handleRateLimitExceeded(HttpServletResponse response, ConsumptionProbe probe,
	                                         String clientId, RateLimitService.RateLimitType type) throws IOException {
	        long retryAfterSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;

	        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
	        response.setContentType("application/json");
	        response.addHeader("X-Rate-Limit-Type", type.name());
	        response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(retryAfterSeconds));
	        response.addHeader("Retry-After", String.valueOf(retryAfterSeconds));

	        String jsonResponse = String.format(
	                "{\"error\":\"Rate limit exceeded\"," +
	                "\"message\":\"Too many requests. Please try again in %d seconds.\"," +
	                "\"retryAfterSeconds\":%d," +
	                "\"limitType\":\"%s\"}",
	                retryAfterSeconds, retryAfterSeconds, type.name()
	        );

	        response.getWriter().write(jsonResponse);

	        logger.warn("Rate limit exceeded - Client: {}, Type: {}, RetryAfter: {}s",
	                clientId, type, retryAfterSeconds);
	    }

}
