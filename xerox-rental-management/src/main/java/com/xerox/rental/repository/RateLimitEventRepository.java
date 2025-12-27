package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.xerox.rental.entity.RateLimitEvent;

public interface RateLimitEventRepository extends JpaRepository<RateLimitEvent, Long> {
	 List<RateLimitEvent> findByClientIdOrderByCreatedAtDesc(String clientId);

	    List<RateLimitEvent> findByUserIdOrderByCreatedAtDesc(Long userId);

	    List<RateLimitEvent> findByBlockedTrueOrderByCreatedAtDesc();

	    @Query("SELECT e FROM RateLimitEvent e WHERE e.createdAt >= :since ORDER BY e.createdAt DESC")
	    List<RateLimitEvent> findRecentEvents(@Param("since") LocalDateTime since);

	    @Query("SELECT e FROM RateLimitEvent e WHERE e.blocked = true AND e.createdAt >= :since ORDER BY e.createdAt DESC")
	    List<RateLimitEvent> findRecentBlockedEvents(@Param("since") LocalDateTime since);

	    @Query("SELECT e.clientId, COUNT(e) as count FROM RateLimitEvent e WHERE e.blocked = true AND e.createdAt >= :since GROUP BY e.clientId ORDER BY count DESC")
	    List<Object[]> findTopOffendersSince(@Param("since") LocalDateTime since);

	    @Query("SELECT COUNT(e) FROM RateLimitEvent e WHERE e.createdAt >= :since")
	    Long countEventsSince(@Param("since") LocalDateTime since);

	    @Query("SELECT COUNT(e) FROM RateLimitEvent e WHERE e.blocked = true AND e.createdAt >= :since")
	    Long countBlockedEventsSince(@Param("since") LocalDateTime since);

	    void deleteByCreatedAtBefore(LocalDateTime date);

}
