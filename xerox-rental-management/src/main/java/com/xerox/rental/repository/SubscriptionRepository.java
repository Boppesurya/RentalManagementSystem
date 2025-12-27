package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.User;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUser(User user);

    Optional<Subscription> findByUserAndStatusIn(User user, List<Subscription.Status> statuses);

    List<Subscription> findByStatus(Subscription.Status status);

    @Query("SELECT s FROM Subscription s WHERE s.endDate <= :date AND s.status IN ('ACTIVE', 'TRIAL')")
    List<Subscription> findExpiredSubscriptions(@Param("date") LocalDateTime date);

    @Query("SELECT s FROM Subscription s WHERE s.endDate BETWEEN :now AND :futureDate AND s.status IN ('ACTIVE', 'TRIAL')")
    List<Subscription> findExpiringSubscriptions(
        @Param("now") LocalDateTime now,
        @Param("futureDate") LocalDateTime futureDate
    );
    
    List<Subscription> findByStatusAndTrialEndDateBefore(
            Subscription.Status status,
            LocalDateTime date
    );


    @Query("SELECT s FROM Subscription s WHERE s.trialEndDate <= :date AND s.status = 'TRIAL'")
    List<Subscription> findExpiredTrials(@Param("date") LocalDateTime date);

    List<Subscription> findByAutoRenewTrueAndStatus(Subscription.Status status);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.user = :user AND s.status IN ('ACTIVE', 'TRIAL')")
    Long countActiveSubscriptionsByUser(@Param("user") User user);
    Optional<Subscription> findByUserIdAndStatus(Long userId, Subscription.Status status);

}
