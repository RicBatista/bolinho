package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/compras") @RequiredArgsConstructor
@Tag(name = "Compras / Contas a Pagar")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @Data public static class PurchaseRequest {
        private Long supplierId;
        private LocalDate dueDate;
        private String invoiceNumber;
        private String notes;
        private List<PurchaseItemRequest> items;
    }
    @Data public static class PurchaseItemRequest {
        private Long ingredientId;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
    }
    @Data public static class PaymentRequest {
        private BigDecimal amount;
    }

    @PostMapping
    @Operation(summary = "Registrar compra")
    public ResponseEntity<Purchase> create(@RequestBody PurchaseRequest req) {
        Purchase purchase = Purchase.builder()
            .dueDate(req.getDueDate()).invoiceNumber(req.getInvoiceNumber()).notes(req.getNotes()).build();
        List<PurchaseItem> items = req.getItems().stream().map(r -> {
            Ingredient ing = new Ingredient(); ing.setId(r.getIngredientId());
            return PurchaseItem.builder().ingredient(ing)
                .quantity(r.getQuantity()).unitPrice(r.getUnitPrice()).build();
        }).collect(Collectors.toList());
        return ResponseEntity.status(201).body(purchaseService.create(purchase, req.getSupplierId(), items));
    }

    @GetMapping             public List<Purchase> listAll()               { return purchaseService.listAll(); }
    @GetMapping("/pendentes") public List<Purchase> listPending()         { return purchaseService.listPending(); }
    @GetMapping("/vencendo") public List<Purchase> dueSoon(@RequestParam(defaultValue = "7") int dias) { return purchaseService.listDueSoon(dias); }
    @GetMapping("/fornecedor/{id}") public List<Purchase> bySupplier(@PathVariable Long id) { return purchaseService.listBySupplier(id); }
    @GetMapping("/{id}")   public ResponseEntity<Purchase> findById(@PathVariable Long id) { return ResponseEntity.ok(purchaseService.findById(id)); }
    @GetMapping("/total-pendente") public ResponseEntity<BigDecimal> totalPending() { return ResponseEntity.ok(purchaseService.totalPending()); }

    @PostMapping("/{id}/pagar")
    @Operation(summary = "Registrar pagamento")
    public ResponseEntity<Purchase> pay(@PathVariable Long id, @RequestBody PaymentRequest req) {
        return ResponseEntity.ok(purchaseService.registerPayment(id, req.getAmount()));
    }
}
