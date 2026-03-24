package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.StockMovementType;
import com.bolinhobacalhau.enums.SupplierPaymentStatus;
import com.bolinhobacalhau.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final IngredientRepository ingredientRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public Purchase create(Purchase purchase, Long supplierId, List<PurchaseItem> items) {
        Supplier supplier = supplierRepository.findById(supplierId)
            .orElseThrow(() -> new EntityNotFoundException("Fornecedor não encontrado"));
        purchase.setSupplier(supplier);
        purchase.setPaymentStatus(SupplierPaymentStatus.PENDENTE);
        purchase.setAmountPaid(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseItem item : items) {
            Ingredient ing = ingredientRepository.findById(item.getIngredient().getId())
                .orElseThrow(() -> new EntityNotFoundException("Ingrediente não encontrado"));
            item.setIngredient(ing);
            item.setPurchase(purchase);
            total = total.add(item.getSubtotal());
            // Entrada no estoque
            updateAverageCost(ing, item.getQuantity(), item.getUnitPrice());
            ing.setCurrentStock(ing.getCurrentStock().add(item.getQuantity()));
            ingredientRepository.save(ing);
            stockMovementRepository.save(StockMovement.builder()
                .ingredient(ing).type(StockMovementType.ENTRADA)
                .quantity(item.getQuantity()).unitCost(item.getUnitPrice())
                .movementDate(LocalDateTime.now())
                .notes("Compra - " + supplier.getName()).build());
        }
        purchase.setTotalAmount(total);
        purchase.setItems(items);
        return purchaseRepository.save(purchase);
    }

    @Transactional
    public Purchase registerPayment(Long id, BigDecimal amount) {
        Purchase p = findById(id);
        p.setAmountPaid(p.getAmountPaid().add(amount));
        p.setPaymentStatus(p.getAmountPaid().compareTo(p.getTotalAmount()) >= 0
            ? SupplierPaymentStatus.PAGO : SupplierPaymentStatus.PARCIALMENTE_PAGO);
        return purchaseRepository.save(p);
    }

    public List<Purchase> listAll()                  { return purchaseRepository.findAll(); }
    public List<Purchase> listPending()              { return purchaseRepository.findByPaymentStatus(SupplierPaymentStatus.PENDENTE); }
    public List<Purchase> listBySupplier(Long sid)   { return purchaseRepository.findBySupplierId(sid); }
    public List<Purchase> listDueSoon(int days)      { return purchaseRepository.findOverdueOrDueSoon(LocalDate.now().plusDays(days)); }
    public BigDecimal totalPending()                 { BigDecimal v = purchaseRepository.totalPendingAmount(); return v != null ? v : BigDecimal.ZERO; }

    public Purchase findById(Long id) {
        return purchaseRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Compra não encontrada: " + id));
    }

    private void updateAverageCost(Ingredient ing, BigDecimal qty, BigDecimal price) {
        BigDecimal cur = ing.getAverageCost() != null ? ing.getAverageCost() : BigDecimal.ZERO;
        BigDecimal totalVal = ing.getCurrentStock().multiply(cur).add(qty.multiply(price));
        BigDecimal totalQty = ing.getCurrentStock().add(qty);
        if (totalQty.compareTo(BigDecimal.ZERO) > 0)
            ing.setAverageCost(totalVal.divide(totalQty, 4, RoundingMode.HALF_UP));
    }
}
