package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.SubscriptionHistory;
import com.xerox.rental.entity.User;

@Repository
public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, Long> {
	 List<SubscriptionHistory> findBySubscriptionOrderByCreatedAtDesc(Subscription subscription);
	    List<SubscriptionHistory> findByUserOrderByCreatedAtDesc(User user);
	    List<SubscriptionHistory> findByActionOrderByCreatedAtDesc(SubscriptionHistory.Action action);

}
