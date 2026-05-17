package com.cinema.movie.service;

import com.cinema.common.PageResponse;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.movie.dto.CreateMovieRequest;
import com.cinema.movie.dto.MovieDto;
import com.cinema.movie.entity.GenreEntity;
import com.cinema.movie.entity.MovieEntity;
import com.cinema.movie.repository.GenreDao;
import com.cinema.movie.repository.MovieDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieDao movieDao;
    private final GenreDao genreDao;

    @Transactional(readOnly = true)
    public PageResponse<MovieDto> getMovies(String status, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MovieEntity> moviePage = movieDao.findWithFilters(status, search, pageable);

        return PageResponse.<MovieDto>builder()
                .content(moviePage.getContent().stream().map(this::toDto).collect(Collectors.toList()))
                .pageNumber(moviePage.getNumber())
                .pageSize(moviePage.getSize())
                .totalElements(moviePage.getTotalElements())
                .totalPages(moviePage.getTotalPages())
                .first(moviePage.isFirst())
                .last(moviePage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public MovieDto getMovie(Long id) {
        MovieEntity movie = movieDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MOVIE_NOT_FOUND));
        return toDto(movie);
    }

    @Transactional
    public MovieDto createMovie(CreateMovieRequest request) {
        MovieEntity movie = MovieEntity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .language(request.getLanguage())
                .subtitle(request.getSubtitle())
                .ageRating(request.getAgeRating())
                .director(request.getDirector())
                .cast(request.getCast())
                .posterUrl(request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .releaseDate(request.getReleaseDate())
                .status(request.getStatus() != null ? request.getStatus() : "COMING_SOON")
                .build();

        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            Set<GenreEntity> genres = new HashSet<>(genreDao.findAllById(request.getGenreIds()));
            movie.setGenres(genres);
        }

        movie = movieDao.save(movie);
        log.info("Movie created: {} (id={})", movie.getTitle(), movie.getId());
        return toDto(movie);
    }

    @Transactional
    public MovieDto updateMovie(Long id, CreateMovieRequest request) {
        MovieEntity movie = movieDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MOVIE_NOT_FOUND));

        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setLanguage(request.getLanguage());
        movie.setSubtitle(request.getSubtitle());
        movie.setAgeRating(request.getAgeRating());
        movie.setDirector(request.getDirector());
        movie.setCast(request.getCast());
        movie.setPosterUrl(request.getPosterUrl());
        movie.setTrailerUrl(request.getTrailerUrl());
        movie.setReleaseDate(request.getReleaseDate());
        if (request.getStatus() != null) movie.setStatus(request.getStatus());

        if (request.getGenreIds() != null) {
            Set<GenreEntity> genres = new HashSet<>(genreDao.findAllById(request.getGenreIds()));
            movie.setGenres(genres);
        }

        movie = movieDao.save(movie);
        log.info("Movie updated: {} (id={})", movie.getTitle(), movie.getId());
        return toDto(movie);
    }

    @Transactional
    public void deleteMovie(Long id) {
        MovieEntity movie = movieDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.MOVIE_NOT_FOUND));
        movie.setStatus("ENDED");
        movieDao.save(movie);
        log.info("Movie soft-deleted: id={}", id);
    }

    private MovieDto toDto(MovieEntity movie) {
        return MovieDto.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .durationMinutes(movie.getDurationMinutes())
                .language(movie.getLanguage())
                .subtitle(movie.getSubtitle())
                .ageRating(movie.getAgeRating())
                .director(movie.getDirector())
                .cast(movie.getCast())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .releaseDate(movie.getReleaseDate())
                .status(movie.getStatus())
                .genres(movie.getGenres().stream().map(GenreEntity::getName).collect(Collectors.toSet()))
                .build();
    }
}

