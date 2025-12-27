package com.xerox.rental.config;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.repository.SubscriptionPlanRepository;

@Component
public class SubscriptionInitializer implements CommandLineRunner {
	 @Autowired
	    private SubscriptionPlanRepository planRepository;

	    @Override
	    public void run(String... args) throws Exception {
	        initializeDefaultPlans();
	    }

	    private void initializeDefaultPlans() {
	        createPlanIfNotExists("Free", "Free plan with basic features", 0, 0.0, 0.0, 7);
	        createPlanIfNotExists("Starter", "Perfect for small businesses", 10, 999.0, 9999.0, 7);
	        createPlanIfNotExists("Professional", "Ideal for growing businesses", 50, 2999.0, 29999.0, 7);
	        createPlanIfNotExists("Business", "For established businesses", 100, 4999.0, 49999.0, 7);
	        createPlanIfNotExists("Enterprise", "For large organizations", 200, 7999.0, 79999.0, 7);
	        createPlanIfNotExists("Unlimited", "Unlimited machines for maximum scale", null, 14999.0, 149999.0, 7);
	    }

	    private void createPlanIfNotExists(String name, String description, Integer machineLimit,
	                                      Double monthlyPrice, Double yearlyPrice, Integer trialDays) {
	        Optional<SubscriptionPlan> existing = planRepository.findByName(name);

	        if (existing.isEmpty()) {
	            SubscriptionPlan plan = new SubscriptionPlan();
	            plan.setName(name);
	            plan.setDescription(description);
	            plan.setMachineLimit(machineLimit);
	            plan.setMonthlyPrice(monthlyPrice);
	            plan.setYearlyPrice(yearlyPrice);
	            plan.setTrialDays(trialDays);
	            plan.setActive(true);
	            plan.setDiscountPercentage(0.0);

	            planRepository.save(plan);
	            System.out.println("Created default subscription plan: " + name);
	        }
	    }}
