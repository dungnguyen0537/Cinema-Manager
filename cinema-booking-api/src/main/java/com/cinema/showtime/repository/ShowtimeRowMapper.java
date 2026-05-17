package com.cinema.showtime.repository;

import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.movie.entity.MovieEntity;
import com.cinema.room.entity.RoomEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class ShowtimeRowMapper implements RowMapper<ShowtimeEntity> {
    @Override
    public ShowtimeEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        ShowtimeEntity entity = new ShowtimeEntity();
        entity.setId(rs.getLong("id"));
        if (rs.getTimestamp("start_time") != null)
            entity.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        if (rs.getTimestamp("end_time") != null)
            entity.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
        entity.setBasePrice(rs.getBigDecimal("base_price"));
        entity.setStatus(rs.getString("status"));
        if (rs.getObject("movie_id") != null) {
            MovieEntity movie = new MovieEntity();
            movie.setId(rs.getLong("movie_id"));
            entity.setMovie(movie);
        }
        if (rs.getObject("room_id") != null) {
            RoomEntity room = new RoomEntity();
            room.setId(rs.getLong("room_id"));
            entity.setRoom(room);
        }
        return entity;
    }
}
