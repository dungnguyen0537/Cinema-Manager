/* Trang Chọn Ghế */
let selectedSeats = [];

async function renderSeats(app) {
    const params = new URLSearchParams(window.location.search);
    const showtimeId = params.get('showtimeId') || window._params?.showtimeId;
    if (!showtimeId) { navigate('/'); return; }
    if (!api.isLoggedIn()) { openModal('login'); showToast('Vui lòng đăng nhập', 'info'); return; }

    selectedSeats = [];
    app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const [showtimeRes, seatsRes] = await Promise.all([
            api.get(`/showtimes/${showtimeId}`),
            api.get(`/showtimes/${showtimeId}/seats`)
        ]);

        const showtime = showtimeRes?.data;
        const seats = seatsRes?.data || [];
        if (!showtime) { navigate('/'); return; }

        // Nhóm ghế theo hàng
        const rows = {};
        seats.forEach(s => {
            if (!rows[s.rowName]) rows[s.rowName] = [];
            rows[s.rowName].push(s);
        });

        // Sắp xếp các hàng
        const sortedRows = Object.keys(rows).sort();

        app.innerHTML = `
            <div class="seat-page">
                <div style="text-align:center;margin-bottom:32px">
                    <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:4px">${showtime.movieTitle}</h2>
                    <p style="color:var(--text-muted);font-size:0.9rem">
                        ${showtime.cinemaName} • ${showtime.roomName} • ${formatDateTime(showtime.startTime)}
                    </p>
                </div>

                <div class="screen">
                    <div class="screen-bar"></div>
                    <div class="screen-label">Màn hình</div>
                </div>

                <div class="seat-grid" id="seat-grid">
                    ${sortedRows.map(row => `
                        <div class="seat-row">
                            <div class="seat-row-label">${row}</div>
                            ${rows[row].sort((a, b) => a.seatNumber - b.seatNumber).map(seat => {
                                let cls = 'seat';
                                if (seat.status === 'BOOKED') cls += ' seat-booked';
                                else if (seat.status === 'HELD') cls += ' seat-held';
                                if (seat.seatType === 'VIP' || seat.seatType === 'PREMIUM') cls += ' seat-vip';
                                if (seat.seatType === 'COUPLE') cls += ' seat-couple';
                                return `<div class="${cls}" 
                                    data-id="${seat.id}" data-row="${seat.rowName}" 
                                    data-num="${seat.seatNumber}" data-type="${seat.seatType}"
                                    data-status="${seat.status}"
                                    onclick="toggleSeat(this, ${showtimeId}, ${showtime.basePrice})"
                                    title="${seat.rowName}${seat.seatNumber} (${seat.seatType})">
                                    ${seat.seatNumber}
                                </div>`;
                            }).join('')}
                            <div class="seat-row-label">${row}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="seat-legend">
                    <div class="seat-legend-item"><div class="legend-box legend-available"></div> Trống</div>
                    <div class="seat-legend-item"><div class="legend-box legend-selected"></div> Đang chọn</div>
                    <div class="seat-legend-item"><div class="legend-box legend-vip"></div> VIP</div>
                    <div class="seat-legend-item"><div class="legend-box legend-booked"></div> Đã đặt</div>
                </div>

                <div id="seat-summary" class="hidden">
                    <div class="booking-summary">
                        <div class="summary-title">Thông tin đặt vé</div>
                        <div class="summary-row"><span>Phim</span><span>${showtime.movieTitle}</span></div>
                        <div class="summary-row"><span>Suất chiếu</span><span>${formatDateTime(showtime.startTime)}</span></div>
                        <div class="summary-row"><span>Ghế</span><span id="summary-seats">-</span></div>
                        <div class="summary-row"><span>Số lượng</span><span id="summary-count">0</span></div>
                        <div class="summary-row total"><span>Tổng tiền</span><span class="amount" id="summary-total">0đ</span></div>
                        <button class="btn btn-primary btn-full btn-lg" style="margin-top:20px" id="btn-hold" onclick="holdSeats(${showtimeId})">
                            Giữ ghế & Tiếp tục
                        </button>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>${err.message}</h3></div>`;
    }
}

function toggleSeat(el, showtimeId, basePrice) {
    if (el.dataset.status === 'BOOKED' || el.dataset.status === 'HELD') return;

    const seatId = parseInt(el.dataset.id);
    const idx = selectedSeats.findIndex(s => s.id === seatId);

    if (idx >= 0) {
        selectedSeats.splice(idx, 1);
        el.classList.remove('seat-selected');
    } else {
        if (selectedSeats.length >= 8) {
            showToast('Tối đa 8 ghế cho mỗi lần đặt', 'error');
            return;
        }
        const type = el.dataset.type;
        let price = basePrice;
        if (type === 'VIP') price = Math.ceil(basePrice * 1.5);
        else if (type === 'PREMIUM') price = Math.ceil(basePrice * 1.8);
        else if (type === 'COUPLE') price = Math.ceil(basePrice * 2.0);

        selectedSeats.push({
            id: seatId,
            row: el.dataset.row,
            num: el.dataset.num,
            type: type,
            price: price
        });
        el.classList.add('seat-selected');
    }

    updateSeatSummary();
}

function updateSeatSummary() {
    const summary = document.getElementById('seat-summary');
    if (selectedSeats.length === 0) {
        summary.classList.add('hidden');
        return;
    }
    summary.classList.remove('hidden');

    const seatNames = selectedSeats.map(s => s.row + s.num).join(', ');
    const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);

    document.getElementById('summary-seats').textContent = seatNames;
    document.getElementById('summary-count').textContent = selectedSeats.length + ' ghế';
    document.getElementById('summary-total').textContent = formatMoney(total);
}

async function holdSeats(showtimeId) {
    if (selectedSeats.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 ghế', 'error');
        return;
    }

    const btn = document.getElementById('btn-hold');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
        // Kiểm tra đơn pending trước
        const pendingRes = await api.get('/bookings/pending');
        const pending = pendingRes?.data;
        if (pending && (pending.status === 'HOLDING' || pending.status === 'PENDING_PAYMENT')) {
            btn.disabled = false;
            btn.textContent = 'Giữ ghế & Tiếp tục';
            showPendingBookingModal(pending, showtimeId);
            return;
        }
    } catch (e) { /* no pending, continue */ }

    try {
        const res = await api.post('/bookings/hold', {
            showtimeId: parseInt(showtimeId),
            seatIds: selectedSeats.map(s => s.id)
        });

        if (res && res.data) {
            showToast('Giữ ghế thành công! Bạn có 10 phút để thanh toán', 'success');
            navigate('/booking', { bookingId: res.data.id });
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Giữ ghế & Tiếp tục';
    }
}

/* Modal khi đã có đơn pending */
function showPendingBookingModal(booking, newShowtimeId) {
    const seats = (booking.seats || []).map(s => `${s.rowName}${s.seatNumber}`).join(', ') || 'N/A';
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.id = 'pending-modal-overlay';
    overlay.innerHTML = `
        <div class="success-popup" style="max-width:440px">
            <div style="text-align:center;margin-bottom:16px">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            </div>
            <h3 style="font-size:1.1rem;margin-bottom:4px">Bạn đang có đơn chưa thanh toán</h3>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px">Mỗi lần chỉ được có 1 đơn chờ thanh toán</p>
            <div class="success-ticket-info" style="margin-bottom:16px">
                <div class="info-row"><span>Phim</span><strong>${booking.movieTitle || ''}</strong></div>
                <div class="info-row"><span>Ghế</span><strong>${seats}</strong></div>
                <div class="info-row"><span>Số vé</span><strong>${(booking.seats || []).length}</strong></div>
                <div class="info-row highlight"><span>Tổng thanh toán</span><strong>${formatMoney(booking.finalAmount || booking.totalAmount || 0)}</strong></div>
            </div>
            <div style="display:flex;gap:10px;flex-direction:column">
                <button class="btn btn-primary btn-lg" style="width:100%" onclick="document.getElementById('pending-modal-overlay').remove(); navigate('/pay', {token: '${booking.paymentToken}'})">
                    Thanh toán đơn cũ
                </button>
                <button class="btn btn-ghost" style="width:100%" onclick="cancelAndCreateNew('${booking.id}', ${newShowtimeId})">
                    Hủy đơn & Tạo đơn mới
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function cancelAndCreateNew(oldBookingId, showtimeId) {
    const overlay = document.getElementById('pending-modal-overlay');
    if (overlay) overlay.remove();
    try {
        await api.post(`/bookings/${oldBookingId}/cancel`);
        showToast('Đã hủy đơn cũ. Đang tạo đơn mới...', 'info');
        // Tạo đơn mới
        const res = await api.post('/bookings/hold', {
            showtimeId: parseInt(showtimeId),
            seatIds: selectedSeats.map(s => s.id)
        });
        if (res && res.data) {
            showToast('Giữ ghế thành công!', 'success');
            navigate('/booking', { bookingId: res.data.id });
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}
