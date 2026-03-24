package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.OrderStatus;
import com.bolinhobacalhau.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/encomendas")
@RequiredArgsConstructor
@Tag(name = "Encomendas", description = "Gestão de encomendas e pedidos futuros")
public class OrderController {

    private final OrderService orderService;

    // ── DTOs ─────────────────────────────────────────────────

    @Data
    public static class OrderRequest {
        @NotBlank private String customerName;
        @NotBlank private String customerPhone;
        private String customerCpf;
        private String customerAddress;
        private String customerAddressNumber;
        private String customerAddressComplement;
        private String customerResidenceType;
        @NotNull  private LocalDateTime deliveryDate;
        private Boolean delivery = false;
        private BigDecimal depositAmount = BigDecimal.ZERO;
        private String notes;
        @NotNull  private List<OrderItemRequest> items;
    }

    @Data
    public static class OrderItemRequest {
        @NotNull private Long productId;
        @NotNull private Integer quantity;
        private BigDecimal unitPrice;
        private String notes;
    }

    @Data
    public static class StatusRequest {
        @NotNull private OrderStatus status;
    }

    @Data
    public static class DepositRequest {
        @NotNull private BigDecimal amount;
    }

    // ── ENDPOINTS ────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Criar nova encomenda")
    public ResponseEntity<Order> create(@Valid @RequestBody OrderRequest req) {
        Order order = Order.builder()
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .customerCpf(req.getCustomerCpf())
                .customerAddress(req.getCustomerAddress())
                .customerAddressNumber(req.getCustomerAddressNumber())
                .customerAddressComplement(req.getCustomerAddressComplement())
                .customerResidenceType(req.getCustomerResidenceType())
                .deliveryDate(req.getDeliveryDate())
                .delivery(req.getDelivery() != null ? req.getDelivery() : false)
                .depositAmount(req.getDepositAmount() != null ? req.getDepositAmount() : BigDecimal.ZERO)
                .notes(req.getNotes())
                .build();

        List<OrderItem> items = req.getItems().stream().map(r -> {
            Product p = new Product(); p.setId(r.getProductId());
            return OrderItem.builder()
                    .product(p).quantity(r.getQuantity())
                    .unitPrice(r.getUnitPrice()).notes(r.getNotes()).build();
        }).collect(Collectors.toList());

        return ResponseEntity.status(201).body(orderService.create(order, items));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar encomenda")
    public ResponseEntity<Order> update(@PathVariable Long id,
                                        @Valid @RequestBody OrderRequest req) {
        Order body = Order.builder()
                .customerName(req.getCustomerName())
                .customerPhone(req.getCustomerPhone())
                .customerCpf(req.getCustomerCpf())
                .customerAddress(req.getCustomerAddress())
                .customerAddressNumber(req.getCustomerAddressNumber())
                .customerAddressComplement(req.getCustomerAddressComplement())
                .customerResidenceType(req.getCustomerResidenceType())
                .deliveryDate(req.getDeliveryDate())
                .delivery(req.getDelivery() != null ? req.getDelivery() : false)
                .notes(req.getNotes())
                .build();

        List<OrderItem> items = req.getItems().stream().map(r -> {
            Product p = new Product(); p.setId(r.getProductId());
            return OrderItem.builder()
                    .product(p).quantity(r.getQuantity())
                    .unitPrice(r.getUnitPrice()).notes(r.getNotes()).build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(orderService.update(id, body, items));
    }

    @GetMapping
    @Operation(summary = "Listar todas as encomendas")
    public List<Order> listAll() { return orderService.listAll(); }

    @GetMapping("/hoje")
    @Operation(summary = "Encomendas para hoje")
    public List<Order> today() { return orderService.listToday(); }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filtrar por status")
    public List<Order> byStatus(@PathVariable OrderStatus status) {
        return orderService.listByStatus(status);
    }

    @GetMapping("/buscar")
    @Operation(summary = "Buscar por nome, telefone ou CPF do cliente")
    public List<Order> search(@RequestParam String q) {
        return orderService.search(q);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar encomenda por ID")
    public ResponseEntity<Order> findById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status da encomenda")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id,
                                               @RequestBody StatusRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(id, req.getStatus()));
    }

    @PostMapping("/{id}/sinal")
    @Operation(summary = "Registrar pagamento do sinal")
    public ResponseEntity<Order> registerDeposit(@PathVariable Long id,
                                                  @RequestBody DepositRequest req) {
        return ResponseEntity.ok(orderService.registerDeposit(id, req.getAmount()));
    }

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "Cancelar encomenda")
    public ResponseEntity<Order> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancel(id));
    }
}
