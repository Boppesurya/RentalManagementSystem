package com.xerox.rental.service;



import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xerox.rental.entity.Subscription;
import com.xerox.rental.entity.SubscriptionHistory;
import com.xerox.rental.entity.SubscriptionPlan;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.SubscriptionHistoryRepository;
import com.xerox.rental.repository.SubscriptionRepository;

@Service
public class SubscriptionService {
	
	@Autowired
    private PdfGenerationService pdfGenerationService;
	
    @Autowired
    private final EmailService emailService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionHistoryRepository historyRepository;

    @Autowired
    private NotificationService notificationService;

    SubscriptionService(EmailService emailService) {
        this.emailService = emailService;
    }

    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    public Optional<Subscription> getSubscriptionById(Long id) {
        return subscriptionRepository.findById(id);
    }

    public List<Subscription> getSubscriptionsByUser(Long userId) {
        User user = new User();
        user.setId(userId);
        return subscriptionRepository.findByUser(user);
    }

    public Optional<Subscription> getActiveSubscriptionByUser(Long userId) {
        User user = new User();
        user.setId(userId);
        List<Subscription.Status> activeStatuses = Arrays.asList(
            Subscription.Status.ACTIVE,
            Subscription.Status.TRIAL
        );
        return subscriptionRepository.findByUserAndStatusIn(user, activeStatuses);
    }

    @Transactional
    public Subscription verifyPaymentAndActivate(
            Long subscriptionId,
            User verifiedBy,
            boolean approved,
            String adminNotes) {

        // ❗ Validate admin (THIS FIXES YOUR NaN PROBLEM)
        if (verifiedBy == null || verifiedBy.getId() == null) {
            throw new RuntimeException("Invalid admin. Admin ID is missing.");
        }

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        // ❗ Allow verification ONLY for PENDING subscriptions
        if (subscription.getStatus() == null || subscription.getStatus() != Subscription.Status.PENDING) {
            throw new RuntimeException("Only pending subscriptions can be verified.");
        }

        // ❗ Prevent double verification
        if (subscription.getPaymentVerified()) {
            throw new RuntimeException("Payment already verified.");
        }

        LocalDateTime now = LocalDateTime.now();

        // Safe adminNotes handling
        String notes = (adminNotes == null || adminNotes.trim().isEmpty())
                ? ""
                : adminNotes.trim();

        if (approved) {

            subscription.setStatus(Subscription.Status.ACTIVE);
            subscription.setPaymentVerified(true);
            subscription.setPaymentVerifiedAt(now);
            subscription.setPaymentVerifiedBy(verifiedBy);
            subscription.setAdminNotes(notes);
            subscription.setStartDate(now);

            if (subscription.getBillingCycle() == Subscription.BillingCycle.MONTHLY) {
                subscription.setEndDate(now.plusMonths(1));
            } else {
                subscription.setEndDate(now.plusYears(1));
            }

            // ❗ Plan must never be null
            if (subscription.getPlan() == null) {
                throw new RuntimeException("Plan is missing for subscription.");
            }

            // Generate invoice number
            String invoiceNumber = generateInvoiceNumber(subscription);
            subscription.setInvoiceNumber(invoiceNumber);

            Subscription saved = subscriptionRepository.save(subscription);

            createHistory(saved, SubscriptionHistory.Action.ACTIVATED,
                    Subscription.Status.PENDING, Subscription.Status.ACTIVE,
                    null, null, saved.getAmountPaid(), null,
                    saved.getPaymentMethod(), saved.getTransactionId(),
                    "Payment verified by admin: " + notes);

            // Safe notification
            try {
                notificationService.sendSubscriptionActivatedNotification(
                        saved.getUser().getId(),
                        saved.getPlan().getName(),
                        saved.getEndDate()
                );
            } catch (Exception ex) {
                System.err.println("Notification error: " + ex.getMessage());
            }

            // Safe email
            try {
                sendInvoiceEmailAsync(saved);
            } catch (Exception ex) {
                System.err.println("Invoice email error: " + ex.getMessage());
            }

            return saved;

        } else {

            subscription.setStatus(Subscription.Status.CANCELLED);
            subscription.setAdminNotes(notes);
            subscription.setPaymentVerifiedBy(verifiedBy);
            subscription.setPaymentVerifiedAt(now);

            Subscription saved = subscriptionRepository.save(subscription);

            createHistory(saved, SubscriptionHistory.Action.CANCELLED,
                    Subscription.Status.PENDING, Subscription.Status.CANCELLED,
                    null, null, 0.0, null, null, null,
                    "Payment rejected by admin: " + notes);

            try {
                notificationService.sendSubscriptionRejectedNotification(
                        saved.getUser().getId(),
                        saved.getPlan().getName(),
                        notes
                );
            } catch (Exception ex) {
                System.err.println("Reject notification error: " + ex.getMessage());
            }

            return saved;
        }
    }


    
    @Async  // Very important! Don't block the transaction
    private void sendInvoiceEmailAsync(Subscription subscription) {
        try {
            User customer = subscription.getUser();
            if (customer == null || customer.getEmail() == null || customer.getEmail().isBlank()) {
               
                return;
            }

            byte[] pdfBytes = pdfGenerationService.generateSubscriptionInvoicePdf(subscription);

            String pdfFileName = "invoice_" + subscription.getInvoiceNumber() + ".pdf";

            String htmlBody = """
                <p>Congratulations! Your payment has been <strong>approved</strong> and your subscription is now <strong>active</strong>.</p>
                
                <h3>Subscription Details</h3>
                <ul>
                    <li><strong>Plan:</strong> %s</li>
                    <li><strong>Invoice Number:</strong> %s</li>
                    <li><strong>Amount Paid:</strong> ₹%,.2f</li>
                    <li><strong>Valid Until:</strong> %s</li>
                </ul>
                
                <p>Your invoice is attached to this email.</p>
                <p>Thank you for trusting us!</p>
                <p>If you have any questions, just reply to this email.</p>
                """.formatted(
                    subscription.getPlan().getName(),
                    subscription.getInvoiceNumber(),
                    subscription.getAmountPaid(),
                    subscription.getEndDate().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"))
                );

            emailService.sendEmailWithAttachment(
                customer.getEmail(),
                customer.getName() != null ? customer.getName() : "Customer",
                "Payment Approved – Invoice #" + subscription.getInvoiceNumber(),
                htmlBody,
                pdfBytes,
                pdfFileName
            );

            

        } catch (Exception e) {
            // Never let email failure break the activation
           e.printStackTrace();
                    
        }
    }

    private String generateInvoiceNumber(Subscription subscription) {
        // Format: SUB-YYYYMMDD-USERID-ID
        LocalDateTime now = LocalDateTime.now();
        return String.format("SUB-%04d%02d%02d-%d-%d",
                now.getYear(),
                now.getMonthValue(),
                now.getDayOfMonth(),
                subscription.getUser().getId(),
                subscription.getId());
    }

    public List<Subscription> getPendingVerificationSubscriptions() {
        return subscriptionRepository.findByStatus(Subscription.Status.PENDING);
    }

    public List<Subscription> getSubscriptionsByStatus(Subscription.Status status) {
        return subscriptionRepository.findByStatus(status);
    }

    public List<Subscription> getExpiringSubscriptions(Integer days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime futureDate = now.plusDays(days);
        return subscriptionRepository.findExpiringSubscriptions(now, futureDate);
    }

    @Transactional
    public Subscription createSubscription(
            User user,
            SubscriptionPlan plan,
            Subscription.BillingCycle billingCycle,
            String paymentMethod,
            String transactionId) {

        Subscription subscription = new Subscription();
        subscription.setUser(user);
        subscription.setPlan(plan);
        subscription.setBillingCycle(billingCycle);
        subscription.setAutoRenew(true);
        subscription.setMachineLimit(plan.getMachineLimit());

        // Always start as PENDING – payment must be verified later
        subscription.setStatus(Subscription.Status.PENDING);
        subscription.setPaymentVerified(false);
        subscription.setIsTrial(false); // explicitly false – no trials anymore

        LocalDateTime now = LocalDateTime.now();
        subscription.setStartDate(now);

        // No trial logic → calculate real end date immediately
        if (billingCycle == Subscription.BillingCycle.MONTHLY) {
            subscription.setEndDate(now.plusMonths(1));
        } else {
            subscription.setEndDate(now.plusYears(1));
        }

        // Amount is always the real price (monthly or yearly)
        Double amount = billingCycle == Subscription.BillingCycle.MONTHLY
                ? plan.getFinalMonthlyPrice()
                : plan.getFinalYearlyPrice();

        subscription.setAmountPaid(amount);
        subscription.setPaymentMethod(paymentMethod);
        subscription.setTransactionId(transactionId);

        Subscription saved = subscriptionRepository.save(subscription);

        // History & notifications – only one path now (no trial branch)
        createHistory(
                saved,
                SubscriptionHistory.Action.CREATED,
                null,
                Subscription.Status.PENDING,
                null,
                null,
                amount,
                null,
                paymentMethod,
                transactionId,
                "Subscription created, awaiting payment verification"
        );

        // Notify user
        notificationService.sendSubscriptionCreatedConfirmation(
                user.getId(),
                plan.getName(),
                paymentMethod
        );

        // Notify admins about the new pending subscription
        notificationService.sendPendingSubscriptionToAdmins(
                user.getName(),
                plan.getName(),
                amount,
                paymentMethod
        );

        return saved;
    }

    @Transactional
    public Subscription upgradeSubscription(Long subscriptionId, SubscriptionPlan newPlan) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        SubscriptionPlan oldPlan = subscription.getPlan();
        subscription.setPlan(newPlan);
        subscription.setMachineLimit(newPlan.getMachineLimit());

        Subscription saved = subscriptionRepository.save(subscription);
        createHistory(saved, SubscriptionHistory.Action.UPGRADED, null, null, oldPlan.getId(), newPlan.getId(), 0.0, null, null, null, "Subscription upgraded from " + oldPlan.getName() + " to " + newPlan.getName());

        return saved;
    }

    @Transactional
    public Subscription renewSubscription(Long subscriptionId, String paymentMethod, String transactionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        LocalDateTime now = LocalDateTime.now();
        subscription.setStartDate(now);
        subscription.setStatus(Subscription.Status.ACTIVE);
        subscription.setIsTrial(false);
        subscription.setTrialEndDate(null);

        if (subscription.getBillingCycle() == Subscription.BillingCycle.MONTHLY) {
            subscription.setEndDate(now.plusMonths(1));
        } else {
            subscription.setEndDate(now.plusYears(1));
        }

        Double amount = subscription.getBillingCycle() == Subscription.BillingCycle.MONTHLY
                ? subscription.getPlan().getFinalMonthlyPrice()
                : subscription.getPlan().getFinalYearlyPrice();

        subscription.setAmountPaid(amount);
        subscription.setPaymentMethod(paymentMethod);
        subscription.setTransactionId(transactionId);

        Subscription saved = subscriptionRepository.save(subscription);
        createHistory(saved, SubscriptionHistory.Action.RENEWED, null, Subscription.Status.ACTIVE, null, null, amount, null, paymentMethod, transactionId, "Subscription renewed");

        return saved;
    }

    @Transactional
    public void cancelSubscription(Long subscriptionId) {

        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        // Prevent double cancellation
        if (subscription.getStatus() == Subscription.Status.CANCELLED) {
            throw new RuntimeException("Subscription is already cancelled");
        }

        // Prevent cancelling expired subscription
        if (subscription.getEndDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel an expired subscription");
        }

        Subscription.Status oldStatus = subscription.getStatus();

        // Safe refund (never null)
        Double refund = calculateRefund(subscription);
        if (refund == null) {
            refund = 0.0;
        }

        // Update subscription
        subscription.setStatus(Subscription.Status.CANCELLED);
        subscription.setAutoRenew(false);

        Subscription saved = subscriptionRepository.save(subscription);

        // History entry
        createHistory(
                saved,
                SubscriptionHistory.Action.CANCELLED,
                oldStatus,
                Subscription.Status.CANCELLED,
                null,
                null,
                0.0,               // amount paid not needed for cancel history
                refund,            // refund amount
                null,
                null,
                "Subscription cancelled. Refund: ₹" + String.format("%.2f", refund)
        );
    }

    @Transactional
    public Subscription toggleAutoRenew(Long subscriptionId, Boolean enabled) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        subscription.setAutoRenew(enabled);
        return subscriptionRepository.save(subscription);
    }

    public Double calculateRefund(Subscription subscription) {
        if (subscription.getIsTrial()) {
            return 0.0;
        }

        long totalDays = subscription.getTotalDays();
        long daysUsed = subscription.getDaysUsed();

        if (daysUsed >= totalDays) {
            return 0.0;
        }

        long remainingDays = totalDays - daysUsed;
        double dailyRate = subscription.getAmountPaid() / totalDays;
        double refund = dailyRate * remainingDays;
        double adminFee = refund * 0.05;

        return Math.max(0.0, refund - adminFee);
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void checkExpiredSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(now);

        for (Subscription subscription : expired) {
            Subscription.Status oldStatus = subscription.getStatus();
            subscription.setStatus(Subscription.Status.EXPIRED);
            subscriptionRepository.save(subscription);

            createHistory(subscription, SubscriptionHistory.Action.EXPIRED, oldStatus, Subscription.Status.EXPIRED, null, null, 0.0, null, null, null, "Subscription expired");

            notificationService.sendSubscriptionExpiredNotification(
                subscription.getUser().getId(),
                subscription.getPlan().getName()
            );
        }
    }

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendExpiryReminders() {
        List<Subscription> expiring7Days = getExpiringSubscriptions(7);
        List<Subscription> expiring3Days = getExpiringSubscriptions(3);
        List<Subscription> expiring1Day = getExpiringSubscriptions(1);

        for (Subscription subscription : expiring7Days) {
            if (subscription.getLastNotificationSent() == null ||
                subscription.getLastNotificationSent().isBefore(LocalDateTime.now().minusDays(2))) {
                notificationService.sendSubscriptionExpiringNotification(
                    subscription.getUser().getId(),
                    subscription.getPlan().getName(),
                    7
                );
                subscription.setLastNotificationSent(LocalDateTime.now());
                subscriptionRepository.save(subscription);
            }
        }

        for (Subscription subscription : expiring3Days) {
            if (subscription.getLastNotificationSent() == null ||
                subscription.getLastNotificationSent().isBefore(LocalDateTime.now().minusDays(1))) {
                notificationService.sendSubscriptionExpiringNotification(
                    subscription.getUser().getId(),
                    subscription.getPlan().getName(),
                    3
                );
                subscription.setLastNotificationSent(LocalDateTime.now());
                subscriptionRepository.save(subscription);
            }
        }

        for (Subscription subscription : expiring1Day) {
            notificationService.sendSubscriptionExpiringNotification(
                subscription.getUser().getId(),
                subscription.getPlan().getName(),
                1
            );
            subscription.setLastNotificationSent(LocalDateTime.now());
            subscriptionRepository.save(subscription);
        }
    }
    
    

    private void createHistory(
            Subscription subscription,
            SubscriptionHistory.Action action,
            Subscription.Status oldStatus,
            Subscription.Status newStatus,
            Long oldPlanId,
            Long newPlanId,
            Double amountPaid,
            Double refundAmount,
            String paymentMethod,
            String transactionId,
            String notes) {

        SubscriptionHistory history = new SubscriptionHistory();
        history.setSubscription(subscription);
        history.setUser(subscription.getUser());
        history.setAction(action);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setOldPlanId(oldPlanId);
        history.setNewPlanId(newPlanId);
        history.setAmountPaid(amountPaid);
        history.setRefundAmount(refundAmount);
        history.setPaymentMethod(paymentMethod);
        history.setTransactionId(transactionId);
        history.setNotes(notes);

        historyRepository.save(history);
    }

    public List<SubscriptionHistory> getSubscriptionHistory(Long subscriptionId) {
        Subscription subscription = new Subscription();
        subscription.setId(subscriptionId);
        return historyRepository.findBySubscriptionOrderByCreatedAtDesc(subscription);
    }
} 