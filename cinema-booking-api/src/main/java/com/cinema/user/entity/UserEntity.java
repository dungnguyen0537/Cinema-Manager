package com.cinema.user.entity;

import com.cinema.common.BaseEntity;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends BaseEntity {

        private String fullName;

        private String email;

        private String phone;

        @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;

        @Builder.Default
    private String status = "ACTIVE";

            @Builder.Default
    private Set<RoleEntity> roles = new HashSet<>();
}

