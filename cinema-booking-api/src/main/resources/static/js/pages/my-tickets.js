/* Trang Vé Của Tôi */
async function renderMyTickets(app) {
    if (!api.isLoggedIn()) {
        openModal('login');
        showToast('Vui lòng đăng nhập', 'info');
        return;
    }

    app.innerHTML = `
        <section class="section">
            <h2 class="section-title" style="margin-bottom:28px; display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg> Vé của tôi</h2>
            <div id="tickets-list"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </section>
    `;

    try {
        const res = await api.get('/users/me/tickets');
        if (res && res.data) {
            const tickets = res.data || [];
            if (!tickets.length) {
                document.getElementById('tickets-list').innerHTML = `
                    <div class="empty-state">
                        <div class="icon"><svg style="opacity:0.5" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg></div>
                        <h3>Chưa có vé nào</h3>
                        <p>Hãy đặt vé xem phim ngay!</p>
                        <a href="/movies" class="btn btn-primary" style="margin-top:16px">Xem phim</a>
                    </div>
                `;
                return;
            }

            document.getElementById('tickets-list').innerHTML = tickets.map(t => {
                const qrImageData = t.qrCode || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23ddd'/%3E%3C/svg%3E`;
                const seatsText = t.seats && t.seats.length > 0 ? t.seats.map(s => `${s.rowName}${s.seatNumber}`).join(', ') : '—';
                return `
                <div class="ticket-card" style="margin-bottom:20px; border-radius:16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); overflow:hidden;">
                    <div class="ticket-content" style="display:flex; padding:20px; gap:20px; align-items:center;">
                        <div class="ticket-qr" style="width:140px; height:140px; background:#fff; padding:8px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <img src="${qrImageData.startsWith('data:') ? qrImageData : 'data:image/png;base64,' + qrImageData}" alt="Ticket QR" style="width:100%; height:100%; object-fit: contain; image-rendering: pixelated;">
                        </div>
                        <div class="ticket-info" style="flex:1;">
                            <h3 style="font-size:1.2rem; margin-bottom:8px; color:var(--text-primary); font-weight:700;">${t.movieTitle || 'Phim'}</h3>
                            <div class="ticket-meta" style="font-size:0.9rem; color:var(--text-muted); line-height:1.5;">
                                <span>${t.cinemaName || ''} • Room: ${t.roomName || ''}</span><br>
                                <span>${t.showtimeStart ? formatDateTime(t.showtimeStart) : ''}</span><br>
                                <span>Ghế: <strong>${seatsText}</strong></span>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; opacity:0.6;">Mã vé</div>
                            <div style="font-family:monospace; font-size:1.1rem; font-weight:700; color:var(--accent);">${t.ticketCode || '—'}</div>
                            <span class="badge ${t.status === 'ISSUED' || t.status === 'CONFIRMED' || t.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}" style="margin-top:12px; display:inline-block; padding:4px 10px; border-radius:100px; font-size:0.8rem;">
                                ${t.status === 'ISSUED' || t.status === 'CONFIRMED' || t.status === 'COMPLETED' ? 'Hợp lệ' : t.status === 'USED' ? 'Đã sử dụng' : 'Chờ thanh toán'}
                            </span>
                        </div>
                    </div>
                </div>
            `}).join('');
        }
    } catch (err) {
        showToast('Không thể tải vé', 'error');
        document.getElementById('tickets-list').innerHTML = `
            <div class="empty-state"><div class="icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><h3>${err.message}</h3></div>`;
    }
}
