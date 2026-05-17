package com.cinema.payment.repository;

import com.cinema.payment.entity.PaymentEntity;
import com.cinema.booking.entity.BookingEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PaymentDaoImpl implements PaymentDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final PaymentRowMapper rowMapper = new PaymentRowMapper();

    @Override
    public PaymentEntity save(PaymentEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("bookingId", entity.getBooking() != null ? entity.getBooking().getId() : null);
        params.addValue("paymentCode", entity.getPaymentCode());
        params.addValue("provider", entity.getProvider());
        params.addValue("bankTransactionId", entity.getBankTransactionId());
        params.addValue("amount", entity.getAmount());
        params.addValue("status", entity.getStatus());
        params.addValue("requestPayload", entity.getRequestPayload());
        params.addValue("responsePayload", entity.getResponsePayload());
        params.addValue("paidAt", entity.getPaidAt());
        params.addValue("qrContent", entity.getQrContent());

        if (entity.getId() == null) {
            LocalDateTime now = LocalDateTime.now();
            params.addValue("createdAt", now);
            params.addValue("updatedAt", now);
            String sql = "INSERT INTO payments (booking_id, payment_code, provider, bank_transaction_id, amount, status, " +
                    "request_payload, response_payload, paid_at, qr_content, created_at, updated_at) " +
                    "VALUES (:bookingId, :paymentCode, :provider, :bankTransactionId, :amount, :status, " +
                    ":requestPayload, :responsePayload, :paidAt, :qrContent, :createdAt, :updatedAt)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
            entity.setCreatedAt(now);
        } else {
            params.addValue("id", entity.getId());
            params.addValue("updatedAt", LocalDateTime.now());
            String sql = "UPDATE payments SET booking_id = :bookingId, payment_code = :paymentCode, provider = :provider, " +
                    "bank_transaction_id = :bankTransactionId, amount = :amount, status = :status, " +
                    "request_payload = :requestPayload, response_payload = :responsePayload, paid_at = :paidAt, " +
                    "qr_content = :qrContent, updated_at = :updatedAt WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<PaymentEntity> findById(Long id) {
        List<PaymentEntity> list = jdbcTemplate.query("SELECT * FROM payments WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<PaymentEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM payments", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM payments WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public boolean existsByBankTransactionId(String bankTransactionId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM payments WHERE bank_transaction_id = :txId",
                new MapSqlParameterSource("txId", bankTransactionId), Integer.class);
        return count != null && count > 0;
    }

    @Override
    public Optional<PaymentEntity> findFirstByBookingIdAndStatusOrderByCreatedAtDesc(Long bookingId, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("bookingId", bookingId);
        params.addValue("status", status);
        List<PaymentEntity> list = jdbcTemplate.query(
                "SELECT * FROM payments WHERE booking_id = :bookingId AND status = :status ORDER BY created_at DESC LIMIT 1",
                params, rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
