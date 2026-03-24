package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.ProductCategory;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "products")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Column(nullable = false) private String name;
    @Column(length = 500) private String description;
    @NotNull @Column(nullable = false, precision = 10, scale = 2) private BigDecimal salePrice;
    @NotNull @Column(nullable = false, precision = 10, scale = 2) private BigDecimal productionCost;
    @Column(nullable = false) private Integer unitQuantity = 1;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProductCategory category = ProductCategory.OUTROS;
    @Column(nullable = false) private Boolean active = true;

    /** Receita (BOM): ingredientes por 1 unidade vendida. Omitido no JSON da listagem; use GET /produtos/{id}/receita. */
    @JsonIgnore
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductRecipeItem> recipeItems = new ArrayList<>();

    public BigDecimal getProfitMargin() {
        if (salePrice == null || salePrice.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return salePrice.subtract(productionCost)
                .divide(salePrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}
