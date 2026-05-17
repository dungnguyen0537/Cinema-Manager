package com.cinema.payment.service;

import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

public interface MbbankService {
    String generateQrUrl(BigDecimal amount, String bookingCode);
    List<MbbankTransaction> fetchHistory();

    @Data
    class MbbankTransaction {
        private String transactionId;
        private BigDecimal amount;
        private String description;
        private String time;
    }
}
