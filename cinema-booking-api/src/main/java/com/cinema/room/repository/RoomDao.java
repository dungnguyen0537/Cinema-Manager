package com.cinema.room.repository;

import com.cinema.room.entity.RoomEntity;
import java.util.List;
import java.util.Optional;

public interface RoomDao {
    RoomEntity save(RoomEntity entity);
    Optional<RoomEntity> findById(Long id);
    List<RoomEntity> findAll();
    void deleteById(Long id);
    List<RoomEntity> findByCinemaIdAndStatus(Long cinemaId, String status);
    List<RoomEntity> findByCinemaId(Long cinemaId);
}
