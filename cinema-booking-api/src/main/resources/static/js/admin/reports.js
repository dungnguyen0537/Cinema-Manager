/* Trang Báo cáo Doanh thu */
async function renderReportsPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Báo cáo doanh thu</div>
        </div>
        <div class="kpi-grid" id="report-kpis">
            <div class="kpi-card"><div class="kpi-label">Tổng booking</div><div class="kpi-value" id="rp-bookings">—</div></div>
            <div class="kpi-card success"><div class="kpi-label">Tổng thanh toán</div><div class="kpi-value" id="rp-payments">—</div></div>
        </div>
        <div class="section-card">
            <div class="section-title-sm">Thống kê chi tiết</div>
            <div id="report-detail">${tableSkeleton(3)}</div>
        </div>
    `;

    try {
        const res = await api.get('/admin/reports/summary');
        if (res && res.data) {
            animateNumber('rp-bookings', res.data.totalBookings || 0);
            animateNumber('rp-payments', res.data.totalPayments || 0);

            const el = document.getElementById('report-detail');
            el.innerHTML = `
                <table>
                    <thead><tr>
                        <th>Chỉ số</th>
                        <th>Giá trị</th>
                    </tr></thead>
                    <tbody>
                        <tr><td>Tổng số booking</td><td style="font-weight:700">${new Intl.NumberFormat('vi-VN').format(res.data.totalBookings || 0)}</td></tr>
                        <tr><td>Tổng số thanh toán</td><td style="font-weight:700">${new Intl.NumberFormat('vi-VN').format(res.data.totalPayments || 0)}</td></tr>
                        ${Object.entries(res.data).filter(([k]) => k !== 'totalBookings' && k !== 'totalPayments').map(([k, v]) => `
                            <tr><td>${k}</td><td style="font-weight:700">${typeof v === 'number' ? new Intl.NumberFormat('vi-VN').format(v) : v}</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    } catch(err) {
        showToast('Không thể tải báo cáo', 'error');
    }
}
