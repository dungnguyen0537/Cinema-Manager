package com.cinema.movie.repository;

import com.cinema.movie.entity.GenreEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class GenreDaoImpl implements GenreDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final GenreRowMapper rowMapper = new GenreRowMapper();

    @Override
    public GenreEntity save(GenreEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("name", entity.getName());
        if (entity.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbcTemplate.update("INSERT INTO genres (name) VALUES (:name)", params, kh, new String[]{"id"});
            entity.setId(kh.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            jdbcTemplate.update("UPDATE genres SET name = :name WHERE id = :id", params);
        }
        return entity;
    }

    @Override
    public Optional<GenreEntity> findById(Long id) {
        List<GenreEntity> list = jdbcTemplate.query("SELECT * FROM genres WHERE id = :id", new MapSqlParameterSource("id", id), rowMapper);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public List<GenreEntity> findAll() {
        return jdbcTemplate.query("SELECT * FROM genres", rowMapper);
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM genres WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public List<GenreEntity> findAllById(Iterable<Long> ids) {
        List<Long> idList = new ArrayList<>();
        ids.forEach(idList::add);
        if (idList.isEmpty()) return new ArrayList<>();
        return jdbcTemplate.query("SELECT * FROM genres WHERE id IN (:ids)", new MapSqlParameterSource("ids", idList), rowMapper);
    }
}
