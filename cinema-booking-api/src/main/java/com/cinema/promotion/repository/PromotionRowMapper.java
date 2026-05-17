package com.cinema.promotion.repository;

import com.cinema.promotion.entity.PromotionEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class PromotionRowMapper implements RowMapper<PromotionEntity> {
    @Override
    public PromotionEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        PromotionEntity entity = new PromotionEntity();
        entity.setId(rs.getLong("id"));
        entity.setCode(rs.getString("code"));
        entity.setDescription(rs.getString("description"));
        entity.setDiscountType(rs.getString("discount_type"));
        entity.setDiscountValue(rs.getBigDecimal("discount_value"));
        entity.setMinOrderValue(rs.getBigDecimal("min_order_value"));
        entity.setMaxDiscountAmount(rs.getBigDecimal("max_discount_amount"));
        if (rs.getTimestamp("start_time") != null)
            entity.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        if (rs.getTimestamp("end_time") != null)
            entity.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
        entity.setUsageLimit(rs.getObject("usage_limit") != null ? rs.getInt("usage_limit") : null);
        entity.setUsedCount(rs.getObject("used_count") != null ? rs.getInt("used_count") : 0);
        entity.setStatus(rs.getString("status"));
        entity.setApplicableMovieIds(rs.getString("applicable_movie_ids"));
        return entity;
    }
}
