package com.cinema.promotion.repository;

import com.cinema.promotion.entity.PromotionEntity;
import java.util.List;
import java.util.Optional;

public interface PromotionDao {
    PromotionEntity save(PromotionEntity entity);
    Optional<PromotionEntity> findById(Long id);
    List<PromotionEntity> findAll();
    void deleteById(Long id);
    Optional<PromotionEntity> findByCodeAndStatus(String code, String status);
    Optional<PromotionEntity> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsById(Long id);
}
