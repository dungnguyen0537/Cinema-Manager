package com.cinema.movie.repository;

import com.cinema.movie.entity.MovieEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class MovieRowMapper implements RowMapper<MovieEntity> {
    @Override
    public MovieEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        MovieEntity entity = new MovieEntity();
        entity.setId(rs.getLong("id"));
        entity.setTitle(rs.getString("title"));
        entity.setDescription(rs.getString("description"));
        entity.setDurationMinutes(rs.getObject("duration_minutes") != null ? rs.getInt("duration_minutes") : null);
        entity.setLanguage(rs.getString("language"));
        entity.setSubtitle(rs.getString("subtitle"));
        entity.setAgeRating(rs.getString("age_rating"));
        entity.setDirector(rs.getString("director"));
        entity.setCast(rs.getString("cast_members"));
        entity.setPosterUrl(rs.getString("poster_url"));
        entity.setTrailerUrl(rs.getString("trailer_url"));
        if (rs.getDate("release_date") != null)
            entity.setReleaseDate(rs.getDate("release_date").toLocalDate());
        entity.setStatus(rs.getString("status"));
        if (rs.getTimestamp("created_at") != null)
            entity.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        if (rs.getTimestamp("updated_at") != null)
            entity.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        entity.setCreatedBy(rs.getString("created_by"));
        return entity;
    }
}
