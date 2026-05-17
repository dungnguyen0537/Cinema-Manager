package com.cinema.seat.repository;

import com.cinema.seat.entity.SeatEntity;
import com.cinema.room.entity.RoomEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class SeatRowMapper implements RowMapper<SeatEntity> {
    @Override
    public SeatEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        SeatEntity entity = new SeatEntity();
        entity.setId(rs.getLong("id"));
        entity.setRowName(rs.getString("row_name"));
        entity.setSeatNumber(rs.getObject("seat_number") != null ? rs.getInt("seat_number") : null);
        entity.setSeatType(rs.getString("seat_type"));
        entity.setStatus(rs.getString("status"));
        if (rs.getObject("room_id") != null) {
            RoomEntity room = new RoomEntity();
            room.setId(rs.getLong("room_id"));
            entity.setRoom(room);
        }
        return entity;
    }
}
