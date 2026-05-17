/* Trang Quản lý Mã Khuyến mãi */
let _promosCache = [];

async function renderPromotionsPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Mã khuyến mãi</div>
            <button class="btn-gold" onclick="openPromoModal()">Thêm mã</button>
        </div>
        <div class="table-wrap">
            <div id="promos-table">${tableSkeleton(4)}</div>
        </div>
    `;
    await loadPromotions();
}

async function loadPromotions() {
    try {
        const res = await api.get('/admin/promotions');
        _promosCache = res && res.data ? (res.data.content || res.data || []) : [];
        renderPromosTable(_promosCache);
    } catch(err) {
        showToast('Không thể tải danh sách khuyến mãi', 'error');
    }
}

function renderPromosTable(promos) {
    const el = document.getElementById('promos-table');
    if (!promos.length) {
        el.innerHTML = '<div class="table-empty">Chưa có mã khuyến mãi</div>';
        return;
    }
    el.innerHTML = `
        <table>
            <thead><tr>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Loại</th>
                <th>Còn lại</th>
                <th>Thời gian</th>
                <th>Áp dụng</th>
                <th>Trạng thái</th>
                <th style="width:140px">Thao tác</th>
            </tr></thead>
            <tbody>
                ${promos.map(p => `
                    <tr>
                        <td style="font-family:monospace;letter-spacing:1px">${p.code || ''}</td>
                        <td>${p.discountType === 'PERCENTAGE' ? (p.discountValue + '%') : fmtMoney(p.discountValue)}</td>
                        <td>${p.discountType === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}</td>
                        <td>${p.usageLimit ? (p.usageLimit - (p.usedCount || 0)) : '∞'}</td>
                        <td style="font-size:0.8rem;line-height:1.4">
                            ${fmtDate(p.startTime)} —<br>${fmtDate(p.endTime)}
                        </td>
                        <td>${promoMoviesLabel(p)}</td>
                        <td>${promoStatusBadge(p)}</td>
                        <td>
                            <div class="gap-row">
                                <button class="btn-ghost btn-sm" onclick="openEditPromoModal(${p.id})">Sửa</button>
                                <button class="btn-danger btn-sm" onclick="confirmDeletePromo(${p.id}, '${(p.code||'').replace(/'/g,"\\'")}')">Xóa</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function promoMoviesLabel(p) {
    if (!p.applicableMovieIds) return '<span class="badge badge-info">Tất cả phim</span>';
    const ids = p.applicableMovieIds.split(',').filter(Boolean);
    const names = ids.map(id => {
        const m = (_moviesCache || []).find(m => m.id == id);
        return m ? m.title : '#' + id;
    });
    if (names.length <= 2) return `<span class="badge badge-purple">${names.join(', ')}</span>`;
    return `<span class="badge badge-purple" title="${names.join(', ')}">${names.length} phim</span>`;
}

function promoStatusBadge(p) {
    if (p.status === 'INACTIVE') return '<span class="badge badge-muted">Tắt</span>';
    const now = new Date();
    if (p.startTime && new Date(p.startTime) > now) return '<span class="badge badge-warn">Chờ</span>';
    if (p.endTime && new Date(p.endTime) < now) return '<span class="badge badge-danger">Hết hạn</span>';
    return '<span class="badge badge-success">Hoạt động</span>';
}

async function openPromoModal(promo = null) {
    const isEdit = !!promo;
    // Tải danh sách phim cho bộ chọn (selector)
    if (!_moviesCache || !_moviesCache.length) {
        try {
            const res = await api.get('/movies?size=100');
            if (res && res.data) _moviesCache = res.data.content || res.data || [];
        } catch(e) { /* bỏ qua lỗi */ }
    }

    const selectedMovieIds = promo && promo.applicableMovieIds
        ? promo.applicableMovieIds.split(',').map(Number).filter(Boolean)
        : [];

    const movieChips = (_moviesCache || []).map(m => {
        const checked = selectedMovieIds.includes(m.id) ? 'checked' : '';
        return `<label class="genre-chip">
            <input type="checkbox" name="promo-movie-cb" value="${m.id}" ${checked}><span>${m.title}</span>
        </label>`;
    }).join('');

    const defaultStart = promo && promo.startTime ? promo.startTime.substring(0, 16) : '';
    const defaultEnd = promo && promo.endTime ? promo.endTime.substring(0, 16) : '';

    openModal(`
        <div class="modal-title">${isEdit ? 'Sửa mã khuyến mãi' : 'Thêm mã khuyến mãi'}</div>
        <form onsubmit="savePromo(event, ${promo ? promo.id : 'null'})">
            <div class="field">
                <label>Mã code</label>
                <input type="text" id="p-code" value="${promo ? promo.code : ''}" required placeholder="CINEMA2026" style="text-transform:uppercase">
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Loại giảm giá</label>
                    <select id="p-type">
                        <option value="PERCENTAGE" ${promo && promo.discountType === 'PERCENTAGE' ? 'selected' : ''}>Phần trăm (%)</option>
                        <option value="FIXED" ${promo && promo.discountType === 'FIXED' ? 'selected' : ''}>Cố định (VNĐ)</option>
                    </select>
                </div>
                <div class="field">
                    <label>Giá trị</label>
                    <input type="number" id="p-value" value="${promo ? promo.discountValue : ''}" min="0" required>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Số lần sử dụng tối đa</label>
                    <input type="number" id="p-max" value="${promo ? (promo.usageLimit || '') : ''}" min="1" placeholder="Không giới hạn">
                </div>
                <div class="field">
                    <label>Trạng thái</label>
                    <select id="p-status">
                        <option value="ACTIVE" ${!promo || promo.status === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option>
                        <option value="INACTIVE" ${promo && promo.status === 'INACTIVE' ? 'selected' : ''}>Tắt</option>
                    </select>
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Thời gian bắt đầu</label>
                    <input type="datetime-local" id="p-start" value="${defaultStart}" required>
                </div>
                <div class="field">
                    <label>Thời gian kết thúc</label>
                    <input type="datetime-local" id="p-end" value="${defaultEnd}" required>
                </div>
            </div>
            <div class="field">
                <label>Áp dụng cho phim <span style="color:var(--text-muted);font-weight:400;font-size:0.8rem">(bỏ trống = tất cả phim)</span></label>
                <div id="promo-movie-chips" class="genre-chips-wrap">
                    ${movieChips || '<span style="color:var(--text-muted);font-size:0.85rem">Chưa có phim nào</span>'}
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-gold" id="promo-save-btn">${isEdit ? 'Cập nhật' : 'Tạo mã'}</button>
            </div>
        </form>
    `);
}

function openEditPromoModal(id) {
    const promo = _promosCache.find(p => p.id === id);
    if (promo) openPromoModal(promo);
}

async function savePromo(e, id) {
    e.preventDefault();
    const btn = document.getElementById('promo-save-btn');
    btn.disabled = true;

    // Lấy danh sách ID phim được chọn
    const selectedMovies = [];
    document.querySelectorAll('input[name="promo-movie-cb"]:checked').forEach(cb => {
        selectedMovies.push(cb.value);
    });

    const body = {
        code: document.getElementById('p-code').value.trim().toUpperCase(),
        discountType: document.getElementById('p-type').value,
        discountValue: parseFloat(document.getElementById('p-value').value),
        usageLimit: parseInt(document.getElementById('p-max').value) || null,
        status: document.getElementById('p-status').value,
        startTime: document.getElementById('p-start').value || null,
        endTime: document.getElementById('p-end').value || null,
        applicableMovieIds: selectedMovies.length > 0 ? selectedMovies.join(',') : null,
    };

    try {
        if (id) {
            await api.put('/admin/promotions/' + id, body);
            showToast('Đã cập nhật mã khuyến mãi', 'success');
        } else {
            await api.post('/admin/promotions', body);
            showToast('Đã tạo mã khuyến mãi', 'success');
        }
        closeModal();
        await loadPromotions();
    } catch(err) {
        showToast(err.message || 'Lỗi khi lưu khuyến mãi', 'error');
        btn.disabled = false;
    }
}

function confirmDeletePromo(id, code) {
    openModal(`
        <div class="modal-title">Xóa mã khuyến mãi</div>
        <p style="color:var(--text-sec);font-size:0.9rem;margin-bottom:8px">Bạn có chắc muốn xóa mã khuyến mãi <strong>${code}</strong>?</p>
        <p style="color:var(--text-muted);font-size:0.8rem">Hành động này không thể hoàn tác.</p>
        <div class="modal-actions">
            <button class="btn-ghost" onclick="closeModal()">Hủy</button>
            <button class="btn-danger" onclick="deletePromo(${id})">Xóa</button>
        </div>
    `);
}

async function deletePromo(id) {
    try {
        await api.delete('/admin/promotions/' + id);
        showToast('Đã xóa mã khuyến mãi', 'success');
        closeModal();
        await loadPromotions();
    } catch(err) {
        showToast(err.message || 'Lỗi khi xóa mã khuyến mãi', 'error');
    }
}
