package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.TwoFactorAttempt;

@Repository
public interface TwoFactorAttemptRepository extends JpaRepository<TwoFactorAttempt, Long> {

    List<TwoFactorAttempt> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(t) FROM TwoFactorAttempt t WHERE t.userId = :userId AND t.success = false AND t.createdAt > :since")
    long countFailedAttemptsSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT t FROM TwoFactorAttempt t WHERE t.userId = :userId AND t.attemptType = :attemptType ORDER BY t.createdAt DESC")
    List<TwoFactorAttempt> findByUserIdAndAttemptType(@Param("userId") Long userId, @Param("attemptType") TwoFactorAttempt.AttemptType attemptType);
}
