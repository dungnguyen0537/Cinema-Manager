package com.cinema.movie.repository;

import com.cinema.movie.entity.GenreEntity;
import java.util.List;
import java.util.Optional;

public interface GenreDao {
    GenreEntity save(GenreEntity entity);
    Optional<GenreEntity> findById(Long id);
    List<GenreEntity> findAll();
    void deleteById(Long id);
    List<GenreEntity> findAllById(Iterable<Long> ids);
}
