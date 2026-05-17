package com.cinema.movie.repository;

import com.cinema.movie.entity.GenreEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class GenreRowMapper implements RowMapper<GenreEntity> {
    @Override
    public GenreEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        GenreEntity entity = new GenreEntity();
        entity.setId(rs.getLong("id"));
        entity.setName(rs.getString("name"));
        return entity;
    }
}
