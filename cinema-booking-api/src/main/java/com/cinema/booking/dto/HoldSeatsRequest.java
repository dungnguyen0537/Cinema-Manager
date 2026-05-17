package com.cinema.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class HoldSeatsRequest {

    @NotNull(message = "Mã suất chiếu không được để trống")
    private Long showtimeId;

    @NotEmpty(message = "Vui lòng chọn ít nhất một ghế")
    private List<Long> seatIds;
}
