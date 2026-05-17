package com.cinema.showtime.entity;

import com.cinema.common.BaseEntity;
import com.cinema.movie.entity.MovieEntity;
import com.cinema.room.entity.RoomEntity;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeEntity extends BaseEntity {

            private MovieEntity movie;

            private RoomEntity room;

        private LocalDateTime startTime;

        private LocalDateTime endTime;

        private BigDecimal basePrice;

        @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, CANCELLED, COMPLETED
}

