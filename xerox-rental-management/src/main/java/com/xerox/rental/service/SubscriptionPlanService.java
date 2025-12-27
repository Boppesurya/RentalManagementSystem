package com.xerox.rental.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.repository.SubscriptionPlanRepository;

import jakarta.transaction.Transactional;

@Service
public class SubscriptionPlanService {
	   @Autowired
	    private SubscriptionPlanRepository planRepository;

	    public List<SubscriptionPlan> getAllPlans() {
	        return planRepository.findAll();
	    }

	    public List<SubscriptionPlan> getActivePlans() {
	        return planRepository.findByActiveTrue();
	    }

	    public Optional<SubscriptionPlan> getPlanById(Long id) {
	        return planRepository.findById(id);
	    }

	    public Optional<SubscriptionPlan> getPlanByName(String name) {
	        return planRepository.findByName(name);
	    }

	    @Transactional
	    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
	        return planRepository.save(plan);
	    }

	    @Transactional
	    public SubscriptionPlan updatePlan(Long id, SubscriptionPlan planDetails) {
	        SubscriptionPlan plan = planRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Plan not found"));

	        plan.setName(planDetails.getName());
	        plan.setDescription(planDetails.getDescription());
	        plan.setMachineLimit(planDetails.getMachineLimit());
	        plan.setMonthlyPrice(planDetails.getMonthlyPrice());
	        plan.setYearlyPrice(planDetails.getYearlyPrice());
	        plan.setTrialDays(planDetails.getTrialDays());
	        plan.setActive(planDetails.getActive());
	        plan.setDiscountPercentage(planDetails.getDiscountPercentage());

	        return planRepository.save(plan);
	    }

	    @Transactional
	    public SubscriptionPlan updateDiscount(Long id, Double discountPercentage) {
	        SubscriptionPlan plan = planRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Plan not found"));

	        plan.setDiscountPercentage(discountPercentage);
	        return planRepository.save(plan);
	    }

	    @Transactional
	    public SubscriptionPlan togglePlanActive(Long id, Boolean active) {
	        SubscriptionPlan plan = planRepository.findById(id)
	                .orElseThrow(() -> new RuntimeException("Plan not found"));

	        plan.setActive(active);
	        return planRepository.save(plan);
	    }

	    @Transactional
	    public void deletePlan(Long id) {
	        planRepository.deleteById(id);
	    }

	    public List<SubscriptionPlan> getPlansByMachineLimit(Integer limit) {
	        return planRepository.findByMachineLimit(limit);
	    }

	    public List<SubscriptionPlan> getPlansByMaxPrice(Double maxPrice) {
	        return planRepository.findByMonthlyPriceLessThanEqual(maxPrice);
	    }
}
