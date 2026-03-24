package com.bolinhobacalhau.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Entity @Table(name = "ingredients")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"preferredSupplier", "hibernateLazyInitializer", "handler"})
public class Ingredient {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Column(nullable = false, unique = true) private String name;
    @NotBlank @Column(nullable = false) private String unit;
    @Column(nullable = false, precision = 10, scale = 3) private BigDecimal currentStock = BigDecimal.ZERO;
    @Column(nullable = false, precision = 10, scale = 3) private BigDecimal minimumStock = BigDecimal.ZERO;
    @Column(precision = 10, scale = 4) private BigDecimal averageCost = BigDecimal.ZERO;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "supplier_id") private Supplier preferredSupplier;

    public boolean isBelowMinimumStock() {
        return currentStock.compareTo(minimumStock) < 0;
    }

    /** Expõe o id do fornecedor no JSON sem serializar o objeto completo (evita lazy/proxy). */
    public Long getPreferredSupplierId() {
        return preferredSupplier != null ? preferredSupplier.getId() : null;
    }

    public String getPreferredSupplierName() {
        return preferredSupplier != null ? preferredSupplier.getName() : null;
    }
}
