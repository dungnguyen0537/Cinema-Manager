/* Ứng dụng Quản trị — Bộ định tuyến, Bảo vệ truy cập, Khung ứng dụng */

const ADMIN_PAGES = {
    dashboard: { title: 'Tổng quan & Doanh thu', render: 'renderReportsPage' },
    movies: { title: 'Quản lý phim', render: 'renderMoviesPage' },
    cinemas: { title: 'Quản lý rạp', render: 'renderCinemasPage' },
    showtimes: { title: 'Quản lý lịch chiếu', render: 'renderShowtimesPage' },
    bookings: { title: 'Quản lý đặt vé', render: 'renderBookingsPage' },
    users: { title: 'Quản lý người dùng', render: 'renderUsersPage' },
    promotions: { title: 'Quản lý khuyến mãi', render: 'renderPromotionsPage' },
};

/* --- Giao diện (Theme) --- */
function initTheme() {
    const saved = localStorage.getItem('admin-theme');
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.body.setAttribute('data-theme', preferred);
}
function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('admin-theme', next);
}
initTheme();

/* --- Khởi tạo --- */
document.addEventListener('DOMContentLoaded', () => {
    if (api.isLoggedIn() && api.user) {
        const roles = api.user.roles || [];
        const hasAdmin = api.user.role === 'ADMIN' ||
            (Array.isArray(roles) && roles.includes('ADMIN'));
        if (hasAdmin) {
            showAdminShell();
            return;
        }
    }
    showLoginScreen();
});

/* --- Xác thực --- */
async function handleAdminLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    errEl.classList.add('hidden');

    try {
        // Sử dụng fetch thuần để tránh api.handle() xử lý lỗi 401 là "hết hạn phiên đăng nhập"
        const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        let data = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                const text = await res.text();
                if (text) data = JSON.parse(text);
            } catch (e) {
                console.error('Parse error:', e);
            }
        }

        if (!res.ok) {
            errEl.textContent = (data && data.message) || `Lỗi hệ thống (${res.status})`;
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Đăng nhập';
            return;
        }

        if (data && data.data) {
            const tokenData = data.data;
            const token = tokenData.accessToken;
            const user = tokenData.user || {};
            api.setAuth(token, user);

            // Kiểm tra quyền — roles là một danh sách chuỗi như ["ADMIN"] hoặc ["ROLE_ADMIN"]
            const roles = user.roles || [];
            const isAdmin = Array.isArray(roles)
                ? roles.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN')
                : (roles === 'ADMIN' || roles === 'ROLE_ADMIN');

            if (!isAdmin) {
                errEl.textContent = 'Tài khoản không có quyền quản trị';
                errEl.classList.remove('hidden');
                api.logout();
                btn.disabled = false;
                btn.textContent = 'Đăng nhập';
                return;
            }
            // Lưu quyền đã được chuẩn hóa để kiểm tra trong ứng dụng quản trị
            api.user.role = 'ADMIN';
            localStorage.setItem('user', JSON.stringify(api.user));
            showAdminShell();
        }
    } catch (err) {
        errEl.textContent = 'Lỗi kết nối server';
        errEl.classList.remove('hidden');
    }
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
}

function adminLogout() {
    api.logout();
    showLoginScreen();
}

/* --- Chuyển đổi màn hình --- */
function showLoginScreen() {
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-shell').classList.add('hidden');
}

function showAdminShell() {
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-shell').classList.remove('hidden');
    document.getElementById('topbar-user').textContent = api.user.fullName || api.user.email || 'Admin';
    navigateAdmin();
    window.addEventListener('hashchange', navigateAdmin);
}

/* --- Bộ định tuyến (Router) --- */
function navigateAdmin() {
    const hash = (location.hash || '#dashboard').replace('#', '');
    const page = ADMIN_PAGES[hash] || ADMIN_PAGES.dashboard;

    // Cập nhật trạng thái menu bên (sidebar) đang hoạt động
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === hash);
    });

    // Cập nhật tiêu đề thanh công cụ trên (topbar)
    document.getElementById('topbar-title').textContent = page.title;

    // Hiển thị nội dung — chuyển chuỗi tên hàm thành hàm thực tế để chạy lúc thực thi
    const content = document.getElementById('content');
    content.style.opacity = '0';
    setTimeout(async () => {
        try {
            const renderFn = typeof page.render === 'string' ? window[page.render] : page.render;
            if (typeof renderFn === 'function') {
                await renderFn(content);
            } else {
                content.innerHTML = '<div class="table-empty">Module chưa sẵn sàng</div>';
                console.error('Render function not found:', page.render);
            }
        } catch (err) {
            console.error('Page render error:', err);
            content.innerHTML = '<div class="table-empty">Lỗi khi tải trang: ' + err.message + '</div>';
        }
        content.style.opacity = '1';
        // Đóng sidebar trên thiết bị di động sau khi chọn trang
        document.getElementById('sidebar').classList.remove('open');
    }, 120);
}

/* --- Bật/tắt Sidebar (di động) --- */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* --- Hỗ trợ Hộp thoại (Modal) --- */
function openModal(html) {
    document.getElementById('modal-box').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-box').innerHTML = '';
}

// Đóng modal khi click vào phần nền mờ (overlay)
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
});

// Đóng modal khi nhấn phím Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

/* --- Thông báo Toast (dùng lại từ api.js nếu có) --- */
if (typeof showToast === 'undefined') {
    window.showToast = function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
}

/* --- Hỗ trợ định dạng --- */
function fmtMoney(n) {
    return new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
}

function fmtDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
           d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* --- Hiệu ứng tải bảng (Skeleton) --- */
function tableSkeleton(rows = 5) {
    return Array(rows).fill('<div class="skeleton-row"></div>').join('');
}
