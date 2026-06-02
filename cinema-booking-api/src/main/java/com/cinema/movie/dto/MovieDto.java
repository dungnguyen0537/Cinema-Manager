package com.cinema.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieDto {
    private Long id;
    private String title;
    private String description;
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
    private Set<String> genres;
    private java.time.LocalDateTime createdAt;
}
