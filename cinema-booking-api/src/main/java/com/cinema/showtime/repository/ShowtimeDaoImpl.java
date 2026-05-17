package com.cinema.showtime.repository;

import com.cinema.showtime.entity.ShowtimeEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ShowtimeDaoImpl implements ShowtimeDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ShowtimeRowMapper rowMapper = new ShowtimeRowMapper();

    @Override
    public ShowtimeEntity save(ShowtimeEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("movieId", entity.getMovie() != null ? entity.getMovie().getId() : null);
        params.addValue("roomId", entity.getRoom() != null ? entity.getRoom().getId() : null);
        params.addValue("startTime", entity.getStartTime());
        params.addValue("endTime", entity.getEndTime());
        params.addValue("basePrice", entity.getBasePrice());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) " +
                    "VALUES (:movieId, :roomId, :startTime, :endTime, :basePrice, :status)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE showtimes SET movie_id = :movieId, room_id = :roomId, start_time = :startTime, " +
                    "end_time = :endTime, base_price = :basePrice, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<ShowtimeEntity> findById(Long id) {
        List<ShowtimeEntity> results = jdbcTemplate.query("SELECT * FROM showtimes WHERE id = :id",
                new MapSqlParameterSource("id", id), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        populateAssociations(results.get(0));
        return Optional.of(results.get(0));
    }

    @Override
    public List<ShowtimeEntity> findAll() {
        List<ShowtimeEntity> list = jdbcTemplate.query("SELECT * FROM showtimes", rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM showtimes WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public List<ShowtimeEntity> findShowtimes(Long movieId, Long cinemaId, LocalDateTime from, LocalDateTime to) {
        StringBuilder sql = new StringBuilder("SELECT s.* FROM showtimes s JOIN rooms r ON s.room_id = r.id WHERE s.start_time >= :from AND s.start_time <= :to AND s.status = 'ACTIVE' ");
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("from", from);
        params.addValue("to", to);
        if (movieId != null) { sql.append(" AND s.movie_id = :movieId "); params.addValue("movieId", movieId); }
        if (cinemaId != null) { sql.append(" AND r.cinema_id = :cinemaId "); params.addValue("cinemaId", cinemaId); }
        sql.append(" ORDER BY s.start_time");
        List<ShowtimeEntity> list = jdbcTemplate.query(sql.toString(), params, rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    @Override
    public List<ShowtimeEntity> findConflicting(Long roomId, LocalDateTime start, LocalDateTime end) {
        String sql = "SELECT * FROM showtimes WHERE room_id = :roomId AND status = 'ACTIVE' " +
                "AND ((start_time BETWEEN :start AND :end) OR (end_time BETWEEN :start AND :end))";
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("roomId", roomId);
        params.addValue("start", start);
        params.addValue("end", end);
        List<ShowtimeEntity> list = jdbcTemplate.query(sql, params, rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    private void populateAssociations(ShowtimeEntity s) {
        // Movie
        if (s.getMovie() != null && s.getMovie().getId() != null) {
            var movies = jdbcTemplate.query("SELECT * FROM movies WHERE id = :id",
                    new MapSqlParameterSource("id", s.getMovie().getId()),
                    new com.cinema.movie.repository.MovieRowMapper());
            if (!movies.isEmpty()) s.setMovie(movies.get(0));
        }
        // Room + Cinema
        if (s.getRoom() != null && s.getRoom().getId() != null) {
            var rooms = jdbcTemplate.query("SELECT * FROM rooms WHERE id = :id",
                    new MapSqlParameterSource("id", s.getRoom().getId()),
                    new com.cinema.room.repository.RoomRowMapper());
            if (!rooms.isEmpty()) {
                s.setRoom(rooms.get(0));
                if (s.getRoom().getCinema() != null && s.getRoom().getCinema().getId() != null) {
                    var cinemas = jdbcTemplate.query("SELECT * FROM cinemas WHERE id = :id",
                            new MapSqlParameterSource("id", s.getRoom().getCinema().getId()),
                            new com.cinema.cinema.repository.CinemaRowMapper());
                    if (!cinemas.isEmpty()) s.getRoom().setCinema(cinemas.get(0));
                }
            }
        }
    }
}
