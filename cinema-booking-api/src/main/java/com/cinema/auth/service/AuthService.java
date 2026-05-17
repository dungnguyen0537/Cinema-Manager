package com.cinema.auth.service;

import com.cinema.auth.dto.*;
import com.cinema.security.CustomUserDetails;

public interface AuthService {
    TokenResponse register(RegisterRequest request);
    TokenResponse login(LoginRequest request);
    TokenResponse refreshToken(RefreshTokenRequest request);
    TokenResponse.UserInfo getCurrentUser(CustomUserDetails userDetails);
}
