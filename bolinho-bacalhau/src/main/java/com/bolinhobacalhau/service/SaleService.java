package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.*;
import com.bolinhobacalhau.enums.OrderStatus;
import com.bolinhobacalhau.enums.PaymentMethod;
import com.bolinhobacalhau.enums.SaleStatus;
import com.bolinhobacalhau.enums.StockMovementType;
import com.bolinhobacalhau.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public Sale createSale(Sale sale, List<SaleItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (SaleItem item : items) {
            Product p = productRepository.findById(item.getProduct().getId())
                .orElseThrow(() -> new EntityNotFoundException("Produto não encontrado"));
            item.setProduct(p);
            if (item.getUnitPrice() == null) item.setUnitPrice(p.getSalePrice());
            item.setSale(sale);
            total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        sale.setTotalAmount(total);
        sale.setItems(items);
        sale.setStatus(SaleStatus.PAGO);

        Set<Long> productIds = items.stream()
            .map(i -> i.getProduct().getId())
            .collect(Collectors.toSet());

        Map<Long, BigDecimal> need = new HashMap<>();
        if (!productIds.isEmpty()) {
            List<Product> withRecipe = productRepository.findAllWithRecipeByIdIn(productIds);
            Map<Long, Product> byId = withRecipe.stream().collect(Collectors.toMap(Product::getId, x -> x));
            for (SaleItem item : items) {
                Product p = byId.get(item.getProduct().getId());
                if (p == null || p.getRecipeItems() == null || p.getRecipeItems().isEmpty()) continue;
                for (ProductRecipeItem line : p.getRecipeItems()) {
                    Long ingId = line.getIngredient().getId();
                    BigDecimal q = line.getQuantity().multiply(BigDecimal.valueOf(item.getQuantity()));
                    need.merge(ingId, q, BigDecimal::add);
                }
            }
        }

        for (Map.Entry<Long, BigDecimal> e : need.entrySet()) {
            Ingredient ing = ingredientRepository.findById(e.getKey())
                .orElseThrow(() -> new EntityNotFoundException("Ingrediente não encontrado: " + e.getKey()));
            if (ing.getCurrentStock().compareTo(e.getValue()) < 0) {
                throw new IllegalStateException(String.format(
                    "Estoque insuficiente de \"%s\": necessário %s %s, disponível %s.",
                    ing.getName(),
                    e.getValue().stripTrailingZeros().toPlainString(),
                    ing.getUnit(),
                    ing.getCurrentStock().stripTrailingZeros().toPlainString()));
            }
        }

        Sale saved = saleRepository.save(sale);

        for (Map.Entry<Long, BigDecimal> e : need.entrySet()) {
            Ingredient ing = ingredientRepository.findById(e.getKey()).orElseThrow();
            ing.setCurrentStock(ing.getCurrentStock().subtract(e.getValue()));
            ingredientRepository.save(ing);
            stockMovementRepository.save(StockMovement.builder()
                .ingredient(ing)
                .type(StockMovementType.SAIDA)
                .quantity(e.getValue())
                .movementDate(LocalDateTime.now())
                .sale(saved)
                .notes("Venda #" + saved.getId())
                .build());
        }

        return saved;
    }

    /**
     * Ao marcar a encomenda como entregue, gera uma venda equivalente ao PDV (faturamento + baixa de estoque).
     * Idempotente: não duplica se a venda já existir para este pedido.
     */
    @Transactional
    public Optional<Sale> createSaleFromCompletedOrderIfAbsent(Order order) {
        if (order.getStatus() != OrderStatus.ENTREGUE) {
            return Optional.empty();
        }
        Optional<Sale> existing = saleRepository.findBySourceOrder_Id(order.getId());
        if (existing.isPresent()) return existing;
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalStateException("Encomenda sem itens não pode gerar venda.");
        }
        List<SaleItem> saleItems = new ArrayList<>();
        for (OrderItem oi : order.getItems()) {
            SaleItem si = new SaleItem();
            Product p = new Product();
            p.setId(oi.getProduct().getId());
            si.setProduct(p);
            si.setQuantity(oi.getQuantity());
            si.setUnitPrice(oi.getUnitPrice());
            saleItems.add(si);
        }
        Sale sale = Sale.builder()
                .sourceOrder(order)
                .saleChannel("ENCOMENDA")
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .customerCpf(order.getCustomerCpf())
                .paymentMethod(PaymentMethod.DINHEIRO)
                .discountAmount(BigDecimal.ZERO)
                .notes("Gerada da encomenda #" + order.getId() + " (valor total do pedido).")
                .build();
        return Optional.of(createSale(sale, saleItems));
    }

    @Transactional
    public Sale cancel(Long id) {
        Sale sale = findById(id);
        if (sale.getStatus() == SaleStatus.CANCELADO)
            throw new IllegalStateException("Venda já cancelada.");

        List<StockMovement> movements = stockMovementRepository.findBySale_Id(id);
        for (StockMovement m : movements) {
            if (m.getType() != StockMovementType.SAIDA) continue;
            Ingredient ing = ingredientRepository.findById(m.getIngredient().getId())
                .orElseThrow(() -> new EntityNotFoundException("Ingrediente não encontrado"));
            ing.setCurrentStock(ing.getCurrentStock().add(m.getQuantity()));
            ingredientRepository.save(ing);
            stockMovementRepository.save(StockMovement.builder()
                .ingredient(ing)
                .type(StockMovementType.ENTRADA)
                .quantity(m.getQuantity())
                .movementDate(LocalDateTime.now())
                .notes("Estorno cancelamento venda #" + id)
                .build());
        }

        sale.setStatus(SaleStatus.CANCELADO);
        return saleRepository.save(sale);
    }

    public List<Sale> listByPeriod(LocalDateTime start, LocalDateTime end) {
        return saleRepository.findBySaleDateBetweenOrderBySaleDateDesc(start, end);
    }

    public Sale findById(Long id) {
        return saleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Venda não encontrada: " + id));
    }
}
