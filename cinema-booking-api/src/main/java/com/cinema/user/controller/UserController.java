package com.cinema.user.controller;

import com.cinema.common.ApiResponse;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.security.CustomUserDetails;
import com.cinema.user.entity.UserEntity;
import com.cinema.user.repository.UserDao;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management")
public class UserController {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me/profile")
    @Operation(summary = "View profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal CustomUserDetails user) {
        UserEntity entity = userDao.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        Map<String, Object> profile = Map.of(
                "id", entity.getId(),
                "fullName", entity.getFullName(),
                "email", entity.getEmail(),
                "phone", entity.getPhone() != null ? entity.getPhone() : "",
                "status", entity.getStatus(),
                "createdAt", entity.getCreatedAt().toString()
        );

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Update profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> request) {
        UserEntity entity = userDao.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (request.containsKey("fullName")) {
            entity.setFullName(request.get("fullName"));
        }
        if (request.containsKey("phone")) {
            entity.setPhone(request.get("phone"));
        }
        userDao.save(entity);

        Map<String, Object> profile = Map.of(
                "id", entity.getId(),
                "fullName", entity.getFullName(),
                "email", entity.getEmail(),
                "phone", entity.getPhone() != null ? entity.getPhone() : "",
                "status", entity.getStatus()
        );

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody Map<String, String> request) {
        UserEntity entity = userDao.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (!passwordEncoder.matches(currentPassword, entity.getPasswordHash())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Current password is incorrect"));
        }

        userDao.updatePasswordHash(entity.getId(), passwordEncoder.encode(newPassword));

        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully"));
    }

    // === ADMIN APIs ===

    @GetMapping("/admin/all")
    @Operation(summary = "Get all users (Admin)")
    public ResponseEntity<ApiResponse<java.util.List<UserEntity>>> getAllUsers(
            @AuthenticationPrincipal CustomUserDetails admin) {
        return ResponseEntity.ok(ApiResponse.ok(userDao.findAll()));
    }

    @PutMapping("/admin/{id}/status")
    @Operation(summary = "Change user status (Admin)")
    public ResponseEntity<ApiResponse<UserEntity>> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        UserEntity entity = userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        // Prevent locking Admin accounts
        boolean isAdmin = entity.getRoles().stream()
                .anyMatch(r -> "ADMIN".equals(r.getName()));
        if (isAdmin) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot lock Admin account"));
        }

        String newStatus = request.get("status");
        if (newStatus != null) {
            userDao.updateStatus(id, newStatus);
            entity.setStatus(newStatus);
        }
        return ResponseEntity.ok(ApiResponse.ok(entity));
    }

    @PutMapping("/admin/{id}/profile")
    @Operation(summary = "Update user info (Admin)")
    public ResponseEntity<ApiResponse<UserEntity>> adminUpdateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        UserEntity entity = userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (request.containsKey("fullName") && !request.get("fullName").isBlank()) {
            entity.setFullName(request.get("fullName"));
        }
        if (request.containsKey("phone")) {
            entity.setPhone(request.get("phone"));
        }
        if (request.containsKey("email") && !request.get("email").isBlank()) {
            entity.setEmail(request.get("email"));
        }
        userDao.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(entity));
    }
}
