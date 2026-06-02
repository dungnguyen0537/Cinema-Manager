/* Trang Chủ */
let heroCarouselTimer = null;
let currentHeroSlideIdx = 0;

async function renderHome(app) {
    app.innerHTML = `
        <div id="hero-section-placeholder">
            <section class="hero">
                <h1 class="hero-title" style="animation: fadeInUp 0.8s ease forwards;">Đặt vé xem phim<br><span class="text-gradient">nhanh chóng & tiện lợi</span></h1>
                <p class="hero-subtitle" style="animation: fadeInUp 0.8s ease forwards 0.1s; opacity: 0;">Khám phá những bộ phim hot nhất, chọn ghế yêu thích và thanh toán chỉ trong vài phút</p>
                <div class="hero-search" style="position: relative; animation: fadeInUp 0.8s ease forwards 0.2s; opacity: 0;">
                    <input type="text" id="search-input" placeholder="Tìm kiếm phim..." autocomplete="off" onkeydown="if(event.key === 'Enter') searchMovies(this.value)" oninput="handleSearchInput(this.value)">
                    <svg class="search-icon" onclick="searchMovies(document.getElementById('search-input').value)" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <div id="search-suggestions" class="search-suggestions" style="display:none;"></div>
                </div>
            </section>
        </div>
        <section class="section">
            <div class="section-header">
                <h2 class="section-title" style="display:flex;align-items:center;gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> Phim đang chiếu</h2>
                <a href="/movies" class="section-link">Xem tất cả →</a>
            </div>
            <div class="movie-grid" id="now-showing-grid">
                ${skeletonCards(4)}
            </div>
        </section>
        <section class="section">
            <div class="section-header">
                <h2 class="section-title" style="display:flex;align-items:center;gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold);"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg> Phim sắp chiếu</h2>
                <a href="/movies" class="section-link">Xem tất cả →</a>
            </div>
            <div class="movie-grid" id="coming-soon-grid">
                ${skeletonCards(4)}
            </div>
        </section>
    `;

    if (heroCarouselTimer) {
        clearInterval(heroCarouselTimer);
        heroCarouselTimer = null;
    }

    try {
        const res = await api.get('/movies?size=50'); // Fetch 50 movies to filter newly added
        if (res && res.data) {
            const movies = res.data.content || res.data || [];
            
            // Lọc ra các phim mới thêm trong 7 ngày gần đây
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const newlyAdded = movies.filter(m => {
                if (!m.createdAt) return false;
                const createdDate = new Date(m.createdAt);
                return createdDate >= sevenDaysAgo;
            });

            // Cập nhật phần Hero
            const heroPlaceholder = document.getElementById('hero-section-placeholder');
            if (heroPlaceholder) {
                if (newlyAdded.length > 0) {
                    // Hiển thị Hero Slider cho các phim mới
                    let slidesHtml = newlyAdded.map((m, idx) => {
                        const poster = m.posterUrl || '';
                        const genres = Array.from(m.genres || []).join(', ') || 'Thể loại';
                        return `
                            <div class="hero-slide ${idx === 0 ? 'active' : ''}" style="background-image: linear-gradient(rgba(10, 10, 12, 0.45), rgba(10, 10, 12, 0.85)), url('${poster}')">
                                <div class="hero-slide-content">
                                    <div class="hero-badge-new">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-2px;margin-right:4px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                        PHIM MỚI THÊM
                                    </div>
                                    <h1 class="hero-title-carousel">${m.title}</h1>
                                    <div class="hero-movie-meta">
                                        <span class="meta-tag age-rating">${m.ageRating || 'C13'}</span>
                                        <span>• ${m.durationMinutes || '?'} phút</span>
                                        <span>• ${genres}</span>
                                    </div>
                                    <p class="hero-movie-desc">${m.description || 'Khám phá bộ phim mới được cập nhật tại rạp chiếu phim Cinema 8 Star.'}</p>
                                    <div class="hero-slide-actions">
                                        <button class="btn btn-primary btn-lg" onclick="navigate('/movie', {id: ${m.id}})">
                                            Đặt vé ngay
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-3px;margin-left:6px"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');

                    let indicatorsHtml = newlyAdded.map((_, idx) => `
                        <span class="indicator-dot ${idx === 0 ? 'active' : ''}" onclick="switchHeroSlide(${idx})"></span>
                    `).join('');

                    heroPlaceholder.innerHTML = `
                        <section class="hero hero-carousel-section">
                            <div class="hero-carousel-container" id="hero-carousel-container">
                                ${slidesHtml}
                            </div>
                            <div class="hero-carousel-indicators">
                                ${indicatorsHtml}
                            </div>
                            <div class="hero-search" style="position: relative; margin-top: 32px; z-index: 10;">
                                <input type="text" id="search-input" placeholder="Tìm kiếm phim..." autocomplete="off" onkeydown="if(event.key === 'Enter') searchMovies(this.value)" oninput="handleSearchInput(this.value)">
                                <svg class="search-icon" onclick="searchMovies(document.getElementById('search-input').value)" style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <div id="search-suggestions" class="search-suggestions" style="display:none;"></div>
                            </div>
                        </section>
                    `;

                    // Khởi động auto-slide
                    currentHeroSlideIdx = 0;
                    startHeroCarousel();
                }
            }

            // Hiển thị danh sách Phim đang chiếu / Phim sắp chiếu ở dưới
            const nowShowing = movies.filter(m => m.status === 'NOW_SHOWING');
            const comingSoon = movies.filter(m => m.status === 'COMING_SOON');

            document.getElementById('now-showing-grid').innerHTML =
                nowShowing.length ? nowShowing.slice(0, 4).map(movieCard).join('') :
                '<p style="color:var(--text-muted)">Chưa có phim đang chiếu</p>';

            document.getElementById('coming-soon-grid').innerHTML =
                comingSoon.length ? comingSoon.slice(0, 4).map(movieCard).join('') :
                '<p style="color:var(--text-muted)">Chưa có phim sắp chiếu</p>';
        }
    } catch (err) {
        showToast('Không thể tải danh sách phim', 'error');
    }
}

// Chuyển slide thủ công khi nhấp vào indicator
function switchHeroSlide(idx) {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator-dot');
    if (!slides.length) return;
    
    slides.forEach(s => s.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));
    
    slides[idx].classList.add('active');
    indicators[idx].classList.add('active');
    currentHeroSlideIdx = idx;
    
    // Khởi động lại timer để không bị trôi slide ngay lập tức sau khi nhấn
    if (heroCarouselTimer) {
        clearInterval(heroCarouselTimer);
        startHeroCarousel();
    }
}

function startHeroCarousel() {
    heroCarouselTimer = setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide');
        const indicators = document.querySelectorAll('.indicator-dot');
        if (slides.length <= 1) return;

        slides[currentHeroSlideIdx].classList.remove('active');
        if (indicators[currentHeroSlideIdx]) indicators[currentHeroSlideIdx].classList.remove('active');

        currentHeroSlideIdx = (currentHeroSlideIdx + 1) % slides.length;

        slides[currentHeroSlideIdx].classList.add('active');
        if (indicators[currentHeroSlideIdx]) indicators[currentHeroSlideIdx].classList.add('active');
    }, 5000);
}

function movieCard(movie) {
    const badge = movie.status === 'NOW_SHOWING'
        ? '<span class="movie-badge badge-showing">Đang chiếu</span>'
        : '<span class="movie-badge badge-coming">Sắp chiếu</span>';

    const poster = movie.posterUrl || movie.moviePosterUrl || '';
    const posterHtml = poster
        ? `<img src="${poster}" alt="${movie.title}" loading="lazy">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a3e,#2d1b4e)"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg></div>`;

    const genres = (movie.genres || []).join(', ') || '';

    return `
        <div class="movie-card" onclick="navigate('/movie', {id: ${movie.id}})">
            <div class="movie-poster">
                ${posterHtml}
                ${badge}
                <div class="overlay">
                    <button class="btn btn-primary">Đặt vé ngay</button>
                </div>
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${movie.durationMinutes || movie.movieDuration || '?'}p</span>
                    ${genres ? `<span>• ${genres}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function skeletonCards(count) {
    return Array(count).fill(`
        <div class="movie-card">
            <div class="movie-poster skeleton" style="aspect-ratio:2/3"></div>
            <div style="margin-top:12px">
                <div class="skeleton" style="height:16px;width:80%;margin-bottom:8px"></div>
                <div class="skeleton" style="height:12px;width:60%"></div>
            </div>
        </div>
    `).join('');
}

function searchMovies(query) {
    if (query && query.trim().length > 0) {
        navigate('/movies', { search: query.trim() });
    }
}

let searchTimeout;
async function handleSearchInput(query) {
    const suggestionsBox = document.getElementById('search-suggestions');
    if (!query || query.trim().length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        try {
            const res = await api.get(`/movies?size=5&search=${encodeURIComponent(query.trim())}`);
            const movies = res?.data?.content || res?.data || [];
            if (movies.length > 0) {
                suggestionsBox.innerHTML = movies.map(m => `
                    <div class="suggestion-item" onclick="navigate('/movie', {id: ${m.id}})">
                        <img src="${m.posterUrl || m.moviePosterUrl || ''}" alt="${m.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'60\\'><rect width=\\'40\\' height=\\'60\\' fill=\\'%23333\\'/></svg>'">
                        <div class="suggestion-info">
                            <h4>${m.title}</h4>
                            <p>${m.durationMinutes || '?'}p • ${m.status === 'NOW_SHOWING' ? 'Đang chiếu' : 'Sắp chiếu'}</p>
                        </div>
                    </div>
                `).join('');
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = '<div style="padding: 12px 16px; color: var(--text-muted); font-size: 0.9rem;">Không tìm thấy phim phù hợp</div>';
                suggestionsBox.style.display = 'block';
            }
        } catch (err) {
            console.error('Lỗi tìm kiếm:', err);
        }
    }, 300);
}

// Ẩn gợi ý khi click ra ngoài
document.addEventListener('click', (e) => {
    const suggestionsBox = document.getElementById('search-suggestions');
    if (suggestionsBox && !e.target.closest('.hero-search')) {
        suggestionsBox.style.display = 'none';
    }
});
