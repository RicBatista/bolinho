package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.SupplierPaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "purchases")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "supplier_id", nullable = false) private Supplier supplier;
    @Column(nullable = false) private LocalDateTime purchaseDate;
    private LocalDate dueDate;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal totalAmount;
    @Column(precision = 10, scale = 2) private BigDecimal amountPaid = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private SupplierPaymentStatus paymentStatus = SupplierPaymentStatus.PENDENTE;
    private String invoiceNumber;
    @Column(length = 1000) private String notes;
    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default private List<PurchaseItem> items = new ArrayList<>();

    @PrePersist public void prePersist() {
        if (purchaseDate == null) purchaseDate = LocalDateTime.now();
    }

    public BigDecimal getRemainingAmount() {
        BigDecimal paid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        return totalAmount.subtract(paid);
    }

    public boolean isOverdue() {
        return dueDate != null && LocalDate.now().isAfter(dueDate)
                && paymentStatus != SupplierPaymentStatus.PAGO;
    }
}
