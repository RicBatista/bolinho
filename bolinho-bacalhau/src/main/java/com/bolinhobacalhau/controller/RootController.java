package com.bolinhobacalhau.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Sem handler em /, o Spring tenta recurso estático e falha. Redireciona para o Swagger.
 */
@Controller
public class RootController {

    @GetMapping("/")
    public String root() {
        return "redirect:/swagger-ui.html";
    }
}
