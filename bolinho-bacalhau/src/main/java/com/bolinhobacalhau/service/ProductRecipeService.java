package com.bolinhobacalhau.service;

import com.bolinhobacalhau.dto.RecipeLineRequest;
import com.bolinhobacalhau.entity.Ingredient;
import com.bolinhobacalhau.entity.Product;
import com.bolinhobacalhau.entity.ProductRecipeItem;
import com.bolinhobacalhau.repository.IngredientRepository;
import com.bolinhobacalhau.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductRecipeService {

    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;

    public List<ProductRecipeItem> getRecipe(Long productId) {
        Product p = productRepository.findByIdWithRecipe(productId)
            .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado: " + productId));
        return p.getRecipeItems();
    }

    @Transactional
    public List<ProductRecipeItem> replaceRecipe(Long productId, List<RecipeLineRequest> lines) {
        Product product = productRepository.findByIdWithRecipe(productId)
            .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado: " + productId));

        Map<Long, BigDecimal> merged = new LinkedHashMap<>();
        if (lines != null) {
            for (RecipeLineRequest line : lines) {
                if (line.getIngredientId() == null || line.getQuantity() == null) continue;
                if (line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) continue;
                merged.merge(line.getIngredientId(), line.getQuantity(), BigDecimal::add);
            }
        }

        product.getRecipeItems().clear();
        for (Map.Entry<Long, BigDecimal> e : merged.entrySet()) {
            Ingredient ing = ingredientRepository.findById(e.getKey())
                .orElseThrow(() -> new EntityNotFoundException("Ingrediente não encontrado: " + e.getKey()));
            ProductRecipeItem row = ProductRecipeItem.builder()
                .product(product)
                .ingredient(ing)
                .quantity(e.getValue())
                .build();
            product.getRecipeItems().add(row);
        }
        productRepository.save(product);
        return product.getRecipeItems();
    }
}
