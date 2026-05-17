package com.cinema.movie.repository;

import com.cinema.movie.entity.GenreEntity;
import com.cinema.movie.entity.MovieEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MovieDaoImpl implements MovieDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final MovieRowMapper rowMapper = new MovieRowMapper();

    @Override
    public MovieEntity save(MovieEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("title", entity.getTitle());
        params.addValue("description", entity.getDescription());
        params.addValue("durationMinutes", entity.getDurationMinutes());
        params.addValue("language", entity.getLanguage());
        params.addValue("subtitle", entity.getSubtitle());
        params.addValue("ageRating", entity.getAgeRating());
        params.addValue("director", entity.getDirector());
        params.addValue("castMembers", entity.getCast());
        params.addValue("posterUrl", entity.getPosterUrl());
        params.addValue("trailerUrl", entity.getTrailerUrl());
        params.addValue("releaseDate", entity.getReleaseDate());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            String sql = "INSERT INTO movies (title, description, duration_minutes, language, subtitle, age_rating, " +
                    "director, cast_members, poster_url, trailer_url, release_date, status) VALUES (:title, :description, " +
                    ":durationMinutes, :language, :subtitle, :ageRating, :director, :castMembers, :posterUrl, :trailerUrl, " +
                    ":releaseDate, :status)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            String sql = "UPDATE movies SET title = :title, description = :description, duration_minutes = :durationMinutes, " +
                    "language = :language, subtitle = :subtitle, age_rating = :ageRating, director = :director, " +
                    "cast_members = :castMembers, poster_url = :posterUrl, trailer_url = :trailerUrl, " +
                    "release_date = :releaseDate, status = :status WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }

        // Save genres
        saveGenres(entity);
        return entity;
    }

    private void saveGenres(MovieEntity movie) {
        if (movie.getId() == null) return;
        jdbcTemplate.update("DELETE FROM movie_genres WHERE movie_id = :movieId", new MapSqlParameterSource("movieId", movie.getId()));
        if (movie.getGenres() != null && !movie.getGenres().isEmpty()) {
            for (GenreEntity genre : movie.getGenres()) {
                MapSqlParameterSource p = new MapSqlParameterSource();
                p.addValue("movieId", movie.getId());
                p.addValue("genreId", genre.getId());
                jdbcTemplate.update("INSERT INTO movie_genres (movie_id, genre_id) VALUES (:movieId, :genreId)", p);
            }
        }
    }

    private void fetchGenres(MovieEntity movie) {
        List<GenreEntity> genres = jdbcTemplate.query(
                "SELECT g.* FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = :movieId",
                new MapSqlParameterSource("movieId", movie.getId()), new GenreRowMapper());
        movie.setGenres(new HashSet<>(genres));
    }

    @Override
    public Optional<MovieEntity> findById(Long id) {
        List<MovieEntity> results = jdbcTemplate.query("SELECT * FROM movies WHERE id = :id",
                new MapSqlParameterSource("id", id), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        fetchGenres(results.get(0));
        return Optional.of(results.get(0));
    }

    @Override
    public List<MovieEntity> findAll() {
        List<MovieEntity> list = jdbcTemplate.query("SELECT * FROM movies", rowMapper);
        list.forEach(this::fetchGenres);
        return list;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM movie_genres WHERE movie_id = :id", new MapSqlParameterSource("id", id));
        jdbcTemplate.update("DELETE FROM movies WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public Page<MovieEntity> findWithFilters(String status, String search, Pageable pageable) {
        StringBuilder sql = new StringBuilder("SELECT * FROM movies WHERE 1=1 ");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (status != null && !status.isEmpty()) {
            sql.append(" AND status = :status ");
            params.addValue("status", status);
        }
        if (search != null && !search.isEmpty()) {
            sql.append(" AND title ILIKE :search ");
            params.addValue("search", "%" + search + "%");
        }

        // count
        String countSql = sql.toString().replace("SELECT *", "SELECT COUNT(*)");
        Long total = jdbcTemplate.queryForObject(countSql, params, Long.class);
        if (total == null) total = 0L;

        // sort and limit
        sql.append(" ORDER BY id DESC LIMIT :limit OFFSET :offset");
        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        List<MovieEntity> content = jdbcTemplate.query(sql.toString(), params, rowMapper);
        content.forEach(this::fetchGenres);

        return new PageImpl<>(content, pageable, total);
    }
}
