/* Trang Hồ Sơ & Cài Đặt Tài Khoản */
async function renderProfile(app) {
    if (!api.isLoggedIn()) { navigate('/'); return; }

    app.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

    try {
        const res = await api.get('/users/me/profile');
        const user = res?.data;
        if (!user) { navigate('/'); return; }

        app.innerHTML = `
            <div class="profile-page" style="max-width:600px;margin:40px auto;padding:0 20px">
                <h2 style="font-size:1.8rem;margin-bottom:32px">Hồ sơ cá nhân</h2>

                <div class="section-card" style="margin-bottom:24px">
                    <div class="field" style="margin-bottom:16px">
                        <label>Họ và tên</label>
                        <input type="text" id="prof-fullname" value="${user.fullName || ''}" placeholder="Nhập họ tên...">
                    </div>
                    <div class="field" style="margin-bottom:16px">
                        <label>Email</label>
                        <input type="email" value="${user.email}" disabled style="background:var(--bg-dim);color:var(--text-muted)">
                    </div>
                    <div class="field" style="margin-bottom:24px">
                        <label>Số điện thoại</label>
                        <input type="text" id="prof-phone" value="${user.phone || ''}" placeholder="Nhập số điện thoại...">
                    </div>
                    <button class="btn btn-primary btn-full" onclick="updateProfile()">Lưu thay đổi</button>
                </div>

                <div class="section-card">
                    <h3 style="font-size:1.1rem;margin-bottom:20px">Đổi mật khẩu</h3>
                    <div class="field" style="margin-bottom:12px">
                        <label>Mật khẩu hiện tại</label>
                        <input type="password" id="pass-current" placeholder="••••••••">
                    </div>
                    <div class="field" style="margin-bottom:12px">
                        <label>Mật khẩu mới</label>
                        <input type="password" id="pass-new" placeholder="••••••••">
                    </div>
                    <div class="field" style="margin-bottom:24px">
                        <label>Xác nhận mật khẩu mới</label>
                        <input type="password" id="pass-confirm" placeholder="••••••••">
                    </div>
                    <button class="btn btn-ghost btn-full" onclick="changePassword()">Cập nhật mật khẩu</button>
                </div>
            </div>
        `;
    } catch (err) {
        showToast('Không thể tải thông tin hồ sơ', 'error');
    }
}

async function updateProfile() {
    const fullName = document.getElementById('prof-fullname').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();

    try {
        await api.put('/users/me/profile', { fullName, phone });
        showToast('Đã cập nhật hồ sơ thành công', 'success');
        // Cập nhật thông tin người dùng trong bộ nhớ đệm (localStorage) nếu cần
        if (api.user) {
            api.user.fullName = fullName;
            localStorage.setItem('user', JSON.stringify(api.user));
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('pass-current').value;
    const newPassword = document.getElementById('pass-new').value;
    const confirmPassword = document.getElementById('pass-confirm').value;

    if (!currentPassword || !newPassword) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    try {
        await api.put('/users/me/password', { currentPassword, newPassword });
        showToast('Đã đổi mật khẩu thành công', 'success');
        document.getElementById('pass-current').value = '';
        document.getElementById('pass-new').value = '';
        document.getElementById('pass-confirm').value = '';
    } catch (err) {
        showToast(err.message, 'error');
    }
}
