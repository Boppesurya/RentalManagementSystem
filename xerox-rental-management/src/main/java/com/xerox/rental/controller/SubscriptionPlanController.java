package com.xerox.rental.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.SubscriptionPlanRequest;
import com.xerox.rental.dto.SubscriptionPlanResponse;
import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.service.SubscriptionPlanService;

@RestController
@RequestMapping("/api/subscription-plans")
@CrossOrigin(origins = "*")
public class SubscriptionPlanController {
	@Autowired
    private SubscriptionPlanService planService;

    @GetMapping
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllPlans() {
        List<SubscriptionPlan> plans = planService.getAllPlans();
        List<SubscriptionPlanResponse> response = plans.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    public ResponseEntity<List<SubscriptionPlanResponse>> getActivePlans() {
        List<SubscriptionPlan> plans = planService.getActivePlans();
        List<SubscriptionPlanResponse> response = plans.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionPlanResponse> getPlanById(@PathVariable Long id) {
        return planService.getPlanById(id)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SubscriptionPlanResponse> createPlan(@RequestBody SubscriptionPlanRequest request) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setMachineLimit(request.getMachineLimit());
        plan.setMonthlyPrice(request.getMonthlyPrice());
        plan.setYearlyPrice(request.getYearlyPrice());
        plan.setTrialDays(request.getTrialDays() != null ? request.getTrialDays() : 7);
        plan.setActive(request.getActive() != null ? request.getActive() : true);
        plan.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0.0);

        SubscriptionPlan created = planService.createPlan(plan);
        return ResponseEntity.ok(convertToResponse(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPlanResponse> updatePlan(
            @PathVariable Long id,
            @RequestBody SubscriptionPlanRequest request) {

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setName(request.getName());
        plan.setDescription(request.getDescription());
        plan.setMachineLimit(request.getMachineLimit());
        plan.setMonthlyPrice(request.getMonthlyPrice());
        plan.setYearlyPrice(request.getYearlyPrice());
        plan.setTrialDays(request.getTrialDays());
        plan.setActive(request.getActive());
        plan.setDiscountPercentage(request.getDiscountPercentage());

        SubscriptionPlan updated = planService.updatePlan(id, plan);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/discount")
    public ResponseEntity<SubscriptionPlanResponse> updateDiscount(
            @PathVariable Long id,
            @RequestParam Double discountPercentage) {

        SubscriptionPlan updated = planService.updateDiscount(id, discountPercentage);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<SubscriptionPlanResponse> activatePlan(@PathVariable Long id) {
        SubscriptionPlan updated = planService.togglePlanActive(id, true);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<SubscriptionPlanResponse> deactivatePlan(@PathVariable Long id) {
        SubscriptionPlan updated = planService.togglePlanActive(id, false);
        return ResponseEntity.ok(convertToResponse(updated));
    }

    private SubscriptionPlanResponse convertToResponse(SubscriptionPlan plan) {
        SubscriptionPlanResponse response = new SubscriptionPlanResponse();
        response.setId(plan.getId());
        response.setName(plan.getName());
        response.setDescription(plan.getDescription());
        response.setMachineLimit(plan.getMachineLimit());
        response.setMonthlyPrice(plan.getMonthlyPrice());
        response.setYearlyPrice(plan.getYearlyPrice());
        response.setTrialDays(plan.getTrialDays());
        response.setActive(plan.getActive());
        response.setDiscountPercentage(plan.getDiscountPercentage());
        response.setFinalMonthlyPrice(plan.getFinalMonthlyPrice());
        response.setFinalYearlyPrice(plan.getFinalYearlyPrice());
        response.setCreatedAt(plan.getCreatedAt());
        response.setUpdatedAt(plan.getUpdatedAt());
        return response;
    }

}
