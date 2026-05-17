package com.cinema.seat.repository;

import com.cinema.seat.entity.SeatEntity;
import java.util.List;
import java.util.Optional;

public interface SeatDao {
    SeatEntity save(SeatEntity entity);
    Optional<SeatEntity> findById(Long id);
    List<SeatEntity> findAll();
    void deleteById(Long id);
    List<SeatEntity> findByRoomIdAndStatus(Long roomId, String status);
    List<SeatEntity> findByRoomId(Long roomId);
    List<SeatEntity> findByIdIn(List<Long> ids);
    List<SeatEntity> saveAll(List<SeatEntity> entities);
}
