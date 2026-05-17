package com.cinema.common;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Base entity with audit fields.
 * All entities should extend this class.
 */
@Getter
@Setter
public abstract class BaseEntity {

    private Long id;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;
}
