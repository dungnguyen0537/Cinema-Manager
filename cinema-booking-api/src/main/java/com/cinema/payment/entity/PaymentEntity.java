package com.cinema.payment.entity;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.common.BaseEntity;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntity extends BaseEntity {

            private BookingEntity booking;

        private String paymentCode;

        @Builder.Default
    private String provider = "MBBANK";

        private String bankTransactionId;


        private BigDecimal amount;

    /**
     * PENDING -> SUCCESS -> FAILED / REFUNDED / PARTIALLY_REFUNDED
     */
        @Builder.Default
    private String status = "PENDING";

        private String requestPayload;

        private String responsePayload;

        private LocalDateTime paidAt;

        private String qrContent;
}

