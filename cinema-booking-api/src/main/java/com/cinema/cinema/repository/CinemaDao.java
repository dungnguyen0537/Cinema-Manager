package com.cinema.cinema.repository;

import com.cinema.cinema.entity.CinemaEntity;
import java.util.List;
import java.util.Optional;

public interface CinemaDao {
    CinemaEntity save(CinemaEntity entity);
    Optional<CinemaEntity> findById(Long id);
    List<CinemaEntity> findAll();
    void deleteById(Long id);
    List<CinemaEntity> findByStatus(String status);
}
