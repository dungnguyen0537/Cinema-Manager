package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingSeatEntity;
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
public class BookingSeatDaoImpl implements BookingSeatDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final BookingSeatRowMapper rowMapper = new BookingSeatRowMapper();

    @Override
    public BookingSeatEntity save(BookingSeatEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("bookingId", entity.getBooking() != null ? entity.getBooking().getId() : null);
        params.addValue("seatId", entity.getSeat() != null ? entity.getSeat().getId() : null);
        params.addValue("seatPrice", entity.getSeatPrice());

        if (entity.getId() == null) {
            String sql = "INSERT INTO booking_seats (booking_id, seat_id, seat_price) VALUES (:bookingId, :seatId, :seatPrice)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE booking_seats SET booking_id = :bookingId, seat_id = :seatId, seat_price = :seatPrice WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<BookingSeatEntity> findById(Long id) {
        List<BookingSeatEntity> results = jdbcTemplate.query("SELECT * FROM booking_seats WHERE id = :id",
                new MapSqlParameterSource("id", id), rowMapper);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<BookingSeatEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM booking_seats", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM booking_seats WHERE id = :id", new MapSqlParameterSource("id", id));
    }
}
