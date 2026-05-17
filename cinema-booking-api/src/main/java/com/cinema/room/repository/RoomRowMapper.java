package com.cinema.room.repository;

import com.cinema.cinema.entity.CinemaEntity;
import com.cinema.room.entity.RoomEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class RoomRowMapper implements RowMapper<RoomEntity> {
    @Override
    public RoomEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        RoomEntity entity = new RoomEntity();
        entity.setId(rs.getLong("id"));
        entity.setName(rs.getString("name"));
        entity.setType(rs.getString("type"));
        entity.setCapacity(rs.getObject("capacity") != null ? rs.getInt("capacity") : null);
        entity.setStatus(rs.getString("status"));
        if (rs.getObject("cinema_id") != null) {
            CinemaEntity cinema = new CinemaEntity();
            cinema.setId(rs.getLong("cinema_id"));
            entity.setCinema(cinema);
        }
        return entity;
    }
}
