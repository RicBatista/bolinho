package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.OrderStatus;
import com.bolinhobacalhau.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final WhatsAppService whatsAppService;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    // ── CRUD ─────────────────────────────────────────────────

    @Transactional
    public Order create(Order order, List<OrderItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : items) {
            Product p = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
            item.setProduct(p);
            if (item.getUnitPrice() == null) item.setUnitPrice(p.getSalePrice());
            item.setOrder(order);
            total = total.add(item.getSubtotal());
        }
        order.setTotalAmount(total);
        order.setItems(items);
        order.setStatus(OrderStatus.PENDENTE);

        Order saved = orderRepository.save(order);
        notifyNewOrder(saved);
        return saved;
    }

    @Transactional
    public Order updateStatus(Long id, OrderStatus newStatus) {
        Order order = findById(id);
        OrderStatus old = order.getStatus();
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        // Notifica cliente e dono nas transições importantes
        if (newStatus == OrderStatus.CONFIRMADO && old == OrderStatus.PENDENTE)
            notifyConfirmed(saved);
        if (newStatus == OrderStatus.PRONTO)
            notifyReady(saved);

        return saved;
    }

    @Transactional
    public Order registerDeposit(Long id, BigDecimal amount) {
        Order order = findById(id);
        order.setDepositAmount(order.getDepositAmount().add(amount));
        if (order.getStatus() == OrderStatus.PENDENTE)
            order.setStatus(OrderStatus.CONFIRMADO);
        Order saved = orderRepository.save(order);
        notifyConfirmed(saved);
        return saved;
    }

    @Transactional
    public Order update(Long id, Order body, List<OrderItem> items) {
        Order order = findById(id);
        order.setCustomerName(body.getCustomerName());
        order.setCustomerPhone(body.getCustomerPhone());
        order.setCustomerCpf(body.getCustomerCpf());
        order.setCustomerAddress(body.getCustomerAddress());
        order.setDeliveryDate(body.getDeliveryDate());
        order.setDelivery(body.getDelivery());
        order.setNotes(body.getNotes());

        order.getItems().clear();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : items) {
            Product p = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
            item.setProduct(p);
            if (item.getUnitPrice() == null) item.setUnitPrice(p.getSalePrice());
            item.setOrder(order);
            order.getItems().add(item);
            total = total.add(item.getSubtotal());
        }
        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    @Transactional
    public Order cancel(Long id) {
        Order order = findById(id);
        if (order.getStatus() == OrderStatus.ENTREGUE)
            throw new IllegalStateException("Encomenda já entregue não pode ser cancelada.");
        order.setStatus(OrderStatus.CANCELADO);
        return orderRepository.save(order);
    }

    // ── CONSULTAS ─────────────────────────────────────────────

    public List<Order> listAll()                             { return orderRepository.findAllByOrderByDeliveryDateAsc(); }
    public List<Order> listByStatus(OrderStatus status)      { return orderRepository.findByStatusOrderByDeliveryDateAsc(status); }
    public List<Order> listToday()                           {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end   = LocalDate.now().atTime(23, 59, 59);
        return orderRepository.findByDay(start, end);
    }
    public List<Order> search(String q) {
        if (q == null || q.isBlank()) return listAll();
        return orderRepository.searchByCustomerText(q.trim());
    }

    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Encomenda não encontrada: " + id));
    }

    // ── JOBS AGENDADOS ────────────────────────────────────────

    /** Lembrete para o dono: encomendas que entregam amanhã */
    @Scheduled(cron = "0 0 18 * * *")
    public void remindTomorrow() {
        LocalDateTime from = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime to   = LocalDate.now().plusDays(1).atTime(23, 59, 59);
        List<Order> orders = orderRepository.findUpcoming(from, to);
        if (orders.isEmpty()) return;

        String lista = orders.stream()
                .map(o -> String.format("• *%s* — %s (%s)",
                        o.getCustomerName(),
                        fmt(o.getTotalAmount()),
                        o.getDelivery() ? "entrega" : "retirada"))
                .collect(Collectors.joining("\n"));

        whatsAppService.sendCustom(
                "\uD83D\uDCCB *Encomendas para amanhã:*\n\n" + lista +
                "\n\nTotal: *" + orders.size() + " encomendas*");
    }

    /** Lembrete para o dono: encomendas que entregam hoje */
    @Scheduled(cron = "0 0 7 * * *")
    public void remindToday() {
        List<Order> orders = listToday().stream()
                .filter(o -> o.getStatus() != OrderStatus.ENTREGUE
                          && o.getStatus() != OrderStatus.CANCELADO)
                .collect(Collectors.toList());
        if (orders.isEmpty()) return;

        String lista = orders.stream()
                .map(o -> String.format("• *%s* — %s — %s",
                        o.getCustomerName(),
                        o.getDeliveryDate().format(DateTimeFormatter.ofPattern("HH:mm")),
                        fmt(o.getRemainingBalance()) + " a receber"))
                .collect(Collectors.joining("\n"));

        whatsAppService.sendCustom(
                "\uD83D\uDE9A *Encomendas de hoje:*\n\n" + lista);
    }

    // ── NOTIFICAÇÕES ─────────────────────────────────────────

    private void notifyNewOrder(Order o) {
        String cpfLine = o.getCustomerCpf() != null && !o.getCustomerCpf().isBlank()
                ? String.format("CPF: %s\n", o.getCustomerCpf()) : "";
        String msg = String.format(
                "\uD83D\uDCE6 *Nova encomenda recebida!*\n\n" +
                "Cliente: *%s*\n" +
                "Fone: %s\n" +
                "%s" +
                "Entrega: *%s*\n" +
                "Tipo: %s\n" +
                "Total: *%s*\n" +
                "Sinal: *%s*\n" +
                "Saldo: *%s*",
                o.getCustomerName(), o.getCustomerPhone(), cpfLine,
                o.getDeliveryDate().format(DATE_FMT),
                o.getDelivery() ? "Entrega no endereço" : "Retirada no balcão",
                fmt(o.getTotalAmount()), fmt(o.getDepositAmount()), fmt(o.getRemainingBalance()));
        whatsAppService.sendCustom(msg);
    }

    private void notifyConfirmed(Order o) {
        String msg = String.format(
                "✅ *Encomenda confirmada!*\n\n" +
                "Cliente: *%s*\n" +
                "Entrega: *%s*\n" +
                "Saldo a pagar na entrega: *%s*",
                o.getCustomerName(),
                o.getDeliveryDate().format(DATE_FMT),
                fmt(o.getRemainingBalance()));
        whatsAppService.sendCustom(msg);
    }

    private void notifyReady(Order o) {
        String msg = String.format(
                "\uD83D\uDFE2 *Encomenda pronta!*\n\n" +
                "*%s*, sua encomenda está pronta!\n" +
                "%s\n" +
                "Saldo a pagar: *%s*",
                o.getCustomerName(),
                o.getDelivery() ? "Saímos para entrega!" : "Pode vir retirar!",
                fmt(o.getRemainingBalance()));
        // Notifica tanto o dono quanto o cliente
        whatsAppService.sendCustom(msg);
    }

    private String fmt(BigDecimal v) {
        return "R$ " + String.format("%.2f", v).replace(".", ",");
    }
}
