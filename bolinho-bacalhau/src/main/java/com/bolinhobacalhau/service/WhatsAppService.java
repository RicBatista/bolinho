package com.bolinhobacalhau.service;

import com.bolinhobacalhau.entity.NotificationLog;
import com.bolinhobacalhau.enums.NotificationType;
import com.bolinhobacalhau.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service @RequiredArgsConstructor @Slf4j
public class WhatsAppService {

    private final NotificationLogRepository logRepository;
    private final RestTemplate restTemplate;

    @Value("${zapi.instance-id:}") private String instanceId;
    @Value("${zapi.token:}")       private String token;
    @Value("${zapi.owner-phone:}") private String ownerPhone;
    @Value("${zapi.enabled:false}") private boolean enabled;

    private static final int COOLDOWN_HOURS = 4;

    public void notifyLowStock(String name, String stock, String unit, String min) {
        String msg = String.format("*[ALERTA ESTOQUE]* \uD83D\uDCE6\n\n*%s* abaixo do mínimo!\nAtual: *%s %s*\nMínimo: *%s %s*", name, stock, unit, min, unit);
        sendWithCooldown(NotificationType.ESTOQUE_BAIXO, ownerPhone, msg);
    }

    public void notifyOverduePayment(String supplier, String amount, String dueDate) {
        String msg = String.format("*[CONTA VENCIDA]* \uD83D\uDEA8\n\nFornecedor: *%s*\nValor: *R$ %s*\nVencimento: *%s*", supplier, amount, dueDate);
        sendWithCooldown(NotificationType.CONTA_VENCIDA, ownerPhone, msg);
    }

    public void notifyPaymentDueSoon(String supplier, String amount, String dueDate) {
        String msg = String.format("*[CONTA A VENCER]* \uD83D\uDCC5\n\nFornecedor: *%s*\nValor: *R$ %s*\nVencimento: *%s*", supplier, amount, dueDate);
        sendWithCooldown(NotificationType.CONTA_VENCENDO, ownerPhone, msg);
    }

    public void notifyDailySummary(String revenue, long sales, int lowStock) {
        String msg = String.format("*[RESUMO DO DIA]* \uD83D\uDCCA\n\nFaturamento: *R$ %s*\nVendas: *%d*\nAlertas estoque: *%d*", revenue, sales, lowStock);
        send(NotificationType.RESUMO_DIARIO, ownerPhone, msg);
    }

    private void sendWithCooldown(NotificationType type, String phone, String message) {
        Optional<NotificationLog> recent = logRepository
            .findTopByTypeAndPhoneAndSentAtAfterOrderBySentAtDesc(
                type, phone, LocalDateTime.now().minusHours(COOLDOWN_HOURS));
        if (recent.isPresent()) { log.info("Notificação {} em cooldown", type); return; }
        send(type, phone, message);
    }

    private void send(NotificationType type, String phone, String message) {
        if (!enabled) {
            log.info("[WhatsApp SIMULADO] Para: {} | {}", phone, message.substring(0, Math.min(50, message.length())));
            saveLog(type, phone, message, true, null);
            return;
        }
        if (instanceId.isBlank() || token.isBlank() || phone.isBlank()) {
            log.warn("WhatsApp não configurado.");
            return;
        }
        try {
            String url = String.format("https://api.z-api.io/instances/%s/token/%s/send-text", instanceId, token);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(url, new HttpEntity<>(Map.of("phone", phone, "message", message), headers), String.class);
            saveLog(type, phone, message, true, null);
        } catch (Exception e) {
            saveLog(type, phone, message, false, e.getMessage());
            log.error("Falha ao enviar WhatsApp: {}", e.getMessage());
        }
    }

    /** Envia mensagem customizada para o número do dono (sem cooldown — para encomendas) */
    public void sendCustom(String message) {
        send(NotificationType.RESUMO_DIARIO, ownerPhone, message);
    }

    private void saveLog(NotificationType type, String phone, String message, boolean success, String error) {
        logRepository.save(NotificationLog.builder()
            .type(type).phone(phone).message(message)
            .success(success).errorMessage(error).sentAt(LocalDateTime.now()).build());
    }
}
// ─── método adicionado para encomendas ───────────────────────
// Coloque este método dentro da classe WhatsAppService, antes do último }
