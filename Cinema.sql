-- =============================================
-- Cinema Booking System - Database Schema
-- PostgreSQL 16
-- =============================================

-- ===== USERS & ROLES =====
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ===== MOVIES & GENRES =====
CREATE TABLE genres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE movies (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    language VARCHAR(50),
    subtitle VARCHAR(50),
    age_rating VARCHAR(10),
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    release_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'COMING_SOON',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE movie_genres (
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- ===== CINEMAS, ROOMS, SEATS =====
CREATE TABLE cinemas (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    cinema_id BIGINT NOT NULL REFERENCES cinemas(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'STANDARD_2D',
    capacity INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE seats (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    row_name VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    seat_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE(room_id, row_name, seat_number)
);

-- ===== SHOWTIMES =====
CREATE TABLE showtimes (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES movies(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    base_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- ===== BOOKINGS =====
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    showtime_id BIGINT NOT NULL REFERENCES showtimes(id),
    total_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2),
    status VARCHAR(30) NOT NULL DEFAULT 'HOLDING',
    hold_expired_at TIMESTAMP,
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    promotion_code VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE booking_seats (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL REFERENCES seats(id),
    seat_price DECIMAL(12,2) NOT NULL,
    UNIQUE(booking_id, seat_id)
);

-- ===== PAYMENTS =====
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL DEFAULT 'SEPAY',
    bank_transaction_id VARCHAR(100),
    sepay_transaction_id BIGINT,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    request_payload TEXT,
    response_payload TEXT,
    paid_at TIMESTAMP,
    qr_content TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- ===== TICKETS =====
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    qr_code TEXT,
    issued_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- ===== PROMOTIONS =====
CREATE TABLE promotions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(500),
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    min_order_value DECIMAL(12,2) DEFAULT 0,
    max_discount_amount DECIMAL(12,2),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- ===== REFUND TRANSACTIONS =====
CREATE TABLE refund_transactions (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    amount DECIMAL(12,2) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(100)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_movies_status_release ON movies(status, release_date);
CREATE INDEX idx_showtimes_movie_start ON showtimes(movie_id, start_time);
CREATE INDEX idx_showtimes_room_start ON showtimes(room_id, start_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_showtime ON bookings(showtime_id);
CREATE INDEX idx_bookings_status_expire ON bookings(status, hold_expired_at);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_sepay_tx ON payments(sepay_transaction_id);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_seats_room ON seats(room_id);
-- =============================================
-- Seed Data for Cinema Booking System
-- =============================================

-- Roles
INSERT INTO roles (name) VALUES ('CUSTOMER');
INSERT INTO roles (name) VALUES ('STAFF');
INSERT INTO roles (name) VALUES ('ADMIN');

-- Admin user (password: admin123)
INSERT INTO users (full_name, email, phone, password_hash, status)
VALUES ('System Admin', 'admin@cinema.vn', '0900000001',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBIjBjCqq/UA9Rh3WlcUGWIP0Gy', 'ACTIVE');

INSERT INTO user_roles (user_id, role_id)
VALUES (1, 3); -- Admin role

-- Staff user (password: staff123)
INSERT INTO users (full_name, email, phone, password_hash, status)
VALUES ('Nhân viên 1', 'staff@cinema.vn', '0900000002',
        '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjqQBIjBjCqq/UA9Rh3WlcUGWIP0Gy', 'ACTIVE');

INSERT INTO user_roles (user_id, role_id)
VALUES (2, 2); -- Staff role

-- Genres
INSERT INTO genres (name) VALUES ('Hành Động');
INSERT INTO genres (name) VALUES ('Hài Hước');
INSERT INTO genres (name) VALUES ('Kinh Dị');
INSERT INTO genres (name) VALUES ('Tình Cảm');
INSERT INTO genres (name) VALUES ('Khoa Học Viễn Tưởng');
INSERT INTO genres (name) VALUES ('Hoạt Hình');
INSERT INTO genres (name) VALUES ('Phiêu Lưu');
INSERT INTO genres (name) VALUES ('Tâm Lý');
INSERT INTO genres (name) VALUES ('Tài Liệu');
INSERT INTO genres (name) VALUES ('Âm Nhạc');

-- Sample Cinema
INSERT INTO cinemas (name, address, city, status)
VALUES ('Cinema Star Quận 1', '123 Nguyễn Huệ, Quận 1', 'Hồ Chí Minh', 'ACTIVE');

INSERT INTO cinemas (name, address, city, status)
VALUES ('Cinema Star Quận 7', '456 Nguyễn Thị Thập, Quận 7', 'Hồ Chí Minh', 'ACTIVE');

-- Rooms for Cinema 1
INSERT INTO rooms (cinema_id, name, type, capacity, status)
VALUES (1, 'Phòng 1', 'STANDARD_2D', 100, 'ACTIVE');

INSERT INTO rooms (cinema_id, name, type, capacity, status)
VALUES (1, 'Phòng 2', 'STANDARD_3D', 80, 'ACTIVE');

INSERT INTO rooms (cinema_id, name, type, capacity, status)
VALUES (1, 'Phòng VIP', 'VIP_4DX', 40, 'ACTIVE');

-- Rooms for Cinema 2
INSERT INTO rooms (cinema_id, name, type, capacity, status)
VALUES (2, 'Phòng A', 'STANDARD_2D', 120, 'ACTIVE');

INSERT INTO rooms (cinema_id, name, type, capacity, status)
VALUES (2, 'Phòng B', 'IMAX', 60, 'ACTIVE');

-- ===== SEATS for Room 1 (10 rows x 10 seats = 100 seats) =====
DO $$
DECLARE
    row_names TEXT[] := ARRAY['A','B','C','D','E','F','G','H','I','J'];
    r TEXT;
    s INT;
    seat_t TEXT;
BEGIN
    FOREACH r IN ARRAY row_names LOOP
        FOR s IN 1..10 LOOP
            -- VIP rows: E, F
            IF r IN ('E', 'F') THEN
                seat_t := 'VIP';
            -- Couple seats: J row
            ELSIF r = 'J' THEN
                seat_t := 'COUPLE';
            ELSE
                seat_t := 'STANDARD';
            END IF;
            
            INSERT INTO seats (room_id, row_name, seat_number, seat_type, status)
            VALUES (1, r, s, seat_t, 'ACTIVE');
        END LOOP;
    END LOOP;
END $$;

-- ===== SEATS for Room 2 (8 rows x 10 seats = 80 seats) =====
DO $$
DECLARE
    row_names TEXT[] := ARRAY['A','B','C','D','E','F','G','H'];
    r TEXT;
    s INT;
    seat_t TEXT;
BEGIN
    FOREACH r IN ARRAY row_names LOOP
        FOR s IN 1..10 LOOP
            IF r IN ('D', 'E') THEN
                seat_t := 'VIP';
            ELSE
                seat_t := 'STANDARD';
            END IF;
            INSERT INTO seats (room_id, row_name, seat_number, seat_type, status)
            VALUES (2, r, s, seat_t, 'ACTIVE');
        END LOOP;
    END LOOP;
END $$;

-- ===== SEATS for Room 3 VIP (5 rows x 8 seats = 40 seats) =====
DO $$
DECLARE
    row_names TEXT[] := ARRAY['A','B','C','D','E'];
    r TEXT;
    s INT;
BEGIN
    FOREACH r IN ARRAY row_names LOOP
        FOR s IN 1..8 LOOP
            INSERT INTO seats (room_id, row_name, seat_number, seat_type, status)
            VALUES (3, r, s, 'PREMIUM', 'ACTIVE');
        END LOOP;
    END LOOP;
END $$;

-- ===== SEATS for Room 4 (12 rows x 10 seats = 120 seats) =====
DO $$
DECLARE
    row_names TEXT[] := ARRAY['A','B','C','D','E','F','G','H','I','J','K','L'];
    r TEXT;
    s INT;
    seat_t TEXT;
BEGIN
    FOREACH r IN ARRAY row_names LOOP
        FOR s IN 1..10 LOOP
            IF r IN ('F', 'G') THEN seat_t := 'VIP';
            ELSIF r = 'L' THEN seat_t := 'COUPLE';
            ELSE seat_t := 'STANDARD';
            END IF;
            INSERT INTO seats (room_id, row_name, seat_number, seat_type, status)
            VALUES (4, r, s, seat_t, 'ACTIVE');
        END LOOP;
    END LOOP;
END $$;

-- ===== SEATS for Room 5 IMAX (6 rows x 10 seats = 60 seats) =====
DO $$
DECLARE
    row_names TEXT[] := ARRAY['A','B','C','D','E','F'];
    r TEXT;
    s INT;
BEGIN
    FOREACH r IN ARRAY row_names LOOP
        FOR s IN 1..10 LOOP
            INSERT INTO seats (room_id, row_name, seat_number, seat_type, status)
            VALUES (5, r, s, 'PREMIUM', 'ACTIVE');
        END LOOP;
    END LOOP;
END $$;

-- Sample Movies
INSERT INTO movies (title, description, duration_minutes, language, subtitle, age_rating, release_date, status)
VALUES ('Avengers: Doomsday', 'Siêu anh hùng Marvel tái xuất trong trận chiến cuối cùng.', 165, 'English', 'Vietnamese', 'C13', '2026-05-01', 'NOW_SHOWING');

INSERT INTO movies (title, description, duration_minutes, language, subtitle, age_rating, release_date, status)
VALUES ('Lật Mặt 8', 'Phim Việt Nam hành động kịch tính của Lý Hải.', 130, 'Vietnamese', NULL, 'C16', '2026-04-15', 'NOW_SHOWING');

INSERT INTO movies (title, description, duration_minutes, language, subtitle, age_rating, release_date, status)
VALUES ('Inside Out 3', 'Hành trình cảm xúc tiếp tục trong phim hoạt hình Pixar.', 105, 'English', 'Vietnamese', 'P', '2026-06-01', 'COMING_SOON');

INSERT INTO movies (title, description, duration_minutes, language, subtitle, age_rating, release_date, status)
VALUES ('Quỷ Ám: Tái Sinh', 'Phim kinh dị đen tối về thế giới tâm linh.', 120, 'Vietnamese', NULL, 'C18', '2026-04-10', 'NOW_SHOWING');

-- Movie-Genre associations
INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 1); -- Avengers - Hành Động
INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 5); -- Avengers - Khoa Học Viễn Tưởng
INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 7); -- Avengers - Phiêu Lưu
INSERT INTO movie_genres (movie_id, genre_id) VALUES (2, 1); -- Lật Mặt - Hành Động
INSERT INTO movie_genres (movie_id, genre_id) VALUES (2, 8); -- Lật Mặt - Tâm Lý
INSERT INTO movie_genres (movie_id, genre_id) VALUES (3, 6); -- Inside Out - Hoạt Hình
INSERT INTO movie_genres (movie_id, genre_id) VALUES (3, 2); -- Inside Out - Hài Hước
INSERT INTO movie_genres (movie_id, genre_id) VALUES (4, 3); -- Quỷ Ám - Kinh Dị
INSERT INTO movie_genres (movie_id, genre_id) VALUES (4, 8); -- Quỷ Ám - Tâm Lý

-- Sample Showtimes (today and tomorrow)
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (1, 1, NOW()::date + INTERVAL '10 hours', NOW()::date + INTERVAL '13 hours', 90000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (1, 1, NOW()::date + INTERVAL '14 hours', NOW()::date + INTERVAL '17 hours', 100000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (1, 2, NOW()::date + INTERVAL '19 hours', NOW()::date + INTERVAL '22 hours', 120000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (2, 4, NOW()::date + INTERVAL '11 hours', NOW()::date + INTERVAL '13 hours 30 minutes', 80000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (2, 4, NOW()::date + INTERVAL '15 hours', NOW()::date + INTERVAL '17 hours 30 minutes', 85000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (4, 1, NOW()::date + INTERVAL '20 hours', NOW()::date + INTERVAL '22 hours 15 minutes', 95000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (1, 5, NOW()::date + INTERVAL '18 hours', NOW()::date + INTERVAL '21 hours', 150000, 'ACTIVE');

-- Tomorrow showtimes
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (1, 1, NOW()::date + INTERVAL '1 day 10 hours', NOW()::date + INTERVAL '1 day 13 hours', 90000, 'ACTIVE');

INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status)
VALUES (2, 4, NOW()::date + INTERVAL '1 day 14 hours', NOW()::date + INTERVAL '1 day 16 hours 30 minutes', 80000, 'ACTIVE');

-- Sample Promotions
INSERT INTO promotions (code, description, discount_type, discount_value, min_order_value, max_discount_amount, start_time, end_time, usage_limit, status)
VALUES ('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'PERCENTAGE', 10, 100000, 50000, NOW(), NOW() + INTERVAL '90 days', 1000, 'ACTIVE');

INSERT INTO promotions (code, description, discount_type, discount_value, min_order_value, max_discount_amount, start_time, end_time, usage_limit, status)
VALUES ('GIAM20K', 'Giảm 20,000đ cho đơn từ 150,000đ', 'FIXED_AMOUNT', 20000, 150000, NULL, NOW(), NOW() + INTERVAL '30 days', 500, 'ACTIVE');

INSERT INTO promotions (code, description, discount_type, discount_value, min_order_value, max_discount_amount, start_time, end_time, usage_limit, status)
VALUES ('VIP30', 'Giảm 30% cho ghế VIP', 'PERCENTAGE', 30, 200000, 100000, NOW(), NOW() + INTERVAL '60 days', 200, 'ACTIVE');
-- Add phone column to cinemas table
ALTER TABLE cinemas ADD COLUMN phone VARCHAR(20);
ALTER TABLE movies
ADD COLUMN director VARCHAR(255),
ADD COLUMN cast_members TEXT;
-- Add applicable_movie_ids column to promotions (stores comma-separated movie IDs, NULL = all movies)
ALTER TABLE promotions ADD COLUMN applicable_movie_ids TEXT;
-- Ensure admin user has ADMIN role
-- This fixes the case where roles were accidentally deleted by save() method

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@cinema.vn'
  AND r.name = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
