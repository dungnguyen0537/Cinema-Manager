package com.cinema.booking.dto;

import lombok.Data;

@Data
public class CreateBookingRequest {
    private Long bookingId;
    private String promotionCode;
}
