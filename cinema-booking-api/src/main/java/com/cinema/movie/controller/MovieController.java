package com.cinema.movie.controller;

import com.cinema.common.ApiResponse;
import com.cinema.common.PageResponse;
import com.cinema.movie.dto.CreateMovieRequest;
import com.cinema.movie.dto.MovieDto;
import com.cinema.movie.service.MovieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Movies", description = "Quản lý phim")
public class MovieController {

    private final MovieService movieService;

    // === CÁC API CÔNG KHAI (Public) ===

    @GetMapping("/api/v1/movies")
    @Operation(summary = "Danh sách phim (public)")
    public ResponseEntity<ApiResponse<PageResponse<MovieDto>>> getMovies(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.getMovies(status, search, page, size)));
    }

    @GetMapping("/api/v1/movies/{id}")
    @Operation(summary = "Chi tiết phim (public)")
    public ResponseEntity<ApiResponse<MovieDto>> getMovie(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.getMovie(id)));
    }

    // === CÁC API QUẢN TRỊ (Admin) ===

    @PostMapping("/api/v1/admin/movies")
    @Operation(summary = "Thêm phim mới (Admin)")
    public ResponseEntity<ApiResponse<MovieDto>> createMovie(@Valid @RequestBody CreateMovieRequest request) {
        MovieDto movie = movieService.createMovie(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(movie));
    }

    @PutMapping("/api/v1/admin/movies/{id}")
    @Operation(summary = "Cập nhật phim (Admin)")
    public ResponseEntity<ApiResponse<MovieDto>> updateMovie(@PathVariable Long id,
                                                              @Valid @RequestBody CreateMovieRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(movieService.updateMovie(id, request)));
    }

    @DeleteMapping("/api/v1/admin/movies/{id}")
    @Operation(summary = "Xóa phim - soft delete (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Xóa phim thành công"));
    }
}
