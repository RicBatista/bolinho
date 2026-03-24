package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.Ingredient;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    @Override
    @EntityGraph(attributePaths = {"preferredSupplier"})
    List<Ingredient> findAll();

    @Override
    @EntityGraph(attributePaths = {"preferredSupplier"})
    Optional<Ingredient> findById(Long id);

    @EntityGraph(attributePaths = {"preferredSupplier"})
    @Query("SELECT i FROM Ingredient i WHERE i.currentStock < i.minimumStock")
    List<Ingredient> findBelowMinimumStock();
}
