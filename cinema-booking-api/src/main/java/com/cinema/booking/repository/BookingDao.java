package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingDao {
    BookingEntity save(BookingEntity entity);
    Optional<BookingEntity> findById(Long id);
    List<BookingEntity> findAll();
    void deleteById(Long id);
    long count();
    Optional<BookingEntity> findByBookingCode(String bookingCode);
    Page<BookingEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<BookingEntity> findExpiredBookings(LocalDateTime now);
    List<Long> findBookedSeatIds(Long showtimeId);
    List<BookingEntity> findConfirmedByShowtime(Long showtimeId);
    BigDecimal sumTotalRevenue();
    BigDecimal sumRevenueBetween(LocalDateTime start, LocalDateTime end);
    long countCompletedBetween(LocalDateTime start, LocalDateTime end);
    Page<BookingEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<java.util.Map<String, Object>> getDailyRevenueBetween(LocalDateTime start, LocalDateTime end);
    List<java.util.Map<String, Object>> getMonthlyRevenue();
    List<BookingEntity> findBookingsBetween(LocalDateTime start, LocalDateTime end);
    Optional<BookingEntity> findPendingByUserId(Long userId);
    Optional<BookingEntity> findByPaymentToken(String token);
}
