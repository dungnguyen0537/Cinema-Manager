#!/bin/bash
# =============================================
# Cinema Booking System - VPS Deployment Script
# Chỉ cần chạy: bash deploy.sh
# =============================================

set -e

echo "🎬 Cinema 8 Star - Deployment Script"
echo "======================================"

# ─── 1. Kiểm tra Docker ────────────────────
if ! command -v docker &> /dev/null; then
    echo "📦 Cài đặt Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "✅ Docker đã cài xong. Chạy: newgrp docker rồi chạy lại script."
    exit 0
fi

# ─── 2. Tự động tạo/cập nhật .env ─────────
ENV_FILE=".env"

# Đọc giá trị hiện tại nếu .env đã tồn tại
_get() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo ""; }

# Tạo .env nếu chưa có
touch "$ENV_FILE"

# Tự sinh JWT_SECRET nếu chưa có hoặc còn là placeholder
CURRENT_JWT=$(_get JWT_SECRET)
if [ -z "$CURRENT_JWT" ] || [ "$CURRENT_JWT" = "CHANGE_ME_JWT_SECRET_RUN_openssl_rand_-base64_64" ]; then
    NEW_JWT=$(openssl rand -base64 64 | tr -d '\n')
    if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_JWT}|" "$ENV_FILE"
    else
        echo "JWT_SECRET=${NEW_JWT}" >> "$ENV_FILE"
    fi
    echo "🔑 JWT_SECRET tự sinh OK"
fi

# Hàm set_env: thêm nếu chưa có, hoặc thay thế nếu còn là placeholder (your_*)
set_env() {
    local key="$1"
    local val="$2"
    local current
    current=$(grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
    if [ -z "$current" ] || echo "$current" | grep -qE "^(your_|CHANGE_ME)"; then
        if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
            sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
        else
            echo "${key}=${val}" >> "$ENV_FILE"
        fi
    fi
}

# ── Giá trị mặc định khớp với application.yml ──
set_env DB_NAME          "cinema_booking"
set_env DB_USERNAME      "cinema_user"
set_env DB_PASSWORD      "Cinema@2024#Secure"
set_env REDIS_HOST       "redis"
set_env REDIS_PORT       "6379"
# MB Bank – dùng đúng giá trị mặc định trong application.yml
set_env MBBANK_API_TOKEN        "d10b28d223e240bed1ea3d9ebf594b35"
set_env MBBANK_ACCOUNT_NUMBER   "83865888888"
set_env MBBANK_ACCOUNT_NAME     "NGUYEN VAN DUNG"
# Mail (không bắt buộc)
set_env MAIL_USERNAME    ""
set_env MAIL_PASSWORD    ""
# CORS
set_env CORS_ORIGINS     "*"

echo "✅ File .env đã sẵn sàng"

# ─── 3. Hiển thị cấu hình sẽ dùng ────────
echo ""
echo "📋 Cấu hình deployment:"
echo "   DB        : $(grep '^DB_NAME=' $ENV_FILE | cut -d= -f2)"
echo "   MB Bank # : $(grep '^MBBANK_ACCOUNT_NUMBER=' $ENV_FILE | cut -d= -f2)"
echo "   MB Bank   : $(grep '^MBBANK_ACCOUNT_NAME=' $ENV_FILE | cut -d= -f2)"
echo ""

# ─── 4. Dừng containers cũ ────────────────
echo "🛑 Dừng containers cũ..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# KHÔNG xóa postgres volume - giữ data người dùng
# Chỉ xóa nếu cần reset DB: docker volume rm cinema-booking-api_postgres_data

# Xóa image cũ để build sạch
docker image rm cinema-booking-api-app 2>/dev/null || true

# ─── 5. Build ─────────────────────────────
echo ""
echo "🔨 Building Docker image (lần đầu ~5 phút, lần sau ~1 phút)..."
docker compose -f docker-compose.prod.yml build --no-cache

# ─── 6. Khởi động services ────────────────
echo ""
echo "🚀 Khởi động services..."
set -a; source "$ENV_FILE"; set +a
docker compose -f docker-compose.prod.yml up -d

# ─── 7. Chờ PostgreSQL healthy ────────────
echo ""
echo "⏳ Chờ PostgreSQL sẵn sàng..."
for i in $(seq 1 30); do
    if docker compose -f docker-compose.prod.yml ps postgres | grep -q "healthy"; then
        echo "   ✅ PostgreSQL HEALTHY"
        break
    fi
    printf "   ... %d/30\r" "$i"
    sleep 3
done

# ─── 8. Chờ Spring Boot healthy ───────────
echo ""
echo "⏳ Chờ Spring Boot khởi động (có thể mất 1-2 phút)..."
READY=0
for i in $(seq 1 40); do
    STATUS=$(docker compose -f docker-compose.prod.yml ps app 2>/dev/null | grep "cinema-app" || echo "")
    if echo "$STATUS" | grep -q "(healthy)"; then
        READY=1
        break
    fi
    # Fallback: thử gọi trực tiếp actuator/health
    if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        READY=1
        break
    fi
    printf "   ... %d/24 (mỗi bước 5s)\r" "$i"
    sleep 5
done

if [ $READY -eq 1 ]; then
    echo "   ✅ Spring Boot HEALTHY!"
else
    echo ""
    echo "   ⚠️  Spring Boot chưa healthy sau 200s. Xem logs:"
    docker compose -f docker-compose.prod.yml logs --tail=40 app
    echo ""
    echo "   Hệ thống vẫn đang cố gắng khởi động (restart: always)."
    echo "   Chạy lệnh sau để theo dõi thêm:"
    echo "   docker compose -f docker-compose.prod.yml logs -f app"
fi

# ─── 9. Restart Nginx ─────────────────────
echo ""
echo "🔄 Restart Nginx để cập nhật địa chỉ app..."
docker compose -f docker-compose.prod.yml restart nginx
sleep 3

# ─── 10. Tóm tắt ──────────────────────────
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "======================================"
echo "✅ Deployment hoàn tất!"
echo ""
echo "🌐 Truy cập tại:"
echo "   🏠 Website  : http://${PUBLIC_IP}"
echo "   ⚙️  Admin    : http://${PUBLIC_IP}/admin.html"
echo "   📖 Swagger   : http://${PUBLIC_IP}/swagger-ui.html"
echo "   💰 Callback  : http://${PUBLIC_IP}/api/v1/payment/callback"
echo ""
echo "🔐 Admin Login:"
echo "   Email    : admin@cinema.vn"
echo "   Password : admin123"
echo ""
echo "📊 Trạng thái containers:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "📋 Lệnh hữu ích:"
echo "   Xem logs app : docker compose -f docker-compose.prod.yml logs -f app"
echo "   Xem logs all : docker compose -f docker-compose.prod.yml logs -f"
echo "   Dừng tất cả  : docker compose -f docker-compose.prod.yml down"
echo "======================================"
