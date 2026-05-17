package com.cinema.payment.repository;

import com.cinema.payment.entity.RefundTransactionEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RefundTransactionDaoImpl implements RefundTransactionDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final RefundTransactionRowMapper rowMapper = new RefundTransactionRowMapper();

    @Override
    public RefundTransactionEntity save(RefundTransactionEntity entity) {
        org.springframework.jdbc.core.namedparam.MapSqlParameterSource params = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource();
        params.addValue("id", entity.getId());
        params.addValue("bookingId", entity.getBookingId());
        params.addValue("paymentId", entity.getPaymentId());
        params.addValue("amount", entity.getAmount());
        params.addValue("reason", entity.getReason());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO refund_transactions (booking_id, payment_id, amount, reason, status) VALUES (:bookingId, :paymentId, :amount, :reason, :status)";
            org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            String sql = "UPDATE refund_transactions SET booking_id = :bookingId, payment_id = :paymentId, amount = :amount, reason = :reason, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<RefundTransactionEntity> findById(Long id) {
        String sql = "SELECT * FROM refund_transactions WHERE id = :id";
        List<RefundTransactionEntity> results = jdbcTemplate.query(sql, new MapSqlParameterSource("id", id), rowMapper);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<RefundTransactionEntity> findAll() {
        String sql = "SELECT * FROM refund_transactions";
        return jdbcTemplate.query(sql, rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        String sql = "DELETE FROM refund_transactions WHERE id = :id";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id));
    }
}
