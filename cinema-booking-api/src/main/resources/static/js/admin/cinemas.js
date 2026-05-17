/* Trang Quản lý Rạp chiếu */
async function renderCinemasPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Danh sách rạp</div>
            <button class="btn-gold" onclick="openCinemaModal()">Thêm rạp</button>
        </div>
        <div id="cinemas-list">${tableSkeleton(4)}</div>
    `;
    await loadCinemas();
}

async function loadCinemas() {
    try {
        const res = await api.get('/cinemas');
        const cinemas = res && res.data ? (res.data.content || res.data || []) : [];
        const el = document.getElementById('cinemas-list');
        
        if (!cinemas.length) {
            el.innerHTML = '<div class="empty-state"><p>Chưa có rạp chiếu nào</p></div>';
            return;
        }

        el.innerHTML = cinemas.map(c => `
            <div class="section-card">
                <div class="page-header" style="margin-bottom:12px">
                    <div>
                        <div style="font-weight:700;font-size:0.95rem">${c.name || 'Rạp'}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${c.address || ''}</div>
                    </div>
                    <button class="btn-ghost btn-sm" onclick="loadRooms(${c.id}, this)">Xem phòng chiếu</button>
                </div>
                <div class="cinema-rooms" id="rooms-${c.id}"></div>
            </div>
        `).join('');
    } catch(err) {
        showToast('Không thể tải danh sách rạp', 'error');
    }
}

async function loadRooms(cinemaId, btn) {
    const el = document.getElementById('rooms-' + cinemaId);
    if (el.innerHTML) { el.innerHTML = ''; btn.textContent = 'Xem phòng chiếu'; return; }
    
    btn.textContent = 'Đang tải...';
    try {
        const res = await api.get(`/cinemas/${cinemaId}/rooms`);
        const rooms = res && res.data ? (res.data.content || res.data || []) : [];
        
        if (!rooms.length) {
            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 0;">
                    <p style="color:var(--text-muted);font-size:0.8rem;margin:0;">Ch\u01b0a c\u00f3 ph\u00f2ng chi\u1ebfu n\u00e0o</p>
                    <button class="btn-primary btn-sm" onclick="openRoomModal(${cinemaId})">+ Th\u00eam ph\u00f2ng</button>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; padding-top: 8px;">
                    <span style="font-weight:600; font-size:0.85rem">Danh s\u00e1ch ph\u00f2ng</span>
                    <button class="btn-primary btn-sm" onclick="openRoomModal(${cinemaId})">+ Th\u00eam ph\u00f2ng</button>
                </div>
                <table>
                    <thead><tr>
                        <th>Tên phòng</th>
                        <th>Loại</th>
                        <th>Số ghế</th>
                    </tr></thead>
                    <tbody>
                        ${rooms.map(r => `
                            <tr>
                                <td>${r.name || ''}</td>
                                <td>${r.type || r.roomType || '—'}</td>
                                <td>${r.capacity || r.totalSeats || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        btn.textContent = 'Ẩn phòng chiếu';
    } catch(err) {
        el.innerHTML = '<p style="color:var(--danger);font-size:0.8rem">Lỗi tải phòng chiếu</p>';
        btn.textContent = 'Xem phòng chiếu';
    }
}

function openCinemaModal() {
    openModal(`
        <div class="modal-title">Thêm rạp mới</div>
        <form onsubmit="saveCinema(event)">
            <div class="field">
                <label>Tên rạp</label>
                <input type="text" id="c-name" required placeholder="Cinema Star Quận 1">
            </div>
            <div class="field">
                <label>Địa chỉ</label>
                <input type="text" id="c-address" placeholder="123 Nguyễn Huệ, Q.1, TP.HCM">
            </div>
            <div class="field">
                <label>Số điện thoại</label>
                <input type="tel" id="c-phone" placeholder="0901234567">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-gold" id="cinema-save-btn">Thêm mới</button>
            </div>
        </form>
    `);
}

async function saveCinema(e) {
    e.preventDefault();
    const btn = document.getElementById('cinema-save-btn');
    btn.disabled = true;
    
    const body = {
        name: document.getElementById('c-name').value.trim(),
        address: document.getElementById('c-address').value.trim(),
        phone: document.getElementById('c-phone').value.trim(),
    };

    try {
        await api.post('/admin/cinemas', body);
        showToast('Đã thêm rạp mới', 'success');
        closeModal();
        await loadCinemas();
    } catch(err) {
        showToast(err.message || 'Lỗi khi thêm rạp', 'error');
        btn.disabled = false;
    }
}

function openRoomModal(cinemaId) {
    openModal(`
        <div class="modal-title">Th\u00eam ph\u00f2ng chi\u1ebfu m\u1edbi</div>
        <form onsubmit="saveRoom(event, ${cinemaId})">
            <div class="field">
                <label>T\u00ean ph\u00f2ng</label>
                <input type="text" id="r-name" required placeholder="V\u00ed d\u1ee5: RAP 1, IMAX 1...">
            </div>
            <div class="field">
                <label>Lo\u1ea1i ph\u00f2ng</label>
                <select id="r-type" required>
                    <option value="STANDARD_2D">STANDARD_2D (Ti\u00eau chu\u1ea9n)</option>
                    <option value="STANDARD_3D">STANDARD_3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="VIP_4DX">VIP 4DX</option>
                </select>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>S\u1ed1 h\u00e0ng gh\u1ebf (1-26)</label>
                    <input type="number" id="r-rows" required min="1" max="26" value="10">
                </div>
                <div class="field">
                    <label>S\u1ed1 gh\u1ebf m\u1ed7i h\u00e0ng</label>
                    <input type="number" id="r-cols" required min="1" max="30" value="12">
                </div>
            </div>
            <div style="margin-bottom:16px; font-size:0.8rem; color:var(--text-muted); padding:12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px;">
                \ud83d\udca1 <b>L\u01b0u \u00fd s\u01a1 \u0111\u1ed3 gh\u1ebf t\u1ef1 \u0111\u1ed9ng:</b><br/>
                - 2 h\u00e0ng cu\u1ed1i c\u00f9ng: Gh\u1ebf \u0111\u00f4i (COUPLE)<br/>
                - C\u00e1c h\u00e0ng gi\u1eefa: Gh\u1ebf VIP<br/>
                - C\u00e1c h\u00e0ng s\u00e1t m\u00e0n h\u00ecnh: Gh\u1ebf STANDARD
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-ghost" onclick="closeModal()">H\u1ee7y</button>
                <button type="submit" class="btn-gold" id="room-save-btn">T\u1ea1o ph\u00f2ng & Sinh gh\u1ebf</button>
            </div>
        </form>
    `);
}

async function saveRoom(e, cinemaId) {
    e.preventDefault();
    const btn = document.getElementById('room-save-btn');
    btn.disabled = true;
    btn.textContent = '\u0110ang x\u1eed l\u00fd...';

    const body = {
        name: document.getElementById('r-name').value.trim(),
        type: document.getElementById('r-type').value,
        rowCount: parseInt(document.getElementById('r-rows').value),
        colCount: parseInt(document.getElementById('r-cols').value)
    };

    try {
        await api.post('/admin/cinemas/' + cinemaId + '/rooms', body);
        showToast('\u0110\u00e3 th\u00eam ph\u00f2ng chi\u1ebfu v\u00e0 t\u1ef1 \u0111\u1ed9ng sinh s\u01a1 \u0111\u1ed3 gh\u1ebf!', 'success');
        closeModal();
        
        // Tải lại danh sách phòng sau khi thêm mới thành công
        const wrapper = document.getElementById('rooms-' + cinemaId);
        const toggleBtn = wrapper.previousElementSibling.querySelector('button');
        wrapper.innerHTML = ''; 
        await loadRooms(cinemaId, toggleBtn);
    } catch(err) {
        showToast(err.message || 'L\u1ed7i khi th\u00eam ph\u00f2ng chi\u1ebfu', 'error');
        btn.disabled = false;
        btn.textContent = 'T\u1ea1o ph\u00f2ng & Sinh gh\u1ebf';
    }
}
