package com.cinema.user.repository;

import com.cinema.config.AuditConfig;
import com.cinema.user.entity.RoleEntity;
import com.cinema.user.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class UserDaoImpl implements UserDao {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final UserRowMapper rowMapper = new UserRowMapper();

    @Override
    public UserEntity save(UserEntity entity) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("fullName", entity.getFullName());
        params.addValue("email", entity.getEmail());
        params.addValue("phone", entity.getPhone());
        params.addValue("passwordHash", entity.getPasswordHash());
        params.addValue("status", entity.getStatus());

        if (entity.getId() == null) {
            LocalDateTime now = LocalDateTime.now();
            params.addValue("createdAt", now);
            params.addValue("updatedAt", now);
            params.addValue("createdBy", AuditConfig.getCurrentAuditor());
            String sql = "INSERT INTO users (full_name, email, phone, password_hash, status, created_at, updated_at, created_by) " +
                    "VALUES (:fullName, :email, :phone, :passwordHash, :status, :createdAt, :updatedAt, :createdBy)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{"id"});
            entity.setId(keyHolder.getKey().longValue());
        } else {
            params.addValue("id", entity.getId());
            params.addValue("updatedAt", LocalDateTime.now());
            String sql = "UPDATE users SET full_name = :fullName, email = :email, phone = :phone, " +
                    "password_hash = :passwordHash, status = :status, updated_at = :updatedAt WHERE id = :id";
            jdbcTemplate.update(sql, params);
        }
        saveRoles(entity);
        return entity;
    }

    private void saveRoles(UserEntity user) {
        if (user.getId() == null) return;
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = :userId", new MapSqlParameterSource("userId", user.getId()));
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            for (RoleEntity role : user.getRoles()) {
                MapSqlParameterSource p = new MapSqlParameterSource();
                p.addValue("userId", user.getId());
                p.addValue("roleId", role.getId());
                jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", p);
            }
        }
    }

    private void fetchRoles(UserEntity user) {
        List<RoleEntity> roles = jdbcTemplate.query(
                "SELECT r.* FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = :userId",
                new MapSqlParameterSource("userId", user.getId()), new RoleRowMapper());
        user.setRoles(new HashSet<>(roles));
    }

    @Override
    public Optional<UserEntity> findById(Long id) {
        List<UserEntity> results = jdbcTemplate.query("SELECT * FROM users WHERE id = :id",
                new MapSqlParameterSource("id", id), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        fetchRoles(results.get(0));
        return Optional.of(results.get(0));
    }

    @Override
    public List<UserEntity> findAll() {
        List<UserEntity> list = jdbcTemplate.query("SELECT * FROM users", rowMapper);
        list.forEach(this::fetchRoles);
        return list;
    }

    @Override
    public void deleteById(Long id) {
        jdbcTemplate.update("DELETE FROM user_roles WHERE user_id = :id", new MapSqlParameterSource("id", id));
        jdbcTemplate.update("DELETE FROM users WHERE id = :id", new MapSqlParameterSource("id", id));
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        List<UserEntity> results = jdbcTemplate.query("SELECT * FROM users WHERE email = :email",
                new MapSqlParameterSource("email", email), rowMapper);
        if (results.isEmpty()) return Optional.empty();
        fetchRoles(results.get(0));
        return Optional.of(results.get(0));
    }

    @Override
    public boolean existsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = :email",
                new MapSqlParameterSource("email", email), Integer.class);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByPhone(String phone) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE phone = :phone",
                new MapSqlParameterSource("phone", phone), Integer.class);
        return count != null && count > 0;
    }

    @Override
    public void updatePasswordHash(Long userId, String passwordHash) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("id", userId);
        params.addValue("passwordHash", passwordHash);
        params.addValue("updatedAt", LocalDateTime.now());
        jdbcTemplate.update("UPDATE users SET password_hash = :passwordHash, updated_at = :updatedAt WHERE id = :id", params);
    }

    @Override
    public void updateStatus(Long userId, String status) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("id", userId);
        params.addValue("status", status);
        params.addValue("updatedAt", LocalDateTime.now());
        jdbcTemplate.update("UPDATE users SET status = :status, updated_at = :updatedAt WHERE id = :id", params);
    }
}
