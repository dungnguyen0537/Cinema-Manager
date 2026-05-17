/* Trang Quản lý Lịch chiếu */
async function renderShowtimesPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Lịch chiếu</div>
            <button class="btn-gold" onclick="openShowtimeModal()">Thêm lịch chiếu</button>
        </div>
        <div class="table-wrap">
            <div class="table-header" style="display:flex;gap:8px;align-items:center">
                <input type="date" class="table-search" id="st-filter-date" onchange="loadShowtimes()" style="width:160px">
                <button class="btn-ghost btn-sm" onclick="clearShowtimeFilter()" title="Xem tất cả">Tất cả</button>
            </div>
            <div id="showtimes-table">${tableSkeleton(6)}</div>
        </div>
    `;
    // Không đặt mặc định ngày — hiện tất cả lịch chiếu sắp tới
    await loadShowtimes();
}

function clearShowtimeFilter() {
    const dateInput = document.getElementById('st-filter-date');
    if (dateInput) dateInput.value = '';
    loadShowtimes();
}

async function loadShowtimes() {
    const date = document.getElementById('st-filter-date')?.value || '';
    try {
        let url = '/showtimes?size=100';
        if (date) url += '&date=' + date;
        const res = await api.get(url);
        const showtimes = res && res.data ? (res.data.content || res.data || []) : [];
        renderShowtimesTable(showtimes);
    } catch(err) {
        showToast('Không thể tải lịch chiếu', 'error');
    }
}

function renderShowtimesTable(showtimes) {
    const el = document.getElementById('showtimes-table');
    if (!showtimes.length) {
        el.innerHTML = '<div class="table-empty">Không có lịch chiếu nào</div>';
        return;
    }
    el.innerHTML = `
        <table>
            <thead><tr>
                <th>Phim</th>
                <th>Rạp</th>
                <th>Phòng</th>
                <th>Giờ chiếu</th>
                <th>Giá vé</th>
            </tr></thead>
            <tbody>
                ${showtimes.map(s => `
                    <tr>
                        <td>${s.movieTitle || s.movie?.title || '—'}</td>
                        <td>${s.cinemaName || s.cinema?.name || '—'}</td>
                        <td>${s.roomName || s.room?.name || '—'}</td>
                        <td>${fmtDateTime(s.startTime || s.showTime)}</td>
                        <td>${s.basePrice ? fmtMoney(s.basePrice) : '—'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function openShowtimeModal() {
    // Tải danh sách phim và rạp để người dùng lựa chọn trong Form
    let moviesOpts = '<option value="">Chọn phim</option>';
    let cinemasOpts = '<option value="">Chọn rạp</option>';

    try {
        const [moviesRes, cinemasRes] = await Promise.all([
            api.get('/movies?size=100'),
            api.get('/cinemas'),
        ]);
        const movies = moviesRes?.data?.content || moviesRes?.data || [];
        const cinemas = cinemasRes?.data?.content || cinemasRes?.data || [];
        moviesOpts += movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
        cinemasOpts += cinemas.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch(e) {}

    openModal(`
        <div class="modal-title">Thêm lịch chiếu</div>
        <form onsubmit="saveShowtime(event)">
            <div class="field">
                <label>Phim</label>
                <select id="st-movie" required>${moviesOpts}</select>
            </div>
            <div class="field">
                <label>Rạp</label>
                <select id="st-cinema" required onchange="loadRoomsForShowtime(this.value)">${cinemasOpts}</select>
            </div>
            <div class="field">
                <label>Phòng chiếu</label>
                <select id="st-room" required><option value="">Chọn rạp trước</option></select>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Giờ chiếu</label>
                    <input type="datetime-local" id="st-time" required>
                </div>
                <div class="field">
                    <label>Giá vé (VNĐ)</label>
                    <input type="number" id="st-price" placeholder="75000" min="0" required>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-gold" id="st-save-btn">Tạo lịch chiếu</button>
            </div>
        </form>
    `);
}

async function loadRoomsForShowtime(cinemaId) {
    const select = document.getElementById('st-room');
    if (!cinemaId) { select.innerHTML = '<option value="">Chọn rạp trước</option>'; return; }
    select.innerHTML = '<option value="">Đang tải...</option>';
    try {
        const res = await api.get(`/cinemas/${cinemaId}/rooms`);
        const rooms = res?.data?.content || res?.data || [];
        select.innerHTML = '<option value="">Chọn phòng</option>' +
            rooms.map(r => `<option value="${r.id}">${r.name} (${r.roomType || 'Standard'})</option>`).join('');
    } catch(e) {
        select.innerHTML = '<option value="">Lỗi tải phòng</option>';
    }
}

async function saveShowtime(e) {
    e.preventDefault();
    const btn = document.getElementById('st-save-btn');
    btn.disabled = true;

    const body = {
        movieId: parseInt(document.getElementById('st-movie').value),
        roomId: parseInt(document.getElementById('st-room').value),
        startTime: document.getElementById('st-time').value,
        basePrice: parseInt(document.getElementById('st-price').value),
    };

    try {
        await api.post('/admin/showtimes', body);
        showToast('\u0110\u00e3 t\u1ea1o l\u1ecbch chi\u1ebfu', 'success');
        
        // Cập nhật bộ lọc ngày về ngày vừa tạo để thấy ngay lập tức
        const createdDate = document.getElementById('st-time').value.split('T')[0];
        if (createdDate && document.getElementById('st-filter-date')) {
            document.getElementById('st-filter-date').value = createdDate;
        }
        
        closeModal();
        
        await loadShowtimes();
    } catch(err) {
        showToast(err.message || 'Lỗi khi tạo lịch chiếu', 'error');
        btn.disabled = false;
    }
}
