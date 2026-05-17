package com.cinema.ticket.controller;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.common.ApiResponse;
import com.cinema.security.CustomUserDetails;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.ticket.entity.TicketEntity;
import com.cinema.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Vé điện tử")
@Transactional(readOnly = true)
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/api/v1/tickets/{id}")
    @Operation(summary = "Xem chi tiết vé")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTicket(@PathVariable Long id) {
        TicketEntity ticket = ticketService.getTicket(id);
        return ResponseEntity.ok(ApiResponse.ok(ticketToMap(ticket)));
    }

    @GetMapping("/api/v1/tickets/code/{ticketCode}")
    @Operation(summary = "Tìm vé theo mã vé")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTicketByCode(@PathVariable String ticketCode) {
        TicketEntity ticket = ticketService.getTicketByCode(ticketCode);
        return ResponseEntity.ok(ApiResponse.ok(ticketToMap(ticket)));
    }

    @GetMapping("/api/v1/users/me/tickets")
    @Operation(summary = "Danh sách vé của tôi")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyTickets(
            @AuthenticationPrincipal CustomUserDetails user) {
        List<TicketEntity> tickets = ticketService.getUserTickets(user.getId());
        List<Map<String, Object>> result = tickets.stream().map(this::ticketToMap).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/api/v1/staff/tickets/{ticketCode}/use")
    @Operation(summary = "Đánh dấu vé đã sử dụng (Staff)")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> useTicket(@PathVariable String ticketCode) {
        ticketService.useTicket(ticketCode);
        return ResponseEntity.ok(ApiResponse.ok(null, "Ticket marked as used"));
    }

    private Map<String, Object> ticketToMap(TicketEntity ticket) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", ticket.getId());
        map.put("ticketCode", ticket.getTicketCode());

        BookingEntity booking = ticket.getBooking();
        if (booking != null) {
            map.put("bookingCode", booking.getBookingCode());

            ShowtimeEntity showtime = booking.getShowtime();
            if (showtime != null) {
                map.put("movieTitle", showtime.getMovie() != null ? showtime.getMovie().getTitle() : "");
                map.put("roomName", showtime.getRoom() != null ? showtime.getRoom().getName() : "");
                map.put("cinemaName", showtime.getRoom() != null && showtime.getRoom().getCinema() != null
                        ? showtime.getRoom().getCinema().getName() : "");
                map.put("showtimeStart", showtime.getStartTime() != null ? showtime.getStartTime().toString() : "");
            }

            if (booking.getBookingSeats() != null) {
                map.put("seats", booking.getBookingSeats().stream()
                        .filter(bs -> bs.getSeat() != null)
                        .map(bs -> Map.of(
                                "rowName", bs.getSeat().getRowName() != null ? bs.getSeat().getRowName() : "",
                                "seatNumber", bs.getSeat().getSeatNumber() != null ? bs.getSeat().getSeatNumber() : 0,
                                "seatType", bs.getSeat().getSeatType() != null ? bs.getSeat().getSeatType() : ""
                        )).collect(Collectors.toList()));
            }
        }

        map.put("qrCode", ticket.getQrCode() != null ? ticket.getQrCode() : "");
        map.put("issuedAt", ticket.getIssuedAt() != null ? ticket.getIssuedAt().toString() : "");
        map.put("status", ticket.getStatus());
        return map;
    }
}
