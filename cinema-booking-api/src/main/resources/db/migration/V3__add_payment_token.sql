-- Thêm cột payment_token vào bảng bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_token VARCHAR(36) UNIQUE;

-- Tạo index để tìm kiếm nhanh theo token
CREATE INDEX IF NOT EXISTS idx_bookings_payment_token ON bookings(payment_token);

-- Tạo index để tìm đơn pending nhanh theo user
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
