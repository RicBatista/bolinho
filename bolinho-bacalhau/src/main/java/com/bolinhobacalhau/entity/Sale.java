package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.PaymentMethod;
import com.bolinhobacalhau.enums.SaleStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "sales")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Sale {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private LocalDateTime saleDate;
    private String saleChannel;

    /** Se preenchido, esta venda foi gerada ao concluir a encomenda (pedido futuro). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_order_id", unique = true)
    @JsonIgnore
    private Order sourceOrder;
    private String customerName;
    private String customerPhone;
    private String customerCpf;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal totalAmount;
    @Column(precision = 10, scale = 2) private BigDecimal discountAmount = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private PaymentMethod paymentMethod;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private SaleStatus status = SaleStatus.PAGO;
    @Column(length = 500) private String notes;
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default private List<SaleItem> items = new ArrayList<>();

    @PrePersist public void prePersist() {
        if (saleDate == null) saleDate = LocalDateTime.now();
    }

    public BigDecimal getFinalAmount() {
        BigDecimal d = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        return totalAmount.subtract(d);
    }
}
