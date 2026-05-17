package com.cinema.ticket.service;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.booking.entity.BookingSeatEntity;
import com.cinema.booking.repository.BookingDao;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.ticket.entity.TicketEntity;
import com.cinema.ticket.repository.TicketDao;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketDao ticketDao;
    private final BookingDao bookingDao;

    /**
     * Táº¡o vÃ© Ä‘iá»‡n tá»­ cho booking Ä‘Ã£ xÃ¡c nháº­n thanh toÃ¡n.
     * Má»—i booking táº¡o 1 vÃ© (bao gá»“m táº¥t cáº£ gháº¿).
     */
    @Transactional
    public TicketEntity generateTicket(Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // Kiá»ƒm tra vÃ© Ä‘Ã£ tá»“n táº¡i chÆ°a
        List<TicketEntity> existing = ticketDao.findByBookingId(bookingId);
        if (!existing.isEmpty()) {
            log.info("Ticket already exists for booking {}", bookingId);
            return existing.get(0);
        }

        String ticketCode = generateTicketCode();

        // Táº¡o ná»™i dung QR vá»›i thÃ´ng tin vÃ©
        StringBuilder qrContent = new StringBuilder();
        qrContent.append("TICKET:").append(ticketCode).append("\n");
        qrContent.append("BOOKING:").append(booking.getBookingCode()).append("\n");
        qrContent.append("MOVIE:").append(booking.getShowtime().getMovie().getTitle()).append("\n");
        qrContent.append("CINEMA:").append(booking.getShowtime().getRoom().getCinema().getName()).append("\n");
        qrContent.append("ROOM:").append(booking.getShowtime().getRoom().getName()).append("\n");
        qrContent.append("TIME:").append(booking.getShowtime().getStartTime()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("\n");
        qrContent.append("SEATS:");
        for (BookingSeatEntity bs : booking.getBookingSeats()) {
            qrContent.append(bs.getSeat().getRowName()).append(bs.getSeat().getSeatNumber()).append(",");
        }
        qrContent.append("\n");
        qrContent.append("AMOUNT:").append(booking.getFinalAmount());

        // Táº¡o mÃ£ QR dáº¡ng áº£nh Base64
        String qrBase64 = generateQrCodeBase64(qrContent.toString());

        TicketEntity ticket = TicketEntity.builder()
                .booking(booking)
                .ticketCode(ticketCode)
                .qrCode(qrBase64)
                .issuedAt(LocalDateTime.now())
                .status("ISSUED")
                .build();

        ticket = ticketDao.save(ticket);
        log.info("Ticket generated: {} for booking {}", ticketCode, booking.getBookingCode());
        return ticket;
    }

    @Transactional(readOnly = true)
    public TicketEntity getTicket(Long ticketId) {
        TicketEntity ticket = ticketDao.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TICKET_NOT_FOUND));
        populateBooking(ticket);
        return ticket;
    }

    @Transactional(readOnly = true)
    public TicketEntity getTicketByCode(String ticketCode) {
        TicketEntity ticket = ticketDao.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TICKET_NOT_FOUND));
        populateBooking(ticket);
        return ticket;
    }

    @Transactional(readOnly = true)
    public List<TicketEntity> getUserTickets(Long userId) {
        List<TicketEntity> tickets = ticketDao.findByBookingUserIdOrderByIssuedAtDesc(userId);
        tickets.forEach(this::populateBooking);
        return tickets;
    }

    /**
     * Load đầy đủ booking associations (user, showtime→movie, room→cinema, bookingSeats→seats)
     * vì TicketRowMapper chỉ tạo BookingEntity shell với ID.
     */
    private void populateBooking(TicketEntity ticket) {
        if (ticket.getBooking() != null && ticket.getBooking().getId() != null) {
            bookingDao.findById(ticket.getBooking().getId())
                    .ifPresent(ticket::setBooking);
        }
    }

    /**
     * ÄÃ¡nh dáº¥u vÃ© Ä‘Ã£ sá»­ dá»¥ng (nhÃ¢n viÃªn soÃ¡t vÃ© táº¡i cá»•ng ráº¡p).
     */
    @Transactional
    public void useTicket(String ticketCode) {
        TicketEntity ticket = ticketDao.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.TICKET_NOT_FOUND));

        if ("USED".equals(ticket.getStatus())) {
            log.warn("Ticket {} already used", ticketCode);
            return;
        }
        ticket.setStatus("USED");
        ticketDao.save(ticket);
        log.info("Ticket used: {}", ticketCode);
    }

    private String generateTicketCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%06d", new Random().nextInt(1000000));
        return "TKT-" + timestamp + "-" + random;
    }

    private String generateQrCodeBase64(String content) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, 300, 300);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            return null;
        }
    }
}

