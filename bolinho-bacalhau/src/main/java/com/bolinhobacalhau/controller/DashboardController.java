package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/dashboard") @RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> get() {
        return ResponseEntity.ok(dashboardService.getDashboard());
    }
}
