package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.dto.ZApiEnvStatus;
import com.bolinhobacalhau.entity.NotificationLog;
import com.bolinhobacalhau.repository.NotificationLogRepository;
import com.bolinhobacalhau.service.NotificationScheduler;
import com.bolinhobacalhau.service.WhatsAppService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/notificacoes") @RequiredArgsConstructor
@Tag(name = "Notificações WhatsApp")
public class NotificationController {

    private final NotificationLogRepository logRepository;
    private final NotificationScheduler scheduler;
    private final WhatsAppService whatsAppService;

    /** Indica se envio real está configurado (sem revelar tokens). */
    @GetMapping("/zapi-estado")
    public ResponseEntity<ZApiEnvStatus> zapiEstado() {
        return ResponseEntity.ok(whatsAppService.zApiEnvStatus());
    }

    @GetMapping("/historico")
    public ResponseEntity<List<NotificationLog>> history() {
        return ResponseEntity.ok(logRepository.findTop20ByOrderBySentAtDesc());
    }

    @PostMapping("/testar/estoque-baixo")
    public ResponseEntity<String> triggerLowStock() {
        scheduler.checkLowStock(); return ResponseEntity.ok("Verificação executada.");
    }

    @PostMapping("/testar/contas-vencidas")
    public ResponseEntity<String> triggerOverdue() {
        scheduler.checkOverduePayments(); return ResponseEntity.ok("Verificação executada.");
    }

    @PostMapping("/testar/resumo-diario")
    public ResponseEntity<String> triggerSummary() {
        scheduler.sendDailySummary(); return ResponseEntity.ok("Resumo enviado.");
    }
}
