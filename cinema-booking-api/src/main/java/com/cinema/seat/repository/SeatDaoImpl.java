package com.cinema.seat.repository;

import com.cinema.seat.entity.SeatEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class SeatDaoImpl implements SeatDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final SeatRowMapper rowMapper = new SeatRowMapper();

    @Override
    public SeatEntity save(SeatEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("roomId", entity.getRoom() != null ? entity.getRoom().getId() : null);
        params.addValue("rowName", entity.getRowName());
        params.addValue("seatNumber", entity.getSeatNumber());
        params.addValue("seatType", entity.getSeatType());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO seats (room_id, row_name, seat_number, seat_type, status) VALUES (:roomId, :rowName, :seatNumber, :seatType, :status)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE seats SET room_id = :roomId, row_name = :rowName, seat_number = :seatNumber, seat_type = :seatType, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<SeatEntity> findById(Long id) {
        List<SeatEntity> results = jdbcTemplate.query("SELECT * FROM seats WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<SeatEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM seats", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM seats WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public List<SeatEntity> findByRoomIdAndStatus(Long roomId, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("roomId", roomId);
        params.addValue("status", status);
        return jdbcTemplate.query("SELECT * FROM seats WHERE room_id = :roomId AND status = :status", params, rowMapper);
    }

    @Override
    public List<SeatEntity> findByRoomId(Long roomId) {
        return jdbcTemplate.query("SELECT * FROM seats WHERE room_id = :roomId", new MapSqlParameterSource("roomId", roomId), rowMapper);
    }

    @Override
    public List<SeatEntity> findByIdIn(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        return jdbcTemplate.query("SELECT * FROM seats WHERE id IN (:ids)", new MapSqlParameterSource("ids", ids), rowMapper);
    }

    @Override
    public List<SeatEntity> saveAll(List<SeatEntity> entities) {
        List<SeatEntity> result = new ArrayList<>();
        for (SeatEntity entity : entities) {
            result.add(save(entity));
        }
        return result;
    }
}
