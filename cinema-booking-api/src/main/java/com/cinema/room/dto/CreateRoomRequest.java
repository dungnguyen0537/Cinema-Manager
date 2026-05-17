package com.cinema.room.dto;

import lombok.Data;

@Data
public class CreateRoomRequest {
    private String name;
    private String type; // STANDARD_2D, IMAX, etc.
    private int rowCount; // e.g. 10
    private int colCount; // e.g. 12
}
