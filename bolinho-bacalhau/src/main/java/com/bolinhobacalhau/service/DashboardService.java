package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.Order;
import com.bolinhobacalhau.entity.Purchase;
import com.bolinhobacalhau.enums.OrderStatus;
import com.bolinhobacalhau.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class DashboardService {

    private final SaleRepository saleRepository;
    private final OrderRepository orderRepository;
    private final IngredientRepository ingredientRepository;
    private final PurchaseRepository purchaseRepository;

    public Map<String, Object> getDashboard() {
        LocalDateTime now         = LocalDateTime.now();
        LocalDateTime startDay    = now.toLocalDate().atStartOfDay();
        LocalDateTime startWeek   = now.toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime startMonth  = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        Map<String, Object> dash = new LinkedHashMap<>();

        // Receitas
        dash.put("revenueToday",      safe(saleRepository.sumRevenueByPeriod(startDay, now)));
        dash.put("revenueThisWeek",   safe(saleRepository.sumRevenueByPeriod(startWeek, now)));
        dash.put("revenueThisMonth",  safe(saleRepository.sumRevenueByPeriod(startMonth, now)));
        dash.put("salesToday",        (long) saleRepository.findBySaleDateBetweenOrderBySaleDateDesc(startDay, now).size());
        dash.put("salesThisMonth",    (long) saleRepository.findBySaleDateBetweenOrderBySaleDateDesc(startMonth, now).size());

        // Encomendas (pedidos futuros — não são vendas de balcão; listagem separada do PDV)
        List<OrderStatus> finalizados = List.of(OrderStatus.ENTREGUE, OrderStatus.CANCELADO);
        dash.put("activeOrdersCount", orderRepository.countExcludingStatuses(finalizados));
        LocalDateTime endDay = now.toLocalDate().atTime(LocalTime.MAX);
        dash.put("ordersDeliveryTodayCount",
                orderRepository.findByDay(startDay, endDay).stream()
                        .filter(o -> o.getStatus() != OrderStatus.CANCELADO)
                        .count());
        dash.put("recentOrders", orderRepository.findRecentOrders(PageRequest.of(0, 5)).stream()
                .map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("customerName", o.getCustomerName());
                    m.put("status", o.getStatus().name());
                    m.put("deliveryDate", o.getDeliveryDate() != null ? o.getDeliveryDate().toString() : "");
                    m.put("totalAmount", o.getTotalAmount());
                    m.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList()));

        // Estoque baixo
        dash.put("lowStockAlerts", ingredientRepository.findBelowMinimumStock().stream()
            .map(i -> Map.of(
                "ingredientId", i.getId(), "ingredientName", i.getName(),
                "unit", i.getUnit(), "currentStock", i.getCurrentStock(),
                "minimumStock", i.getMinimumStock()))
            .collect(Collectors.toList()));
        dash.put("totalIngredientsCount", (int) ingredientRepository.count());

        // Contas a pagar
        BigDecimal pending = purchaseRepository.totalPendingAmount();
        dash.put("totalPendingPayments", pending != null ? pending : BigDecimal.ZERO);
        List<Purchase> dueSoon = purchaseRepository.findOverdueOrDueSoon(LocalDate.now().plusDays(7));
        dash.put("overduePaymentsCount", dueSoon.stream().filter(Purchase::isOverdue).count());
        dash.put("upcomingPayments", dueSoon.stream().map(p -> Map.of(
            "purchaseId", p.getId(), "supplierName", p.getSupplier().getName(),
            "remainingAmount", p.getRemainingAmount(),
            "dueDate", p.getDueDate() != null ? p.getDueDate().toString() : "",
            "overdue", p.isOverdue()))
            .collect(Collectors.toList()));

        // Por canal
        Map<String, BigDecimal> byChannel = new LinkedHashMap<>();
        saleRepository.revenueByChannel(startMonth, now)
            .forEach(r -> byChannel.put((String) r[0], (BigDecimal) r[2]));
        dash.put("revenueByChannel", byChannel);

        // Por forma de pagamento
        Map<String, BigDecimal> byPayment = new LinkedHashMap<>();
        saleRepository.revenueByPaymentMethod(startMonth, now)
            .forEach(r -> byPayment.put(r[0].toString(), (BigDecimal) r[2]));
        dash.put("revenueByPaymentMethod", byPayment);

        // Últimos 7 dias
        Map<String, BigDecimal> last7 = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            BigDecimal rev = saleRepository.sumRevenueByPeriod(
                day.atStartOfDay(), day.atTime(LocalTime.MAX));
            last7.put(day.toString(), safe(rev));
        }
        dash.put("revenueLast7Days", last7);

        return dash;
    }

    private BigDecimal safe(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
}
