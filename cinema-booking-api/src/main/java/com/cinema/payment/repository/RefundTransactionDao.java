package com.cinema.payment.repository;

import com.cinema.payment.entity.RefundTransactionEntity;
import java.util.List;
import java.util.Optional;

public interface RefundTransactionDao {
    RefundTransactionEntity save(RefundTransactionEntity entity);
    Optional<RefundTransactionEntity> findById(Long id);
    List<RefundTransactionEntity> findAll();
    void deleteById(Long id);
}
