package com.cinema.common.exception;

import lombok.Getter;

/**
 * Mã lỗi thống nhất cho toàn hệ thống.
 */
@Getter
public enum ErrorCode {

    // Lỗi xác thực (1xxx)
    AUTH_INVALID_CREDENTIALS(1001, "Email hoặc mật khẩu không đúng"),
    AUTH_EMAIL_ALREADY_EXISTS(1002, "Email đã được đăng ký"),
    AUTH_TOKEN_EXPIRED(1003, "Phiên đăng nhập đã hết hạn"),
    AUTH_TOKEN_INVALID(1004, "Token không hợp lệ"),
    AUTH_ACCESS_DENIED(1005, "Bạn không có quyền truy cập"),
    AUTH_PHONE_ALREADY_EXISTS(1006, "Số điện thoại đã được đăng ký"),

    // Lỗi người dùng (2xxx)
    USER_NOT_FOUND(2001, "Không tìm thấy người dùng"),
    USER_DISABLED(2002, "Tài khoản đã bị vô hiệu hóa"),

    // Lỗi phim (3xxx)
    MOVIE_NOT_FOUND(3001, "Không tìm thấy phim"),
    GENRE_NOT_FOUND(3002, "Không tìm thấy thể loại"),

    // Lỗi rạp (4xxx)
    CINEMA_NOT_FOUND(4001, "Không tìm thấy rạp chiếu phim"),
    ROOM_NOT_FOUND(4002, "Không tìm thấy phòng chiếu"),
    SEAT_NOT_FOUND(4003, "Không tìm thấy ghế ngồi"),

    // Lỗi suất chiếu (5xxx)
    SHOWTIME_NOT_FOUND(5001, "Không tìm thấy suất chiếu"),
    SHOWTIME_CONFLICT(5002, "Suất chiếu bị trùng lịch với suất chiếu khác"),
    SHOWTIME_PAST(5003, "Không thể đặt vé cho suất chiếu đã qua"),

    // Lỗi đặt vé (6xxx)
    BOOKING_NOT_FOUND(6001, "Không tìm thấy đơn đặt vé"),
    BOOKING_SEATS_UNAVAILABLE(6002, "Một hoặc nhiều ghế đã được người khác chọn"),
    BOOKING_HOLD_EXPIRED(6003, "Thời gian giữ ghế đã hết hạn, vui lòng chọn lại"),
    BOOKING_ALREADY_CONFIRMED(6004, "Đơn đặt vé đã được xác nhận"),
    BOOKING_CANNOT_CANCEL(6005, "Không thể hủy đơn đặt vé này"),
    BOOKING_INVALID_STATUS(6006, "Trạng thái đơn đặt vé không hợp lệ cho thao tác này"),
    BOOKING_MAX_SEATS_EXCEEDED(6007, "Số ghế chọn vượt quá giới hạn cho phép (tối đa 8 ghế)"),

    // Lỗi thanh toán (7xxx)
    PAYMENT_NOT_FOUND(7001, "Không tìm thấy thông tin thanh toán"),
    PAYMENT_ALREADY_PROCESSED(7002, "Giao dịch thanh toán đã được xử lý"),
    PAYMENT_AMOUNT_MISMATCH(7003, "Số tiền thanh toán không khớp"),
    PAYMENT_INVALID_CALLBACK(7004, "Dữ liệu callback thanh toán không hợp lệ"),
    PAYMENT_FAILED(7005, "Thanh toán thất bại"),
    PAYMENT_DUPLICATE_TRANSACTION(7006, "Giao dịch thanh toán bị trùng lặp"),

    // Lỗi vé (8xxx)
    TICKET_NOT_FOUND(8001, "Không tìm thấy vé"),
    TICKET_ALREADY_USED(8002, "Vé đã được sử dụng"),

    // Lỗi khuyến mãi (9xxx)
    PROMOTION_NOT_FOUND(9001, "Mã khuyến mãi không tồn tại"),
    PROMOTION_EXPIRED(9002, "Mã khuyến mãi đã hết hạn"),
    PROMOTION_USAGE_LIMIT(9003, "Mã khuyến mãi đã hết lượt sử dụng"),
    PROMOTION_MIN_ORDER(9004, "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã"),
    PROMOTION_CODE_EXISTS(9005, "Mã khuyến mãi đã tồn tại"),

    // Lỗi chung
    RESOURCE_NOT_FOUND(10001, "Không tìm thấy tài nguyên"),
    VALIDATION_ERROR(10002, "Dữ liệu không hợp lệ"),
    INTERNAL_ERROR(10003, "Lỗi hệ thống, vui lòng thử lại sau");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
