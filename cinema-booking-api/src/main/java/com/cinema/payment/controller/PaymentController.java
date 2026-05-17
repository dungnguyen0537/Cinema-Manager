package com.cinema.payment.controller;

import com.cinema.common.ApiResponse;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.payment.entity.PaymentEntity;
import com.cinema.payment.service.PaymentService;
import com.cinema.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Quản lý thanh toán và QR Code")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Initiate payment for a booking - returns QR code URL.
     */
    @PostMapping("/initiate")
    @Operation(summary = "Khởi tạo thanh toán - tạo QR code MB Bank")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiatePayment(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, Long> request) {
        Long bookingId = request.get("bookingId");
        PaymentEntity payment = paymentService.initiatePayment(bookingId);

        Map<String, Object> response = Map.of(
                "paymentId", payment.getId(),
                "paymentCode", payment.getPaymentCode(),
                "amount", payment.getAmount(),
                "qrCodeUrl", payment.getQrContent(),
                "status", payment.getStatus()
        );

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Check payment status for a booking.
     */
    @GetMapping("/{bookingId}/status")
    @Operation(summary = "Kiểm tra trạng thái thanh toán")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long bookingId) {
        PaymentEntity payment = paymentService.getPaymentStatus(bookingId);

        Map<String, Object> response = Map.of(
                "paymentId", payment.getId(),
                "status", payment.getStatus(),
                "amount", payment.getAmount(),
                "paidAt", payment.getPaidAt() != null ? payment.getPaidAt().toString() : "",
                "bankTransactionId", payment.getBankTransactionId() != null ? payment.getBankTransactionId() : ""
        );

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
