package com.bolinhobacalhau.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "clients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(length = 30)
    private String phone;

    /** CPF com ou sem máscara (até 14 caracteres formatado). */
    @Column(length = 20)
    private String cpf;

    @Column(length = 500)
    private String address;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}

