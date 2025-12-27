package com.xerox.rental.controller;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.entity.Invoice;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.InvoiceService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
	@Autowired
    private InvoiceService invoiceService;
    
    @Autowired
    private MachineService machineService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/revenue")
    public ResponseEntity<List<Map<String, Object>>> getRevenueReport() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        
        Map<String, Double> monthlyRevenue = new HashMap<>();
        Map<String, Integer> monthlyInvoiceCount = new HashMap<>();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (Invoice invoice : invoices) {
            if (invoice.getStatus() == Invoice.Status.PAID) {
                String month = invoice.getCreatedAt().format(formatter);
                monthlyRevenue.merge(month, invoice.getTotalAmount(), Double::sum);
                monthlyInvoiceCount.merge(month, 1, Integer::sum);
            }
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (String month : monthlyRevenue.keySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("month", month);
            data.put("amount", monthlyRevenue.get(month));
            data.put("invoiceCount", monthlyInvoiceCount.get(month));
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/machines/status")
    public ResponseEntity<List<Map<String, Object>>> getMachineStatusReport() {
        List<Machine> machines = machineService.getAllMachines();
        
        Map<String, Long> statusCount = machines.stream()
                .collect(Collectors.groupingBy(
                    machine -> machine.getStatus().toString(),
                    Collectors.counting()
                ));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : statusCount.entrySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("status", entry.getKey());
            data.put("count", entry.getValue());
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/users/role")
    public ResponseEntity<List<Map<String, Object>>> getUserRoleReport() {
        List<User> users = userService.getAllUsers();
        
        Map<String, Long> roleCount = users.stream()
                .collect(Collectors.groupingBy(
                    user -> user.getRole().toString(),
                    Collectors.counting()
                ));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : roleCount.entrySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("role", entry.getKey());
            data.put("count", entry.getValue());
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/invoices/status")
    public ResponseEntity<List<Map<String, Object>>> getInvoiceStatusReport() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        
        Map<String, Long> statusCount = invoices.stream()
                .collect(Collectors.groupingBy(
                    invoice -> invoice.getStatus().toString(),
                    Collectors.counting()
                ));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : statusCount.entrySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("status", entry.getKey());
            data.put("count", entry.getValue());
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        List<Machine> machines = machineService.getAllMachines();
        List<Invoice> invoices = invoiceService.getAllInvoices();
        List<User> users = userService.getAllUsers();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMachines", machines.size());
        stats.put("totalInvoices", invoices.size());
        stats.put("totalUsers", users.size());
        stats.put("totalRevenue", invoices.stream()
                .filter(i -> i.getStatus() == Invoice.Status.PAID)
                .mapToDouble(Invoice::getTotalAmount)
                .sum());
        stats.put("pendingInvoices", invoices.stream()
                .filter(i -> i.getStatus() == Invoice.Status.PENDING)
                .count());
        stats.put("activeMachines", machines.stream()
                .filter(m -> m.getStatus() == Machine.Status.RENTED)
                .count());
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/owner/{ownerId}/revenue")
    public ResponseEntity<List<Map<String, Object>>> getOwnerRevenueReport(@PathVariable Long ownerId) {
        List<Invoice> invoices = invoiceService.getInvoicesByOwner(ownerId);
        
        Map<String, Double> monthlyRevenue = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (Invoice invoice : invoices) {
            if (invoice.getStatus() == Invoice.Status.PAID) {
                String month = invoice.getCreatedAt().format(formatter);
                monthlyRevenue.merge(month, invoice.getTotalAmount(), Double::sum);
            }
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (String month : monthlyRevenue.keySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("month", month);
            data.put("amount", monthlyRevenue.get(month));
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/rental/{rentalId}/expenses")
    public ResponseEntity<List<Map<String, Object>>> getRentalExpenseReport(@PathVariable Long rentalId) {
        List<Invoice> invoices = invoiceService.getInvoicesByRental(rentalId);
        
        Map<String, Double> monthlyExpenses = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (Invoice invoice : invoices) {
            String month = invoice.getCreatedAt().format(formatter);
            monthlyExpenses.merge(month, invoice.getTotalAmount(), Double::sum);
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (String month : monthlyExpenses.keySet()) {
            Map<String, Object> data = new HashMap<>();
            data.put("month", month);
            data.put("amount", monthlyExpenses.get(month));
            result.add(data);
        }
        
        return ResponseEntity.ok(result);
    }
}
