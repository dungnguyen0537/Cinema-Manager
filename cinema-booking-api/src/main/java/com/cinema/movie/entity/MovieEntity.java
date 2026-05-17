package com.cinema.movie.entity;

import com.cinema.common.BaseEntity;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieEntity extends BaseEntity {

        private String title;

        private String description;

        private Integer durationMinutes;

        private String language;

        private String subtitle;

        private String ageRating;

        private String posterUrl;

        private String trailerUrl;

        private LocalDate releaseDate;

        private String director;

        private String cast;

        @Builder.Default
    private String status = "COMING_SOON"; // COMING_SOON, NOW_SHOWING, ENDED

            @Builder.Default
    private Set<GenreEntity> genres = new HashSet<>();
}

