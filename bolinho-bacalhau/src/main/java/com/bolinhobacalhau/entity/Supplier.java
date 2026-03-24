package com.bolinhobacalhau.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity @Table(name = "suppliers")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Supplier {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Column(nullable = false) private String name;
    private String cnpjCpf;
    private String contactName;
    private String phone;
    private String email;
    @Column(length = 500) private String address;
    @Column(length = 1000) private String notes;
    @Column(nullable = false) private Boolean active = true;
}
