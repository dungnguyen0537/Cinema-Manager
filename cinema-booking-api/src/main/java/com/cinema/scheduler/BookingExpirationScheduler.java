package com.cinema.scheduler;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.booking.repository.BookingDao;
import com.cinema.common.Constants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * TÃ¡c vá»¥ Ä‘á»‹nh ká»³ há»§y cÃ¡c booking Ä‘Ã£ quÃ¡ thá»i háº¡n giá»¯ gháº¿.
 * Cháº¡y má»—i 60 giÃ¢y.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpirationScheduler {

    private final BookingDao bookingDao;
    private final StringRedisTemplate redisTemplate;

    @Scheduled(fixedRate = 300000) // Every 5 minutes (increased from 60s to give user more time)
    @Transactional
    public void expireBookings() {
        List<BookingEntity> expiredBookings = bookingDao.findExpiredBookings(LocalDateTime.now());

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("Found {} expired bookings to process", expiredBookings.size());

        for (BookingEntity booking : expiredBookings) {
            try {
                // Cáº­p nháº­t tráº¡ng thÃ¡i booking
                booking.setStatus("EXPIRED");
                bookingDao.save(booking);

                // Giáº£i phÃ³ng gháº¿ khá»i Redis
                Long showtimeId = booking.getShowtime().getId();
                booking.getBookingSeats().forEach(bs -> {
                    String redisKey = Constants.REDIS_SEAT_HOLD_PREFIX + showtimeId + ":" + bs.getSeat().getId();
                    redisTemplate.delete(redisKey);
                });

                log.info("Booking expired: {} (was {})", booking.getBookingCode(), booking.getStatus());
            } catch (Exception e) {
                log.error("Failed to expire booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }
    }
}

