package com.cinema.booking.entity;

import com.cinema.seat.entity.SeatEntity;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingSeatEntity {

    private Long id;

    private BookingEntity booking;

    private SeatEntity seat;

    private BigDecimal seatPrice;
}
