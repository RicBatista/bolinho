package com.bolinhobacalhau.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeLineRequest {
    @NotNull
    private Long ingredientId;
    @NotNull
    private BigDecimal quantity;
}
