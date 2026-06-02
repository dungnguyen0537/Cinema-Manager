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

        // Also add total payments for backwards compatibility
        summary.put("totalPayments", totalBookings);

        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/revenue-report")
    @Operation(summary = "Get filtered revenue report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start;
        LocalDateTime end;
        
        if (startDate != null && !startDate.isEmpty()) {
            start = java.time.LocalDate.parse(startDate).atStartOfDay();
        } else {
            start = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            end = java.time.LocalDate.parse(endDate).atTime(23, 59, 59, 999999999);
        } else {
            end = LocalDateTime.now();
        }
        
        BigDecimal totalRevenue = bookingDao.sumRevenueBetween(start, end);
        long totalBookings = bookingDao.countCompletedBetween(start, end);
        
        List<Map<String, Object>> rawChartData = bookingDao.getDailyRevenueBetween(start, end);
        
        List<Map<String, Object>> chartData = new ArrayList<>();
        java.time.LocalDate sDate = start.toLocalDate();
        java.time.LocalDate eDate = end.toLocalDate();
        Map<String, BigDecimal> revenueMap = new HashMap<>();
        for (Map<String, Object> item : rawChartData) {
            String dateStr = item.get("date").toString();
            revenueMap.put(dateStr, (BigDecimal) item.get("revenue"));
        }
        
        for (java.time.LocalDate d = sDate; !d.isAfter(eDate); d = d.plusDays(1)) {
            String dStr = d.toString();
            BigDecimal rev = revenueMap.getOrDefault(dStr, BigDecimal.ZERO);
            
            String label = String.format("%02d/%02d", d.getDayOfMonth(), d.getMonthValue());
            Map<String, Object> m = new HashMap<>();
            m.put("label", label);
            m.put("date", dStr);
            m.put("revenue", rev);
            chartData.add(m);
        }
        
        List<com.cinema.booking.entity.BookingEntity> bookings = bookingDao.findBookingsBetween(start, end);
        List<Map<String, Object>> bookingList = new ArrayList<>();
        for (com.cinema.booking.entity.BookingEntity b : bookings) {
            Map<String, Object> bm = new HashMap<>();
            bm.put("bookingCode", b.getBookingCode());
            bm.put("createdAt", b.getCreatedAt().toString());
            bm.put("customerName", b.getUser() != null ? b.getUser().getFullName() : "Khách vãng lai");
            bm.put("movieTitle", b.getShowtime() != null && b.getShowtime().getMovie() != null ? b.getShowtime().getMovie().getTitle() : "Phim");
            bm.put("roomName", b.getShowtime() != null && b.getShowtime().getRoom() != null ? b.getShowtime().getRoom().getName() : "Phòng");
            bm.put("showtimeStart", b.getShowtime() != null ? b.getShowtime().getStartTime().toString() : "");
            bm.put("finalAmount", b.getFinalAmount());
            bookingList.add(bm);
        }
        
        Map<String, Object> report = new HashMap<>();
        report.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        report.put("totalBookings", totalBookings);
        report.put("chartData", chartData);
        report.put("bookings", bookingList);
        
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/monthly")
    @Operation(summary = "Get monthly revenue reports")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyReport() {
        return ResponseEntity.ok(ApiResponse.ok(bookingDao.getMonthlyRevenue()));
    }
}
