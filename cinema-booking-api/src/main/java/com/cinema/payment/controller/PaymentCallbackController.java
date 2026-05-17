package com.cinema.payment.controller;

import com.cinema.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Webhook/Callback endpoint cho DVSTEAM API Bank (nếu được hỗ trợ).
 * Endpoint: POST /api/v1/payment/callback
 * Không yêu cầu authentication (permitAll trong SecurityConfig).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentCallbackController {

    private final PaymentService paymentService;

    private static final Pattern CGV_PATTERN = Pattern.compile("CGV(\\d{8})", Pattern.CASE_INSENSITIVE);
    private static final Pattern NUMERIC_8_PATTERN = Pattern.compile("(?<!\\d)(\\d{8})(?!\\d)");

    /**
     * Webhook callback từ DVSTEAM hoặc các hệ thống bên ngoài.
     */
    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestBody Map<String, Object> payload) {
        log.info("=== CALLBACK RECEIVED ===");
        log.info("Payload: {}", payload);

        try {
            String txId = extractString(payload,
                    "id", "transactionId", "transaction_id", "transId", "refNo", "reference");

            BigDecimal amount = extractAmount(payload,
                    "creditAmount", "credit_amount", "amount", "money", "value");

            String description = extractString(payload,
                    "description", "content", "des", "memo", "detail", "transDesc", "addDescription");

            log.info("Parsed: txId={}, amount={}, desc='{}'", txId, amount, description);

            if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.ok(Map.of("status", "error", "message", "Invalid amount"));
            }

            if (description == null || description.isBlank()) {
                return ResponseEntity.ok(Map.of("status", "error", "message", "No description"));
            }

            if (txId == null) {
                txId = "CB" + System.currentTimeMillis();
            }

            String bookingCode = extractBookingCode(description);
            if (bookingCode == null) {
                return ResponseEntity.ok(Map.of("status", "ok", "message", "No matching booking code"));
            }

            boolean result = paymentService.approvePayment(txId, amount, bookingCode);
            String msg = result ? "Payment approved for booking " + bookingCode : "Booking not eligible";
            return ResponseEntity.ok(Map.of("status", "ok", "message", msg));

        } catch (Exception e) {
            log.error("Callback error: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> callbackHealthCheck() {
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Payment callback endpoint is active"));
    }

    private String extractBookingCode(String description) {
        String normalized = description.toUpperCase().replaceAll("\\s+", "");
        Matcher cgvMatcher = CGV_PATTERN.matcher(normalized);
        if (cgvMatcher.find()) return cgvMatcher.group(1);
        Matcher numericMatcher = NUMERIC_8_PATTERN.matcher(normalized);
        if (numericMatcher.find()) return numericMatcher.group(1);
        return null;
    }

    private String extractString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null && !"null".equals(String.valueOf(val)) && !String.valueOf(val).isBlank()) {
                return String.valueOf(val);
            }
        }
        return null;
    }

    private BigDecimal extractAmount(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null) {
                try {
                    String cleaned = String.valueOf(val).replaceAll("[^0-9.]", "");
                    if (!cleaned.isEmpty()) {
                        BigDecimal amount = new BigDecimal(cleaned);
                        if (amount.compareTo(BigDecimal.ZERO) > 0) return amount;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }
}
