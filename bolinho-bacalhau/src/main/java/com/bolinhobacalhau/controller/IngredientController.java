package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.Ingredient;
import com.bolinhobacalhau.entity.Supplier;
import com.bolinhobacalhau.repository.IngredientRepository;
import com.bolinhobacalhau.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController @RequestMapping("/api/ingredientes") @RequiredArgsConstructor
@Tag(name = "Ingredientes / Estoque")
public class IngredientController {

    private final IngredientRepository ingredientRepository;
    private final SupplierRepository supplierRepository;

    @Data public static class IngredientRequest {
        private String name;
        private String unit;
        private BigDecimal minimumStock = BigDecimal.ZERO;
        /** Custo por unidade de medida (KG, L, UN…). Opcional no update: omitir para manter o atual. */
        private BigDecimal averageCost;
        private Long preferredSupplierId;
    }

    @GetMapping
    public List<Ingredient> listAll() { return ingredientRepository.findAll(); }

    @GetMapping("/estoque-baixo")
    @Operation(summary = "Ingredientes abaixo do mínimo")
    public List<Ingredient> belowMinimum() { return ingredientRepository.findBelowMinimumStock(); }

    @GetMapping("/{id}")
    public ResponseEntity<Ingredient> findById(@PathVariable Long id) {
        return ingredientRepository.findById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Ingredient> create(@RequestBody IngredientRequest req) {
        Ingredient i = Ingredient.builder()
            .name(req.getName()).unit(req.getUnit())
            .minimumStock(req.getMinimumStock() != null ? req.getMinimumStock() : BigDecimal.ZERO)
            .currentStock(BigDecimal.ZERO)
            .averageCost(req.getAverageCost() != null ? req.getAverageCost() : BigDecimal.ZERO)
            .build();
        if (req.getPreferredSupplierId() != null)
            i.setPreferredSupplier(supplierRepository.findById(req.getPreferredSupplierId()).orElse(null));
        return ResponseEntity.status(201).body(ingredientRepository.save(i));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ingredient> update(@PathVariable Long id, @RequestBody IngredientRequest req) {
        Ingredient i = ingredientRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Ingrediente não encontrado"));
        i.setName(req.getName()); i.setUnit(req.getUnit());
        i.setMinimumStock(req.getMinimumStock() != null ? req.getMinimumStock() : BigDecimal.ZERO);
        if (req.getAverageCost() != null)
            i.setAverageCost(req.getAverageCost());
        if (req.getPreferredSupplierId() != null)
            i.setPreferredSupplier(supplierRepository.findById(req.getPreferredSupplierId()).orElse(null));
        return ResponseEntity.ok(ingredientRepository.save(i));
    }
}
