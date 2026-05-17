package com.cinema.promotion.entity;

import com.cinema.common.BaseEntity;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionEntity extends BaseEntity {

        private String code;

        private String description;

        private String discountType; // PERCENTAGE, FIXED_AMOUNT

        private BigDecimal discountValue;

        @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

        private BigDecimal maxDiscountAmount;

        private LocalDateTime startTime;

        private LocalDateTime endTime;

        private Integer usageLimit;

        @Builder.Default
    private Integer usedCount = 0;

        @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, EXPIRED

        private String applicableMovieIds; // comma-separated movie IDs, null = all movies
}

