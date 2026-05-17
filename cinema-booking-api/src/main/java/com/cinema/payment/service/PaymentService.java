package com.cinema.payment.service;

import com.cinema.payment.entity.PaymentEntity;
import java.math.BigDecimal;

public interface PaymentService {
    PaymentEntity initiatePayment(Long bookingId);
    boolean approvePayment(String bankTransactionId, BigDecimal amount, String bookingCode);
    PaymentEntity getPaymentStatus(Long bookingId);
}
