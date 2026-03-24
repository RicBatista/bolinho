package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.StockMovementType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "stock_movements")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "ingredient_id", nullable = false) private Ingredient ingredient;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private StockMovementType type;
    @Column(nullable = false, precision = 10, scale = 3) private BigDecimal quantity;
    @Column(precision = 10, scale = 4) private BigDecimal unitCost;
    @Column(nullable = false) private LocalDateTime movementDate;
    private String referenceId;
    @Column(length = 500) private String notes;

    /** Preenchido nas baixas de estoque ligadas a uma venda (para estorno no cancelamento). */
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sale_id")
    private Sale sale;

    @PrePersist public void prePersist() {
        if (movementDate == null) movementDate = LocalDateTime.now();
    }
}
