package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.Purchase;
import com.bolinhobacalhau.enums.SupplierPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByPaymentStatus(SupplierPaymentStatus status);
    List<Purchase> findBySupplierId(Long supplierId);

    @Query("SELECT p FROM Purchase p WHERE p.dueDate <= :date AND p.paymentStatus <> 'PAGO'")
    List<Purchase> findOverdueOrDueSoon(@Param("date") LocalDate date);

    @Query("SELECT SUM(p.totalAmount - COALESCE(p.amountPaid, 0)) FROM Purchase p WHERE p.paymentStatus <> 'PAGO'")
    BigDecimal totalPendingAmount();
}
