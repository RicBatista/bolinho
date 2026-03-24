package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.Sale;
import com.bolinhobacalhau.enums.SaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findBySaleDateBetweenOrderBySaleDateDesc(LocalDateTime start, LocalDateTime end);
    List<Sale> findByStatus(SaleStatus status);

    @Query("SELECT SUM(s.totalAmount - COALESCE(s.discountAmount, 0)) FROM Sale s " +
           "WHERE s.saleDate BETWEEN :start AND :end AND s.status = 'PAGO'")
    BigDecimal sumRevenueByPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s.saleChannel, COUNT(s), SUM(s.totalAmount) FROM Sale s " +
           "WHERE s.saleDate BETWEEN :start AND :end AND s.status = 'PAGO' GROUP BY s.saleChannel")
    List<Object[]> revenueByChannel(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s.paymentMethod, COUNT(s), SUM(s.totalAmount) FROM Sale s " +
           "WHERE s.saleDate BETWEEN :start AND :end AND s.status = 'PAGO' GROUP BY s.paymentMethod")
    List<Object[]> revenueByPaymentMethod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
