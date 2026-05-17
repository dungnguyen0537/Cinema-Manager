/* Trang Phim */
async function renderMovies(app) {
    const searchParam = new URLSearchParams(window.location.search).get('search') || '';
    app.innerHTML = `
        <section class="section">
            <div class="movies-page-header">
                <h2 class="section-title">Tất cả phim</h2>
                <div class="movies-search-wrapper">
                    <div class="movies-search-bar">
                        <svg class="movies-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input type="text" id="movies-search-input" placeholder="Tìm phim, thể loại, đạo diễn..." value="${searchParam}" autocomplete="off"
                            onkeydown="if(event.key === 'Enter') performMoviesSearch(this.value)"
                            oninput="handleMoviesSearchInput(this.value)">
                        <button class="movies-search-btn" onclick="performMoviesSearch(document.getElementById('movies-search-input').value)" title="Tìm kiếm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                    </div>
                    <div id="movies-search-suggestions" class="search-suggestions" style="display:none;"></div>
                </div>
            </div>
            <div class="movie-grid" id="all-movies-grid">
                ${skeletonCards(8)}
            </div>
        </section>
    `;

    try {
        const search = new URLSearchParams(window.location.search).get('search') || '';
        const url = search ? `/movies?size=20&search=${encodeURIComponent(search)}` : '/movies?size=20';
        const res = await api.get(url);
        const data = res?.data;
        const movies = Array.isArray(data) ? data : (data?.content || []);
        document.getElementById('all-movies-grid').innerHTML =
            movies.length ? movies.map(movieCard).join('') :
            `<div class="empty-state" style="grid-column:1/-1">
                <div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg></div>
                <h3>Không tìm thấy phim</h3>
                <p>Thử tìm kiếm với từ khóa khác</p>
            </div>`;
    } catch (err) {
        console.error('renderMovies error:', err);
        document.getElementById('all-movies-grid').innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1">Không thể tải phim: ${err.message}</p>`;
    }
}

/* Trang Rạp Chiếu */
async function renderCinemas(app) {
    app.innerHTML = `
        <section class="section">
            <h2 class="section-title" style="margin-bottom:28px">Hệ thống rạp chiếu</h2>
            <div id="cinemas-list"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </section>
    `;

    try {
        const res = await api.get('/cinemas');
        const data = res?.data;
        const cinemas = Array.isArray(data) ? data : (data?.content || []);
        if (cinemas.length) {
            document.getElementById('cinemas-list').innerHTML = cinemas.map(c => `
                <div class="cinema-showtimes" style="cursor:pointer" onclick="navigate('/showtimes', {cinemaId: ${c.id}})">
                    <div class="cinema-name">${c.name} <small>${c.address || ''}, ${c.city || ''}</small></div>
                </div>
            `).join('');
        } else {
            document.getElementById('cinemas-list').innerHTML = '<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div><h3>Chưa có rạp</h3></div>';
        }
    } catch (err) {
        console.error('renderCinemas error:', err);
        document.getElementById('cinemas-list').innerHTML = `<p style="color:var(--text-muted)">Không thể tải rạp: ${err.message}</p>`;
    }
}

/* Trang Lịch Chiếu */
async function renderShowtimes(app) {
    app.innerHTML = `
        <section class="section">
            <h2 class="section-title" style="margin-bottom:28px">Lịch chiếu hôm nay</h2>
            <div id="showtimes-list"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </section>
    `;

    try {
        const params = new URLSearchParams(window.location.search);
        const cinemaId = params.get('cinemaId') || '';
        let url = '/showtimes';
        if (cinemaId) url += `?cinemaId=${cinemaId}`;
        const res = await api.get(url);
        const data = res?.data;
        const showtimes = Array.isArray(data) ? data : (data?.content || []);
        if (!showtimes.length) {
            document.getElementById('showtimes-list').innerHTML = `
                <div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><h3>Chưa có lịch chiếu</h3></div>`;
            return;
        }
        // Nhóm theo phim
        const grouped = {};
        showtimes.forEach(s => {
            const key = s.movieId;
            if (!grouped[key]) grouped[key] = { movie: s, times: [] };
            grouped[key].times.push(s);
        });

        document.getElementById('showtimes-list').innerHTML = Object.values(grouped).map(g => `
            <div class="cinema-showtimes">
                <div class="cinema-name" style="cursor:pointer" onclick="navigate('/movie', {id: ${g.movie.movieId}})">
                    ${g.movie.movieTitle} <small>• ${g.movie.movieDuration || '?'}p • ${g.movie.cinemaName || ''}</small>
                </div>
                <div class="showtime-list">
                    ${g.times.map(t => `
                        <button class="showtime-btn" onclick="goToSeats(${t.id})">
                            ${formatTime(t.startTime)}
                            <span class="price">${formatMoney(t.basePrice)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('renderShowtimes error:', err);
        document.getElementById('showtimes-list').innerHTML = `<p style="color:var(--text-muted)">Không thể tải lịch chiếu: ${err.message}</p>`;
    }
}

function goToSeats(showtimeId) {
    if (!api.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để đặt vé', 'info');
        openModal('login');
        return;
    }
    navigate('/seats', { showtimeId });
}

function performMoviesSearch(query) {
    const sugBox = document.getElementById('movies-search-suggestions');
    if (sugBox) sugBox.style.display = 'none';
    if (query && query.trim().length > 0) {
        navigate('/movies', { search: query.trim() });
    } else {
        navigate('/movies');
    }
}

let _moviesSearchTimer = null;
function handleMoviesSearchInput(value) {
    clearTimeout(_moviesSearchTimer);
    const sugBox = document.getElementById('movies-search-suggestions');
    if (!sugBox) return;
    if (!value || value.trim().length < 2) {
        sugBox.style.display = 'none';
        return;
    }
    _moviesSearchTimer = setTimeout(async () => {
        try {
            const res = await api.get(`/movies?size=5&search=${encodeURIComponent(value.trim())}`);
            const data = res?.data;
            const movies = Array.isArray(data) ? data : (data?.content || []);
            if (movies.length === 0) {
                sugBox.style.display = 'none';
                return;
            }
            sugBox.innerHTML = movies.map(m => `
                <div class="suggestion-item" onclick="navigate('/movie', {id: ${m.id}})">
                    ${m.posterUrl ? `<img src="${m.posterUrl}" alt="">` : '<div style="width:40px;height:60px;background:var(--bg-glass);border-radius:4px;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></svg></div>'}
                    <div class="suggestion-info">
                        <h4>${m.title}</h4>
                        <p>${m.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'} • ${m.durationMinutes || '?'}p</p>
                    </div>
                </div>
            `).join('');
            sugBox.style.display = 'block';
        } catch (e) {
            sugBox.style.display = 'none';
        }
    }, 300);
}

// Ẩn gợi ý tìm kiếm phim khi click ra ngoài
document.addEventListener('click', (e) => {
    const sugBox = document.getElementById('movies-search-suggestions');
    if (sugBox && !e.target.closest('.movies-search-wrapper')) {
        sugBox.style.display = 'none';
    }
});
