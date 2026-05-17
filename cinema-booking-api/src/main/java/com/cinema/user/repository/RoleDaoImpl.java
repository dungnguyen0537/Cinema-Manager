package com.cinema.user.repository;

import com.cinema.user.entity.RoleEntity;
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
public class RoleDaoImpl implements RoleDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final RoleRowMapper rowMapper = new RoleRowMapper();

    @Override
    public RoleEntity save(RoleEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("name", entity.getName());
        if (entity.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbcTemplate.update("INSERT INTO roles (name) VALUES (:name)", params, kh, new String[]{"id"});
            entity.setId(kh.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            jdbcTemplate.update("UPDATE roles SET name = :name WHERE id = :id", params);
        }
        return entity;
    }

    @Override
    public Optional<RoleEntity> findById(Long id) {
        List<RoleEntity> list = jdbcTemplate.query("SELECT * FROM roles WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<RoleEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM roles", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM roles WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public Optional<RoleEntity> findByName(String name) {
        List<RoleEntity> list = jdbcTemplate.query("SELECT * FROM roles WHERE name = :name",
                new MapSqlParameterSource("name", name), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
