package com.cinema.payment.repository;

import com.cinema.payment.entity.PaymentEntity;
import java.util.List;
import java.util.Optional;

public interface PaymentDao {
    PaymentEntity save(PaymentEntity entity);
    Optional<PaymentEntity> findById(Long id);
    List<PaymentEntity> findAll();
    void deleteById(Long id);
    boolean existsByBankTransactionId(String bankTransactionId);
    Optional<PaymentEntity> findFirstByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, String status);
}
