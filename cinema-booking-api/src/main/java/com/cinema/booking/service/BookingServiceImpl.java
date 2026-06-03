package com.cinema.booking.service;

import com.cinema.booking.dto.*;
import com.cinema.booking.entity.BookingEntity;
import com.cinema.booking.entity.BookingSeatEntity;
import com.cinema.booking.repository.BookingDao;
import com.cinema.common.Constants;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.payment.service.MbbankService;
import com.cinema.promotion.entity.PromotionEntity;
import com.cinema.promotion.repository.PromotionDao;
import com.cinema.seat.entity.SeatEntity;
import com.cinema.seat.repository.SeatDao;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.showtime.repository.ShowtimeDao;
import com.cinema.user.entity.UserEntity;
import com.cinema.user.repository.UserDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingDao bookingDao;
    private final ShowtimeDao showtimeDao;
    private final SeatDao seatDao;
    private final UserDao userDao;
    private final PromotionDao promotionDao;
    private final StringRedisTemplate redisTemplate;
    private final MbbankService mbbankService;

    @Value("${app.booking.hold-duration-minutes:10}")
    private int holdDurationMinutes;

    /**
     * BÆ°á»›c 1: Giá»¯ gháº¿ táº¡m thá»i báº±ng Redis lock.
     * Táº¡o booking vá»›i tráº¡ng thÃ¡i HOLDING.
     */
    @Transactional
    public BookingDto holdSeats(Long userId, HoldSeatsRequest request) {
        // Kiá»ƒm tra suáº¥t chiáº¿u
        ShowtimeEntity showtime = showtimeDao.findById(request.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHOWTIME_NOT_FOUND));

        if (!"ACTIVE".equals(showtime.getStatus())) {
            throw new BusinessException(ErrorCode.SHOWTIME_NOT_FOUND, "Showtime is not active");
        }
        if (showtime.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.SHOWTIME_PAST);
        }

        // Kiá»ƒm tra sá»‘ gháº¿ tá»‘i Ä‘a (tá»‘i Ä‘a 8 gháº¿ má»—i Ä‘Æ¡n)
        if (request.getSeatIds().size() > 8) {
            throw new BusinessException(ErrorCode.BOOKING_MAX_SEATS_EXCEEDED);
        }

        // Kiá»ƒm tra gháº¿ tá»“n táº¡i vÃ  thuá»™c phÃ²ng chiáº¿u
        List<SeatEntity> seats = seatDao.findByIdIn(request.getSeatIds());
        if (seats.size() != request.getSeatIds().size()) {
            throw new BusinessException(ErrorCode.SEAT_NOT_FOUND);
        }
        for (SeatEntity seat : seats) {
            if (!seat.getRoom().getId().equals(showtime.getRoom().getId())) {
                throw new BusinessException(ErrorCode.SEAT_NOT_FOUND, "Seat does not belong to showtime room");
            }
        }

        // Thá»­ giá»¯ tá»«ng gháº¿ trong Redis (thao tÃ¡c atomic)
        List<Long> heldSeatIds = new ArrayList<>();
        try {
            for (Long seatId : request.getSeatIds()) {
                String redisKey = Constants.REDIS_SEAT_HOLD_PREFIX + request.getShowtimeId() + ":" + seatId;
                try {
                    Boolean acquired = redisTemplate.opsForValue()
                            .setIfAbsent(redisKey, userId.toString(), holdDurationMinutes, TimeUnit.MINUTES);
                    if (Boolean.FALSE.equals(acquired)) {
                        // Kiểm tra nếu ghế do chính user này giữ → cho phép re-hold
                        String holder = redisTemplate.opsForValue().get(redisKey);
                        if (userId.toString().equals(holder)) {
                            // Cùng user → gia hạn thời gian giữ ghế
                            redisTemplate.expire(redisKey, holdDurationMinutes, TimeUnit.MINUTES);
                            heldSeatIds.add(seatId);
                            continue;
                        }
                        throw new BusinessException(ErrorCode.BOOKING_SEATS_UNAVAILABLE,
                                "Ghế " + seatId + " đang được người khác giữ");
                    }
                    heldSeatIds.add(seatId);
                } catch (Exception e) {
                    if (e instanceof BusinessException) throw (BusinessException) e;
                    log.warn("Redis đang lỗi, bỏ qua atomic lock cho ghế {}", seatId);
                    heldSeatIds.add(seatId);
                }
            }
        } catch (BusinessException e) {
            // Rollback: release already-held seats
            for (Long seatId : heldSeatIds) {
                try {
                    String redisKey = Constants.REDIS_SEAT_HOLD_PREFIX + request.getShowtimeId() + ":" + seatId;
                    redisTemplate.delete(redisKey);
                } catch (Exception ignored) {}
            }
            throw e;
        }

        // Kiá»ƒm tra thÃªm trong DB cÃ¡c gháº¿ Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t
        List<Long> bookedSeatIds = bookingDao.findBookedSeatIds(request.getShowtimeId());
        for (Long seatId : request.getSeatIds()) {
            if (bookedSeatIds.contains(seatId)) {
                // Rollback Redis holds
                for (Long heldId : heldSeatIds) {
                    try {
                        String redisKey = Constants.REDIS_SEAT_HOLD_PREFIX + request.getShowtimeId() + ":" + heldId;
                        redisTemplate.delete(redisKey);
                    } catch (Exception ignored) {}
                }
                throw new BusinessException(ErrorCode.BOOKING_SEATS_UNAVAILABLE, "Gháº¿ Ä‘Ã£ Ä‘Æ°á»£c ngÆ°á»i khÃ¡c Ä‘áº·t. Vui lÃ²ng chá»n gháº¿ khÃ¡c.");
            }
        }

        // Táº¡o entity booking
        UserEntity user = userDao.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        LocalDateTime holdExpiry = LocalDateTime.now().plusMinutes(holdDurationMinutes);
        String bookingCode = generateBookingCode();

        BookingEntity booking = BookingEntity.builder()
                .bookingCode(bookingCode)
                .paymentToken(UUID.randomUUID().toString())
                .user(user)
                .showtime(showtime)
                .status("HOLDING")
                .holdExpiredAt(holdExpiry)
                .build();

        // TÃ­nh giÃ¡ vÃ  thÃªm gháº¿
        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<Long, SeatEntity> seatMap = seats.stream().collect(Collectors.toMap(SeatEntity::getId, s -> s));

        for (Long seatId : request.getSeatIds()) {
            SeatEntity seat = seatMap.get(seatId);
            BigDecimal seatPrice = calculateSeatPrice(showtime.getBasePrice(), seat.getSeatType());

            BookingSeatEntity bookingSeat = BookingSeatEntity.builder()
                    .seat(seat)
                    .seatPrice(seatPrice)
                    .build();
            booking.addBookingSeat(bookingSeat);
            totalAmount = totalAmount.add(seatPrice);
        }

        booking.setTotalAmount(totalAmount);
        booking.setFinalAmount(totalAmount);
        booking = bookingDao.save(booking);

        log.info("Seats held for booking {} (user={}, showtime={}, seats={})",
                bookingCode, userId, request.getShowtimeId(), request.getSeatIds());

        return toDto(booking);
    }

    /**
     * BÆ°á»›c 2: XÃ¡c nháº­n booking vÃ  Ã¡p dá»¥ng khuyáº¿n mÃ£i.
     * Chuyá»ƒn tráº¡ng thÃ¡i tá»« HOLDING sang PENDING_PAYMENT.
     */
    @Transactional
    public BookingDto createBooking(Long userId, CreateBookingRequest request) {
        BookingEntity booking = bookingDao.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // Kiá»ƒm tra quyá»n sá»Ÿ há»¯u
        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AUTH_ACCESS_DENIED);
        }

        // Kiá»ƒm tra tráº¡ng thÃ¡i
        if (!"HOLDING".equals(booking.getStatus())) {
            throw new BusinessException(ErrorCode.BOOKING_INVALID_STATUS);
        }

        // Kiá»ƒm tra thá»i háº¡n giá»¯ gháº¿
        if (booking.getHoldExpiredAt().isBefore(LocalDateTime.now())) {
            booking.setStatus("EXPIRED");
            bookingDao.save(booking);
            releaseSeatsFromRedis(booking);
            throw new BusinessException(ErrorCode.BOOKING_HOLD_EXPIRED);
        }

        // Ãp dá»¥ng khuyáº¿n mÃ£i náº¿u cÃ³
        if (request.getPromotionCode() != null && !request.getPromotionCode().isBlank()) {
            applyPromotion(booking, request.getPromotionCode());
        }

        // Cáº­p nháº­t tráº¡ng thÃ¡i sang CHá»œ THANH TOÃN
        booking.setStatus("PENDING_PAYMENT");
        // Gia háº¡n giá»¯ gháº¿ cho phÃ©p thanh toÃ¡n (30 phÃºt Ä‘á»ƒ chuyá»ƒn khoáº£n)
        booking.setHoldExpiredAt(LocalDateTime.now().plusMinutes(30));
        booking = bookingDao.save(booking);

        log.info("Booking confirmed for payment: {} (amount={})", booking.getBookingCode(), booking.getFinalAmount());

        return toDto(booking);
    }

    /**
     * Há»§y booking vÃ  giáº£i phÃ³ng gháº¿.
     */
    @Transactional
    public void cancelBooking(Long userId, Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AUTH_ACCESS_DENIED);
        }

        if ("CONFIRMED".equals(booking.getStatus()) || "COMPLETED".equals(booking.getStatus())) {
            throw new BusinessException(ErrorCode.BOOKING_CANNOT_CANCEL);
        }

        booking.setStatus("CANCELLED");
        bookingDao.save(booking);
        releaseSeatsFromRedis(booking);

        log.info("Booking cancelled: {}", booking.getBookingCode());
    }

    @Transactional(readOnly = true)
    public BookingDto getBooking(Long userId, Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AUTH_ACCESS_DENIED);
        }

        return toDto(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getUserBookings(Long userId, int page, int size) {
        Page<BookingEntity> bookings = bookingDao.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        return bookings.getContent().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Admin: Get all bookings across all users.
     */
    @Transactional(readOnly = true)
    public List<BookingDto> getAllBookings(int page, int size) {
        Page<BookingEntity> bookings = bookingDao.findAllByOrderByCreatedAtDesc(
                PageRequest.of(page, size));
        return bookings.getContent().stream().map(this::toDto).collect(Collectors.toList());
    }

    /**
     * Admin: Get booking by ID without user ownership check.
     */
    @Transactional(readOnly = true)
    public BookingDto getBookingAdmin(Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));
        return toDto(booking);
    }

    /**
     * ÄÆ°á»£c gá»i tá»« PaymentService sau khi thanh toÃ¡n thÃ nh cÃ´ng.
     */
    @Transactional
    public void confirmPayment(Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        booking.setStatus("CONFIRMED");
        booking.setPaymentStatus("SUCCESS");
        bookingDao.save(booking);

        // Giáº£i phÃ³ng lock Redis (gháº¿ Ä‘Ã£ Ä‘Æ°á»£c Ä‘áº·t cá»‘ Ä‘á»‹nh trong DB)
        releaseSeatsFromRedis(booking);

        log.info("Booking payment confirmed: {}", booking.getBookingCode());
    }

    // === CÃ¡c phÆ°Æ¡ng thá»©c há»— trá»£ ===

    private BigDecimal calculateSeatPrice(BigDecimal basePrice, String seatType) {
        return switch (seatType) {
            case "VIP" -> basePrice.multiply(BigDecimal.valueOf(1.5)).setScale(0, RoundingMode.UP);
            case "COUPLE" -> basePrice.multiply(BigDecimal.valueOf(2.0)).setScale(0, RoundingMode.UP);
            case "PREMIUM" -> basePrice.multiply(BigDecimal.valueOf(1.8)).setScale(0, RoundingMode.UP);
            default -> basePrice; // STANDARD
        };
    }

    private void applyPromotion(BookingEntity booking, String code) {
        PromotionEntity promo = promotionDao.findByCodeAndStatus(code, "ACTIVE")
                .orElseThrow(() -> new BusinessException(ErrorCode.PROMOTION_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promo.getStartTime()) || now.isAfter(promo.getEndTime())) {
            throw new BusinessException(ErrorCode.PROMOTION_EXPIRED);
        }
        if (promo.getUsageLimit() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new BusinessException(ErrorCode.PROMOTION_USAGE_LIMIT);
        }
        if (booking.getTotalAmount().compareTo(promo.getMinOrderValue()) < 0) {
            throw new BusinessException(ErrorCode.PROMOTION_MIN_ORDER);
        }

        BigDecimal discount;
        if ("PERCENTAGE".equals(promo.getDiscountType())) {
            discount = booking.getTotalAmount()
                    .multiply(promo.getDiscountValue()).divide(BigDecimal.valueOf(100), 0, RoundingMode.UP);
            if (promo.getMaxDiscountAmount() != null && discount.compareTo(promo.getMaxDiscountAmount()) > 0) {
                discount = promo.getMaxDiscountAmount();
            }
        } else {
            discount = promo.getDiscountValue();
        }

        booking.setDiscountAmount(discount);
        booking.setFinalAmount(booking.getTotalAmount().subtract(discount));
        booking.setPromotionCode(code);

        promo.setUsedCount(promo.getUsedCount() + 1);
        promotionDao.save(promo);
    }

    private void releaseSeatsFromRedis(BookingEntity booking) {
        Long showtimeId = booking.getShowtime().getId();
        try {
            for (BookingSeatEntity bs : booking.getBookingSeats()) {
                String redisKey = Constants.REDIS_SEAT_HOLD_PREFIX + showtimeId + ":" + bs.getSeat().getId();
                redisTemplate.delete(redisKey);
            }
        } catch (Exception e) {
            log.warn("KhÃ´ng thá»ƒ xÃ³a Redis key cho booking {} vÃ¬ lá»—i: {}", booking.getBookingCode(), e.getMessage());
        }
    }

    private String generateBookingCode() {
        // Táº¡o mÃ£ booking ngáº«u nhiÃªn 8 chá»¯ sá»‘
        Random random = new Random();
        int number = 10000000 + random.nextInt(90000000);
        return String.valueOf(number);
    }

    BookingDto toDto(BookingEntity booking) {
        BookingDto dto = BookingDto.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .paymentToken(booking.getPaymentToken())
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .totalAmount(booking.getTotalAmount())
                .discountAmount(booking.getDiscountAmount())
                .finalAmount(booking.getFinalAmount())
                .holdExpiredAt(booking.getHoldExpiredAt())
                .createdAt(booking.getCreatedAt())
                .build();

        // Enrich with user info
        if (booking.getUser() != null) {
            dto.setUserFullName(booking.getUser().getFullName());
            dto.setUserEmail(booking.getUser().getEmail());
        }

        // Bá»• sung thÃ´ng tin suáº¥t chiáº¿u
        ShowtimeEntity showtime = booking.getShowtime();
        if (showtime != null) {
            dto.setMovieTitle(showtime.getMovie().getTitle());
            dto.setCinemaName(showtime.getRoom().getCinema().getName());
            dto.setRoomName(showtime.getRoom().getName());
            dto.setShowtimeStart(showtime.getStartTime());
        }

        // ThÃ´ng tin gháº¿
        dto.setSeats(booking.getBookingSeats().stream().map(bs -> BookingDto.SeatInfo.builder()
                .seatId(bs.getSeat().getId())
                .rowName(bs.getSeat().getRowName())
                .seatNumber(bs.getSeat().getSeatNumber())
                .seatType(bs.getSeat().getSeatType())
                .price(bs.getSeatPrice())
                .build()).collect(Collectors.toList()));

        // URL mÃ£ QR thanh toÃ¡n (VietQR)
        if ("PENDING_PAYMENT".equals(booking.getStatus()) && booking.getFinalAmount() != null) {
            dto.setPaymentQrUrl(mbbankService.generateQrUrl(booking.getFinalAmount(), booking.getBookingCode()));
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public BookingDto getPendingBooking(Long userId) {
        Optional<BookingEntity> pending = bookingDao.findPendingByUserId(userId);
        return pending.map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public BookingDto getBookingByToken(Long userId, String token) {
        BookingEntity booking = bookingDao.findByPaymentToken(token)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));
        if (!booking.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AUTH_ACCESS_DENIED);
        }
        return toDto(booking);
    }
}

