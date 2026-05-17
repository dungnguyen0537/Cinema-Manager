/* Trang Quản lý Người dùng (Dành cho Admin) */
async function renderUsersPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Quản lý người dùng</div>
        </div>
        <div class="section-card">
            <div id="users-table-container">${tableSkeleton(8)}</div>
        </div>
    `;

    try {
        const res = await api.get('/users/admin/all');
        const users = res?.data || [];
        
        const el = document.getElementById('users-table-container');
        if (users.length === 0) {
            el.innerHTML = '<div class="table-empty">Không có người dùng nào</div>';
            return;
        }

        el.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => {
                        const isAdmin = u.email === 'admin@cinema.vn' || (u.roles && u.roles.some(r => (r.name || r) === 'ADMIN' || (r.name || r) === 'ROLE_ADMIN'));
                        const roleBadge = isAdmin
                            ? '<span class="badge badge-purple">Admin</span>'
                            : '<span class="badge badge-blue">User</span>';
                        const statusBadge = u.status === 'ACTIVE'
                            ? '<span class="badge badge-success">Hoạt động</span>'
                            : '<span class="badge badge-danger">Đã khóa</span>';

                        return `
                        <tr>
                            <td>${u.id}</td>
                            <td style="font-weight:600">${u.fullName || '—'}</td>
                            <td>${u.email}</td>
                            <td>${u.phone || '—'}</td>
                            <td>${roleBadge}</td>
                            <td>${statusBadge}</td>
                            <td>${fmtDate(u.createdAt)}</td>
                            <td>
                                <div style="display:flex;gap:6px;flex-wrap:wrap">
                                    <button class="btn btn-sm btn-ghost" onclick="openEditUserModal(${u.id}, '${(u.fullName||'').replace(/'/g,"\\'")}', '${u.email}', '${u.phone||''}')">
                                        Sửa
                                    </button>
                                    ${!isAdmin ? `
                                        <button class="btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}" 
                                                onclick="toggleUserStatus(${u.id}, '${u.status}')">
                                            ${u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                                        </button>
                                    ` : `
                                        <button class="btn btn-sm btn-ghost" disabled title="Không thể khóa tài khoản Admin" style="opacity: 0.5; cursor: not-allowed;">
                                            Khóa
                                        </button>
                                    `}
                                </div>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        showToast('Không thể tải danh sách người dùng', 'error');
    }
}

function openEditUserModal(userId, fullName, email, phone) {
    openModal(`
        <div class="modal-content">
            <h3 class="modal-title">Sửa thông tin người dùng #${userId}</h3>
            <div class="form-grid">
                <div class="field">
                    <label>Họ tên</label>
                    <input type="text" id="edit-user-name" value="${fullName}" placeholder="Nhập họ tên">
                </div>
                <div class="field">
                    <label>Email</label>
                    <input type="email" id="edit-user-email" value="${email}" placeholder="Nhập email">
                </div>
                <div class="field">
                    <label>Số điện thoại</label>
                    <input type="text" id="edit-user-phone" value="${phone}" placeholder="Nhập SĐT">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-ghost" onclick="closeModal()">Hủy</button>
                <button class="btn btn-primary" onclick="saveEditUser(${userId})">Lưu thay đổi</button>
            </div>
        </div>
    `);
}

async function saveEditUser(userId) {
    const fullName = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const phone = document.getElementById('edit-user-phone').value.trim();

    if (!fullName) { showToast('Họ tên không được để trống', 'error'); return; }
    if (!email) { showToast('Email không được để trống', 'error'); return; }

    try {
        await api.put(`/users/admin/${userId}/profile`, { fullName, email, phone });
        showToast('Cập nhật thông tin thành công', 'success');
        closeModal();
        renderUsersPage(document.getElementById('content'));
    } catch (err) {
        showToast(err.message || 'Lỗi khi cập nhật', 'error');
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';
    
    const confirmed = await webConfirm(`Bạn có chắc muốn ${action} người dùng này?`, { 
        type: newStatus === 'ACTIVE' ? 'warning' : 'danger', 
        confirmText: action.charAt(0).toUpperCase() + action.slice(1) 
    });
    if (!confirmed) return;

    try {
        await api.put(`/users/admin/${userId}/status`, { status: newStatus });
        showToast(`Đã ${action} người dùng thành công`, 'success');
        renderUsersPage(document.getElementById('content'));
    } catch (err) {
        showToast(err.message, 'error');
    }
}
