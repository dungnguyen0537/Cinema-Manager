package com.cinema.cinema.entity;

import com.cinema.common.BaseEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CinemaEntity extends BaseEntity {

        private String name;

        private String address;

        private String city;

        private String phone;

        @Builder.Default
    private String status = "ACTIVE";
}

