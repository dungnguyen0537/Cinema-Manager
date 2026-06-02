package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.booking.entity.BookingSeatEntity;
import com.cinema.config.AuditConfig;
import com.cinema.seat.entity.SeatEntity;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class BookingDaoImpl implements BookingDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final BookingRowMapper rowMapper = new BookingRowMapper();

    @Override
    public BookingEntity save(BookingEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("bookingCode", entity.getBookingCode());
        params.addValue("userId", entity.getUser() != null ? entity.getUser().getId() : null);
        params.addValue("showtimeId", entity.getShowtime() != null ? entity.getShowtime().getId() : null);
        params.addValue("totalAmount", entity.getTotalAmount());
        params.addValue("discountAmount", entity.getDiscountAmount());
        params.addValue("finalAmount", entity.getFinalAmount());
        params.addValue("status", entity.getStatus());
        params.addValue("holdExpiredAt", entity.getHoldExpiredAt());
        params.addValue("paymentStatus", entity.getPaymentStatus());
        params.addValue("promotionCode", entity.getPromotionCode());

        if (entity.getId() == null) {
            LocalDateTime now = LocalDateTime.now();
            params.addValue("createdAt", now);
            params.addValue("updatedAt", now);
            params.addValue("createdBy", AuditConfig.getCurrentAuditor());
            String sql = "INSERT INTO bookings (booking_code, user_id, showtime_id, total_amount, discount_amount, " +
                    "final_amount, status, hold_expired_at, payment_status, promotion_code, created_at, updated_at, created_by) " +
                    "VALUES (:bookingCode, :userId, :showtimeId, :totalAmount, :discountAmount, :finalAmount, :status, " +
                    ":holdExpiredAt, :paymentStatus, :promotionCode, :createdAt, :updatedAt, :createdBy)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
            entity.setCreatedAt(now);

            // Lưu booking_seats
            saveBookingSeats(entity);
        } else {
            params.addValue("id", entity.getId());
            params.addValue("updatedAt", LocalDateTime.now());
            String sql = "UPDATE bookings SET booking_code = :bookingCode, user_id = :userId, showtime_id = :showtimeId, " +
                    "total_amount = :totalAmount, discount_amount = :discountAmount, final_amount = :finalAmount, " +
                    "status = :status, hold_expired_at = :holdExpiredAt, payment_status = :paymentStatus, " +
                    "promotion_code = :promotionCode, updated_at = :updatedAt WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    private void saveBookingSeats(BookingEntity booking) {
        if (booking.getBookingSeats() == null || booking.getBookingSeats().isEmpty()) return;
        for (BookingSeatEntity bs : booking.getBookingSeats()) {
            MapSqlParameterSource p = new MapSqlParameterSource();
            p.addValue("bookingId", booking.getId());
            p.addValue("seatId", bs.getSeat() != null ? bs.getSeat().getId() : null);
            p.addValue("seatPrice", bs.getSeatPrice());
            String sql = "INSERT INTO booking_seats (booking_id, seat_id, seat_price) VALUES (:bookingId, :seatId, :seatPrice)";
            KeyHolder kh = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, p, kh, new String[]{"id"});
            bs.setId(kh.getKey().longValue());
        }
    }

    @Override
    public Optional<BookingEntity> findById(Long id) {
        String sql = "SELECT * FROM bookings WHERE id = :id";
        List<BookingEntity> results = jdbcTemplate.query(sql, new MapSqlParameterSource("id", id), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        BookingEntity b = results.get(0);
        populateAssociations(b);
        return Optional.of(b);
    }

    @Override
    public List<BookingEntity> findAll() {
        String sql = "SELECT * FROM bookings";
        List<BookingEntity> list = jdbcTemplate.query(sql, rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM booking_seats WHERE booking_id = :id", new MapSqlParameterSource("id", id));
        jdbcTemplate.update("DELETE FROM bookings WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public long count() {
        Long c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings", new MapSqlParameterSource(), Long.class);
        return c != null ? c : 0L;
    }

    @Override
    public Optional<BookingEntity> findByBookingCode(String bookingCode) {
        String sql = "SELECT * FROM bookings WHERE booking_code = :code";
        List<BookingEntity> list = jdbcTemplate.query(sql, new MapSqlParameterSource("code", bookingCode), rowMapper);
        if (list.isEmpty()) return Optional.empty();
        populateAssociations(list.get(0));
        return Optional.of(list.get(0));
    }

    @Override
    public Page<BookingEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable) {
        MapSqlParameterSource params = new MapSqlParameterSource("userId", userId);
        long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings WHERE user_id = :userId", params, Long.class);
        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());
        List<BookingEntity> list = jdbcTemplate.query(
                "SELECT * FROM bookings WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit OFFSET :offset",
                params, rowMapper);
        list.forEach(this::populateAssociations);
        return new PageImpl<>(list, pageable, total);
    }

    @Override
    public List<BookingEntity> findExpiredBookings(LocalDateTime now) {
        String sql = "SELECT * FROM bookings WHERE status IN ('HOLDING', 'PENDING_PAYMENT') AND hold_expired_at < :now";
        List<BookingEntity> list = jdbcTemplate.query(sql, new MapSqlParameterSource("now", now), rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    @Override
    public List<Long> findBookedSeatIds(Long showtimeId) {
        String sql = "SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON bs.booking_id = b.id " +
                "WHERE b.showtime_id = :showtimeId AND b.status IN ('HOLDING', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED')";
        return jdbcTemplate.queryForList(sql, new MapSqlParameterSource("showtimeId", showtimeId), Long.class);
    }

    @Override
    public List<BookingEntity> findConfirmedByShowtime(Long showtimeId) {
        String sql = "SELECT * FROM bookings WHERE showtime_id = :showtimeId AND status IN ('CONFIRMED', 'COMPLETED')";
        List<BookingEntity> list = jdbcTemplate.query(sql, new MapSqlParameterSource("showtimeId", showtimeId), rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }

    @Override
    public BigDecimal sumTotalRevenue() {
        return jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(final_amount), 0) FROM bookings WHERE status IN ('CONFIRMED', 'COMPLETED')",
                new MapSqlParameterSource(), BigDecimal.class);
    }

    @Override
    public BigDecimal sumRevenueBetween(LocalDateTime start, LocalDateTime end) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("start", start);
        p.addValue("end", end);
        return jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(final_amount), 0) FROM bookings WHERE status IN ('CONFIRMED', 'COMPLETED') AND created_at >= :start AND created_at <= :end",
                p, BigDecimal.class);
    }

    @Override
    public long countCompletedBetween(LocalDateTime start, LocalDateTime end) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("start", start);
        p.addValue("end", end);
        Long c = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bookings WHERE status IN ('CONFIRMED', 'COMPLETED') AND created_at >= :start AND created_at <= :end",
                p, Long.class);
        return c != null ? c : 0L;
    }

    @Override
    public Page<BookingEntity> findAllByOrderByCreatedAtDesc(Pageable pageable) {
        long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings", new MapSqlParameterSource(), Long.class);
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());
        List<BookingEntity> list = jdbcTemplate.query(
                "SELECT * FROM bookings ORDER BY created_at DESC LIMIT :limit OFFSET :offset",
                params, rowMapper);
        list.forEach(this::populateAssociations);
        return new PageImpl<>(list, pageable, total);
    }

    // === Populate nested entities for a booking ===
    private void populateAssociations(BookingEntity b) {
        // User
        if (b.getUser() != null && b.getUser().getId() != null) {
            List<UserEntity> users = jdbcTemplate.query("SELECT * FROM users WHERE id = :id",
                    new MapSqlParameterSource("id", b.getUser().getId()),
                    new com.cinema.user.repository.UserRowMapper());
            if (!users.isEmpty()) b.setUser(users.get(0));
        }
        // Showtime + Movie + Room + Cinema
        if (b.getShowtime() != null && b.getShowtime().getId() != null) {
            List<ShowtimeEntity> sts = jdbcTemplate.query("SELECT * FROM showtimes WHERE id = :id",
                    new MapSqlParameterSource("id", b.getShowtime().getId()),
                    new com.cinema.showtime.repository.ShowtimeRowMapper());
            if (!sts.isEmpty()) {
                ShowtimeEntity st = sts.get(0);
                // Movie
                if (st.getMovie() != null && st.getMovie().getId() != null) {
                    var movies = jdbcTemplate.query("SELECT * FROM movies WHERE id = :id",
                            new MapSqlParameterSource("id", st.getMovie().getId()),
                            new com.cinema.movie.repository.MovieRowMapper());
                    if (!movies.isEmpty()) st.setMovie(movies.get(0));
                }
                // Room + Cinema
                if (st.getRoom() != null && st.getRoom().getId() != null) {
                    var rooms = jdbcTemplate.query("SELECT * FROM rooms WHERE id = :id",
                            new MapSqlParameterSource("id", st.getRoom().getId()),
                            new com.cinema.room.repository.RoomRowMapper());
                    if (!rooms.isEmpty()) {
                        st.setRoom(rooms.get(0));
                        if (st.getRoom().getCinema() != null && st.getRoom().getCinema().getId() != null) {
                            var cinemas = jdbcTemplate.query("SELECT * FROM cinemas WHERE id = :id",
                                    new MapSqlParameterSource("id", st.getRoom().getCinema().getId()),
                                    new com.cinema.cinema.repository.CinemaRowMapper());
                            if (!cinemas.isEmpty()) st.getRoom().setCinema(cinemas.get(0));
                        }
                    }
                }
                b.setShowtime(st);
            }
        }
        // BookingSeats
        List<BookingSeatEntity> seats = jdbcTemplate.query(
                "SELECT * FROM booking_seats WHERE booking_id = :bookingId",
                new MapSqlParameterSource("bookingId", b.getId()),
                new BookingSeatRowMapper());
        for (BookingSeatEntity bs : seats) {
            bs.setBooking(b);
            if (bs.getSeat() != null && bs.getSeat().getId() != null) {
                var seatList = jdbcTemplate.query("SELECT * FROM seats WHERE id = :id",
                        new MapSqlParameterSource("id", bs.getSeat().getId()),
                        new com.cinema.seat.repository.SeatRowMapper());
                if (!seatList.isEmpty()) {
                    SeatEntity seat = seatList.get(0);
                    // Populate Room for seat (needed by BookingService validation)
                    if (seat.getRoom() != null && seat.getRoom().getId() != null) {
                        var rooms = jdbcTemplate.query("SELECT * FROM rooms WHERE id = :id",
                                new MapSqlParameterSource("id", seat.getRoom().getId()),
                                new com.cinema.room.repository.RoomRowMapper());
                        if (!rooms.isEmpty()) seat.setRoom(rooms.get(0));
                    }
                    bs.setSeat(seat);
                }
            }
        }
        b.setBookingSeats(seats);
    }

    @Override
    public List<java.util.Map<String, Object>> getDailyRevenueBetween(LocalDateTime start, LocalDateTime end) {
        String sql = "SELECT DATE_TRUNC('day', created_at) as booking_date, COALESCE(SUM(final_amount), 0) as revenue, COUNT(*) as booking_count " +
                "FROM bookings " +
                "WHERE status IN ('CONFIRMED', 'COMPLETED') AND created_at >= :start AND created_at <= :end " +
                "GROUP BY DATE_TRUNC('day', created_at) " +
                "ORDER BY booking_date ASC";
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("start", start);
        p.addValue("end", end);
        return jdbcTemplate.query(sql, p, (rs, rowNum) -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("date", rs.getTimestamp("booking_date").toLocalDateTime().toLocalDate().toString());
            map.put("revenue", rs.getBigDecimal("revenue"));
            map.put("count", rs.getLong("booking_count"));
            return map;
        });
    }

    @Override
    public List<java.util.Map<String, Object>> getMonthlyRevenue() {
        String sql = "SELECT DATE_TRUNC('month', created_at) as booking_month, COALESCE(SUM(final_amount), 0) as revenue, COUNT(*) as booking_count " +
                "FROM bookings " +
                "WHERE status IN ('CONFIRMED', 'COMPLETED') " +
                "GROUP BY DATE_TRUNC('month', created_at) " +
                "ORDER BY booking_month DESC";
        return jdbcTemplate.query(sql, new MapSqlParameterSource(), (rs, rowNum) -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            java.time.LocalDate date = rs.getTimestamp("booking_month").toLocalDateTime().toLocalDate();
            String formattedMonth = String.format("Tháng %02d/%d", date.getMonthValue(), date.getYear());
            map.put("month", formattedMonth);
            map.put("revenue", rs.getBigDecimal("revenue"));
            map.put("count", rs.getLong("booking_count"));
            return map;
        });
    }

    @Override
    public List<BookingEntity> findBookingsBetween(LocalDateTime start, LocalDateTime end) {
        String sql = "SELECT * FROM bookings " +
                "WHERE status IN ('CONFIRMED', 'COMPLETED') AND created_at >= :start AND created_at <= :end " +
                "ORDER BY created_at DESC";
        MapSqlParameterSource p = new MapSqlParameterSource();
        p.addValue("start", start);
        p.addValue("end", end);
        List<BookingEntity> list = jdbcTemplate.query(sql, p, rowMapper);
        list.forEach(this::populateAssociations);
        return list;
    }
}
