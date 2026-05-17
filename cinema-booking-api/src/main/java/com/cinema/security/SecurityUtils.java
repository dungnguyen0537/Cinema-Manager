package com.cinema.security;

import com.cinema.common.ApiResponse;
import com.cinema.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;

/**
 * Tiện ích ghi JSON response chuẩn cho các handler bảo mật.
 */
public class SecurityUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public static void writeErrorResponse(HttpServletResponse response, HttpStatus status, ErrorCode errorCode) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Void> apiResponse = ApiResponse.error(errorCode.getMessage());
        // Có thể bổ sung mã lỗi vào đây nếu ApiResponse hỗ trợ
        
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    public static void writeErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Void> apiResponse = ApiResponse.error(message);
        
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
