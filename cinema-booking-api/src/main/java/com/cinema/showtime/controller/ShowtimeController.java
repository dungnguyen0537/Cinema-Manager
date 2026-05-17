package com.cinema.showtime.controller;

import com.cinema.common.ApiResponse;
import com.cinema.showtime.dto.ShowtimeDto;
import com.cinema.showtime.service.ShowtimeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Showtimes", description = "Lịch chiếu phim")
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @GetMapping("/api/v1/showtimes")
    @Operation(summary = "Danh sách lịch chiếu (public)")
    public ResponseEntity<ApiResponse<List<ShowtimeDto>>> getShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long cinemaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(showtimeService.getShowtimes(movieId, cinemaId, date)));
    }

    @GetMapping("/api/v1/showtimes/{id}")
    @Operation(summary = "Chi tiết lịch chiếu (public)")
    public ResponseEntity<ApiResponse<ShowtimeDto>> getShowtime(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(showtimeService.getShowtime(id)));
    }

    @GetMapping("/api/v1/showtimes/{id}/seats")
    @Operation(summary = "Sơ đồ ghế theo suất chiếu (public)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSeatMap(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(showtimeService.getSeatMap(id)));
    }

    @PostMapping("/api/v1/admin/showtimes")
    @Operation(summary = "Tạo lịch chiếu (Admin)")
    public ResponseEntity<ApiResponse<ShowtimeDto>> createShowtime(@RequestBody com.cinema.showtime.dto.CreateShowtimeRequest request) {
        ShowtimeDto showtime = showtimeService.createShowtime(
                request.getMovieId(), 
                request.getRoomId(), 
                request.getStartTime(), 
                request.getBasePrice()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(showtime));
    }
}
