package com.bolinhobacalhau.config;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.*;
import com.bolinhobacalhau.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component @RequiredArgsConstructor @Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        if (productRepository.count() > 0) {
            log.info("Dados de negócio já existem. Pulando.");
            return;
        }
        log.info("=== Carregando dados iniciais ===");
        seedSuppliersIngredientsProducts();
        log.info("✅ {} fornecedores | {} ingredientes | {} produtos",
            supplierRepository.count(), ingredientRepository.count(), productRepository.count());
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("dono"))
            userRepository.save(AppUser.builder().username("dono")
                .password(passwordEncoder.encode("bolinho123"))
                .fullName("Dono do Negócio").role(UserRole.DONO).active(true).build());
        if (!userRepository.existsByUsername("gestor"))
            userRepository.save(AppUser.builder().username("gestor")
                .password(passwordEncoder.encode("gestor123"))
                .fullName("Gestor de Estoque").role(UserRole.GESTOR).active(true).build());
        if (!userRepository.existsByUsername("caixa"))
            userRepository.save(AppUser.builder().username("caixa")
                .password(passwordEncoder.encode("caixa123"))
                .fullName("Operador de Caixa").role(UserRole.CAIXA).active(true).build());
    }

    private void seedSuppliersIngredientsProducts() {
        // Fornecedores
        Supplier peixaria = supplierRepository.save(Supplier.builder()
            .name("Peixaria do Zé").contactName("José Silva")
            .phone("(21) 99999-1111").active(true).build());
        Supplier aviario = supplierRepository.save(Supplier.builder()
            .name("Aviário Central").contactName("Pedro Alves")
            .phone("(21) 99999-3333").active(true).build());
        Supplier sacolao = supplierRepository.save(Supplier.builder()
            .name("Sacolão Central").contactName("Maria Oliveira")
            .phone("(21) 99999-2222").active(true).build());
        Supplier distrib = supplierRepository.save(Supplier.builder()
            .name("Distribuidora Sul Salgados").contactName("Ana Costa")
            .phone("(21) 99999-4444").active(true).build());

        // Ingredientes
        ingredientRepository.save(Ingredient.builder().name("Bacalhau dessalgado").unit("KG")
            .currentStock(new BigDecimal("5.000")).minimumStock(new BigDecimal("2.000"))
            .averageCost(new BigDecimal("45.0000")).preferredSupplier(peixaria).build());
        ingredientRepository.save(Ingredient.builder().name("Batata cozida").unit("KG")
            .currentStock(new BigDecimal("10.000")).minimumStock(new BigDecimal("3.000"))
            .averageCost(new BigDecimal("4.5000")).preferredSupplier(sacolao).build());
        ingredientRepository.save(Ingredient.builder().name("Ovo").unit("UN")
            .currentStock(new BigDecimal("60.000")).minimumStock(new BigDecimal("12.000"))
            .averageCost(new BigDecimal("0.8000")).preferredSupplier(sacolao).build());
        ingredientRepository.save(Ingredient.builder().name("Salsa picada").unit("G")
            .currentStock(new BigDecimal("500.000")).minimumStock(new BigDecimal("100.000"))
            .averageCost(new BigDecimal("0.0200")).preferredSupplier(sacolao).build());
        ingredientRepository.save(Ingredient.builder().name("Frango desossado").unit("KG")
            .currentStock(new BigDecimal("8.000")).minimumStock(new BigDecimal("3.000"))
            .averageCost(new BigDecimal("14.0000")).preferredSupplier(aviario).build());
        ingredientRepository.save(Ingredient.builder().name("Azeite").unit("ML")
            .currentStock(new BigDecimal("1000.000")).minimumStock(new BigDecimal("300.000"))
            .averageCost(new BigDecimal("0.0500")).preferredSupplier(sacolao).build());
        ingredientRepository.save(Ingredient.builder().name("Massa para salgadinho").unit("KG")
            .currentStock(new BigDecimal("5.000")).minimumStock(new BigDecimal("2.000"))
            .averageCost(new BigDecimal("8.0000")).preferredSupplier(distrib).build());
        ingredientRepository.save(Ingredient.builder().name("Recheio misto").unit("KG")
            .currentStock(new BigDecimal("4.000")).minimumStock(new BigDecimal("1.500"))
            .averageCost(new BigDecimal("18.0000")).preferredSupplier(distrib).build());
        ingredientRepository.save(Ingredient.builder().name("Óleo para fritura").unit("L")
            .currentStock(new BigDecimal("5.000")).minimumStock(new BigDecimal("2.000"))
            .averageCost(new BigDecimal("6.5000")).preferredSupplier(sacolao).build());

        // Produtos — Bolinhos
        productRepository.save(Product.builder().name("Bolinho de bacalhau (unidade)")
            .description("Bolinho crocante feito na hora").category(ProductCategory.BOLINHO_BACALHAU)
            .salePrice(new BigDecimal("5.00")).productionCost(new BigDecimal("1.80"))
            .unitQuantity(1).active(true).build());
        productRepository.save(Product.builder().name("Bandeja 10 bolinhos")
            .category(ProductCategory.BOLINHO_BACALHAU)
            .salePrice(new BigDecimal("45.00")).productionCost(new BigDecimal("18.00"))
            .unitQuantity(10).active(true).build());
        productRepository.save(Product.builder().name("Bandeja 20 bolinhos")
            .category(ProductCategory.BOLINHO_BACALHAU)
            .salePrice(new BigDecimal("80.00")).productionCost(new BigDecimal("36.00"))
            .unitQuantity(20).active(true).build());

        // Produtos — Frango
        productRepository.save(Product.builder().name("Frango assado — porção 300g")
            .description("Frango desossado assado, temperado na hora").category(ProductCategory.FRANGO_ASSADO)
            .salePrice(new BigDecimal("22.00")).productionCost(new BigDecimal("9.00"))
            .unitQuantity(1).active(true).build());
        productRepository.save(Product.builder().name("Frango assado — meia ave (600g)")
            .category(ProductCategory.FRANGO_ASSADO)
            .salePrice(new BigDecimal("38.00")).productionCost(new BigDecimal("16.00"))
            .unitQuantity(1).active(true).build());
        productRepository.save(Product.builder().name("Frango assado — ave inteira (1,2kg)")
            .category(ProductCategory.FRANGO_ASSADO)
            .salePrice(new BigDecimal("65.00")).productionCost(new BigDecimal("28.00"))
            .unitQuantity(1).active(true).build());

        // Produtos — Salgadinhos
        productRepository.save(Product.builder().name("Mix salgadinhos — 20 unidades")
            .description("Mix variado: coxinha, risole, quibe e empada").category(ProductCategory.MIX_SALGADINHOS)
            .salePrice(new BigDecimal("58.00")).productionCost(new BigDecimal("28.00"))
            .unitQuantity(20).active(true).build());
        productRepository.save(Product.builder().name("Mix salgadinhos — 50 unidades")
            .category(ProductCategory.MIX_SALGADINHOS)
            .salePrice(new BigDecimal("130.00")).productionCost(new BigDecimal("65.00"))
            .unitQuantity(50).active(true).build());
        productRepository.save(Product.builder().name("Mix festa — 100 unidades")
            .category(ProductCategory.MIX_SALGADINHOS)
            .salePrice(new BigDecimal("240.00")).productionCost(new BigDecimal("120.00"))
            .unitQuantity(100).active(true).build());
    }
}
