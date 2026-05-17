package com.cinema.auth.service;

import com.cinema.auth.dto.*;
import com.cinema.common.Constants;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.security.CustomUserDetails;
import com.cinema.security.JwtProperties;
import com.cinema.security.JwtTokenProvider;
import com.cinema.user.entity.RoleEntity;
import com.cinema.user.entity.UserEntity;
import com.cinema.user.repository.RoleDao;
import com.cinema.user.repository.UserDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserDao userDao;
    private final RoleDao roleDao;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        // Check duplicate email
        if (userDao.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
        }

        // Check duplicate phone
        if (request.getPhone() != null && userDao.existsByPhone(request.getPhone())) {
            throw new BusinessException(ErrorCode.AUTH_PHONE_ALREADY_EXISTS);
        }

        // Get CUSTOMER role
        RoleEntity customerRole = roleDao.findByName(Constants.ROLE_CUSTOMER)
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "Default role not found"));

        // Create user
        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status("ACTIVE")
                .build();
        user.getRoles().add(customerRole);
        userDao.save(user);

        log.info("New user registered: {}", request.getEmail());

        // Auto-login after registration
        return login(new LoginRequest() {{
            setEmail(request.getEmail());
            setPassword(request.getPassword());
        }});
    }

    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails.getUsername());

        log.info("User logged in: {}", request.getEmail());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenExpiration() / 1000)
                .user(TokenResponse.UserInfo.builder()
                        .id(userDetails.getId())
                        .fullName(userDetails.getFullName())
                        .email(userDetails.getEmail())
                        .roles(userDetails.getRoles())
                        .build())
                .build();
    }

    public TokenResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtTokenProvider.validateToken(request.getRefreshToken())) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_INVALID);
        }

        String email = jwtTokenProvider.getEmailFromToken(request.getRefreshToken());
        UserEntity user = userDao.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Set<String> roles = user.getRoles().stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet());

        CustomUserDetails userDetails = new CustomUserDetails(
                user.getId(), user.getEmail(), user.getPasswordHash(),
                user.getFullName(), "ACTIVE".equals(user.getStatus()), roles
        );

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );

        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenExpiration() / 1000)
                .user(TokenResponse.UserInfo.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .roles(roles)
                        .build())
                .build();
    }

    public TokenResponse.UserInfo getCurrentUser(CustomUserDetails userDetails) {
        return TokenResponse.UserInfo.builder()
                .id(userDetails.getId())
                .fullName(userDetails.getFullName())
                .email(userDetails.getEmail())
                .roles(userDetails.getRoles())
                .build();
    }

}

