package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.PaymentMethod;
import com.bolinhobacalhau.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/vendas") @RequiredArgsConstructor
@Tag(name = "Vendas")
public class SaleController {

    private final SaleService saleService;

    @Data public static class SaleRequest {
        private String saleChannel;
        private String customerName;
        private String customerPhone;
        private String customerCpf;
        private PaymentMethod paymentMethod;
        private BigDecimal discountAmount;
        private String notes;
        private List<SaleItemRequest> items;
    }
    @Data public static class SaleItemRequest {
        private Long productId;
        private Integer quantity;
        private BigDecimal unitPrice;
    }

    @PostMapping
    @Operation(summary = "Registrar venda")
    public ResponseEntity<Sale> create(@RequestBody SaleRequest req) {
        Sale sale = Sale.builder()
            .saleChannel(req.getSaleChannel()).customerName(req.getCustomerName())
            .customerPhone(req.getCustomerPhone()).customerCpf(req.getCustomerCpf())
            .paymentMethod(req.getPaymentMethod())
            .discountAmount(req.getDiscountAmount()).notes(req.getNotes()).build();

        List<SaleItem> items = req.getItems().stream().map(r -> {
            SaleItem item = new SaleItem();
            Product p = new Product(); p.setId(r.getProductId());
            item.setProduct(p); item.setQuantity(r.getQuantity()); item.setUnitPrice(r.getUnitPrice());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.status(201).body(saleService.createSale(sale, items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> findById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.findById(id));
    }

    @GetMapping
    @Operation(summary = "Listar vendas por período")
    public List<Sale> listByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return saleService.listByPeriod(start.atStartOfDay(), end.atTime(23, 59, 59));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<Sale> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.cancel(id));
    }
}
