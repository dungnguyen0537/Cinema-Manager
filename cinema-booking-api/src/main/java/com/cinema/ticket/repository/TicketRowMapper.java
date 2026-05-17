package com.cinema.ticket.repository;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.ticket.entity.TicketEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TicketRowMapper implements RowMapper<TicketEntity> {
    @Override
    public TicketEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        TicketEntity entity = new TicketEntity();
        entity.setId(rs.getLong("id"));
        entity.setTicketCode(rs.getString("ticket_code"));
        entity.setQrCode(rs.getString("qr_code"));
        if (rs.getTimestamp("issued_at") != null)
            entity.setIssuedAt(rs.getTimestamp("issued_at").toLocalDateTime());
        entity.setStatus(rs.getString("status"));
        if (rs.getObject("booking_id") != null) {
            BookingEntity booking = new BookingEntity();
            booking.setId(rs.getLong("booking_id"));
            entity.setBooking(booking);
        }
        return entity;
    }
}
