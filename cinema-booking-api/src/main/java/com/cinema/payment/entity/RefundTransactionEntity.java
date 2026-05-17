package com.cinema.payment.entity;

import com.cinema.common.BaseEntity;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundTransactionEntity extends BaseEntity {

        private Long bookingId;

        private Long paymentId;

        private BigDecimal amount;

        private String reason;

        @Builder.Default
    private String status = "PENDING";
}

