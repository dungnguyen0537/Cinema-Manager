package com.cinema.showtime.repository;

import com.cinema.showtime.entity.ShowtimeEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShowtimeDao {
    ShowtimeEntity save(ShowtimeEntity entity);
    Optional<ShowtimeEntity> findById(Long id);
    List<ShowtimeEntity> findAll();
    void deleteById(Long id);
    List<ShowtimeEntity> findShowtimes(Long movieId, Long cinemaId, LocalDateTime from, LocalDateTime to);
    List<ShowtimeEntity> findConflicting(Long roomId, LocalDateTime start, LocalDateTime end);
}
