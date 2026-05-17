package com.cinema.booking.service;

import com.cinema.booking.dto.*;
import java.util.List;

public interface BookingService {
    BookingDto holdSeats(Long userId, HoldSeatsRequest request);
    BookingDto createBooking(Long userId, CreateBookingRequest request);
    void cancelBooking(Long userId, Long bookingId);
    BookingDto getBooking(Long userId, Long bookingId);
    List<BookingDto> getUserBookings(Long userId, int page, int size);
    List<BookingDto> getAllBookings(int page, int size);
    BookingDto getBookingAdmin(Long bookingId);
    void confirmPayment(Long bookingId);
}
