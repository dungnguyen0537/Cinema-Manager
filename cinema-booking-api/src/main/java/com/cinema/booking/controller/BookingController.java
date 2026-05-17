package com.cinema.booking.controller;

import com.cinema.booking.dto.*;
import com.cinema.booking.service.BookingService;
import com.cinema.common.ApiResponse;
import com.cinema.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Đặt vé xem phim")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/hold")
    @Operation(summary = "Giữ ghế tạm thời (5-10 phút)")
    public ResponseEntity<ApiResponse<BookingDto>> holdSeats(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody HoldSeatsRequest request) {
        BookingDto booking = bookingService.holdSeats(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(booking));
    }

    @PostMapping
    @Operation(summary = "Xác nhận đặt vé và chuyển sang thanh toán")
    public ResponseEntity<ApiResponse<BookingDto>> createBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody CreateBookingRequest request) {
        BookingDto booking = bookingService.createBooking(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết booking")
    public ResponseEntity<ApiResponse<BookingDto>> getBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBooking(user.getId(), id)));
    }

    @GetMapping("/my-bookings")
    @Operation(summary = "Lịch sử đặt vé của tôi")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getUserBookings(user.getId(), page, size)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy booking")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long id) {
        bookingService.cancelBooking(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Hủy đặt vé thành công"));
    }
}
