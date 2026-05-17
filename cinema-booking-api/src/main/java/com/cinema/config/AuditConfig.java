package com.cinema.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * Cấu hình Audit - xác định ai đang thao tác trong hệ thống.
 * Dùng cho việc ghi log createdBy trong BaseEntity (xử lý thủ công trong DAO).
 */
@Configuration
public class AuditConfig {

    public static String getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}
