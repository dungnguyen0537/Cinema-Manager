package com.cinema.movie.controller;

import com.cinema.common.ApiResponse;
import com.cinema.movie.entity.GenreEntity;
import com.cinema.movie.repository.GenreDao;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Genres", description = "Thá»ƒ loáº¡i phim")
public class GenreController {

    private final GenreDao genreDao;

    @GetMapping("/api/v1/genres")
    @Operation(summary = "Danh sÃ¡ch thá»ƒ loáº¡i (public)")
    public ResponseEntity<ApiResponse<List<GenreEntity>>> getGenres() {
        return ResponseEntity.ok(ApiResponse.ok(genreDao.findAll()));
    }

    @PostMapping("/api/v1/admin/genres")
    @Operation(summary = "ThÃªm thá»ƒ loáº¡i (Admin)")
    public ResponseEntity<ApiResponse<GenreEntity>> createGenre(@RequestBody GenreEntity genre) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(genreDao.save(genre)));
    }
}

