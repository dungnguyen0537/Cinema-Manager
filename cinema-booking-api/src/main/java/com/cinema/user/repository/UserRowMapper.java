package com.cinema.user.repository;

import com.cinema.user.entity.UserEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserRowMapper implements RowMapper<UserEntity> {
    @Override
    public UserEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        UserEntity entity = new UserEntity();
        entity.setId(rs.getLong("id"));
        entity.setFullName(rs.getString("full_name"));
        entity.setEmail(rs.getString("email"));
        entity.setPhone(rs.getString("phone"));
        entity.setPasswordHash(rs.getString("password_hash"));
        entity.setStatus(rs.getString("status"));
        if (rs.getTimestamp("created_at") != null)
            entity.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return entity;
    }
}
