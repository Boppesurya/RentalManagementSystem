package com.xerox.rental.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.RefundCalculationResponse;
import com.xerox.rental.dto.SubscriptionRequest;
import com.xerox.rental.dto.SubscriptionResponse;
import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.EmailService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.PdfGenerationService;
import com.xerox.rental.service.SubscriptionPlanService;
import com.xerox.rental.service.SubscriptionService;
import com.xerox.rental.service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/subscriptions")
@CrossOrigin(origins = "*")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private SubscriptionPlanService planService;

    @Autowired
    private UserService userService;

    @Autowired
    private MachineService machineService;

    @Autowired
    private PdfGenerationService pdfGenerationService;

    @Autowired
    private EmailService emailService;


    // ========================= GET ALL =========================
    @GetMapping
    public ResponseEntity<List<SubscriptionResponse>> getAllSubscriptions() {
        List<Subscription> subscriptions = subscriptionService.getAllSubscriptions();
        return ResponseEntity.ok(
                subscriptions.stream().map(this::convertToResponse).collect(Collectors.toList())
        );
    }

    // ========================= GET BY ID =========================
    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return subscriptionService.getSubscriptionById(id)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ========================= GET USER ACTIVE =========================
    @GetMapping("/user/{userId}")
    public ResponseEntity<SubscriptionResponse> getUserActiveSubscription(@PathVariable Long userId) {
        return subscriptionService.getActiveSubscriptionByUser(userId)
                .map(this::convertToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ========================= GET USER ALL =========================
    @GetMapping("/user/{userId}/all")
    public ResponseEntity<List<SubscriptionResponse>> getUserSubscriptions(@PathVariable Long userId) {
        List<Subscription> subscriptions = subscriptionService.getSubscriptionsByUser(userId);
        return ResponseEntity.ok(
                subscriptions.stream().map(this::convertToResponse).collect(Collectors.toList())
        );
    }

    // ========================= CREATE SUBSCRIPTION =========================
    @PostMapping
    public ResponseEntity<SubscriptionResponse> createSubscription(@RequestBody SubscriptionRequest request) {
        try {
            User user = userService.getUserById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            SubscriptionPlan plan = planService.getPlanById(request.getPlanId())
                    .orElseThrow(() -> new RuntimeException("Plan not found"));

            Subscription.BillingCycle billingCycle =
                    Subscription.BillingCycle.valueOf(request.getBillingCycle().toUpperCase());

            Subscription subscription = subscriptionService.createSubscription(
                    user, plan, billingCycle, request.getPaymentMethod(), request.getTransactionId()
            );

            return ResponseEntity.ok(convertToResponse(subscription));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= UPGRADE =========================
    @PostMapping("/{id}/upgrade")
    public ResponseEntity<SubscriptionResponse> upgradeSubscription(
            @PathVariable Long id,
            @RequestParam Long newPlanId) {

        try {
            SubscriptionPlan newPlan = planService.getPlanById(newPlanId)
                    .orElseThrow(() -> new RuntimeException("Plan not found"));

            Subscription upgraded = subscriptionService.upgradeSubscription(id, newPlan);
            return ResponseEntity.ok(convertToResponse(upgraded));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= RENEW =========================
    @PostMapping("/{id}/renew")
    public ResponseEntity<SubscriptionResponse> renewSubscription(
            @PathVariable Long id,
            @RequestParam String paymentMethod,
            @RequestParam String transactionId) {

        try {
            Subscription renewed = subscriptionService.renewSubscription(id, paymentMethod, transactionId);
            return ResponseEntity.ok(convertToResponse(renewed));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= CANCEL =========================
    @PostMapping("/{id}/cancel")
    public ResponseEntity<RefundCalculationResponse> cancelSubscription(@PathVariable Long id) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            Double refundAmount = subscriptionService.calculateRefund(subscription);
            if (refundAmount == null) refundAmount = 0.0;

            subscriptionService.cancelSubscription(id);

            LocalDate start = subscription.getStartDate().toLocalDate();
            LocalDate end = subscription.getEndDate().toLocalDate();
            LocalDate today = LocalDate.now();

            Long totalDays = ChronoUnit.DAYS.between(start, end);
            Long daysUsed = ChronoUnit.DAYS.between(start, today);
            if (daysUsed < 0) daysUsed = 0L;
            if (daysUsed > totalDays) daysUsed = totalDays;

            Long remainingDays = totalDays - daysUsed;
            double dailyRate = subscription.getAmountPaid() / totalDays;

            double refundBeforeFee = refundAmount / 0.95;
            double adminFee = refundBeforeFee * 0.05;

            RefundCalculationResponse response = new RefundCalculationResponse();
            response.setAmountPaid(subscription.getAmountPaid());
            response.setTotalDays(totalDays);
            response.setDaysUsed(daysUsed);
            response.setRemainingDays(remainingDays);
            response.setDailyRate(dailyRate);
            response.setRefundBeforeFee(refundBeforeFee);
            response.setAdminFee(adminFee);
            response.setFinalRefund(refundAmount);
            response.setCancellationDate(LocalDateTime.now().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }


    // ========================= REFUND ESTIMATE =========================
    @GetMapping("/{id}/refund-estimate")
    public ResponseEntity<RefundCalculationResponse> getRefundEstimate(@PathVariable Long id) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            Double refund = subscriptionService.calculateRefund(subscription);

            RefundCalculationResponse response = new RefundCalculationResponse();
            response.setAmountPaid(subscription.getAmountPaid());
            response.setTotalDays(subscription.getTotalDays());
            response.setDaysUsed(subscription.getDaysUsed());
            response.setRemainingDays(subscription.getTotalDays() - subscription.getDaysUsed());
            response.setDailyRate(subscription.getAmountPaid() / subscription.getTotalDays());
            response.setRefundBeforeFee(refund / 0.95);
            response.setAdminFee(refund / 0.95 * 0.05);
            response.setFinalRefund(refund);
            response.setCancellationDate(LocalDateTime.now().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= AUTO RENEW =========================
    @PutMapping("/{id}/auto-renew")
    public ResponseEntity<SubscriptionResponse> toggleAutoRenew(
            @PathVariable Long id,
            @RequestParam Boolean enabled) {

        try {
            Subscription updated = subscriptionService.toggleAutoRenew(id, enabled);
            return ResponseEntity.ok(convertToResponse(updated));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= STATUS FILTER =========================
    @GetMapping("/status/{status}")
    public ResponseEntity<List<SubscriptionResponse>> getSubscriptionsByStatus(@PathVariable String status) {
        try {
            Subscription.Status statusEnum = Subscription.Status.valueOf(status.toUpperCase());
            List<Subscription> subscriptions = subscriptionService.getSubscriptionsByStatus(statusEnum);

            return ResponseEntity.ok(
                    subscriptions.stream().map(this::convertToResponse).collect(Collectors.toList())
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // ========================= EXPIRING =========================
    @GetMapping("/expiring")
    public ResponseEntity<List<SubscriptionResponse>> getExpiringSubscriptions(@RequestParam Integer days) {
        List<Subscription> subscriptions = subscriptionService.getExpiringSubscriptions(days);

        return ResponseEntity.ok(
                subscriptions.stream().map(this::convertToResponse).collect(Collectors.toList())
        );
    }

    // ========================= PENDING =========================
    @GetMapping("/pending")
    public ResponseEntity<List<SubscriptionResponse>> getPendingVerificationSubscriptions() {
        List<Subscription> subscriptions = subscriptionService.getPendingVerificationSubscriptions();

        return ResponseEntity.ok(
                subscriptions.stream().map(this::convertToResponse).collect(Collectors.toList())
        );
    }

    // =============================================================
    //          UPDATED: VERIFY PAYMENT → AUTOMATIC ADMIN
    // =============================================================
    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<SubscriptionResponse> verifyPayment(
            @PathVariable Long id,
            @RequestParam boolean approved,
            @RequestParam(required = false) String adminNotes,
            HttpServletRequest request) {

        try {
            // Admin Auto-detect from JWT
            Long adminId = (Long) request.getAttribute("userId");
            String role = (String) request.getAttribute("userRole");

            System.out.println("JWT AdminId = " + adminId);
            System.out.println("JWT Role = " + role);

            if (adminId == null || role == null || !role.equalsIgnoreCase("ADMIN")) {
                throw new RuntimeException("Unauthorized: Only admin can verify payments");
            }

            User admin = userService.getUserById(adminId)
                    .orElseThrow(() -> new RuntimeException("Admin user not found"));

            Subscription verified = subscriptionService.verifyPaymentAndActivate(
                    id, admin, approved, adminNotes
            );

            return ResponseEntity.ok(convertToResponse(verified));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }


    // ========================= DOWNLOAD INVOICE =========================
    @GetMapping("/{id}/invoice/pdf")
    public ResponseEntity<byte[]> downloadSubscriptionInvoice(@PathVariable Long id) {
        try {
            Subscription subscription = subscriptionService.getSubscriptionById(id)
                    .orElseThrow(() -> new RuntimeException("Subscription not found"));

            if (subscription.getInvoiceNumber() == null) {
                return ResponseEntity.badRequest().build();
            }

            byte[] pdfBytes = pdfGenerationService.generateSubscriptionInvoicePdf(subscription);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment",
                    "subscription_invoice_" + subscription.getInvoiceNumber() + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }


    // ========================= CONVERT TO RESPONSE =========================
    private SubscriptionResponse convertToResponse(Subscription subscription) {
        SubscriptionResponse response = new SubscriptionResponse();

        response.setId(subscription.getId());

        // User
        response.setUserId(subscription.getUser().getId());
        response.setUserName(subscription.getUser().getName());
        response.setUserEmail(subscription.getUser().getEmail());
        response.setUserPhone(subscription.getUser().getContactNumber());

        // Plan
        response.setPlanId(subscription.getPlan().getId());
        response.setPlanName(subscription.getPlan().getName());
        response.setPlanDescription(subscription.getPlan().getDescription());
        response.setPlanMonthlyPrice(subscription.getPlan().getMonthlyPrice());
        response.setPlanYearlyPrice(subscription.getPlan().getYearlyPrice());

        // Subscription info
        response.setStatus(subscription.getStatus().name());
        response.setBillingCycle(subscription.getBillingCycle().name());
        response.setStartDate(subscription.getStartDate());
        response.setEndDate(subscription.getEndDate());
        response.setTrialEndDate(subscription.getTrialEndDate());
        response.setAutoRenew(subscription.getAutoRenew());
        response.setIsTrial(subscription.getIsTrial());
        response.setMachineLimit(subscription.getMachineLimit());

        // Payment
        response.setAmountPaid(subscription.getAmountPaid());
        response.setPaymentMethod(subscription.getPaymentMethod());
        response.setTransactionId(subscription.getTransactionId());
        response.setPaymentVerified(subscription.getPaymentVerified());
        response.setPaymentVerifiedAt(subscription.getPaymentVerifiedAt());
        response.setPaymentVerifiedBy(
                subscription.getPaymentVerifiedBy() != null ?
                        String.valueOf(subscription.getPaymentVerifiedBy().getId()) : null
        );
        response.setInvoiceNumber(subscription.getInvoiceNumber());
        response.setAdminNotes(subscription.getAdminNotes());

        // Machine count
        try {
            int machineCount = machineService.getMachinesByOwner(subscription.getUser().getId()).size();
            response.setCurrentMachineCount(machineCount);
        } catch (Exception e) {
            response.setCurrentMachineCount(0);
        }

        // Days remaining
        if (subscription.getEndDate() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), subscription.getEndDate());
            response.setDaysRemaining(Math.max(0, daysRemaining));
        }

        response.setCreatedAt(subscription.getCreatedAt());
        response.setUpdatedAt(subscription.getUpdatedAt());

        return response;
    }
}
