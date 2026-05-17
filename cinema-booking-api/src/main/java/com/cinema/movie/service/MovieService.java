package com.cinema.movie.service;

import com.cinema.common.PageResponse;
import com.cinema.movie.dto.CreateMovieRequest;
import com.cinema.movie.dto.MovieDto;

public interface MovieService {
    PageResponse<MovieDto> getMovies(String status, String search, int page, int size);
    MovieDto getMovie(Long id);
    MovieDto createMovie(CreateMovieRequest request);
    MovieDto updateMovie(Long id, CreateMovieRequest request);
    void deleteMovie(Long id);
}
