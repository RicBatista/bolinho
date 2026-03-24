package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.dto.RecipeLineRequest;
import com.bolinhobacalhau.entity.Product;
import com.bolinhobacalhau.entity.ProductRecipeItem;
import com.bolinhobacalhau.repository.ProductRepository;
import com.bolinhobacalhau.service.ProductRecipeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/produtos") @RequiredArgsConstructor
@Tag(name = "Produtos")
public class ProductController {

    private final ProductRepository productRepository;
    private final ProductRecipeService productRecipeService;

    @GetMapping
    @Operation(summary = "Listar produtos ativos")
    public List<Product> listActive() { return productRepository.findByActiveTrue(); }

    @GetMapping("/todos")
    public List<Product> listAll() { return productRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Product> findById(@PathVariable Long id) {
        return productRepository.findById(id).map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        product.setActive(true);
        return ResponseEntity.status(201).body(productRepository.save(product));
    }

    @GetMapping("/{id}/receita")
    @Operation(summary = "Listar receita (BOM) do produto — quantidades por 1 unidade vendida")
    public List<ProductRecipeItem> getReceita(@PathVariable Long id) {
        return productRecipeService.getRecipe(id);
    }

    @PutMapping("/{id}/receita")
    @Operation(summary = "Substituir receita (BOM) do produto")
    public List<ProductRecipeItem> putReceita(@PathVariable Long id, @RequestBody List<RecipeLineRequest> body) {
        return productRecipeService.replaceRecipe(id, body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product body) {
        Product p = productRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
        p.setName(body.getName()); p.setDescription(body.getDescription());
        p.setSalePrice(body.getSalePrice()); p.setProductionCost(body.getProductionCost());
        p.setUnitQuantity(body.getUnitQuantity()); p.setCategory(body.getCategory());
        return ResponseEntity.ok(productRepository.save(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        productRepository.findById(id).ifPresent(p -> { p.setActive(false); productRepository.save(p); });
        return ResponseEntity.noContent().build();
    }
}
