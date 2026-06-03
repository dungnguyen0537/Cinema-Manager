package com.cinema.booking.entity;


import com.cinema.common.BaseEntity;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.user.entity.UserEntity;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntity extends BaseEntity {

        private String bookingCode;
        private String paymentToken;

            private UserEntity user;

            private ShowtimeEntity showtime;

        private BigDecimal totalAmount;

        @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

        private BigDecimal finalAmount;

    /**
     * HOLDING -> PENDING_PAYMENT -> CONFIRMED -> COMPLETED -> CANCELLED / EXPIRED
     */
        @Builder.Default
    private String status = "HOLDING";

        private LocalDateTime holdExpiredAt;

        @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, SUCCESS, FAILED, REFUNDED

        private String promotionCode;

        @Builder.Default
    private List<BookingSeatEntity> bookingSeats = new ArrayList<>();

    public void addBookingSeat(BookingSeatEntity bookingSeat) {
        bookingSeats.add(bookingSeat);
        bookingSeat.setBooking(this);
    }
}

