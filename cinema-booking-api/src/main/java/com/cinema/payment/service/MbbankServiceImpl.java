package com.cinema.payment.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MbbankServiceImpl implements MbbankService {

    @Value("${app.payment.mbbank.token:}")
    private String apiToken;

    @Value("${app.payment.mbbank.account-number:}")
    private String accountNumber;

    @Value("${app.payment.mbbank.account-name:}")
    private String accountName;

    private final RestTemplate restTemplate;


    public MbbankServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generate VietQR URL for MB Bank.
     */
    public String generateQrUrl(BigDecimal amount, String bookingCode) {
        return String.format("https://img.vietqr.io/image/mbbank-%s-compact.png?amount=%s&addInfo=CGV%s&accountName=%s",
                accountNumber,
                amount.toBigInteger().toString(),
                bookingCode,
                accountName.replace(" ", "%20"));
    }

    /**
     * Fetch transaction history from DVSTEAM API.
     * API: GET https://api.dvsteam.vn/api/historymbbank/{token}
     */
    @SuppressWarnings("unchecked")
    public List<MbbankTransaction> fetchHistory() {
        if (apiToken == null || apiToken.isBlank()) {
            log.warn("MBBANK_API_TOKEN chưa được cấu hình!");
            return new ArrayList<>();
        }

        String url = "https://api.dvsteam.vn/api/historymbbank/" + apiToken;
        try {
            log.info("Fetching MB Bank history from: {}", url);

            // Thêm headers giống trình duyệt để tránh bị Cloudflare chặn
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "vi-VN,vi;q=0.9,en;q=0.8");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response == null) {
                log.warn("DVSTEAM API trả về null response");
                return new ArrayList<>();
            }

            // Log toàn bộ response structure để debug
            log.info("DVSTEAM response keys: {}", response.keySet());
            log.info("DVSTEAM response (truncated): {}", truncate(response.toString(), 500));

            // Kiểm tra status - hỗ trợ cả boolean true, string "success", string "true", int 1
            Object statusObj = response.get("status");
            boolean isSuccess = false;
            if (statusObj instanceof Boolean) {
                isSuccess = (Boolean) statusObj;
            } else if (statusObj instanceof String) {
                String s = ((String) statusObj).toLowerCase();
                isSuccess = "success".equals(s) || "true".equals(s) || "ok".equals(s) || "1".equals(s);
            } else if (statusObj instanceof Number) {
                isSuccess = ((Number) statusObj).intValue() == 1 || ((Number) statusObj).intValue() == 200;
            }

            if (!isSuccess) {
                log.warn("DVSTEAM API status không thành công: status={}, message={}", statusObj, response.get("message"));
                return new ArrayList<>();
            }

            // Lấy data - thử nhiều cấu trúc phổ biến
            List<Map<String, Object>> dataList = extractDataList(response);
            if (dataList == null || dataList.isEmpty()) {
                log.info("Không có giao dịch mới từ DVSTEAM");
                return new ArrayList<>();
            }

            // Log sample transaction để debug field mapping
            log.info("DVSTEAM total transactions: {}", dataList.size());
            if (!dataList.isEmpty()) {
                log.info("DVSTEAM sample transaction keys: {}", dataList.get(0).keySet());
                log.info("DVSTEAM sample transaction: {}", truncate(dataList.get(0).toString(), 300));
            }

            List<MbbankTransaction> transactions = new ArrayList<>();
            for (Map<String, Object> item : dataList) {
                try {
                    MbbankTransaction tx = parseTransaction(item);
                    if (tx != null) {
                        transactions.add(tx);
                    }
                } catch (Exception e) {
                    log.warn("Lỗi parse transaction: {}", e.getMessage());
                }
            }

            log.info("Parsed {} giao dịch hợp lệ từ DVSTEAM", transactions.size());
            return transactions;

        } catch (Exception e) {
            log.error("Lỗi kết nối DVSTEAM API: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Parse a single transaction from DVSTEAM response.
     * Hỗ trợ nhiều field name khác nhau tùy version API.
     */
    private MbbankTransaction parseTransaction(Map<String, Object> item) {
        MbbankTransaction tx = new MbbankTransaction();

        // Transaction ID
        String txId = firstNonNull(item,
                "id", "transactionId", "transaction_id", "transId", "trans_id",
                "refNo", "reference", "idFT", "FTCode");
        if (txId == null) {
            log.debug("Skip transaction - no ID: {}", item);
            return null;
        }
        tx.setTransactionId(String.valueOf(txId));

        // Amount (credit/incoming)
        BigDecimal amount = parseAmount(item,
                "creditAmount", "credit_amount", "amount", "money",
                "value", "creditValue", "credit_value");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("Skip transaction {} - no valid amount", txId);
            return null;
        }
        tx.setAmount(amount);

        // Description / Content
        String desc = firstNonNull(item,
                "description", "content", "des", "memo", "detail",
                "transDesc", "trans_desc", "remark", "note", "narration",
                "addDescription", "add_description");
        tx.setDescription(desc != null ? desc : "");

        // Time
        String time = firstNonNull(item,
                "transactionDate", "transaction_date", "time", "date",
                "transDate", "trans_date", "createdAt", "created_at", "txDate");
        tx.setTime(time);

        log.debug("Parsed: id={}, amount={}, desc='{}'", txId, amount, desc);
        return tx;
    }

    /**
     * Extract transaction list from various DVSTEAM response structures.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractDataList(Map<String, Object> response) {
        // Cấu trúc 1: { "data": [...] }
        Object data = response.get("data");
        if (data instanceof List) {
            return (List<Map<String, Object>>) data;
        }

        // Cấu trúc 2: { "data": { "transactions": [...] } }
        if (data instanceof Map) {
            Map<String, Object> dataMap = (Map<String, Object>) data;
            for (String key : new String[]{"transactions", "TranList", "tranList", "list", "items", "records"}) {
                Object inner = dataMap.get(key);
                if (inner instanceof List) {
                    return (List<Map<String, Object>>) inner;
                }
            }
            // Nếu data là Map nhưng không có nested list, thử wrap nó thành list
            log.info("DVSTEAM data is Map with keys: {}", dataMap.keySet());
        }

        // Cấu trúc 3: { "transactions": [...] } (top-level)
        for (String key : new String[]{"transactions", "TranList", "tranList", "list", "items", "records", "result"}) {
            Object obj = response.get(key);
            if (obj instanceof List) {
                return (List<Map<String, Object>>) obj;
            }
        }

        log.warn("Không tìm thấy danh sách giao dịch trong response. Keys: {}", response.keySet());
        return null;
    }

    private BigDecimal parseAmount(Map<String, Object> item, String... keys) {
        for (String key : keys) {
            Object val = item.get(key);
            if (val != null && !"null".equals(String.valueOf(val))) {
                try {
                    String cleaned = String.valueOf(val).replaceAll("[^0-9.]", "");
                    if (!cleaned.isEmpty()) {
                        BigDecimal amount = new BigDecimal(cleaned);
                        if (amount.compareTo(BigDecimal.ZERO) > 0) {
                            return amount;
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private String firstNonNull(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val != null && !"null".equals(String.valueOf(val)) && !String.valueOf(val).isBlank()) {
                return String.valueOf(val);
            }
        }
        return null;
    }

    private String truncate(String s, int maxLen) {
        return s.length() > maxLen ? s.substring(0, maxLen) + "..." : s;
    }
}
