package com.bolinhobacalhau.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "purchase_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "purchase_id", nullable = false) private Purchase purchase;
    @ManyToOne(fetch = FetchType.EAGER) @JoinColumn(name = "ingredient_id", nullable = false) private Ingredient ingredient;
    @Column(nullable = false, precision = 10, scale = 3) private BigDecimal quantity;
    @Column(nullable = false, precision = 10, scale = 4) private BigDecimal unitPrice;

    public BigDecimal getSubtotal() { return quantity.multiply(unitPrice); }
}
