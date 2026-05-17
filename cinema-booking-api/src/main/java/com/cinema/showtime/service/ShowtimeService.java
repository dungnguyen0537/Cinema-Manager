package com.cinema.showtime.service;

import com.cinema.showtime.dto.ShowtimeDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ShowtimeService {
    List<ShowtimeDto> getShowtimes(Long movieId, Long cinemaId, LocalDate date);
    ShowtimeDto getShowtime(Long id);
    ShowtimeDto createShowtime(Long movieId, Long roomId, LocalDateTime startTime, BigDecimal basePrice);
    List<Map<String, Object>> getSeatMap(Long showtimeId);
}
