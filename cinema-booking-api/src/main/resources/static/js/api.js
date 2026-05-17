/* Khởi tạo API Client */
const API_BASE = '/api/v1';

const api = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),

    headers(json = true) {
        const h = {};
        if (json) h['Content-Type'] = 'application/json';
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    async get(path) {
        const separator = path.includes('?') ? '&' : '?';
        const url = API_BASE + path + separator + '_t=' + new Date().getTime();
        const res = await fetch(url, { headers: this.headers(), cache: 'no-store' });
        return this.handle(res);
    },

    async post(path, body) {
        const res = await fetch(API_BASE + path, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(body)
        });
        return this.handle(res);
    },

    async put(path, body) {
        const res = await fetch(API_BASE + path, {
            method: 'PUT',
            headers: this.headers(),
            body: JSON.stringify(body)
        });
        return this.handle(res);
    },

    async delete(path) {
        const res = await fetch(API_BASE + path, {
            method: 'DELETE',
            headers: this.headers()
        });
        return this.handle(res);
    },

    async handle(res) {
        const contentType = res.headers.get('content-type');
        let data = null;

        // Xử lý đặc biệt cho phản hồi 204 No Content (Thành công nhưng không có dữ liệu trả về)
        if (res.status === 204) {
            return { success: true, message: 'Thành công' };
        }

        if (contentType && contentType.includes('application/json')) {
            try {
                const text = await res.text();
                if (text && text.trim().length > 0) {
                    data = JSON.parse(text);
                }
            } catch (e) {
                console.error('JSON Parse Error:', e);
            }
        } else if (res.ok) {
            const text = await res.text();
            console.warn('Non-JSON response:', text.substring(0, 200));
            data = { message: text };
        }

        if (res.status === 401) {
            this.logout();
            showToast('Phiên đăng nhập đã hết hạn', 'error');
            return null;
        }

        if (!res.ok) {
            const errorMsg = (data && (data.message || data.error)) || `Lỗi máy chủ (HTTP ${res.status})`;
            console.error(`[API Error ${res.status}]`, data);
            throw new Error(errorMsg);
        }

        return data;
    },

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    isLoggedIn() {
        return !!this.token;
    }
};

/* Thông báo Toast */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* Hộp thoại xác nhận tùy chỉnh (thay thế confirm() của trình duyệt) */
function webConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const title = options.title || 'X\u00e1c nh\u1eadn';
        const confirmText = options.confirmText || '\u0110\u1ed3ng \u00fd';
        const cancelText = options.cancelText || 'H\u1ee7y';
        const type = options.type || 'warning';

        const iconMap = {
            warning: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            danger: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5534b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#539bf5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
            success: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        };
        const icon = iconMap[type] || iconMap.warning;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-icon">${icon}</div>
                <h3 class="confirm-title">${title}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="btn btn-ghost confirm-cancel">${cancelText}</button>
                    <button class="btn btn-primary confirm-ok ${type === 'danger' ? 'confirm-danger' : ''}">${confirmText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cleanup = (result) => {
            overlay.classList.add('confirm-closing');
            setTimeout(() => { overlay.remove(); resolve(result); }, 200);
        };

        overlay.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));
        overlay.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });

        // Tự động focus vào nút hủy để đảm bảo an toàn
        overlay.querySelector('.confirm-cancel').focus();
    });
}

/* Định dạng tiền tệ */
function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/* Định dạng ngày giờ */
function formatDateTime(str) {
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
           d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(str) {
    const d = new Date(str);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* Định dạng ngày (VD: 01/05/2026) */
function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
