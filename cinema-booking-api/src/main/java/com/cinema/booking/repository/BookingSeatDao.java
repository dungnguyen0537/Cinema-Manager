package com.cinema.booking.repository;

import com.cinema.booking.entity.BookingSeatEntity;
import java.util.List;
import java.util.Optional;

public interface BookingSeatDao {
    BookingSeatEntity save(BookingSeatEntity entity);
    Optional<BookingSeatEntity> findById(Long id);
    List<BookingSeatEntity> findAll();
    void deleteById(Long id);
}
