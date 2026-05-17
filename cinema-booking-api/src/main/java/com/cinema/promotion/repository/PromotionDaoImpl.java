package com.cinema.promotion.repository;

import com.cinema.promotion.entity.PromotionEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PromotionDaoImpl implements PromotionDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final PromotionRowMapper rowMapper = new PromotionRowMapper();

    @Override
    public PromotionEntity save(PromotionEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("code", entity.getCode());
        params.addValue("description", entity.getDescription());
        params.addValue("discountType", entity.getDiscountType());
        params.addValue("discountValue", entity.getDiscountValue());
        params.addValue("minOrderValue", entity.getMinOrderValue());
        params.addValue("maxDiscountAmount", entity.getMaxDiscountAmount());
        params.addValue("startTime", entity.getStartTime());
        params.addValue("endTime", entity.getEndTime());
        params.addValue("usageLimit", entity.getUsageLimit());
        params.addValue("usedCount", entity.getUsedCount());
        params.addValue("status", entity.getStatus());
        params.addValue("applicableMovieIds", entity.getApplicableMovieIds());

        if (entity.getId() == null) {
            String sql = "INSERT INTO promotions (code, description, discount_type, discount_value, min_order_value, " +
                    "max_discount_amount, start_time, end_time, usage_limit, used_count, status, applicable_movie_ids) " +
                    "VALUES (:code, :description, :discountType, :discountValue, :minOrderValue, :maxDiscountAmount, " +
                    ":startTime, :endTime, :usageLimit, :usedCount, :status, :applicableMovieIds)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE promotions SET code = :code, description = :description, discount_type = :discountType, " +
                    "discount_value = :discountValue, min_order_value = :minOrderValue, max_discount_amount = :maxDiscountAmount, " +
                    "start_time = :startTime, end_time = :endTime, usage_limit = :usageLimit, used_count = :usedCount, " +
                    "status = :status, applicable_movie_ids = :applicableMovieIds WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<PromotionEntity> findById(Long id) {
        List<PromotionEntity> list = jdbcTemplate.query("SELECT * FROM promotions WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<PromotionEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM promotions", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM promotions WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public Optional<PromotionEntity> findByCodeAndStatus(String code, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("code", code);
        params.addValue("status", status);
        List<PromotionEntity> list = jdbcTemplate.query("SELECT * FROM promotions WHERE code = :code AND status = :status", params, rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public Optional<PromotionEntity> findByCode(String code) {
        List<PromotionEntity> list = jdbcTemplate.query("SELECT * FROM promotions WHERE code = :code", new MapSqlParameterSource("code", code), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public boolean existsByCode(String code) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions WHERE code = :code", new MapSqlParameterSource("code", code), Integer.class);
        return count != null && count > 0;
    }

    @Override
    public boolean existsById(Long id) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM promotions WHERE id = :id", new MapSqlParameterSource("id", id), Integer.class);
        return count != null && count > 0;
    }
}
