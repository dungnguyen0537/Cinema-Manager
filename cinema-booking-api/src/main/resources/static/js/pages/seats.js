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
        const res = await api.post('/bookings/hold', {
            showtimeId: parseInt(showtimeId),
            seatIds: selectedSeats.map(s => s.id)
        });

        if (res && res.data) {
            showToast('Giữ ghế thành công! ⏰ Bạn có 10 phút', 'success');
            navigate('/booking', { bookingId: res.data.id });
        }
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Giữ ghế & Tiếp tục';
    }
}
