package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingSeatEntity;
import com.cinema.seat.entity.SeatEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class BookingSeatRowMapper implements RowMapper<BookingSeatEntity> {
    @Override
    public BookingSeatEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        BookingSeatEntity entity = new BookingSeatEntity();
        entity.setId(rs.getLong("id"));
        entity.setSeatPrice(rs.getBigDecimal("seat_price"));
        if (rs.getObject("seat_id") != null) {
            SeatEntity seat = new SeatEntity();
            seat.setId(rs.getLong("seat_id"));
            entity.setSeat(seat);
        }
        return entity;
    }
}
