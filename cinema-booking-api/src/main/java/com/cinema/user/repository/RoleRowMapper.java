package com.cinema.user.repository;

import com.cinema.user.entity.RoleEntity;
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class RoleRowMapper implements RowMapper<RoleEntity> {
    @Override
    public RoleEntity mapRow(ResultSet rs, int rowNum) throws SQLException {
        RoleEntity entity = new RoleEntity();
        entity.setId(rs.getLong("id"));
        entity.setName(rs.getString("name"));
        return entity;
    }
}
