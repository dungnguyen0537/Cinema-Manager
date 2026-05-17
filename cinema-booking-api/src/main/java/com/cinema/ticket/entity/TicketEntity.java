package com.cinema.ticket.entity;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.common.BaseEntity;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketEntity extends BaseEntity {

            private BookingEntity booking;

        private String ticketCode;

        private String qrCode; // Base64 QR image or QR data string

        private LocalDateTime issuedAt;

    /**
     * ISSUED -> USED -> CANCELLED / EXPIRED
     */
        @Builder.Default
    private String status = "ISSUED";
}

