/* Xử lý Xác thực (Đăng nhập/Đăng ký) */

function updateAuthUI() {
    const authDiv = document.getElementById('nav-auth');
    const userDiv = document.getElementById('nav-user');

    if (api.isLoggedIn()) {
        authDiv.classList.add('hidden');
        userDiv.classList.remove('hidden');
        document.getElementById('user-initial').textContent = api.user.fullName?.charAt(0)?.toUpperCase() || 'U';
        document.getElementById('dropdown-name').textContent = api.user.fullName || 'User';
        document.getElementById('dropdown-email').textContent = api.user.email || '';
    } else {
        authDiv.classList.remove('hidden');
        userDiv.classList.add('hidden');
    }
}

function openModal(type) {
    document.getElementById('auth-modal').classList.remove('hidden');
    switchAuthForm(type);
}

function closeModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthForm(type) {
    document.getElementById('login-form').classList.toggle('hidden', type !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', type !== 'register');
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-submit');
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';

    try {
        const res = await api.post('/auth/login', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });

        if (res && res.data) {
            api.setAuth(res.data.accessToken, res.data.user);
            updateAuthUI();
            closeModal();
            showToast('Đăng nhập thành công! 🎉', 'success');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-submit');
    btn.disabled = true;
    btn.textContent = 'Đang đăng ký...';

    try {
        const res = await api.post('/auth/register', {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            password: document.getElementById('reg-password').value
        });

        if (res && res.data) {
            api.setAuth(res.data.accessToken, res.data.user);
            updateAuthUI();
            closeModal();
            showToast('Đăng ký thành công! Chào mừng bạn', 'success');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Đăng ký';
    }
}

function logout() {
    api.logout();
    updateAuthUI();
    navigate('/');
    showToast('Đã đăng xuất', 'info');
}

// Bật/tắt dropdown người dùng khi nhấn vào avatar
document.addEventListener('click', (e) => {
    const avatar = document.getElementById('user-avatar');
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;

    if (e.target.closest('#user-avatar')) {
        dropdown.classList.toggle('hidden');
    } else if (!e.target.closest('#user-dropdown')) {
        dropdown.classList.add('hidden');
    }
});

// Đóng hộp thoại khi nhấn vào phần nền mờ (overlay)
document.getElementById('auth-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
});

// Đóng hộp thoại khi nhấn phím Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

function toggleMobileMenu() {
    document.getElementById('nav-links').classList.toggle('mobile-open');
}
