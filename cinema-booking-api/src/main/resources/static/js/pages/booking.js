/* Trang Đặt Vé & Thanh Toán */
async function renderBooking(app) {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId') || window._params?.bookingId;
    if (!bookingId || !api.isLoggedIn()) { navigate('/'); return; }

    app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res?.data;
        if (!booking) { navigate('/'); return; }

        const seats = (booking.seats || []).map(s => `${s.rowName}${s.seatNumber}`).join(', ') || 'N/A';

        app.innerHTML = `
            <div class="payment-page">
                <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:8px">Xác nhận đặt vé</h2>
                <p style="color:var(--text-muted);margin-bottom:24px">Mã đơn: <strong style="color:var(--accent)">${booking.bookingCode}</strong></p>

                <div class="payment-info">
                    <div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg> Phim</span><span>${booking.movieTitle || ''}</span></div>
                    <div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Rạp</span><span>${booking.cinemaName || ''}</span></div>
                    <div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><rect width="20" height="15" x="2" y="3" rx="2"/><path d="M12 18v4"/><path d="M8 21h8"/></svg> Phòng</span><span>${booking.roomName || ''}</span></div>
                    <div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Suất chiếu</span><span>${booking.showtimeStart ? formatDateTime(booking.showtimeStart) : ''}</span></div>
                    <div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Ghế</span><span>${seats}</span></div>
                    <hr style="border-color:var(--border);margin:12px 0">
                    <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon" style="vertical-align:-2px"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Chi tiết giá vé</div>
                    ${(booking.seats || []).map(s => {
                        const seatLabel = s.rowName + s.seatNumber;
                        const typeMap = {VIP: 'VIP x1.5', PREMIUM: 'Premium x1.8', COUPLE: 'Couple x2.0', STANDARD: 'Standard'};
                        const typeLabel = typeMap[s.seatType] || s.seatType;
                        return '<div class="summary-row" style="font-size:0.85rem"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg> ' + seatLabel + ' <span style="opacity:0.6;font-size:0.78rem">(' + typeLabel + ')</span></span><span>' + formatMoney(s.price || 0) + '</span></div>';
                    }).join('')}
                    <hr style="border-color:var(--border);margin:12px 0">
                    <div class="summary-row"><span>Tạm tính</span><span>${formatMoney(booking.totalAmount || 0)}</span></div>
                    ${booking.discountAmount > 0 ? '<div class="summary-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> Giảm giá (' + (booking.promotionCode || 'Promo') + ')</span><span style="color:var(--green)">-' + formatMoney(booking.discountAmount) + '</span></div>' : ''}
                    <div class="summary-row" style="font-size:0.82rem;color:var(--text-muted)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Phí dịch vụ</span><span style="color:var(--green)">Miễn phí</span></div>
                    <div class="summary-row" style="font-size:0.82rem;color:var(--text-muted)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> VAT (10%)</span><span>Đã bao gồm</span></div>
                    <div class="summary-row total"><span>Tổng thanh toán</span><span class="amount">${formatMoney(booking.finalAmount || booking.totalAmount || 0)}</span></div>
                </div>

                ${booking.status === 'HOLDING' ? `
                    <div class="promo-input" style="max-width:400px;margin:20px auto">
                        <input type="text" id="promo-code" placeholder="Nhập mã khuyến mãi..." style="text-transform:uppercase">
                        <button class="btn btn-ghost" onclick="applyPromo(${bookingId})">Áp dụng</button>
                    </div>
                    <button class="btn btn-primary btn-lg" style="margin:8px" onclick="confirmBooking(${bookingId})">Xác nhận & Thanh toán</button>
                    <button class="btn btn-ghost" style="margin:8px" onclick="cancelBooking(${bookingId})">Hủy đặt vé</button>
                ` : ''}

                ${booking.status === 'PENDING_PAYMENT' ? `
                    <div style="margin:24px 0; background:rgba(255,255,255,0.02); padding:32px; border-radius:24px; border:1px solid var(--border);">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px; align-items:center;">
                            <div id="qr-area" style="text-align:center;">
                                <div class="loading-spinner"><div class="spinner"></div></div>
                            </div>
                            <div style="text-align:left;">
                                <h3 style="font-size:1.1rem; margin-bottom:16px; color:var(--gold);">Thông tin chuyển khoản</h3>
                                <div style="margin-bottom:12px;">
                                    <div style="font-size:0.8rem; opacity:0.6; text-transform:uppercase;">Ngân hàng</div>
                                    <div style="font-weight:600;">MB Bank (Quân Đội)</div>
                                </div>
                                <div style="margin-bottom:12px;">
                                    <div style="font-size:0.8rem; opacity:0.6; text-transform:uppercase;">Số tài khoản</div>
                                    <div style="font-size:1.2rem; font-weight:700; color:var(--text-primary);">0348950574</div>
                                </div>
                                <div style="margin-bottom:12px;">
                                    <div style="font-size:0.8rem; opacity:0.6; text-transform:uppercase;">Chủ tài khoản</div>
                                    <div style="font-weight:600;">DANG QUOC ANH</div>
                                </div>
                                <div style="margin-bottom:20px;">
                                    <div style="font-size:0.8rem; opacity:0.6; text-transform:uppercase;">Nội dung chuyển khoản</div>
                                    <div style="font-size:1.1rem; font-weight:700; color:var(--accent); font-family:monospace;">CGV${booking.bookingCode}</div>
                                </div>
                                <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">
                                    Hệ thống sẽ tự động duyệt đơn ngay sau khi nhận được tiền. 
                                    Vui lòng nhập đúng nội dung chuyển khoản là <strong>CGV${booking.bookingCode}</strong>.
                                </p>
                            </div>
                        </div>
                        <div style="margin-top:24px; text-align:center;">
                            <p class="payment-countdown" id="countdown" style="font-size:1.5rem; font-weight:700; color:var(--accent);">10:00</p>
                            <div style="margin-top:20px; display:inline-flex; align-items:center; gap:8px; padding:8px 16px; background:rgba(0, 200, 83, 0.1); border-radius:20px; color:var(--green); font-size:0.85rem; font-weight:500;">
                                <div class="spinner" style="width:14px; height:14px; border-width:2px; border-top-color:var(--green)"></div>
                                H\u1ec7 th\u1ed1ng \u0111ang t\u1ef1 \u0111\u1ed9ng ch\u1edd nh\u1eadn ti\u1ec1n...
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${booking.status === 'CONFIRMED' ? `
                    <div style="margin:32px 0">
                        <div style="margin-bottom:16px"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                        <h3 style="color:var(--green);font-size:1.3rem">Đã thanh toán thành công!</h3>
                        <p style="color:var(--text-muted);margin-bottom:24px">Vé của bạn đã sẵn sàng</p>
                        <a href="/my-tickets" class="btn btn-primary btn-lg">Xem vé của tôi</a>
                    </div>
                ` : ''}
            </div>
        `;

        // Tải mã QR cho đơn hàng chờ thanh toán
        if (booking.status === 'PENDING_PAYMENT') {
            initiatePayment(bookingId);
            startCountdown(booking.holdExpiredAt);

            // Bắt đầu kiểm tra trạng thái mỗi 5 giây (polling)
            if (window._paymentPolling) clearInterval(window._paymentPolling);
            window._paymentPolling = setInterval(() => {
                checkPaymentStatus(bookingId, false);
            }, 5000);
        } else {
            if (window._paymentPolling) clearInterval(window._paymentPolling);
        }
    } catch (err) {
        app.innerHTML = `<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>${err.message}</h3></div>`;
    }
}

async function applyPromo(bookingId) {
    const code = document.getElementById('promo-code').value.trim().toUpperCase();
    if (!code) { showToast('Vui lòng nhập mã khuyến mãi', 'error'); return; }

    try {
        await api.get(`/promotions/check/${code}`);
        showToast(`Mã ${code} hợp lệ! Nhấn "Xác nhận" để áp dụng.`, 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function confirmBooking(bookingId) {
    const promoCode = document.getElementById('promo-code')?.value?.trim()?.toUpperCase() || null;

    try {
        const body = { bookingId: parseInt(bookingId) };
        if (promoCode) body.promotionCode = promoCode;

        const res = await api.post('/bookings', body);
        if (res && res.data && res.data.paymentToken) {
            showToast('Đặt vé thành công! Tiến hành thanh toán...', 'success');
            navigate('/pay', { token: res.data.paymentToken });
        } else if (res) {
            showToast('Đặt vé thành công!', 'success');
            navigate('/booking', { bookingId });
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function initiatePayment(bookingId) {
    try {
        const res = await api.post('/payments/initiate', { bookingId: parseInt(bookingId) });
        if (res && res.data) {
            const qrUrl = res.data.qrCodeUrl;
            document.getElementById('qr-area').innerHTML = qrUrl
                ? `<img src="${qrUrl}" alt="QR Payment" style="width: 100%; height: auto; border-radius: 16px; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">`
                : `<p style="color:var(--text-muted)">Chuy\u1ec3n kho\u1ea3n theo th\u00f4ng tin \u0111\u01a1n h\u00e0ng</p>`;
        }
    } catch (err) {
        document.getElementById('qr-area').innerHTML = `<p style="color:var(--text-muted)">${err.message}</p>`;
    }
}

async function checkPaymentStatus(bookingId, isManual = false) {
    try {
        const res = await api.get(`/payments/${bookingId}/status`);
        if (res && res.data && res.data.status === 'SUCCESS') {
            if (window._paymentPolling) clearInterval(window._paymentPolling);

            // Lấy chi tiết đơn đặt vé để hiển thị popup thành công
            try {
                const bRes = await api.get(`/bookings/${bookingId}`);
                const b = bRes?.data;
                if (b) {
                    showSuccessPopup(b);
                    return;
                }
            } catch(e) { /* fallback below */ }

            showToast('Thanh toán thành công!', 'success');
            navigate('/booking', { bookingId });
        } else {
            if (isManual) showToast('Chưa nhận được thanh toán. Vui lòng đợi...', 'info');
        }
    } catch (err) {
        if (isManual) showToast('Đang kiểm tra...', 'info');
    }
}

/* === Popup Thành công với hiệu ứng Pháo hoa === */
function showSuccessPopup(booking) {
    const seats = (booking.seats || []).map(s => `${s.rowName}${s.seatNumber}`).join(', ') || 'N/A';
    const amount = formatMoney(booking.finalAmount || booking.totalAmount || 0);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-popup">
            <div class="success-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <h2>Thanh toán thành công!</h2>
            <p class="sub">Chúc bạn xem phim vui vẻ!</p>
            <div class="success-ticket-info">
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg> Phim</span><strong>${booking.movieTitle || ''}</strong></div>
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Rạp</span><strong>${booking.cinemaName || ''}</strong></div>
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><rect width="20" height="15" x="2" y="3" rx="2"/><path d="M12 18v4"/><path d="M8 21h8"/></svg> Phòng</span><strong>${booking.roomName || ''}</strong></div>
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Suất</span><strong>${booking.showtimeStart ? formatDateTime(booking.showtimeStart) : ''}</strong></div>
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Ghế</span><strong>${seats}</strong></div>
                <div class="info-row"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> Mã vé</span><strong style="color:var(--accent)">${booking.bookingCode}</strong></div>
                <div class="info-row highlight"><span>Tổng thanh toán</span><strong>${amount}</strong></div>
            </div>
            <button class="btn btn-primary btn-lg" style="width:100%" onclick="document.querySelector('.success-overlay').remove(); navigate('/my-tickets')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg> Xem vé của tôi</button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Đóng popup khi click ra ngoài
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            navigate('/booking', { bookingId: booking.id });
        }
    });

    // Kích hoạt hiệu ứng pháo hoa!
    launchConfetti();
}

/* === Công cụ tạo hiệu ứng Pháo hoa (Canvas thuần) === */
function launchConfetti() {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        document.body.appendChild(canvas);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = ['#4F46E5', '#6366f1', '#f5c518', '#00c853', '#4fc3f7', '#a371f7', '#818CF8', '#ffffff'];
    const particles = [];
    const total = 150;

    for (let i = 0; i < total; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 3,
            d: Math.random() * total,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 10,
            tiltAngle: 0,
            tiltAngleInc: Math.random() * 0.07 + 0.05,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 2 - 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
    }

    let frame = 0;
    const maxFrames = 300;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const fade = frame > maxFrames - 60 ? (maxFrames - frame) / 60 : 1;

        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.tiltAngle);
            if (p.shape === 'rect') {
                ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 1.5);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            p.y += p.speedY;
            p.x += p.speedX + Math.sin(frame * 0.02) * 0.5;
            p.tiltAngle += p.tiltAngleInc;

            if (p.y > canvas.height + 20) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
        });

        frame++;
        if (frame < maxFrames) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.remove();
        }
    }

    draw();
}

async function cancelBooking(bookingId) {
    const confirmed = await webConfirm('Bạn có chắc muốn hủy đặt vé này?', { type: 'danger', confirmText: 'Hủy vé' });
    if (!confirmed) return;
    try {
        await api.post(`/bookings/${bookingId}/cancel`);
        showToast('Đã hủy đặt vé', 'info');
        navigate('/');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function startCountdown(expiredAt) {
    if (!expiredAt) return;
    
    let target;
    if (Array.isArray(expiredAt)) {
        target = new Date(expiredAt[0], expiredAt[1] - 1, expiredAt[2], expiredAt[3] || 0, expiredAt[4] || 0, expiredAt[5] || 0);
    } else {
        const s = typeof expiredAt === 'string' ? expiredAt.replace(' ', 'T') : expiredAt;
        target = new Date(s);
    }

    const el = document.getElementById('countdown');
    if (!el) return;

    // Kiểm tra thời gian - nếu đã hết hạn thì không chạy đếm ngược
    const initialDiff = target - new Date();
    if (isNaN(initialDiff) || initialDiff <= 0) {
        el.textContent = '00:00';
        showToast('Hết thời gian! Đơn đặt vé đã hủy.', 'error');
        setTimeout(() => navigate('/'), 2000);
        return;
    }

    const timer = setInterval(() => {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
            el.textContent = '00:00';
            clearInterval(timer);
            showToast('Hết thời gian! Đơn đặt vé đã hủy.', 'error');
            setTimeout(() => navigate('/'), 2000);
            return;
        }
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        el.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }, 1000);
}

/* === Trang thanh toán theo Payment Token === */
async function renderPayByToken(app) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || window._params?.token;
    if (!token || !api.isLoggedIn()) { navigate('/'); return; }

    app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const res = await api.get(`/bookings/token/${token}`);
        const booking = res?.data;
        if (!booking) { navigate('/'); return; }

        // Delegate tới renderBooking với bookingId
        window._params = { bookingId: booking.id };
        await renderBooking(app);
    } catch (err) {
        app.innerHTML = `<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>Đơn đặt vé không tồn tại hoặc đã hết hạn</h3><button class="btn btn-primary" onclick="navigate('/')">Về trang chủ</button></div>`;
    }
}

/* === Kiểm tra đơn pending & hiện notification bar === */
async function checkAndShowPendingBar() {
    if (!api.isLoggedIn()) return;
    const old = document.getElementById('pending-booking-bar');
    if (old) old.remove();

    try {
        const res = await api.get('/bookings/pending');
        const pending = res?.data;
        if (!pending || !pending.paymentToken) return;
        if (pending.status !== 'HOLDING' && pending.status !== 'PENDING_PAYMENT') return;

        const path = window.location.pathname;
        if (path.startsWith('/booking') || path.startsWith('/pay') || path.startsWith('/seats')) return;

        const bar = document.createElement('div');
        bar.id = 'pending-booking-bar';
        bar.className = 'pending-bar';
        bar.innerHTML = `
            <div class="pending-bar-content">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Bạn có đơn đặt vé <strong>${pending.movieTitle || ''}</strong> chưa thanh toán</span>
                <button class="btn btn-primary btn-sm" onclick="navigate('/pay', {token: '${pending.paymentToken}'})">Thanh toán ngay</button>
                <button class="pending-bar-close" onclick="this.closest('.pending-bar').remove()">&times;</button>
            </div>
        `;
        document.body.prepend(bar);
    } catch (e) { /* ignore */ }
}
