package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.recipeItems ri LEFT JOIN FETCH ri.ingredient WHERE p.id IN :ids")
    List<Product> findAllWithRecipeByIdIn(@Param("ids") Collection<Long> ids);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.recipeItems ri LEFT JOIN FETCH ri.ingredient WHERE p.id = :id")
    Optional<Product> findByIdWithRecipe(@Param("id") Long id);
}
