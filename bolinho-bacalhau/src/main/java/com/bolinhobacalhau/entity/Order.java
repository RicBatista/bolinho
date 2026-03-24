package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Encomenda — pedido futuro com data de entrega, sinal e saldo.
 * Pode ser para retirada no balcão ou entrega no endereço do cliente.
 */
@Entity
@Table(name = "orders")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Cliente ──────────────────────────────────────────────
    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    private String customerCpf;

    private String customerAddress;

    // ── Entrega ──────────────────────────────────────────────
    @Column(nullable = false)
    private LocalDateTime deliveryDate;

    /** true = entrega no endereço | false = retirada no balcão */
    @Column(nullable = false)
    private Boolean delivery = false;

    // ── Financeiro ───────────────────────────────────────────
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /** Sinal pago no momento da encomenda */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    // ── Status ───────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDENTE;

    // ── Outras informações ───────────────────────────────────
    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ── Itens ─────────────────────────────────────────────────
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
               fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Saldo restante a receber na entrega */
    public BigDecimal getRemainingBalance() {
        BigDecimal dep = depositAmount != null ? depositAmount : BigDecimal.ZERO;
        return totalAmount.subtract(dep);
    }

    /** Encomenda vencida = passou da data e ainda não foi entregue/cancelada */
    public boolean isOverdue() {
        return deliveryDate != null
                && LocalDateTime.now().isAfter(deliveryDate)
                && status != OrderStatus.ENTREGUE
                && status != OrderStatus.CANCELADO;
    }
}
