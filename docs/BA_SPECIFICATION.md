# 🎬 TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS & BA SPECIFICATION)
## DỰ ÁN: CINEMA 8 STAR — HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN

- **Mã hệ thống:** `CINEMA-MANAGER-2025`
- **Tác giả / Lead BA & System Architect:** Nguyễn Văn Dũng
- **Khoa / Trường:** Khoa Công nghệ Thông tin — Đại học Công nghiệp Hà Nội (HaUI)
- **Phiên bản:** `v1.3.0` (Cập nhật tháng 11/2026)

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Bối cảnh & Mục tiêu nghiệp vụ
Hệ thống bán vé rạp chiếu phim trực tuyến đòi hỏi tính toàn vẹn dữ liệu cực cao tại thời điểm người dùng chọn ghế và thanh toán. Vấn đề nhức nhối nhất của các rạp phim là **xung đột ghế (Seat Concurrency Conflict)**: khi có 2 hoặc nhiều khách hàng cùng bấm chọn 1 vị trí ghế VIP trong cùng một phần nghìn giây.

### 1.2. Giải pháp cốt lõi
Thiết kế quy trình nghiệp vụ hai bước: **Giữ chỗ tạm thời (Seat Locking với Redis TTL 5-10 phút)** kết hợp **Giao dịch thanh toán an toàn (ACID Transaction trên PostgreSQL)**, đảm bảo ghế đã giữ không bị người khác tranh chấp trong lúc thanh toán.

---

## 2. MA TRẬN PHÂN QUYỀN & SƠ ĐỒ USE CASE (USE CASE SPECIFICATION)

### 2.1. Phân quyền tác nhân (Role-Based Access Control)
- **Khách hàng (Customer / End-User):** Tra cứu phim, xem trailer, chọn rạp/suất chiếu, chọn ghế theo sơ đồ thời gian thực, áp dụng voucher khuyến mãi, thanh toán vé.
- **Nhân viên rạp (Staff / Cashier):** Xuất vé tại quầy (Box Office), quét mã QR vé vào phòng chiếu, hỗ trợ đổi trả vé theo quy định.
- **Quản trị viên (Cinema Admin):** Quản lý phim, cấu hình phòng chiếu & sơ đồ ghế, lên lịch suất chiếu (Showtime scheduling), quản lý mã giảm giá và xem báo cáo doanh thu.

### 2.2. Sơ đồ Use Case tổng quan

```mermaid
graph TD
    Cust((Khách hàng))
    Staff((Nhân viên quầy))
    Admin((Quản trị viên))

    subgraph Browsing [1. Tra cứu & Lựa chọn]
        Cust --> UC1[Tìm kiếm & Lọc phim theo ngày/thể loại]
        Cust --> UC2[Xem chi tiết phim & Lịch chiếu rạp]
    end

    subgraph BookingFlow [2. Đặt vé & Giữ ghế]
        Cust --> UC3[Xem sơ đồ ghế thời gian thực]
        Cust --> UC4[Khóa giữ ghế tạm thời - Hold Seat]
        Cust --> UC5[Áp dụng mã giảm giá / Voucher]
        Cust --> UC6[Thanh toán trực tuyến VNPay/Momo]
    end

    subgraph CounterDesk [3. Quầy vé & Kiểm soát]
        Staff --> UC7[Bán vé tại quầy - POS]
        Staff --> UC8[Quét mã QR Check-in vào rạp]
    end

    subgraph Management [4. Quản trị hệ thống]
        Admin --> UC9[Quản lý Phim & Danh mục]
        Admin --> UC10[Cấu hình Phòng chiếu & Ghế VIP/Thường]
        Admin --> UC11[Lập lịch Suất chiếu không trùng lặp]
        Admin --> UC12[Báo cáo doanh thu & Tỷ lệ lấp đầy ghế]
    end
```

---

## 3. LUỒNG NGHIỆP VỤ GIỮ GHẾ & THANH TOÁN (SEAT LOCKING ACTIVITY DIAGRAM)

```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng
    participant FE as Single Page App (Web)
    participant API as Spring Boot Backend
    participant Redis as Redis Cache (Distributed Lock)
    participant DB as PostgreSQL 16
    participant Pay as Cổng Thanh Toán

    User->>FE: Chọn ghế [G7, G8] trên sơ đồ phòng chiếu
    FE->>API: POST /api/v1/bookings/hold-seats { showtimeId, seatIds: [101, 102] }
    
    API->>Redis: SETNX lock:showtime:101 "userId" EX 300 (Khóa 5 phút)
    alt Ghế đã bị người khác giữ trước đó
        Redis-->>API: Trả về False (Seat already locked)
        API-->>FE: HTTP 409 Conflict ("Ghế đã được giữ bởi người khác")
        FE-->>User: Đổi màu ghế xám & Yêu cầu chọn vị trí khác
    else Khóa ghế thành công
        Redis-->>API: Trả về True (Lock acquired)
        API->>DB: Tạo bản ghi Booking trạng thái PENDING_PAYMENT
        API-->>FE: HTTP 200 OK { bookingId, holdExpiresIn: 300s }
        FE-->>User: Đổi màu ghế đỏ (Đang giữ) & Bắt đầu đếm ngược 5 phút
    end

    User->>FE: Bấm "Thanh Toán" & Chọn Cổng TT
    FE->>API: POST /api/v1/payments/create-url { bookingId }
    API->>Pay: Tạo phiên giao dịch
    Pay-->>User: Người dùng quét mã thanh toán

    alt Thanh toán thành công trong hạn 5 phút
        Pay-->>API: Webhook Instant Payment Notification (IPN) Thành công
        API->>DB: Cập nhật Booking = CONFIRMED, Sinh mã Vé (Ticket QR)
        API->>Redis: Xóa khóa tạm thời, đánh dấu Ghế = SOLD
        API-->>User: Gửi Email xác nhận & Mã vé điện tử
    else Quá 5 phút người dùng không thanh toán
        Note over Redis: Hết hạn TTL (Auto Expirations)
        Redis->>Redis: Tự động giải phóng khóa ghế
        API->>DB: Chuyển Booking = EXPIRED
        FE-->>User: Thông báo hết hạn phiên giữ vé
    end
```

---

## 4. MÔ HÌNH DỮ LIỆU THỰC THỂ QUAN HỆ (ERD CHUẨN 3NF)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : "có"
    ROLES ||--o{ USER_ROLES : "thuộc"
    MOVIES ||--o{ SHOWTIMES : "chiếu trong"
    ROOMS ||--o{ SHOWTIMES : "địa điểm"
    ROOMS ||--o{ SEATS : "chứa"
    SHOWTIMES ||--o{ BOOKINGS : "phục vụ"
    USERS ||--o{ BOOKINGS : "đặt"
    BOOKINGS ||--o{ TICKETS : "gồm các vé"
    SEATS ||--o{ TICKETS : "vị trí cho"
    BOOKINGS ||--o{ PAYMENTS : "thanh toán qua"

    MOVIES {
        bigint id PK
        string title "Tên phim"
        int duration_minutes "Thời lượng"
        string age_rating "Độ tuổi (P, C13, C18)"
        string status "ACTIVE | COMING_SOON"
    }

    ROOMS {
        bigint id PK
        string name "Tên phòng (Cinema 01)"
        int total_seats "Tổng số ghế"
        string screen_type "2D | 3D | IMAX"
    }

    SEATS {
        bigint id PK
        bigint room_id FK
        string seat_row "Hàng ghế (A-Z)"
        int seat_number "Số ghế (1-20)"
        string seat_type "REGULAR | VIP | COUPLE"
    }

    SHOWTIMES {
        bigint id PK
        bigint movie_id FK
        bigint room_id FK
        datetime start_time "Giờ chiếu"
        datetime end_time "Giờ kết thúc"
        decimal base_price "Giá vé cơ bản"
    }

    BOOKINGS {
        bigint id PK
        string booking_code UK "Mã đặt chỗ duy nhất"
        bigint user_id FK
        bigint showtime_id FK
        decimal total_amount "Tổng số tiền"
        string status "PENDING | CONFIRMED | CANCELLED | EXPIRED"
        datetime expires_at "Hạn giữ ghế"
    }

    TICKETS {
        bigint id PK
        bigint booking_id FK
        bigint seat_id FK
        decimal price "Giá vé thực tế"
        string qr_code "Mã QR soát vé"
        boolean is_checked_in "Trạng thái vào cửa"
    }

    PAYMENTS {
        bigint id PK
        bigint booking_id FK
        string payment_method "VNPAY | MOMO | CASH"
        string transaction_no "Mã tham chiếu ngân hàng"
        string payment_status "SUCCESS | FAILED"
    }
```

---

## 5. QUY TẮC NGHIỆP VỤ & ĐẶC TẢ API (BUSINESS RULES & API)

### 5.1. Quy tắc nghiệm thu (Business Rules)
1. **Quy tắc xếp lịch:** Hai suất chiếu cùng phòng phải cách nhau tối thiểu **15 phút** (Thời gian dọn phòng chiếu và phát quảng cáo dạo đầu).
2. **Quy tắc giữ chỗ (TTL Rule):** Thời gian giữ chỗ tối đa là **300 giây (5 phút)**. Nếu cổng thanh toán không phản hồi thành công trong thời gian này, ghế sẽ tự động mở lại cho người khác.
3. **Quy tắc giá vé:** 
   - Ghế VIP: Giá vé = `base_price` + 20%.
   - Ghế đôi (Couple): Giá vé = `base_price` * 2.
   - Suất chiếu sau 18:00 và cuối tuần phụ thu thêm 10%.

### 5.2. Danh sách API then chốt
- `GET /api/v1/movies/now-showing`: Danh sách phim đang chiếu kèm suất chiếu trong ngày.
- `GET /api/v1/showtimes/:id/seat-layout`: Lấy sơ đồ ghế kèm trạng thái thời gian thực (`AVAILABLE`, `HOLDING`, `BOOKED`).
- `POST /api/v1/bookings/hold-seats`: Khóa giữ ghế tạm thời trong 5 phút.
- `POST /api/v1/bookings/:id/confirm`: Xác nhận thanh toán và tạo mã vé QR.

---

## 6. YÊU CẦU PHI CHỨC NĂNG (NFR)
- **Tính toàn vẹn (Data Consistency):** Áp dụng mức cô lập giao dịch `READ_COMMITTED` kết hợp Distributed Lock trên Redis, ngăn ngừa 100% tình trạng over-booking (bán trùng ghế).
- **Thời gian phản hồi (Response Time):** API tra cứu sơ đồ ghế có độ trễ < 80ms nhờ bộ nhớ đệm Redis Cache.
- **Tính sẵn sàng (High Availability):** Thiết kế Stateless API hỗ trợ mở rộng ngang (Horizontal Scaling) khi lưu lượng khách đặt vé tăng đột biến trong các dịp phim bom tấn phát hành.

---
*Tài liệu chuẩn hóa phục vụ thẩm định phân tích nghiệp vụ và kiến trúc hệ thống Cinema-Manager.*
