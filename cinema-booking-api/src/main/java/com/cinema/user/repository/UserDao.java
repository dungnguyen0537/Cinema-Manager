package com.cinema.user.repository;

import com.cinema.user.entity.UserEntity;
import java.util.List;
import java.util.Optional;

public interface UserDao {
    UserEntity save(UserEntity entity);
    Optional<UserEntity> findById(Long id);
    List<UserEntity> findAll();
    void deleteById(Long id);
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    void updatePasswordHash(Long userId, String passwordHash);
    void updateStatus(Long userId, String status);
}
