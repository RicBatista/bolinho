package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.ProductRecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRecipeItemRepository extends JpaRepository<ProductRecipeItem, Long> {
}
