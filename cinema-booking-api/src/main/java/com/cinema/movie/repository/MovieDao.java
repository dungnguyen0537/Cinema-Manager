package com.cinema.movie.repository;

import com.cinema.movie.entity.MovieEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MovieDao {
    MovieEntity save(MovieEntity entity);
    Optional<MovieEntity> findById(Long id);
    List<MovieEntity> findAll();
    void deleteById(Long id);
    Page<MovieEntity> findWithFilters(String status, String search, Pageable pageable);
}
