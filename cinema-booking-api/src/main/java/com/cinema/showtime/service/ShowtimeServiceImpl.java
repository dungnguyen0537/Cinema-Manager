package com.cinema.showtime.service;

import com.cinema.booking.repository.BookingDao;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.movie.entity.MovieEntity;
import com.cinema.movie.repository.MovieDao;
import com.cinema.room.entity.RoomEntity;
import com.cinema.room.repository.RoomDao;
import com.cinema.seat.entity.SeatEntity;
import com.cinema.seat.repository.SeatDao;
import com.cinema.showtime.dto.ShowtimeDto;
import com.cinema.showtime.entity.ShowtimeEntity;
import com.cinema.showtime.repository.ShowtimeDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {

    private final ShowtimeDao showtimeDao;
    private final MovieDao movieDao;
    private final RoomDao roomDao;
    private final SeatDao seatDao;
    private final BookingDao bookingDao;
    private final StringRedisTemplate redisTemplate;

    @Transactional(readOnly = true)
    public List<ShowtimeDto> getShowtimes(Long movieId, Long cinemaId, LocalDate date) {
        LocalDateTime from;
        LocalDateTime to;
        if (date != null) {
            from = date.atStartOfDay();
            to = date.atTime(LocalTime.MAX);
        } else {
            // Không có date filter: lấy tất cả từ hôm qua đến 60 ngày tới
            from = LocalDate.now().minusDays(1).atStartOfDay();
            to = LocalDate.now().plusDays(60).atTime(LocalTime.MAX);
        }

        log.info("getShowtimes: movieId={}, cinemaId={}, from={}, to={}", movieId, cinemaId, from, to);
        List<ShowtimeEntity> showtimes = showtimeDao.findShowtimes(movieId, cinemaId, from, to);
        log.info("getShowtimes: found {} showtimes", showtimes.size());

        return showtimes.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShowtimeDto getShowtime(Long id) {
        ShowtimeEntity showtime = showtimeDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHOWTIME_NOT_FOUND));
        return toDto(showtime);
    }

    /**
     * Get seat map for a showtime with availability status.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSeatMap(Long showtimeId) {
        ShowtimeEntity showtime = showtimeDao.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.SHOWTIME_NOT_FOUND));

        List<SeatEntity> allSeats = seatDao.findByRoomIdAndStatus(showtime.getRoom().getId(), "ACTIVE");
        List<Long> bookedSeatIds = bookingDao.findBookedSeatIds(showtimeId);

        // Also check Redis for held seats
        Set<Long> heldSeatIds = new HashSet<>();
        try {
            for (SeatEntity seat : allSeats) {
                String redisKey = "seat:hold:" + showtimeId + ":" + seat.getId();
                if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
                    heldSeatIds.add(seat.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Redis connection failed during seat map check. Showing seats without active Redis locks: {}", e.getMessage());
        }

        return allSeats.stream().map(seat -> {
            String status;
            if (bookedSeatIds.contains(seat.getId())) {
                status = "BOOKED";
            } else if (heldSeatIds.contains(seat.getId())) {
                status = "HELD";
            } else {
                status = "AVAILABLE";
            }

            Map<String, Object> seatInfo = new LinkedHashMap<>();
            seatInfo.put("id", seat.getId());
            seatInfo.put("rowName", seat.getRowName());
            seatInfo.put("seatNumber", seat.getSeatNumber());
            seatInfo.put("seatType", seat.getSeatType());
            seatInfo.put("status", status);
            return seatInfo;
        }).collect(Collectors.toList());
    }

    @Transactional
    public ShowtimeDto createShowtime(Long movieId, Long roomId, LocalDateTime startTime, java.math.BigDecimal basePrice) {
        log.info("createShowtime: movieId={}, roomId={}, startTime={}, basePrice={}", movieId, roomId, startTime, basePrice);

        MovieEntity movie = movieDao.findById(movieId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MOVIE_NOT_FOUND));
        RoomEntity room = roomDao.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ROOM_NOT_FOUND));

        LocalDateTime endTime = startTime.plusMinutes(movie.getDurationMinutes() + 15); // +15 min buffer

        // Check conflicts
        List<ShowtimeEntity> conflicts = showtimeDao.findConflicting(roomId, startTime, endTime);
        if (!conflicts.isEmpty()) {
            log.warn("Showtime conflict detected: {} existing showtimes overlap", conflicts.size());
            throw new BusinessException(ErrorCode.SHOWTIME_CONFLICT);
        }

        ShowtimeEntity showtime = ShowtimeEntity.builder()
                .movie(movie)
                .room(room)
                .startTime(startTime)
                .endTime(endTime)
                .basePrice(basePrice)
                .status("ACTIVE")
                .build();

        showtime = showtimeDao.save(showtime);
        log.info("Showtime created: id={}, movie={}, room={}, start={}", showtime.getId(), movie.getTitle(), room.getName(), startTime);

        // Đảm bảo entity có đầy đủ associations để toDto() hoạt động chính xác
        showtime.setMovie(movie);
        showtime.setRoom(room);
        return toDto(showtime);
    }

    private ShowtimeDto toDto(ShowtimeEntity s) {
        // Count available seats
        List<SeatEntity> allSeats = seatDao.findByRoomIdAndStatus(s.getRoom().getId(), "ACTIVE");
        List<Long> bookedSeatIds = bookingDao.findBookedSeatIds(s.getId());

        return ShowtimeDto.builder()
                .id(s.getId())
                .movieId(s.getMovie().getId())
                .movieTitle(s.getMovie().getTitle())
                .moviePosterUrl(s.getMovie().getPosterUrl())
                .movieDuration(s.getMovie().getDurationMinutes())
                .cinemaId(s.getRoom().getCinema().getId())
                .cinemaName(s.getRoom().getCinema().getName())
                .roomId(s.getRoom().getId())
                .roomName(s.getRoom().getName())
                .roomType(s.getRoom().getType())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .basePrice(s.getBasePrice())
                .status(s.getStatus())
                .totalSeats(allSeats.size())
                .availableSeats(allSeats.size() - bookedSeatIds.size())
                .build();
    }
}

