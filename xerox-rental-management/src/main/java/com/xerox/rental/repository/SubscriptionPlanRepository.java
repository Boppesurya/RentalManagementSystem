package com.xerox.rental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.SubscriptionPlan;
@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
	List<SubscriptionPlan> findByActiveTrue();
    Optional<SubscriptionPlan> findByName(String name);
    List<SubscriptionPlan> findByMachineLimit(Integer machineLimit);
    List<SubscriptionPlan> findByMonthlyPriceLessThanEqual(Double maxPrice);

}
