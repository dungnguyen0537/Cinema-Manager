package com.cinema.showtime.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateShowtimeRequest {
    private Long movieId;
    private Long roomId;
    private LocalDateTime startTime;
    private BigDecimal basePrice;
}
