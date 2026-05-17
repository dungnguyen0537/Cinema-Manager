package com.cinema.cinema.controller;

import com.cinema.cinema.entity.CinemaEntity;
import com.cinema.cinema.repository.CinemaDao;
import com.cinema.common.ApiResponse;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.room.entity.RoomEntity;
import com.cinema.room.repository.RoomDao;
import com.cinema.seat.entity.SeatEntity;
import com.cinema.seat.repository.SeatDao;
import com.cinema.room.dto.CreateRoomRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Tag(name = "Cinemas", description = "Quáº£n lÃ½ ráº¡p phim")
public class CinemaController {

    private final CinemaDao cinemaDao;
    private final RoomDao roomDao;
    private final SeatDao seatDao;

    @GetMapping("/api/v1/cinemas")
    @Operation(summary = "Danh sÃ¡ch ráº¡p (public)")
    public ResponseEntity<ApiResponse<List<CinemaEntity>>> getCinemas() {
        return ResponseEntity.ok(ApiResponse.ok(cinemaDao.findByStatus("ACTIVE")));
    }

    @GetMapping("/api/v1/cinemas/{id}")
    @Operation(summary = "Chi tiáº¿t ráº¡p (public)")
    public ResponseEntity<ApiResponse<CinemaEntity>> getCinema(@PathVariable Long id) {
        CinemaEntity cinema = cinemaDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CINEMA_NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(cinema));
    }

    @GetMapping("/api/v1/cinemas/{id}/rooms")
    @Operation(summary = "Danh sÃ¡ch phÃ²ng chiáº¿u (public)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRooms(@PathVariable Long id) {
        List<RoomEntity> rooms = roomDao.findByCinemaIdAndStatus(id, "ACTIVE");
        List<Map<String, Object>> result = rooms.stream().map(r -> Map.<String, Object>of(
                "id", r.getId(),
                "name", r.getName(),
                "type", r.getType(),
                "capacity", r.getCapacity() != null ? r.getCapacity() : 0
        )).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/api/v1/admin/cinemas")
    @Operation(summary = "ThÃªm ráº¡p má»›i (Admin)")
    public ResponseEntity<ApiResponse<CinemaEntity>> createCinema(@RequestBody CinemaEntity cinema) {
        return ResponseEntity.ok(ApiResponse.created(cinemaDao.save(cinema)));
    }

    @PostMapping("/api/v1/admin/cinemas/{id}/rooms")
    @Operation(summary = "ThÃªm phÃ²ng chiáº¿u vÃ  sinh sÆ¡ Ä‘á»“ gháº¿ tá»± Ä‘á»™ng (Admin)")
    @Transactional
    public ResponseEntity<ApiResponse<RoomEntity>> createRoom(@PathVariable Long id, @RequestBody CreateRoomRequest request) {
        CinemaEntity cinema = cinemaDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CINEMA_NOT_FOUND));

        int capacity = request.getRowCount() * request.getColCount();

        RoomEntity room = RoomEntity.builder()
                .cinema(cinema)
                .name(request.getName())
                .type(request.getType() != null ? request.getType() : "STANDARD_2D")
                .capacity(capacity)
                .status("ACTIVE")
                .build();
        room = roomDao.save(room);

        List<SeatEntity> seats = new ArrayList<>();
        // Quy táº¯c: 2 hÃ ng cuá»‘i lÃ  COUPLE, giá»¯a lÃ  VIP, cÃ²n láº¡i STANDARD
        int totalRows = request.getRowCount();
        for (int i = 0; i < totalRows; i++) {
            char rowChar = (char) ('A' + i);
            String rowName = String.valueOf(rowChar);
            
            String seatType = "STANDARD";
            if (i >= totalRows - 2) {
                seatType = "COUPLE";
            } else if (i >= totalRows / 2 - 1 && i < totalRows - 2) {
                seatType = "VIP";
            }

            for (int j = 1; j <= request.getColCount(); j++) {
                seats.add(SeatEntity.builder()
                        .room(room)
                        .rowName(rowName)
                        .seatNumber(j)
                        .seatType(seatType)
                        .status("ACTIVE")
                        .build());
            }
        }
        seatDao.saveAll(seats);

        return ResponseEntity.ok(ApiResponse.created(room));
    }
}

