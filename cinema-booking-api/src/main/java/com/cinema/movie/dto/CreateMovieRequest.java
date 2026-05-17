package com.cinema.movie.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class CreateMovieRequest {

    @NotBlank(message = "Tên phim không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Thời lượng phim không được để trống")
    @Min(value = 1, message = "Thời lượng phim tối thiểu 1 phút")
    private Integer durationMinutes;

    private String language;
    private String subtitle;
    private String ageRating;
    private String director;
    private String cast;
    private String posterUrl;
    private String trailerUrl;
    private LocalDate releaseDate;
    private String status;
    private Set<Long> genreIds;
}
