package com.cinema.ticket.service;

import com.cinema.ticket.entity.TicketEntity;
import java.util.List;

public interface TicketService {
    TicketEntity generateTicket(Long bookingId);
    TicketEntity getTicket(Long ticketId);
    TicketEntity getTicketByCode(String ticketCode);
    List<TicketEntity> getUserTickets(Long userId);
    void useTicket(String ticketCode);
}
