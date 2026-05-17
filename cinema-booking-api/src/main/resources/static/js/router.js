/* Bộ định tuyến SPA (Single Page Application) */
const routes = {
    '/home': 'renderHome',
    '/': 'renderHome',
    '/movies': 'renderMovies',
    '/movie': 'renderMovieDetail',
    '/seats': 'renderSeats',
    '/booking': 'renderBooking',
    '/my-tickets': 'renderMyTickets',
    '/cinemas': 'renderCinemas',
    '/showtimes': 'renderShowtimes',
    '/profile': 'renderProfile',
};

function navigate(path, params = {}) {
    window._params = params;
    const url = new URL(window.location.origin + path);
    Object.keys(params).forEach(k => url.searchParams.set(k, params[k]));
    history.pushState(params, '', url.toString());
    renderCurrentRoute();
}

function renderCurrentRoute() {
    const path = window.location.pathname;
    const app = document.getElementById('app');

    // Cập nhật trạng thái menu (nav-link) đang hoạt động
    document.querySelectorAll('.nav-link[data-page]').forEach(l => {
        l.classList.toggle('active', '/' + (l.dataset.page === 'home' ? '' : l.dataset.page) === path);
    });

    // Tìm hàm xử lý (handler) cho đường dẫn hiện tại
    let handlerName = routes[path];
    if (!handlerName) {
        // Kiểm tra các đường dẫn có tham số (dynamic routes)
        if (path.startsWith('/movie')) handlerName = routes['/movie'];
        else if (path.startsWith('/seats')) handlerName = routes['/seats'];
        else if (path.startsWith('/booking')) handlerName = routes['/booking'];
        else handlerName = routes['/'];
    }

    // Hiệu ứng chuyển cảnh mượt mà khi thay đổi nội dung trang
    app.style.opacity = '0';
    setTimeout(async () => {
        try {
            const handler = typeof handlerName === 'string' ? window[handlerName] : handlerName;
            if (typeof handler === 'function') {
                await handler(app);
            } else {
                app.innerHTML = '<div style="text-align:center;padding:60px;color:#888;">Trang không tồn tại</div>';
                console.error('Route handler not found:', handlerName);
            }
        } catch (err) {
            console.error('Route render error:', err);
            app.innerHTML = '<div style="text-align:center;padding:60px;color:#f44;">Lỗi: ' + err.message + '</div>';
        }
        app.style.opacity = '1';
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 150);
}

// Xử lý sự kiện điều hướng khi click vào các liên kết nội bộ
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
    }
});

window.addEventListener('popstate', renderCurrentRoute);
