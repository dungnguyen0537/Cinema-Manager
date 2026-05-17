package com.cinema.seat.entity;

import com.cinema.common.BaseEntity;
import com.cinema.room.entity.RoomEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatEntity extends BaseEntity {

            private RoomEntity room;

        private String rowName; // A, B, C...

        private Integer seatNumber; // 1, 2, 3...

        @Builder.Default
    private String seatType = "STANDARD"; // STANDARD, VIP, COUPLE, PREMIUM

        @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, MAINTENANCE, DISABLED
}

