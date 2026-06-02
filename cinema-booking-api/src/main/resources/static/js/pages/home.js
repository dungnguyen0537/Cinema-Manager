/* Trang Chủ — Poster Carousel ngang (vuốt vòng tròn) */
let heroScrollPos = 0;
let heroCardWidth = 240; // card width + gap
let heroCarouselTimer = null;

async function renderHome(app) {
    app.innerHTML = `
        <div id="hero-section-placeholder">
            <section class="hero">
                <h1 class="hero-title" style="animation: fadeInUp 0.8s ease forwards;">Đặt vé xem phim<br><span class="text-gradient">nhanh chóng & tiện lợi</span></h1>
                <p class="hero-subtitle" style="animation: fadeInUp 0.8s ease forwards 0.1s; opacity: 0;">Khám phá những bộ phim hot nhất tại Cinema 8 Star</p>
                <div class="hero-search" style="position: relative; animation: fadeInUp 0.8s ease forwards 0.2s; opacity: 0;">
                    <input type="text" id="search-input" placeholder="Tìm kiếm phim..." autocomplete="off" onkeydown="if(event.key === 'Enter') searchMovies(this.value)" oninput="handleSearchInput(this.value)">
                    <svg class="search-icon" onclick="searchMovies(document.getElementById('search-input').value)" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <div id="search-suggestions" class="search-suggestions" style="display:none;"></div>
                </div>
            </section>
        </div>
        <section class="section">
            <div class="section-header">
                <h2 class="section-title" style="display:flex;align-items:center;gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent);"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> Phim đang chiếu</h2>
                <a href="/movies" class="section-link">Xem tất cả →</a>
            </div>
            <div class="movie-grid" id="now-showing-grid">${skeletonCards(4)}</div>
        </section>
        <section class="section">
            <div class="section-header">
                <h2 class="section-title" style="display:flex;align-items:center;gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--gold);"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg> Phim sắp chiếu</h2>
                <a href="/movies" class="section-link">Xem tất cả →</a>
            </div>
            <div class="movie-grid" id="coming-soon-grid">${skeletonCards(4)}</div>
        </section>
    `;

    if (heroCarouselTimer) { clearInterval(heroCarouselTimer); heroCarouselTimer = null; }

    try {
        const res = await api.get('/movies?size=50');
        if (res && res.data) {
            const movies = res.data.content || res.data || [];

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            let bannerMovies = movies.filter(m => m.createdAt && new Date(m.createdAt) >= sevenDaysAgo);
            if (bannerMovies.length === 0 && movies.length > 0) {
                bannerMovies = [...movies].sort((a, b) => {
                    return (b.createdAt ? new Date(b.createdAt) : new Date(0)) - (a.createdAt ? new Date(a.createdAt) : new Date(0)) || b.id - a.id;
                }).slice(0, 8);
            }

            const heroPlaceholder = document.getElementById('hero-section-placeholder');
            if (heroPlaceholder && bannerMovies.length > 0) {
                const cardsHtml = bannerMovies.map(m => {
                    const poster = m.posterUrl || '';
                    const genres = Array.from(m.genres || []).join(', ') || '';
                    const posterImg = poster
                        ? `<img src="${poster}" alt="${m.title}" draggable="false">`
                        : `<div class="hc-poster-placeholder"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:.2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/></svg></div>`;

                    return `
                    <div class="hc-card" onclick="navigate('/movie', {id: ${m.id}})">
                        <div class="hc-card-poster">
                            ${posterImg}
                            <span class="hc-age-badge">${m.ageRating || 'P'}</span>
                            <span class="hc-new-badge">Mới</span>
                            <div class="hc-card-overlay">
                                <button class="btn btn-primary" onclick="event.stopPropagation(); navigate('/movie', {id: ${m.id}})">Đặt vé ngay</button>
                            </div>
                        </div>
                        <div class="hc-card-info">
                            <div class="hc-card-title">${m.title}</div>
                            <div class="hc-card-meta">
                                <span>${m.durationMinutes || '?'} phút</span>
                                ${genres ? `<span>• ${genres}</span>` : ''}
                            </div>
                        </div>
                    </div>`;
                }).join('');

                heroPlaceholder.innerHTML = `
                    <div class="hc-wrapper" id="hero-carousel-root">
                        <div class="hc-section-header">
                            <h2 class="hc-section-title">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                Phim mới cập nhật
                            </h2>
                        </div>
                        <div class="hc-track-wrap" id="hc-track-wrap">
                            <div class="hc-track" id="hc-track">
                                ${cardsHtml}
                            </div>
                        </div>
                        <button class="hc-arrow hc-arrow-prev" onclick="heroScrollBy(-1)" aria-label="Trước">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button class="hc-arrow hc-arrow-next" onclick="heroScrollBy(1)" aria-label="Tiếp">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg>
                        </button>
                    </div>
                    <div class="hero-search-below">
                        <div class="hero-search" style="position:relative">
                            <input type="text" id="search-input" placeholder="Tìm kiếm phim..." autocomplete="off" onkeydown="if(event.key === 'Enter') searchMovies(this.value)" oninput="handleSearchInput(this.value)">
                            <svg class="search-icon" onclick="searchMovies(document.getElementById('search-input').value)" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);color:var(--text-muted);cursor:pointer" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <div id="search-suggestions" class="search-suggestions" style="display:none;"></div>
                        </div>
                    </div>
                `;

                initHeroScroll();
            }

            // Danh sách phim
            const nowShowing = movies.filter(m => m.status === 'NOW_SHOWING');
            const comingSoon = movies.filter(m => m.status === 'COMING_SOON');
            document.getElementById('now-showing-grid').innerHTML = nowShowing.length ? nowShowing.slice(0, 4).map(movieCard).join('') : '<p style="color:var(--text-muted)">Chưa có phim đang chiếu</p>';
            document.getElementById('coming-soon-grid').innerHTML = comingSoon.length ? comingSoon.slice(0, 4).map(movieCard).join('') : '<p style="color:var(--text-muted)">Chưa có phim sắp chiếu</p>';
        }
    } catch (err) { showToast('Không thể tải danh sách phim', 'error'); }
}

/* ===== CAROUSEL SCROLL LOGIC ===== */
function initHeroScroll() {
    const track = document.getElementById('hc-track');
    const wrap = document.getElementById('hc-track-wrap');
    if (!track || !wrap) return;

    heroScrollPos = 0;
    const cards = track.querySelectorAll('.hc-card');
    if (!cards.length) return;
    heroCardWidth = cards[0].offsetWidth + 20; // card width + gap

    // Vuốt cảm ứng
    let startX = 0, dragging = false;
    wrap.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; dragging = true; }, { passive: true });
    wrap.addEventListener('touchend', e => { if (!dragging) return; dragging = false; const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) heroScrollBy(diff > 0 ? 1 : -1); }, { passive: true });

    // Kéo chuột
    wrap.addEventListener('mousedown', e => { startX = e.clientX; dragging = true; wrap.style.cursor = 'grabbing'; });
    wrap.addEventListener('mouseup', e => { if (!dragging) return; dragging = false; wrap.style.cursor = 'grab'; const diff = startX - e.clientX; if (Math.abs(diff) > 50) heroScrollBy(diff > 0 ? 1 : -1); });
    wrap.addEventListener('mouseleave', () => { dragging = false; wrap.style.cursor = 'grab'; });
    wrap.style.cursor = 'grab';

    // Auto scroll
    heroCarouselTimer = setInterval(() => heroScrollBy(1), 4000);
    wrap.addEventListener('mouseenter', () => { if (heroCarouselTimer) clearInterval(heroCarouselTimer); });
    wrap.addEventListener('mouseleave', () => { heroCarouselTimer = setInterval(() => heroScrollBy(1), 4000); });
}

function heroScrollBy(direction) {
    const track = document.getElementById('hc-track');
    const wrap = document.getElementById('hc-track-wrap');
    if (!track || !wrap) return;

    const cards = track.querySelectorAll('.hc-card');
    if (!cards.length) return;
    heroCardWidth = cards[0].offsetWidth + 20;

    const maxScroll = track.scrollWidth - wrap.offsetWidth;
    heroScrollPos += direction * heroCardWidth * 2;

    // Vòng tròn
    if (heroScrollPos > maxScroll) heroScrollPos = 0;
    if (heroScrollPos < 0) heroScrollPos = maxScroll;

    track.style.transform = `translateX(-${heroScrollPos}px)`;
}

/* ===== MOVIE CARD ===== */
function movieCard(movie) {
    const badge = movie.status === 'NOW_SHOWING' ? '<span class="movie-badge badge-showing">Đang chiếu</span>' : '<span class="movie-badge badge-coming">Sắp chiếu</span>';
    const poster = movie.posterUrl || movie.moviePosterUrl || '';
    const posterHtml = poster
        ? `<img src="${poster}" alt="${movie.title}" loading="lazy">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a3e,#2d1b4e)"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 12h18"/></svg></div>`;
    const genres = (movie.genres || []).join(', ') || '';
    return `
        <div class="movie-card" onclick="navigate('/movie', {id: ${movie.id}})">
            <div class="movie-poster">${posterHtml}${badge}<div class="overlay"><button class="btn btn-primary">Đặt vé ngay</button></div></div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${movie.durationMinutes || '?'}p</span>
                    ${genres ? `<span>• ${genres}</span>` : ''}
                </div>
            </div>
        </div>`;
}

function skeletonCards(n) {
    return Array(n).fill('<div class="movie-card"><div class="movie-poster skeleton" style="aspect-ratio:2/3"></div><div style="margin-top:12px"><div class="skeleton" style="height:16px;width:80%;margin-bottom:8px"></div><div class="skeleton" style="height:12px;width:60%"></div></div></div>').join('');
}

function searchMovies(q) { if (q && q.trim().length > 0) navigate('/movies', { search: q.trim() }); }

let searchTimeout;
async function handleSearchInput(query) {
    const box = document.getElementById('search-suggestions');
    if (!query || query.trim().length < 2) { box.style.display = 'none'; return; }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const res = await api.get(`/movies?size=5&search=${encodeURIComponent(query.trim())}`);
            const movies = res?.data?.content || res?.data || [];
            if (movies.length > 0) {
                box.innerHTML = movies.map(m => `<div class="suggestion-item" onclick="navigate('/movie', {id: ${m.id}})"><img src="${m.posterUrl || ''}" alt="${m.title}" onerror="this.style.display='none'"><div class="suggestion-info"><h4>${m.title}</h4><p>${m.durationMinutes || '?'}p • ${m.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}</p></div></div>`).join('');
                box.style.display = 'block';
            } else {
                box.innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:.9rem">Không tìm thấy phim</div>';
                box.style.display = 'block';
            }
        } catch (e) { console.error('Search error:', e); }
    }, 300);
}

document.addEventListener('click', e => {
    const box = document.getElementById('search-suggestions');
    if (box && !e.target.closest('.hero-search')) box.style.display = 'none';
});
