package com.cinema.ticket.repository;

import com.cinema.ticket.entity.TicketEntity;
import java.util.List;
import java.util.Optional;

public interface TicketDao {
    TicketEntity save(TicketEntity entity);
    Optional<TicketEntity> findById(Long id);
    List<TicketEntity> findAll();
    void deleteById(Long id);
    Optional<TicketEntity> findByTicketCode(String ticketCode);
    List<TicketEntity> findByBookingId(Long bookingId);
    List<TicketEntity> findByBookingUserIdOrderByIssuedAtDesc(Long userId);
}
