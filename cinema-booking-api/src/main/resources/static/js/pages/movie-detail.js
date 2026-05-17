/* Trang Chi Tiết Phim */
async function renderMovieDetail(app) {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id') || window._params?.id;

    if (!movieId) { navigate('/'); return; }

    app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const [movieRes, showtimesRes] = await Promise.all([
            api.get(`/movies/${movieId}`),
            api.get(`/showtimes?movieId=${movieId}`)
        ]);

        const movie = movieRes?.data;
        const showtimes = showtimesRes?.data || [];

        if (!movie) { navigate('/'); return; }

        const poster = movie.posterUrl || '';
        const posterHtml = poster
            ? `<img src="${poster}" alt="${movie.title}">`
            : `<div style="width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a3e,#2d1b4e);border-radius:var(--radius-lg)"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg></div>`;

        const genres = (movie.genres || []).map(g => `<span class="detail-tag">${g}</span>`).join('');

        // Nhóm suất chiếu theo rạp
        const byCinema = {};
        showtimes.forEach(s => {
            const key = s.cinemaId || s.cinemaName;
            if (!byCinema[key]) byCinema[key] = { name: s.cinemaName, room: s.roomName, times: [] };
            byCinema[key].times.push(s);
        });

        // Xây dựng nút Trailer
        const trailerUrl = movie.trailerUrl || '';
        let trailerBtnHtml = '';
        if (trailerUrl) {
            trailerBtnHtml = `<button class="btn btn-outline btn-trailer-toggle" id="btn-trailer-toggle" onclick="toggleTrailer()" style="margin-bottom:16px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Xem trailer
            </button>`;
        }

        app.innerHTML = `
            <div class="movie-detail-hero">
                <div class="movie-detail-bg" style="background-image:url('${poster}')"></div>
                <div class="movie-detail-content">
                    <div class="movie-detail-poster">${posterHtml}</div>
                    <div>
                        <h1 class="detail-title">${movie.title}</h1>
                        <div class="detail-tags">${genres}</div>
                        <div class="detail-meta">
                            <span>⏱ ${movie.durationMinutes}p</span>
                            ${movie.language ? `<span>🌐 ${movie.language}</span>` : ''}
                            ${movie.ageRating ? `<span class="detail-age-badge">${movie.ageRating}</span>` : ''}
                        </div>
                        <p class="detail-desc">${movie.description || 'Chưa có mô tả'}</p>
                        <div class="detail-info-grid">
                            ${movie.releaseDate ? `<div class="detail-info-item">
                                <span class="detail-info-label">📅 Ngày phát hành</span>
                                <span class="detail-info-value">${formatDate(movie.releaseDate)}</span>
                            </div>` : ''}
                            ${movie.director ? `<div class="detail-info-item">
                                <span class="detail-info-label">🎬 Đạo diễn</span>
                                <span class="detail-info-value">${movie.director}</span>
                            </div>` : ''}
                            ${movie.cast ? `<div class="detail-info-item">
                                <span class="detail-info-label">🎭 Diễn viên</span>
                                <span class="detail-info-value">${movie.cast}</span>
                            </div>` : ''}
                            ${movie.subtitle ? `<div class="detail-info-item">
                                <span class="detail-info-label">💬 Phụ đề</span>
                                <span class="detail-info-value">${movie.subtitle}</span>
                            </div>` : ''}
                        </div>
                        ${trailerBtnHtml}
                    </div>
                </div>
                <!-- Khung xem trailer (ẩn mặc định) -->
                <div class="trailer-container" id="trailer-container" data-url="${escapeAttr(trailerUrl)}">
                    <div class="trailer-inner" id="trailer-inner"></div>
                </div>
            </div>

            <div class="showtime-section">
                <h2 class="section-title" style="margin-bottom:24px">Lịch chiếu</h2>
                ${Object.values(byCinema).length ? Object.values(byCinema).map(c => `
                    <div class="cinema-showtimes">
                        <div class="cinema-name">${c.name} <small>• ${c.room || ''}</small></div>
                        <div class="showtime-list">
                            ${c.times.map(t => `
                                <button class="showtime-btn" onclick="goToSeats(${t.id})">
                                    ${formatTime(t.startTime)}
                                    <span class="price">${formatMoney(t.basePrice)} • ${t.availableSeats || '?'} ghế trống</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                        <h3>Chưa có lịch chiếu</h3>
                        <p>Phim này chưa có suất chiếu. Hãy quay lại sau nhé!</p>
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>${err.message}</h3></div>`;
    }
}

/* === Hàm xử lý Trailer === */

/**
 * Toggle hiển thị/ẩn khung xem trailer.
 */
function toggleTrailer() {
    const container = document.getElementById('trailer-container');
    const inner = document.getElementById('trailer-inner');
    const btn = document.getElementById('btn-trailer-toggle');
    if (!container || !btn) return;

    const isOpen = container.classList.contains('open');

    if (isOpen) {
        // Ẩn trailer
        container.classList.remove('open');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg> Xem trailer`;
        // Xóa nội dung sau khi animation kết thúc để dừng phát video
        setTimeout(() => { inner.innerHTML = ''; }, 400);
    } else {
        // Hiện trailer
        const url = container.dataset.url || '';
        inner.innerHTML = buildTrailerPlayer(url);
        // Trigger reflow rồi mới mở để animation chạy mượt
        void container.offsetHeight;
        container.classList.add('open');
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Ẩn trailer`;
    }
}

/**
 * Phân tích URL trailer và tạo player phù hợp:
 * - File video (.mp4, .webm, .ogg, .mov): <video> tag
 * - YouTube: Embed iframe
 * - Vimeo: Embed iframe
 * - Link khác: Mở tab mới (fallback)
 */
function buildTrailerPlayer(url) {
    if (!url) return '<p style="text-align:center;color:var(--text-muted)">Không có trailer</p>';

    // 1. File video trực tiếp (upload từ máy hoặc URL dạng .mp4)
    if (isDirectVideoUrl(url)) {
        return `<video controls autoplay playsinline class="trailer-video">
            <source src="${url}" type="${getVideoMimeType(url)}">
            Trình duyệt không hỗ trợ video.
        </video>`;
    }

    // 2. YouTube
    const ytId = extractYouTubeId(url);
    if (ytId) {
        return `<iframe class="trailer-iframe" src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" 
                title="Trailer" frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>`;
    }

    // 3. Vimeo
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
        return `<iframe class="trailer-iframe" src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" 
                title="Trailer" frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen></iframe>`;
    }

    // 4. Fallback — Mở link ở tab mới
    window.open(url, '_blank', 'noopener');
    return `<p style="text-align:center;color:var(--text-muted);padding:20px;">
        Trailer đã được mở ở tab mới. 
        <a href="${url}" target="_blank" rel="noopener" style="color:var(--accent)">Bấm vào đây</a> nếu không tự mở.
    </p>`;
}

/** Kiểm tra URL có phải video file trực tiếp không */
function isDirectVideoUrl(url) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lower = url.toLowerCase().split('?')[0]; // Bỏ query params
    return videoExtensions.some(ext => lower.endsWith(ext)) ||
           url.includes('/upload/video') || // URL upload nội bộ server
           url.includes('/videos/');
}

/** Lấy MIME type từ URL video */
function getVideoMimeType(url) {
    const lower = url.toLowerCase().split('?')[0];
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ogg')) return 'video/ogg';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4'; // mặc định
}

/** Trích xuất YouTube Video ID từ các dạng URL khác nhau */
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    for (const re of patterns) {
        const match = url.match(re);
        if (match) return match[1];
    }
    return null;
}

/** Trích xuất Vimeo Video ID */
function extractVimeoId(url) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

/** Escape chuỗi cho thuộc tính HTML data-* */
function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function goToSeats(showtimeId) {
    if (!api.isLoggedIn()) {
        showToast('Vui lòng đăng nhập để đặt vé', 'info');
        openModal('login');
        return;
    }
    navigate('/seats', { showtimeId: showtimeId });
}
