package com.cinema.config;

import com.cinema.user.repository.UserDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures the admin account always has the correct password and ADMIN role after each deploy.
 * Runs once when Spring Boot starts.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements ApplicationRunner {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final String ADMIN_EMAIL = "admin@cinema.vn";
    private static final String ADMIN_PASSWORD = "admin123";

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userDao.findByEmail(ADMIN_EMAIL).ifPresent(admin -> {
            // Update password hash safely (without touching roles)
            String newHash = passwordEncoder.encode(ADMIN_PASSWORD);
            userDao.updatePasswordHash(admin.getId(), newHash);
            log.info("Admin password updated for '{}'", ADMIN_EMAIL);

            // Ensure admin has ADMIN role (fix for cases where save() deleted roles)
            ensureAdminRole(admin.getId());
        });
    }

    private void ensureAdminRole(Long userId) {
        // Check if admin role already assigned
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id " +
            "WHERE ur.user_id = :userId AND r.name = 'ADMIN'",
            new MapSqlParameterSource("userId", userId),
            Integer.class
        );

        if (count == null || count == 0) {
            // Get ADMIN role id
            Integer roleId = jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE name = 'ADMIN'",
                new MapSqlParameterSource(),
                Integer.class
            );

            if (roleId != null) {
                MapSqlParameterSource params = new MapSqlParameterSource();
                params.addValue("userId", userId);
                params.addValue("roleId", roleId);
                jdbcTemplate.update(
                    "INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)", params
                );
                log.info("ADMIN role restored for user '{}'", ADMIN_EMAIL);
            }
        }
    }
}
