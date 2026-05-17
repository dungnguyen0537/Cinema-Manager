/* Quản lý Đặt vé — Lịch sử đầy đủ + Tìm kiếm */
let _bookingsCache = [];

async function renderBookingsPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Quản lý đặt vé</div>
        </div>

        <div class="section-card" style="margin-bottom:16px">
            <div class="section-title-sm">Tra cứu nhanh</div>
            <div class="field-row">
                <div class="field">
                    <label>Mã booking hoặc email</label>
                    <input type="text" id="bk-search-q" placeholder="Nhập mã booking / email khách hàng..." onkeydown="if(event.key==='Enter')filterBookings()">
                </div>
                <div class="field" style="align-self:end">
                    <button class="btn-primary" onclick="filterBookings()">Tìm kiếm</button>
                </div>
            </div>
        </div>

        <div class="table-wrap">
            <div class="table-header">
                <div class="table-title">Lịch sử đặt vé — Tất cả khách hàng</div>
                <div class="table-actions">
                    <select id="bk-filter-status" onchange="filterBookings()" style="padding:7px 10px;background:var(--elevated);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:0.8rem;cursor:pointer;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                        <option value="HOLDING">Đang giữ</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="EXPIRED">Hết hạn</option>
                    </select>
                </div>
            </div>
            <div id="bookings-table">${tableSkeleton(8)}</div>
        </div>
    `;

    await loadAllBookings();
}

async function loadAllBookings() {
    try {
        const res = await api.get('/admin/bookings?size=100');
        if (res && res.data) {
            _bookingsCache = res.data;
            renderBookingsTable(_bookingsCache);
        }
    } catch (err) {
        document.getElementById('bookings-table').innerHTML =
            `<div class="table-empty">Không thể tải danh sách booking: ${err.message}</div>`;
    }
}

function filterBookings() {
    const query = (document.getElementById('bk-search-q').value || '').trim().toLowerCase();
    const status = document.getElementById('bk-filter-status').value;

    let filtered = _bookingsCache;

    if (query) {
        filtered = filtered.filter(b =>
            (b.bookingCode || '').toLowerCase().includes(query) ||
            (b.userEmail || '').toLowerCase().includes(query) ||
            (b.userFullName || '').toLowerCase().includes(query) ||
            (b.movieTitle || '').toLowerCase().includes(query)
        );
    }

    if (status) {
        filtered = filtered.filter(b => b.status === status);
    }

    renderBookingsTable(filtered);
}

function renderBookingsTable(bookings) {
    const el = document.getElementById('bookings-table');

    if (!bookings.length) {
        el.innerHTML = '<div class="table-empty">Không có booking nào</div>';
        return;
    }

    el.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mã</th>
                    <th>Khách hàng</th>
                    <th>Phim</th>
                    <th>Rạp</th>
                    <th>Ghế</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày đặt</th>
                </tr>
            </thead>
            <tbody>
                ${bookings.map(b => {
                    const seats = (b.seats || []).map(s => s.rowName + s.seatNumber).join(', ') || '—';
                    return `
                    <tr style="cursor:pointer" onclick="viewBookingDetail(${b.id})">
                        <td style="font-family:monospace;font-weight:600;color:var(--primary)">${b.bookingCode || b.id}</td>
                        <td>
                            <div style="font-weight:500">${b.userFullName || '—'}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted)">${b.userEmail || ''}</div>
                        </td>
                        <td>${b.movieTitle || '—'}</td>
                        <td>${b.cinemaName || '—'}</td>
                        <td><span style="font-size:0.8rem">${seats}</span></td>
                        <td style="font-weight:600">${fmtMoney(b.finalAmount || b.totalAmount)}</td>
                        <td>${statusBookingBadge(b.status)}</td>
                        <td>${fmtDateTime(b.createdAt)}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function viewBookingDetail(id) {
    const b = _bookingsCache.find(x => x.id === id);
    if (!b) return;

    const seats = (b.seats || []).map(s => `${s.rowName}${s.seatNumber} (${s.seatType})`).join(', ') || '—';

    openModal(`
        <div class="modal-title">Booking #${b.bookingCode || b.id}</div>
        <table>
            <tbody>
                <tr><td>Khách hàng</td><td><strong>${b.userFullName || '—'}</strong></td></tr>
                <tr><td>Email</td><td>${b.userEmail || '—'}</td></tr>
                <tr><td>Phim</td><td><strong>${b.movieTitle || '—'}</strong></td></tr>
                <tr><td>Rạp / Phòng</td><td>${b.cinemaName || '—'} — ${b.roomName || '—'}</td></tr>
                <tr><td>Suất chiếu</td><td>${fmtDateTime(b.showtimeStart)}</td></tr>
                <tr><td>Ghế</td><td>${seats}</td></tr>
                <tr><td>Tổng tiền</td><td style="font-weight:700;color:var(--primary)">${fmtMoney(b.totalAmount)}</td></tr>
                ${b.discountAmount ? `<tr><td>Giảm giá</td><td style="color:var(--green)">-${fmtMoney(b.discountAmount)}</td></tr>` : ''}
                <tr><td>Thanh toán</td><td style="font-weight:700;color:var(--primary)">${fmtMoney(b.finalAmount)}</td></tr>
                <tr><td>Trạng thái</td><td>${statusBookingBadge(b.status)}</td></tr>
                <tr><td>Thanh toán</td><td>${b.paymentStatus || '—'}</td></tr>
                <tr><td>Ngày đặt</td><td>${fmtDateTime(b.createdAt)}</td></tr>
            </tbody>
        </table>
        <div class="modal-actions">
            <button class="btn-ghost" onclick="closeModal()">Đóng</button>
        </div>
    `);
}

function statusBookingBadge(status) {
    switch(status) {
        case 'CONFIRMED': return '<span class="badge badge-success">Đã xác nhận</span>';
        case 'COMPLETED': return '<span class="badge badge-success">Hoàn tất</span>';
        case 'PENDING_PAYMENT': return '<span class="badge badge-warn">Chờ thanh toán</span>';
        case 'CANCELLED': return '<span class="badge badge-danger">Đã hủy</span>';
        case 'HOLDING': return '<span class="badge badge-info">Đang giữ</span>';
        case 'EXPIRED': return '<span class="badge badge-muted">Hết hạn</span>';
        default: return '<span class="badge badge-muted">' + (status || '—') + '</span>';
    }
}
