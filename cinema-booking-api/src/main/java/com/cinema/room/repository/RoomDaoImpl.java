package com.cinema.room.repository;

import com.cinema.room.entity.RoomEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RoomDaoImpl implements RoomDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final RoomRowMapper rowMapper = new RoomRowMapper();

    @Override
    public RoomEntity save(RoomEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("cinemaId", entity.getCinema() != null ? entity.getCinema().getId() : null);
        params.addValue("name", entity.getName());
        params.addValue("type", entity.getType());
        params.addValue("capacity", entity.getCapacity());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO rooms (cinema_id, name, type, capacity, status) VALUES (:cinemaId, :name, :type, :capacity, :status)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE rooms SET cinema_id = :cinemaId, name = :name, type = :type, capacity = :capacity, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<RoomEntity> findById(Long id) {
        List<RoomEntity> results = jdbcTemplate.query("SELECT * FROM rooms WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        populateCinema(results.get(0));
        return Optional.of(results.get(0));
    }

    @Override
    public List<RoomEntity> findAll() {
        List<RoomEntity> list = jdbcTemplate.query("SELECT * FROM rooms", rowMapper);
        list.forEach(this::populateCinema);
        return list;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM rooms WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public List<RoomEntity> findByCinemaIdAndStatus(Long cinemaId, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("cinemaId", cinemaId);
        params.addValue("status", status);
        List<RoomEntity> list = jdbcTemplate.query("SELECT * FROM rooms WHERE cinema_id = :cinemaId AND status = :status", params, rowMapper);
        list.forEach(this::populateCinema);
        return list;
    }

    @Override
    public List<RoomEntity> findByCinemaId(Long cinemaId) {
        List<RoomEntity> list = jdbcTemplate.query("SELECT * FROM rooms WHERE cinema_id = :cinemaId",
                new MapSqlParameterSource("cinemaId", cinemaId), rowMapper);
        list.forEach(this::populateCinema);
        return list;
    }

    private void populateCinema(RoomEntity room) {
        if (room.getCinema() != null && room.getCinema().getId() != null) {
            var cinemas = jdbcTemplate.query("SELECT * FROM cinemas WHERE id = :id",
                    new MapSqlParameterSource("id", room.getCinema().getId()),
                    new com.cinema.cinema.repository.CinemaRowMapper());
            if (!cinemas.isEmpty()) room.setCinema(cinemas.get(0));
        }
    }
}
