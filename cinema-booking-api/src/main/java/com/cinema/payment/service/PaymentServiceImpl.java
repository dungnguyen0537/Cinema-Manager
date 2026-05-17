package com.cinema.payment.service;

import com.cinema.booking.entity.BookingEntity;
import com.cinema.booking.repository.BookingDao;
import com.cinema.booking.service.BookingService;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.payment.entity.PaymentEntity;
import com.cinema.payment.repository.PaymentDao;
import com.cinema.ticket.service.TicketService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

/**
 * Service xá»­ lÃ½ vÃ²ng Ä‘á»i thanh toÃ¡n.
 *
 * Flow:
 * 1. Customer creates booking -> gets QR code URL
 * 2. Customer scans QR and transfers money via banking app
 * 3. System polls MB Bank history (dvsteam.vn) to detect transfer
 * 4. We verify and match the payment to a booking
 * 5. Confirm booking + generate ticket
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentDao paymentDao;
    private final BookingDao bookingDao;
    private final BookingService bookingService;
    private final TicketService ticketService;
    private final MbbankService mbbankService;
    private final ObjectMapper objectMapper;

    /**
     * Khá»Ÿi táº¡o thanh toÃ¡n - táº¡o URL mÃ£ QR cho booking.
     */
    @Transactional
    public PaymentEntity initiatePayment(Long bookingId) {
        BookingEntity booking = bookingDao.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!"PENDING_PAYMENT".equals(booking.getStatus())) {
            throw new BusinessException(ErrorCode.BOOKING_INVALID_STATUS,
                    "Booking must be in PENDING_PAYMENT status");
        }

        // Táº¡o mÃ£ thanh toÃ¡n
        String paymentCode = "PAY" + System.currentTimeMillis() + String.format("%04d", new Random().nextInt(10000));
        String qrUrl = mbbankService.generateQrUrl(booking.getFinalAmount(), booking.getBookingCode());

        PaymentEntity payment = PaymentEntity.builder()
                .booking(booking)
                .paymentCode(paymentCode)
                .provider("MBBANK")
                .amount(booking.getFinalAmount())
                .status("PENDING")
                .qrContent(qrUrl)
                .build();

        payment = paymentDao.save(payment);
        log.info("Payment initiated: {} for booking {} (amount={})",
                paymentCode, booking.getBookingCode(), booking.getFinalAmount());

        return payment;
    }

    /**
     * Xá»­ lÃ½ duyá»‡t thanh toÃ¡n tá»« bank API (polling hoáº·c callback).
     * Method nÃ y cháº¡y trong 1 transaction riÃªng biá»‡t â€” Ä‘áº£m báº£o atomic:
     * save payment + confirm booking + generate ticket.
     *
     * @return true náº¿u duyá»‡t thÃ nh cÃ´ng
     */
    @Transactional
    public boolean approvePayment(String bankTransactionId, BigDecimal amount, String bookingCode) {
        log.info(">>> approvePayment: txId={}, amount={}, bookingCode={}", bankTransactionId, amount, bookingCode);

        // 1. Kiá»ƒm tra transaction Ä‘Ã£ xá»­ lÃ½ chÆ°a
        if (bankTransactionId != null && paymentDao.existsByBankTransactionId(bankTransactionId)) {
            log.info("Giao dá»‹ch {} Ä‘Ã£ xá»­ lÃ½ rá»“i, bá» qua", bankTransactionId);
            return false;
        }

        // 2. TÃ¬m booking
        Optional<BookingEntity> bookingOpt = bookingDao.findByBookingCode(bookingCode);
        if (bookingOpt.isEmpty()) {
            log.warn("KhÃ´ng tÃ¬m tháº¥y booking code '{}' trong DB", bookingCode);
            return false;
        }

        BookingEntity booking = bookingOpt.get();
        log.info("TÃ¬m tháº¥y booking #{} (code={}, status={}, paymentStatus={}, finalAmount={})",
                booking.getId(), bookingCode, booking.getStatus(), booking.getPaymentStatus(), booking.getFinalAmount());

        // 3. Kiá»ƒm tra status
        if (!"PENDING_PAYMENT".equals(booking.getStatus()) && !"HOLDING".equals(booking.getStatus())) {
            log.warn("Booking {} status='{}' khÃ´ng há»£p lá»‡ (cáº§n PENDING_PAYMENT hoáº·c HOLDING)", bookingCode, booking.getStatus());
            return false;
        }

        // 4. Kiá»ƒm tra sá»‘ tiá»n
        if (booking.getFinalAmount() != null && booking.getFinalAmount().compareTo(amount) > 0) {
            log.warn("Sá»‘ tiá»n khÃ´ng Ä‘á»§ cho booking {}: cáº§n {}, nháº­n {}", bookingCode, booking.getFinalAmount(), amount);
            return false;
        }

        // 5. Táº¡o payment record
        String payCode = "MB" + (bankTransactionId != null ? bankTransactionId : System.currentTimeMillis());
        PaymentEntity payment = PaymentEntity.builder()
                .booking(booking)
                .paymentCode(payCode)
                .provider("MBBANK")
                .bankTransactionId(bankTransactionId)
                .amount(amount)
                .status("SUCCESS")
                .paidAt(LocalDateTime.now())
                .build();
        paymentDao.save(payment);

        // 6. Confirm booking
        bookingService.confirmPayment(booking.getId());

        // 7. Generate ticket
        ticketService.generateTicket(booking.getId());

        log.info("âœ… Booking {} Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t thÃ nh cÃ´ng! txId={}, amount={}", bookingCode, bankTransactionId, amount);
        return true;
    }

    @Transactional(readOnly = true)
    public PaymentEntity getPaymentStatus(Long bookingId) {
        return paymentDao.findFirstByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, "SUCCESS")
                .or(() -> paymentDao.findFirstByBookingIdAndStatusOrderByCreatedAtDesc(bookingId, "PENDING"))
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));
    }
}

