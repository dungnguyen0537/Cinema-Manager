package com.cinema.room.entity;

import com.cinema.cinema.entity.CinemaEntity;
import com.cinema.common.BaseEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomEntity extends BaseEntity {

            private CinemaEntity cinema;

        private String name;

        @Builder.Default
    private String type = "STANDARD_2D"; // STANDARD_2D, STANDARD_3D, IMAX, VIP_4DX

        private Integer capacity;

        @Builder.Default
    private String status = "ACTIVE";
}

