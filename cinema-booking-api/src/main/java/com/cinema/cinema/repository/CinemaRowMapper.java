package com.cinema.cinema.repository;

import com.cinema.cinema.entity.CinemaEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class CinemaRowMapper implements RowMapper<CinemaEntity> {
    @Override
    public CinemaEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        CinemaEntity entity = new CinemaEntity();
        entity.setId(rs.getLong("id"));
        entity.setName(rs.getString("name"));
        entity.setAddress(rs.getString("address"));
        entity.setCity(rs.getString("city"));
        entity.setPhone(rs.getString("phone"));
        entity.setStatus(rs.getString("status"));
        return entity;
    }
}
