package com.cinema.payment.repository;

import com.cinema.payment.entity.RefundTransactionEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class RefundTransactionRowMapper implements RowMapper<RefundTransactionEntity> {
    @Override
    public RefundTransactionEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        RefundTransactionEntity entity = new RefundTransactionEntity();
        entity.setId(rs.getLong("id"));
        entity.setBookingId(rs.getObject("booking_id") != null ? rs.getLong("booking_id") : null);
        entity.setPaymentId(rs.getObject("payment_id") != null ? rs.getLong("payment_id") : null);
        entity.setAmount(rs.getBigDecimal("amount"));
        entity.setReason(rs.getString("reason"));
        entity.setStatus(rs.getString("status"));
        return entity;
    }
}
