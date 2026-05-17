package com.cinema.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {
    private Long id;
    private String bookingCode;
    private String status;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private LocalDateTime holdExpiredAt;
    private LocalDateTime createdAt;

    // User info
    private String userFullName;
    private String userEmail;

    // Showtime info
    private String movieTitle;
    private String cinemaName;
    private String roomName;
    private LocalDateTime showtimeStart;

    // Seats
    private List<SeatInfo> seats;

    // Payment QR
    private String paymentQrUrl;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatInfo {
        private Long seatId;
        private String rowName;
        private Integer seatNumber;
        private String seatType;
        private BigDecimal price;
    }
}
