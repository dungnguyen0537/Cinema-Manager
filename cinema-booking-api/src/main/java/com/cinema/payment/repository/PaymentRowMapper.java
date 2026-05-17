package com.cinema.payment.repository;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.payment.entity.PaymentEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PaymentRowMapper implements RowMapper<PaymentEntity> {
    @Override
    public PaymentEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        PaymentEntity entity = new PaymentEntity();
        entity.setId(rs.getLong("id"));
        entity.setPaymentCode(rs.getString("payment_code"));
        entity.setProvider(rs.getString("provider"));
        entity.setBankTransactionId(rs.getString("bank_transaction_id"));
        entity.setAmount(rs.getBigDecimal("amount"));
        entity.setStatus(rs.getString("status"));
        entity.setRequestPayload(rs.getString("request_payload"));
        entity.setResponsePayload(rs.getString("response_payload"));
        if (rs.getTimestamp("paid_at") != null)
            entity.setPaidAt(rs.getTimestamp("paid_at").toLocalDateTime());
        entity.setQrContent(rs.getString("qr_content"));
        if (rs.getTimestamp("created_at") != null)
            entity.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        if (rs.getObject("booking_id") != null) {
            BookingEntity booking = new BookingEntity();
            booking.setId(rs.getLong("booking_id"));
            entity.setBooking(booking);
        }
        return entity;
    }
}
