package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.Ingredient;
import com.bolinhobacalhau.entity.Purchase;
import com.bolinhobacalhau.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
public class NotificationScheduler {

    private final WhatsAppService whatsAppService;
    private final IngredientRepository ingredientRepository;
    private final PurchaseRepository purchaseRepository;
    private final SaleRepository saleRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Scheduled(cron = "0 0 8 * * *")
    public void checkLowStock() {
        List<Ingredient> low = ingredientRepository.findBelowMinimumStock();
        low.forEach(i -> whatsAppService.notifyLowStock(
            i.getName(), i.getCurrentStock().toPlainString(),
            i.getUnit(), i.getMinimumStock().toPlainString()));
        if (!low.isEmpty()) log.info("{} ingredientes com estoque baixo notificados", low.size());
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void checkOverduePayments() {
        purchaseRepository.findOverdueOrDueSoon(LocalDate.now().minusDays(1)).stream()
            .filter(Purchase::isOverdue)
            .forEach(p -> whatsAppService.notifyOverduePayment(
                p.getSupplier().getName(),
                p.getRemainingAmount().toPlainString(),
                p.getDueDate().format(FMT)));
    }

    @Scheduled(cron = "0 30 9 * * *")
    public void checkPaymentsDueSoon() {
        purchaseRepository.findOverdueOrDueSoon(LocalDate.now().plusDays(3)).stream()
            .filter(p -> !p.isOverdue() && p.getDueDate() != null)
            .forEach(p -> whatsAppService.notifyPaymentDueSoon(
                p.getSupplier().getName(),
                p.getRemainingAmount().toPlainString(),
                p.getDueDate().format(FMT)));
    }

    @Scheduled(cron = "0 0 20 * * *")
    public void sendDailySummary() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime now   = LocalDateTime.now();
        BigDecimal revenue  = saleRepository.sumRevenueByPeriod(start, now);
        long sales          = saleRepository.findBySaleDateBetweenOrderBySaleDateDesc(start, now).size();
        int lowStock        = ingredientRepository.findBelowMinimumStock().size();
        String rev = revenue != null
            ? String.format("%.2f", revenue).replace(".", ",") : "0,00";
        whatsAppService.notifyDailySummary(rev, sales, lowStock);
    }
}
