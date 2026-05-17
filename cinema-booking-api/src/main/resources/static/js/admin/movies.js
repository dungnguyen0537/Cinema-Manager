/* Quản lý Phim — Các chức năng Thêm, Sửa, Xóa (CRUD) */
let _moviesCache = [];
let _genresCache = [];

async function renderMoviesPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Danh sách phim</div>
            <button class="btn-gold" onclick="openMovieModal()">Thêm phim</button>
        </div>
        <div class="table-wrap">
            <div class="table-header">
                <input type="text" class="table-search" placeholder="Tìm kiếm phim..." oninput="filterMovies(this.value)">
            </div>
            <div id="movies-table">${tableSkeleton(6)}</div>
        </div>
    `;
    await loadMovies();
}

async function loadMovies() {
    try {
        const res = await api.get('/movies?size=100');
        if (res && res.data) {
            _moviesCache = res.data.content || res.data || [];
            renderMoviesTable(_moviesCache);
        }
    } catch (err) {
        showToast('Không thể tải danh sách phim', 'error');
    }
}

async function loadGenres() {
    if (_genresCache.length) return _genresCache;
    try {
        const res = await api.get('/genres');
        _genresCache = res?.data || [];
    } catch (e) {
        _genresCache = [];
    }
    return _genresCache;
}

function filterMovies(query) {
    const q = query.toLowerCase();
    const filtered = _moviesCache.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.genres || []).join(' ').toLowerCase().includes(q)
    );
    renderMoviesTable(filtered);
}

function renderMoviesTable(movies) {
    const el = document.getElementById('movies-table');
    if (!movies.length) {
        el.innerHTML = '<div class="table-empty">Chưa có phim nào</div>';
        return;
    }
    el.innerHTML = `
        <table>
            <thead><tr>
                <th>Tên phim</th>
                <th>Thể loại</th>
                <th>Thời lượng</th>
                <th>Trạng thái</th>
                <th style="width:140px">Thao tác</th>
            </tr></thead>
            <tbody>
                ${movies.map(m => `
                    <tr>
                        <td>${m.title || ''}</td>
                        <td>${(m.genres || []).join(', ') || '—'}</td>
                        <td>${m.durationMinutes || m.movieDuration || '—'} phút</td>
                        <td>${statusBadge(m.status)}</td>
                        <td>
                            <div class="gap-row">
                                <button class="btn-ghost btn-sm" onclick="openEditMovieModal(${m.id})">Sửa</button>
                                <button class="btn-danger btn-sm" onclick="confirmDeleteMovie(${m.id}, '${(m.title||'').replace(/'/g,"\\'")}')">Xóa</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function statusBadge(status) {
    switch(status) {
        case 'NOW_SHOWING': return '<span class="badge badge-success">Đang chiếu</span>';
        case 'COMING_SOON': return '<span class="badge badge-info">Sắp chiếu</span>';
        case 'ENDED': return '<span class="badge badge-muted">Đã kết thúc</span>';
        default: return '<span class="badge badge-muted">' + (status || '—') + '</span>';
    }
}

async function openMovieModal(movie = null) {
    const isEdit = !!movie;
    const title = isEdit ? 'Sửa phim' : 'Thêm phim mới';
    const genres = await loadGenres();

    // Xác định các thể loại hiện tại của phim để tích sẵn checkbox
    const selectedGenreIds = [];
    if (movie && movie.genreIds) {
        selectedGenreIds.push(...movie.genreIds);
    } else if (movie && movie.genres && genres.length) {
        // Nếu phim có tên thể loại nhưng không có ID (dữ liệu cũ), tìm ID tương ứng theo tên để hiển thị chính xác trên UI
        movie.genres.forEach(gName => {
            const found = genres.find(g => g.name === gName);
            if (found) selectedGenreIds.push(found.id);
        });
    }

    const genreCheckboxes = genres.map(g => {
        const checked = selectedGenreIds.includes(g.id) ? 'checked' : '';
        return `<label class="genre-chip">
            <input type="checkbox" name="genre-cb" value="${g.id}" ${checked}><span>${g.name}</span>
        </label>`;
    }).join('');

    openModal(`
        <div class="modal-title">${title}</div>
        <form id="movie-form" onsubmit="saveMovie(event, ${movie ? movie.id : 'null'})">
            <div class="field">
                <label>Tên phim</label>
                <input type="text" id="m-title" value="${movie ? movie.title : ''}" required>
            </div>
            <div class="field">
                <label>Mô tả</label>
                <textarea id="m-desc">${movie ? (movie.description || '') : ''}</textarea>
            </div>
            <div class="field">
                <label>Thể loại</label>
                <div id="genre-checkboxes" class="genre-chips-wrap">
                    ${genreCheckboxes || '<span style="color:var(--text-muted);font-size:0.85rem">Chưa có thể loại nào trong hệ thống</span>'}
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Thời lượng (phút)</label>
                    <input type="number" id="m-duration" value="${movie ? (movie.durationMinutes || '') : ''}" min="1" required>
                </div>
                <div class="field">
                    <label>Trạng thái</label>
                    <select id="m-status">
                        <option value="COMING_SOON" ${movie && movie.status === 'COMING_SOON' ? 'selected' : ''}>Sắp chiếu</option>
                        <option value="NOW_SHOWING" ${movie && movie.status === 'NOW_SHOWING' ? 'selected' : ''}>Đang chiếu</option>
                        <option value="ENDED" ${movie && movie.status === 'ENDED' ? 'selected' : ''}>Đã kết thúc</option>
                    </select>
                </div>
            </div>
            <div class="field">
                <label>Ảnh Poster</label>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" id="m-poster" value="${movie ? (movie.posterUrl || '') : ''}" placeholder="URL ảnh hoặc tải lên..." style="flex:1">
                    <label class="btn-ghost btn-sm" style="cursor:pointer;white-space:nowrap;padding:8px 12px;border:1px solid var(--border);border-radius:6px">
                        Tải ảnh
                        <input type="file" accept="image/*" onchange="uploadMovieFile(this, 'image', 'm-poster')" style="display:none">
                    </label>
                </div>
                <div id="m-poster-preview" style="margin-top:8px">${movie && movie.posterUrl ? '<img src="'+movie.posterUrl+'" style="max-height:120px;border-radius:8px;object-fit:cover">' : ''}</div>
            </div>
            <div class="field">
                <label>Video Trailer</label>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" id="m-trailer" value="${movie ? (movie.trailerUrl || '') : ''}" placeholder="URL video hoặc tải lên..." style="flex:1">
                    <label class="btn-ghost btn-sm" style="cursor:pointer;white-space:nowrap;padding:8px 12px;border:1px solid var(--border);border-radius:6px">
                        Tải video
                        <input type="file" accept="video/*" onchange="uploadMovieFile(this, 'video', 'm-trailer')" style="display:none">
                    </label>
                </div>
                <div id="m-trailer-status" style="margin-top:4px;font-size:0.8rem;color:var(--text-muted)"></div>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Ngày phát hành</label>
                    <input type="date" id="m-release" value="${movie && movie.releaseDate ? movie.releaseDate.split('T')[0] : ''}">
                </div>
                <div class="field">
                    <label>Đạo diễn</label>
                    <input type="text" id="m-director" value="${movie ? (movie.director || '') : ''}">
                </div>
            </div>
            <div class="field-row">
                <div class="field">
                    <label>Ngôn ngữ</label>
                    <input type="text" id="m-language" value="${movie ? (movie.language || '') : ''}" placeholder="VD: Tiếng Việt">
                </div>
                <div class="field">
                    <label>Phân loại tuổi</label>
                    <input type="text" id="m-age" value="${movie ? (movie.ageRating || '') : ''}" placeholder="VD: P, T13, T16, T18">
                </div>
            </div>
            <div class="field">
                <label>Diễn viên</label>
                <input type="text" id="m-cast" value="${movie ? (movie.cast || '') : ''}" placeholder="Cách nhau bởi dấu phẩy">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-ghost" onclick="closeModal()">Hủy</button>
                <button type="submit" class="btn-gold" id="movie-save-btn">${isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
            </div>
        </form>
    `);
}

async function openEditMovieModal(id) {
    const movie = _moviesCache.find(m => m.id === id);
    if (movie) {
        openMovieModal(movie);
    } else {
        try {
            const res = await api.get('/movies/' + id);
            if (res && res.data) openMovieModal(res.data);
        } catch(e) { showToast('Không thể tải thông tin phim', 'error'); }
    }
}

async function saveMovie(e, id) {
    e.preventDefault();
    const btn = document.getElementById('movie-save-btn');
    btn.disabled = true;

    // Thu thập các ID thể loại đã được chọn từ các checkbox
    const genreIds = [];
    document.querySelectorAll('input[name="genre-cb"]:checked').forEach(cb => {
        genreIds.push(parseInt(cb.value));
    });

    const body = {
        title: document.getElementById('m-title').value.trim(),
        description: document.getElementById('m-desc').value.trim(),
        durationMinutes: parseInt(document.getElementById('m-duration').value),
        status: document.getElementById('m-status').value,
        posterUrl: document.getElementById('m-poster').value.trim(),
        trailerUrl: document.getElementById('m-trailer').value.trim(),
        releaseDate: document.getElementById('m-release').value || null,
        director: document.getElementById('m-director').value.trim(),
        cast: document.getElementById('m-cast').value.trim(),
        language: document.getElementById('m-language').value.trim(),
        ageRating: document.getElementById('m-age').value.trim(),
        genreIds: genreIds.length > 0 ? genreIds : null,
    };

    try {
        if (id) {
            await api.put('/admin/movies/' + id, body);
            showToast('Đã cập nhật phim', 'success');
        } else {
            await api.post('/admin/movies', body);
            showToast('Đã thêm phim mới', 'success');
        }
        closeModal();
        await loadMovies();
    } catch(err) {
        showToast(err.message || 'Lỗi khi lưu phim', 'error');
        btn.disabled = false;
    }
}

function confirmDeleteMovie(id, title) {
    openModal(`
        <div class="modal-title">Xóa phim</div>
        <p style="color:var(--text-sec);font-size:0.9rem;margin-bottom:8px">Bạn có chắc muốn xóa phim <strong>${title}</strong>?</p>
        <p style="color:var(--text-muted);font-size:0.8rem">Hành động này không thể hoàn tác.</p>
        <div class="modal-actions">
            <button class="btn-ghost" onclick="closeModal()">Hủy</button>
            <button class="btn-danger" onclick="deleteMovie(${id})">Xóa phim</button>
        </div>
    `);
}

async function deleteMovie(id) {
    try {
        await api.delete('/admin/movies/' + id);
        showToast('Đã xóa phim', 'success');
        closeModal();
        await loadMovies();
    } catch(err) {
        showToast(err.message || 'Lỗi khi xóa phim', 'error');
    }
}

async function uploadMovieFile(input, type, targetId) {
    const file = input.files[0];
    if (!file) return;

    const endpoint = type === 'image' ? '/api/v1/admin/upload/image' : '/api/v1/admin/upload/video';
    const statusId = type === 'image' ? 'm-poster-preview' : 'm-trailer-status';
    const statusEl = document.getElementById(statusId);

    if (statusEl) {
        statusEl.innerHTML = type === 'image'
            ? '<div style="color:var(--gold)">Đang tải ảnh lên...</div>'
            : 'Đang tải video lên... (có thể mất vài phút)';
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + api.token },
            body: formData
        });

        let data = {};
        try {
            data = await res.json();
        } catch (e) {
            const statusMsg = res.status === 413 ? "File quá lớn (vượt giới hạn server)" : `Lỗi HTTP ${res.status}`;
            throw new Error(`Upload thất bại: ${statusMsg}`);
        }

        if (!res.ok) throw new Error(data.message || data.error || 'Upload thất bại');

        // Xử lý phản hồi: dữ liệu có thể là {data: {url: "..."}} hoặc {data: "url"}
        const url = typeof data.data === 'string' ? data.data : (data.data?.url || data.url || '');
        if (!url) throw new Error('Không nhận được URL từ server');

        document.getElementById(targetId).value = url;

        if (type === 'image' && statusEl) {
            statusEl.innerHTML = `<img src="${url}" style="max-height:120px;border-radius:8px;object-fit:cover">`;
        } else if (statusEl) {
            statusEl.innerHTML = '<span style="color:var(--green)">Tải video thành công!</span>';
        }
        showToast('Tải file thành công!', 'success');
    } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--red)">Lỗi: ${err.message}</span>`;
        showToast(err.message || 'Lỗi khi tải file', 'error');
    }

    input.value = '';
}
