package com.cinema.common.controller;

import com.cinema.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@Tag(name = "File Upload", description = "Upload anh/video")
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path uploadBasePath;

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    @PostConstruct
    public void init() {
        // Giải quyết đường dẫn tuyệt đối một lần duy nhất khi khởi động
        uploadBasePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        log.info("Upload base path: {}", uploadBasePath);

        // Tạo sẵn các thư mục cần thiết
        try {
            Files.createDirectories(uploadBasePath.resolve("posters"));
            Files.createDirectories(uploadBasePath.resolve("trailers"));
            log.info("Upload directories ready: {}/posters, {}/trailers", uploadBasePath, uploadBasePath);
        } catch (IOException e) {
            log.error("Cannot create upload directories at '{}'. Trying fallback...", uploadBasePath, e);

            // Dự phòng: sử dụng thư mục tạm của hệ thống
            uploadBasePath = Paths.get(System.getProperty("java.io.tmpdir"), "cinema-uploads").normalize();
            log.warn("Using fallback upload path: {}", uploadBasePath);
            try {
                Files.createDirectories(uploadBasePath.resolve("posters"));
                Files.createDirectories(uploadBasePath.resolve("trailers"));
                log.info("Fallback upload directories created successfully");
            } catch (IOException e2) {
                log.error("CRITICAL: Cannot create upload directories even at fallback path!", e2);
            }
        }

        // Kiểm tra quyền ghi vào thư mục (write permission)
        try {
            Path testFile = uploadBasePath.resolve(".write-test");
            Files.writeString(testFile, "ok");
            Files.deleteIfExists(testFile);
            log.info("Upload directory is writable");
        } catch (IOException e) {
            log.error("Upload directory is NOT writable: {}", uploadBasePath, e);
        }
    }

     /** Lấy đường dẫn gốc của thư mục upload đã được xử lý (dùng cho WebConfig). */
    public Path getUploadBasePath() {
        return uploadBasePath;
    }

    @PostMapping("/api/v1/admin/upload/image")
    @Operation(summary = "Upload anh poster (Admin)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File trong"));
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Anh khong duoc vuot qua 10MB"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chi chap nhan file anh (jpg, png, webp,...)"));
        }

        try {
            String url = saveFile(file, "posters");
            return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url)));
        } catch (IOException e) {
            log.error("Upload image failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Loi luu anh: " + e.getMessage()));
        }
    }

    @PostMapping("/api/v1/admin/upload/video")
    @Operation(summary = "Upload video trailer (Admin)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File trong"));
        }
        if (file.getSize() > MAX_VIDEO_SIZE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Video khong duoc vuot qua 100MB"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chi chap nhan file video (mp4, webm,...)"));
        }

        try {
            String url = saveFile(file, "trailers");
            return ResponseEntity.ok(ApiResponse.ok(Map.of("url", url)));
        } catch (IOException e) {
            log.error("Upload video failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Loi luu video: " + e.getMessage()));
        }
    }

    private String saveFile(MultipartFile file, String subfolder) throws IOException {
        Path dirPath = uploadBasePath.resolve(subfolder);

        // Đảm bảo thư mục tồn tại (kiểm tra lại cho an toàn)
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + ext;
        Path filePath = dirPath.resolve(fileName);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("File uploaded: {} -> {} (size={}KB)", originalName, filePath, file.getSize() / 1024);
        return "/uploads/" + subfolder + "/" + fileName;
    }
}
