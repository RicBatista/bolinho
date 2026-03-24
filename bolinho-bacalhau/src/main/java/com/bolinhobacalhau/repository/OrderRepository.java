package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.Order;
import com.bolinhobacalhau.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatusOrderByDeliveryDateAsc(OrderStatus status);

    List<Order> findAllByOrderByDeliveryDateAsc();

    @Query("SELECT o FROM Order o WHERE " +
           "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(o.customerPhone) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(o.customerCpf, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Order> searchByCustomerText(@Param("q") String q);

    /** Encomendas com entrega entre agora e X horas à frente (para lembretes) */
    @Query("SELECT o FROM Order o WHERE o.deliveryDate BETWEEN :from AND :to " +
           "AND o.status NOT IN ('ENTREGUE', 'CANCELADO')")
    List<Order> findUpcoming(@Param("from") LocalDateTime from,
                             @Param("to")   LocalDateTime to);

    /** Encomendas do dia */
    @Query("SELECT o FROM Order o WHERE o.deliveryDate BETWEEN :start AND :end " +
           "ORDER BY o.deliveryDate ASC")
    List<Order> findByDay(@Param("start") LocalDateTime start,
                          @Param("end")   LocalDateTime end);
}
