package com.cinema.payment.scheduler;

import com.cinema.payment.service.MbbankService;
import com.cinema.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Scheduler polling DVSTEAM API mỗi 30 giây để kiểm tra giao dịch MB Bank.
 *
 * KHÔNG dùng @Transactional ở đây — mỗi payment được xử lý bởi
 * PaymentService.approvePayment() trong transaction riêng biệt.
 * Nếu 1 booking fail, các booking khác vẫn được xử lý bình thường.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentScheduler {

    private final MbbankService mbbankService;
    private final PaymentService paymentService;

    private static final Pattern CGV_PATTERN = Pattern.compile("CGV(\\d{8})", Pattern.CASE_INSENSITIVE);
    private static final Pattern NUMERIC_8_PATTERN = Pattern.compile("(?<!\\d)(\\d{8})(?!\\d)");

    @Scheduled(fixedRate = 30000) // 30 giây
    public void checkBankTransactions() {
        log.info("=== POLL: Kiểm tra giao dịch MB Bank ===");

        List<MbbankService.MbbankTransaction> transactions;
        try {
            transactions = mbbankService.fetchHistory();
        } catch (Exception e) {
            log.error("Lỗi lấy lịch sử giao dịch: {}", e.getMessage());
            return;
        }

        if (transactions.isEmpty()) {
            log.info("Không có giao dịch mới");
            return;
        }

        log.info("Đang xử lý {} giao dịch", transactions.size());
        int matched = 0, skipped = 0;

        for (MbbankService.MbbankTransaction tx : transactions) {
            try {
                String txId = tx.getTransactionId();
                String description = tx.getDescription();

                log.info("TX: id={}, amount={}, desc='{}'", txId, tx.getAmount(), description);

                if (description == null || description.isBlank()) {
                    log.debug("Bỏ qua TX {} - không có description", txId);
                    skipped++;
                    continue;
                }

                // Tìm booking code trong description
                String bookingCode = extractBookingCode(description);
                if (bookingCode == null) {
                    log.debug("Bỏ qua TX {} - không tìm thấy booking code trong: '{}'", txId, description);
                    skipped++;
                    continue;
                }

                // Gọi service để xử lý payment (trong transaction riêng)
                boolean approved = paymentService.approvePayment(txId, tx.getAmount(), bookingCode);
                if (approved) {
                    matched++;
                } else {
                    skipped++;
                }

            } catch (Exception e) {
                log.error("Lỗi xử lý giao dịch {}: {}", tx.getTransactionId(), e.getMessage());
                skipped++;
            }
        }

        log.info("=== KẾT QUẢ: {} duyệt, {} bỏ qua ===", matched, skipped);
    }

    private String extractBookingCode(String description) {
        String normalized = description.toUpperCase().replaceAll("\\s+", "");

        // Pattern 1: CGV + 8 digits
        Matcher cgvMatcher = CGV_PATTERN.matcher(normalized);
        if (cgvMatcher.find()) {
            return cgvMatcher.group(1);
        }

        // Pattern 2: any 8-digit number
        Matcher numericMatcher = NUMERIC_8_PATTERN.matcher(normalized);
        if (numericMatcher.find()) {
            return numericMatcher.group(1);
        }

        return null;
    }
}
