package com.cinema.booking.controller;

import com.cinema.booking.dto.BookingDto;
import com.cinema.booking.service.BookingService;
import com.cinema.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@RequiredArgsConstructor
@Tag(name = "Admin Bookings", description = "Quản lý đặt vé (Admin)")
public class AdminBookingController {

    private final BookingService bookingService;

    @GetMapping
    @Operation(summary = "Danh sách tất cả booking")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getAllBookings(page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết booking (admin)")
    public ResponseEntity<ApiResponse<BookingDto>> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBookingAdmin(id)));
    }
}
