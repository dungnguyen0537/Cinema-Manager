package com.cinema.ticket.repository;

import com.cinema.ticket.entity.TicketEntity;
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
public class TicketDaoImpl implements TicketDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TicketRowMapper rowMapper = new TicketRowMapper();

    @Override
    public TicketEntity save(TicketEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("bookingId", entity.getBooking() != null ? entity.getBooking().getId() : null);
        params.addValue("ticketCode", entity.getTicketCode());
        params.addValue("qrCode", entity.getQrCode());
        params.addValue("issuedAt", entity.getIssuedAt());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            LocalDateTime now = LocalDateTime.now();
            params.addValue("createdAt", now);
            String sql = "INSERT INTO tickets (booking_id, ticket_code, qr_code, issued_at, status, created_at) " +
                    "VALUES (:bookingId, :ticketCode, :qrCode, :issuedAt, :status, :createdAt)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE tickets SET booking_id = :bookingId, ticket_code = :ticketCode, qr_code = :qrCode, " +
                    "issued_at = :issuedAt, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<TicketEntity> findById(Long id) {
        List<TicketEntity> list = jdbcTemplate.query("SELECT * FROM tickets WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<TicketEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM tickets", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM tickets WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public Optional<TicketEntity> findByTicketCode(String ticketCode) {
        List<TicketEntity> list = jdbcTemplate.query("SELECT * FROM tickets WHERE ticket_code = :code",
                new MapSqlParameterSource("code", ticketCode), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<TicketEntity> findByBookingId(Long bookingId) {
        return jdbcTemplate.query("SELECT * FROM tickets WHERE booking_id = :bookingId",
                new MapSqlParameterSource("bookingId", bookingId), rowMapper);
    }

    @Override
    public List<TicketEntity> findByBookingUserIdOrderByIssuedAtDesc(Long userId) {
        return jdbcTemplate.query(
                "SELECT t.* FROM tickets t JOIN bookings b ON t.booking_id = b.id WHERE b.user_id = :userId ORDER BY t.issued_at DESC",
                new MapSqlParameterSource("userId", userId), rowMapper);
    }
}
