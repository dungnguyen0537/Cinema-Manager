package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.user.entity.UserEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class BookingRowMapper implements RowMapper<BookingEntity> {
    @Override
    public BookingEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        BookingEntity entity = new BookingEntity();
        entity.setId(rs.getLong("id"));
        entity.setBookingCode(rs.getString("booking_code"));
        try { entity.setPaymentToken(rs.getString("payment_token")); } catch (SQLException ignored) {}
        entity.setTotalAmount(rs.getBigDecimal("total_amount"));
        entity.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        entity.setFinalAmount(rs.getBigDecimal("final_amount"));
        entity.setStatus(rs.getString("status"));
        if (rs.getTimestamp("hold_expired_at") != null)
            entity.setHoldExpiredAt(rs.getTimestamp("hold_expired_at").toLocalDateTime());
        entity.setPaymentStatus(rs.getString("payment_status"));
        entity.setPromotionCode(rs.getString("promotion_code"));
        if (rs.getTimestamp("created_at") != null)
            entity.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        if (rs.getTimestamp("updated_at") != null)
            entity.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        entity.setCreatedBy(rs.getString("created_by"));

        // FK stubs - will be populated by DaoImpl
        if (rs.getObject("user_id") != null) {
            UserEntity user = new UserEntity();
            user.setId(rs.getLong("user_id"));
            entity.setUser(user);
        }
        if (rs.getObject("showtime_id") != null) {
            ShowtimeEntity showtime = new ShowtimeEntity();
            showtime.setId(rs.getLong("showtime_id"));
            entity.setShowtime(showtime);
        }
        return entity;
    }
}
