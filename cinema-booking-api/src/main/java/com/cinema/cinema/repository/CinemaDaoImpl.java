package com.cinema.cinema.repository;

import com.cinema.cinema.entity.CinemaEntity;
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
public class CinemaDaoImpl implements CinemaDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final CinemaRowMapper rowMapper = new CinemaRowMapper();

    @Override
    public CinemaEntity save(CinemaEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("name", entity.getName());
        params.addValue("address", entity.getAddress());
        params.addValue("city", entity.getCity());
        params.addValue("phone", entity.getPhone());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO cinemas (name, address, city, phone, status) VALUES (:name, :address, :city, :phone, :status)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE cinemas SET name = :name, address = :address, city = :city, phone = :phone, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        return entity;
    }

    @Override
    public Optional<CinemaEntity> findById(Long id) {
        List<CinemaEntity> results = jdbcTemplate.query("SELECT * FROM cinemas WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<CinemaEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM cinemas", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM cinemas WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public List<CinemaEntity> findByStatus(String status) {
        return jdbcTemplate.query("SELECT * FROM cinemas WHERE status = :status",
                new MapSqlParameterSource("status", status), rowMapper);
    }
}
