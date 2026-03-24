package com.bolinhobacalhau.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Quantidade de ingrediente consumida por <strong>1 unidade</strong> vendida deste produto
 * (ex.: 1 bolinho, 1 bandeja já como SKU no cardápio).
 */
@Entity
@Table(name = "product_recipe_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRecipeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    @JsonIgnoreProperties({"preferredSupplier", "hibernateLazyInitializer", "handler"})
    private Ingredient ingredient;

    /** Quantidade do ingrediente (na unidade do cadastro) por 1 unidade vendida do produto */
    @NotNull
    @Column(nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;
}
