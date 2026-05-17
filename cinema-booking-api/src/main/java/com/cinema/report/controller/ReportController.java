package com.cinema.report.controller;

import com.cinema.booking.repository.BookingDao;
import com.cinema.common.ApiResponse;
import com.cinema.payment.repository.PaymentDao;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Revenue reports (Admin)")
public class ReportController {

    private final BookingDao bookingDao;
    private final PaymentDao paymentDao;

    @GetMapping("/summary")
    @Operation(summary = "Report summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        long totalBookings = bookingDao.count();
        BigDecimal totalRevenue = bookingDao.sumTotalRevenue();
        BigDecimal dailyRevenue = bookingDao.sumRevenueBetween(startOfDay, now);
        BigDecimal monthlyRevenue = bookingDao.sumRevenueBetween(startOfMonth, now);
        long dailyBookings = bookingDao.countCompletedBetween(startOfDay, now);

        // Chart data for days in current month
        List<Map<String, Object>> chartData = new ArrayList<>();
        int currentDay = now.getDayOfMonth();
        for (int i = 1; i <= currentDay; i++) {
            LocalDateTime dayStart = now.withDayOfMonth(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1).minusNanos(1);
            BigDecimal revenue = bookingDao.sumRevenueBetween(dayStart, dayEnd);
            chartData.add(Map.of(
                "label", "Ng\u00e0y " + i,
                "revenue", revenue != null ? revenue : 0
            ));
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalBookings", totalBookings);
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : 0);
        summary.put("dailyRevenue", dailyRevenue != null ? dailyRevenue : 0);
        summary.put("monthlyRevenue", monthlyRevenue != null ? monthlyRevenue : 0);
        summary.put("dailyBookings", dailyBookings);
        summary.put("chartData", chartData);

        return ResponseEntity.ok(ApiResponse.ok(summary));
    }
}
