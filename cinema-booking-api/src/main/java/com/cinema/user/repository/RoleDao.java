package com.cinema.user.repository;

import com.cinema.user.entity.RoleEntity;
import java.util.List;
import java.util.Optional;

public interface RoleDao {
    RoleEntity save(RoleEntity entity);
    Optional<RoleEntity> findById(Long id);
    List<RoleEntity> findAll();
    void deleteById(Long id);
    Optional<RoleEntity> findByName(String name);
}
