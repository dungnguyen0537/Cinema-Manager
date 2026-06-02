/* =========================================================
   TỔNG QUAN & DOANH THU — Bảng điều khiển hợp nhất
   Cinema 8 Star Admin Dashboard
   ========================================================= */
let reportChartInstance = null;
let currentReportData = null;
let currentPeriodText = 'Tháng này';

async function renderReportsPage(container) {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    container.innerHTML = `
        <!-- ====== Welcome Banner ====== -->
        <div class="dash-welcome">
            <div class="dash-welcome-text">
                <h2>${greeting}, Quản trị viên</h2>
                <p>Tổng quan hoạt động hệ thống Cinema 8 Star</p>
            </div>
            <div class="dash-welcome-date">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ${dateStr}
            </div>
        </div>

        <!-- ====== Overview KPI Cards ====== -->
        <div class="dash-kpi-row">
            <div class="dash-kpi-card dash-kpi-indigo">
                <div class="dash-kpi-glow"></div>
                <div class="dash-kpi-content">
                    <div class="dash-kpi-top">
                        <div class="dash-kpi-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <span class="dash-kpi-badge">Hôm nay</span>
                    </div>
                    <div class="dash-kpi-value" id="kpi-daily-rev">—</div>
                    <div class="dash-kpi-label">Doanh thu hôm nay</div>
                    <div class="dash-kpi-trend"><span class="dash-kpi-trend-orders" id="kpi-daily-orders">— đơn</span></div>
                </div>
            </div>
            <div class="dash-kpi-card dash-kpi-cyan">
                <div class="dash-kpi-glow"></div>
                <div class="dash-kpi-content">
                    <div class="dash-kpi-top">
                        <div class="dash-kpi-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        </div>
                        <span class="dash-kpi-badge">Tháng này</span>
                    </div>
                    <div class="dash-kpi-value" id="kpi-monthly-rev">—</div>
                    <div class="dash-kpi-label">Doanh thu tháng</div>
                </div>
            </div>
            <div class="dash-kpi-card dash-kpi-emerald">
                <div class="dash-kpi-glow"></div>
                <div class="dash-kpi-content">
                    <div class="dash-kpi-top">
                        <div class="dash-kpi-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 17 12 22l10-5"/><path d="M2 12l10 5 10-5"/><path d="m2 7 10 5 10-5-10-5Z"/></svg>
                        </div>
                        <span class="dash-kpi-badge">Tổng cộng</span>
                    </div>
                    <div class="dash-kpi-value" id="kpi-total-rev">—</div>
                    <div class="dash-kpi-label">Tổng doanh thu</div>
                </div>
            </div>
            <div class="dash-kpi-card dash-kpi-violet">
                <div class="dash-kpi-glow"></div>
                <div class="dash-kpi-content">
                    <div class="dash-kpi-top">
                        <div class="dash-kpi-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>
                        </div>
                        <span class="dash-kpi-badge">Tất cả</span>
                    </div>
                    <div class="dash-kpi-value" id="kpi-total-bookings">—</div>
                    <div class="dash-kpi-label">Vé đã bán</div>
                </div>
            </div>
        </div>

        <!-- ====== Filter & Export Bar ====== -->
        <div class="section-card filter-container-card" style="margin-bottom:24px">
            <div class="filter-row">
                <div class="filter-presets">
                    <button class="btn-filter-preset active" data-preset="this-month">Tháng này</button>
                    <button class="btn-filter-preset" data-preset="last-month">Tháng trước</button>
                    <button class="btn-filter-preset" data-preset="this-week">Tuần này</button>
                    <button class="btn-filter-preset" data-preset="today">Hôm nay</button>
                    <button class="btn-filter-preset" data-preset="yesterday">Hôm qua</button>
                    <button class="btn-filter-preset" data-preset="custom">Tùy chọn</button>
                </div>
                <div class="filter-actions">
                    <button class="btn-export-action btn-export-pdf" onclick="exportReportToPDF()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        PDF
                    </button>
                    <button class="btn-export-action btn-export-excel" onclick="exportReportToExcel()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Excel
                    </button>
                </div>
            </div>
            <div class="filter-custom-dates hidden" id="custom-date-selectors">
                <div class="date-input-group">
                    <label>Từ ngày</label>
                    <input type="date" id="filter-start-date" class="form-control-sm">
                </div>
                <div class="date-input-group">
                    <label>Đến ngày</label>
                    <input type="date" id="filter-end-date" class="form-control-sm">
                </div>
                <button class="btn-secondary btn-sm" id="btn-apply-custom-filter" style="margin-top:20px">Áp dụng</button>
            </div>
        </div>

        <!-- ====== Filtered KPIs ====== -->
        <div class="kpi-grid" id="report-kpis" style="margin-bottom:24px">
            <div class="kpi-card info">
                <div class="kpi-icon-wrap" style="--si-color:#6366f1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">Vé bán trong kỳ</div>
                    <div class="kpi-value" id="rp-bookings">—</div>
                </div>
            </div>
            <div class="kpi-card success">
                <div class="kpi-icon-wrap" style="--si-color:#10b981">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">Doanh thu trong kỳ</div>
                    <div class="kpi-value" id="rp-revenue">—</div>
                </div>
            </div>
            <div class="kpi-card warning">
                <div class="kpi-icon-wrap" style="--si-color:#f59e0b">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">TB mỗi vé trong kỳ</div>
                    <div class="kpi-value" id="rp-avg-amount">—</div>
                </div>
            </div>
        </div>

        <!-- ====== Revenue Line Chart ====== -->
        <div class="dash-main-row" style="margin-bottom:24px;display:grid;grid-template-columns:1fr;gap:24px">
            <div class="dash-chart-card">
                <div class="dash-card-header">
                    <div>
                        <h3 class="dash-card-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                            Xu hướng doanh thu
                        </h3>
                        <p class="dash-card-subtitle" id="chart-period-title">Doanh thu theo ngày liên tục</p>
                    </div>
                    <div class="dash-chart-legend"><span class="dash-legend-dot"></span> Doanh thu (VNĐ)</div>
                </div>
                <div class="dash-chart-body" style="height:320px;position:relative">
                    <canvas id="reportRevenueChart"></canvas>
                </div>
            </div>
        </div>

        <!-- ====== Detail Table & Monthly Summary ====== -->
        <div style="display:grid;grid-template-columns:2.2fr 1fr;gap:24px" class="report-table-row">
            <div class="section-card">
                <div class="section-title-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                    Danh sách giao dịch chi tiết
                </div>
                <div id="report-detail" class="table-responsive">${tableSkeleton(5)}</div>
            </div>
            <div class="section-card">
                <div class="section-title-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    Doanh thu từng tháng
                </div>
                <div id="monthly-summary" class="table-responsive">${tableSkeleton(5)}</div>
            </div>
        </div>
    `;

    // === Khởi tạo các sự kiện lọc ===
    const presets = container.querySelectorAll('.btn-filter-preset');
    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            presets.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const preset = btn.dataset.preset;
            const customDates = document.getElementById('custom-date-selectors');
            if (preset === 'custom') {
                customDates.classList.remove('hidden');
                const today = new Date().toISOString().split('T')[0];
                const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                document.getElementById('filter-start-date').value = firstDay;
                document.getElementById('filter-end-date').value = today;
            } else {
                customDates.classList.add('hidden');
                currentPeriodText = btn.textContent;
                applyPresetFilter(preset);
            }
        });
    });

    document.getElementById('btn-apply-custom-filter').addEventListener('click', () => {
        const start = document.getElementById('filter-start-date').value;
        const end = document.getElementById('filter-end-date').value;
        if (!start || !end) { showToast('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'warning'); return; }
        if (new Date(start) > new Date(end)) { showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'warning'); return; }
        currentPeriodText = `Từ ${fmtDate(start)} đến ${fmtDate(end)}`;
        loadReportData(start, end);
    });

    // === Tải song song: KPI tổng quan + Báo cáo theo kỳ + Doanh thu tháng ===
    loadOverviewKPIs();
    applyPresetFilter('this-month');
    loadMonthlyReport();
}

// =============== LOAD OVERVIEW KPIs ===============
async function loadOverviewKPIs() {
    try {
        const res = await api.get('/admin/reports/summary');
        if (res && res.data) {
            const d = res.data;
            animateNumber('kpi-daily-rev', d.dailyRevenue || 0, true);
            animateNumber('kpi-monthly-rev', d.monthlyRevenue || 0, true);
            animateNumber('kpi-total-rev', d.totalRevenue || 0, true);
            animateNumber('kpi-total-bookings', d.totalBookings || 0);
            const dailyOrders = document.getElementById('kpi-daily-orders');
            if (dailyOrders) dailyOrders.textContent = `${d.dailyBookings || 0} đơn hôm nay`;
        }
    } catch (err) {
        console.error('Overview KPI error:', err);
    }
}

// =============== FILTER PRESETS ===============
function applyPresetFilter(preset) {
    const todayObj = new Date();
    let start = '';
    let end = todayObj.toISOString().split('T')[0];

    if (preset === 'today') {
        start = end;
    } else if (preset === 'yesterday') {
        const y = new Date(); y.setDate(todayObj.getDate() - 1);
        start = y.toISOString().split('T')[0]; end = start;
    } else if (preset === 'this-week') {
        const day = todayObj.getDay();
        const diff = todayObj.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(new Date().setDate(diff)).toISOString().split('T')[0];
        end = new Date().toISOString().split('T')[0];
    } else if (preset === 'this-month') {
        start = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
    } else if (preset === 'last-month') {
        start = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1).toISOString().split('T')[0];
        end = new Date(todayObj.getFullYear(), todayObj.getMonth(), 0).toISOString().split('T')[0];
    }
    loadReportData(start, end);
}

// =============== LOAD REPORT DATA ===============
async function loadReportData(startDate, endDate) {
    const detailEl = document.getElementById('report-detail');
    if (detailEl) detailEl.innerHTML = tableSkeleton(5);
    const chartTitle = document.getElementById('chart-period-title');
    if (chartTitle) chartTitle.textContent = `Doanh thu chi tiết (${currentPeriodText})`;

    try {
        const res = await api.get(`/admin/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`);
        if (res && res.data) {
            const data = res.data;
            currentReportData = data;

            // Filtered KPIs
            animateNumber('rp-bookings', data.totalBookings || 0);
            animateNumber('rp-revenue', data.totalRevenue || 0, true);
            const avg = data.totalBookings > 0 ? Math.round(data.totalRevenue / data.totalBookings) : 0;
            animateNumber('rp-avg-amount', avg, true);

            // Line Chart
            renderReportChart(data.chartData);

            // Transaction Table
            if (data.bookings && data.bookings.length > 0) {
                detailEl.innerHTML = `
                    <table>
                        <thead><tr>
                            <th>Mã vé</th><th>Ngày mua</th><th>Khách hàng</th>
                            <th>Phim</th><th>Phòng</th><th>Suất chiếu</th>
                            <th style="text-align:right">Doanh thu</th>
                        </tr></thead>
                        <tbody>
                            ${data.bookings.map(b => `<tr>
                                <td><span class="badge" style="font-family:monospace;font-size:.85rem">${b.bookingCode}</span></td>
                                <td>${fmtDateTime(b.createdAt)}</td>
                                <td><strong>${b.customerName}</strong></td>
                                <td>${b.movieTitle}</td>
                                <td>${b.roomName}</td>
                                <td>${fmtDateTime(b.showtimeStart)}</td>
                                <td style="text-align:right;font-weight:700" class="text-success">${fmtMoney(b.finalAmount)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>`;
            } else {
                detailEl.innerHTML = '<div class="table-empty" style="padding:40px 0">Không có giao dịch nào trong khoảng thời gian này</div>';
            }
        }
    } catch (err) {
        console.error('Report load error:', err);
        showToast('Không thể tải báo cáo doanh thu', 'error');
    }
}

// =============== MONTHLY REPORT ===============
async function loadMonthlyReport() {
    const el = document.getElementById('monthly-summary');
    try {
        const res = await api.get('/admin/reports/monthly');
        if (res && res.data && res.data.length > 0) {
            el.innerHTML = `
                <table>
                    <thead><tr><th>Tháng</th><th style="text-align:center">Số vé</th><th style="text-align:right">Doanh thu</th></tr></thead>
                    <tbody>${res.data.map(m => `<tr>
                        <td><strong>${m.month}</strong></td>
                        <td style="text-align:center">${new Intl.NumberFormat('vi-VN').format(m.count)} vé</td>
                        <td style="text-align:right;font-weight:700">${fmtMoney(m.revenue)}</td>
                    </tr>`).join('')}</tbody>
                </table>`;
        } else {
            el.innerHTML = '<div class="table-empty">Chưa có dữ liệu doanh thu tháng</div>';
        }
    } catch(e) { console.error('Monthly report error:', e); }
}

// =============== LINE CHART ===============
function renderReportChart(chartData) {
    const ctx = document.getElementById('reportRevenueChart');
    if (!ctx) return;
    if (reportChartInstance) reportChartInstance.destroy();

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#525264' : '#94a3b8';

    const context = ctx.getContext('2d');
    const lineGrad = context.createLinearGradient(0, 0, 0, 300);
    lineGrad.addColorStop(0, isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.2)');
    lineGrad.addColorStop(1, 'rgba(99,102,241,0)');

    reportChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Doanh thu',
                data: chartData.map(d => d.revenue),
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.35,
                fill: true,
                backgroundColor: lineGrad,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: isDark ? '#0a0a0c' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: chartData.length > 31 ? 1 : 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1000, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(10,10,20,0.95)' : '#fff',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: '#6366f1',
                    borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
                    borderWidth: 1, padding: 12, cornerRadius: 10,
                    titleFont: { family: 'Inter', size: 12 },
                    bodyFont: { family: 'Inter', size: 14, weight: '700' },
                    displayColors: false,
                    callbacks: {
                        title: items => { const raw = chartData[items[0].dataIndex]; return `Ngày ${fmtDate(raw.date)}`; },
                        label: ctx => `Doanh thu: ${new Intl.NumberFormat('vi-VN').format(ctx.raw)}đ`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    border: { display: false },
                    ticks: { color: textColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 6,
                        callback: v => v === 0 ? '0' : new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v) }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: textColor, font: { family: 'Inter', size: 9 }, maxTicksLimit: 15 }
                }
            }
        }
    });
}

// =============== HELPERS ===============
function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g,"A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g,"E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g,"I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g,"O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g,"U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g,"Y");
    str = str.replace(/Đ/g,"D");
    return str;
}

// =============== EXPORT PDF ===============
async function exportReportToPDF() {
    if (!currentReportData) { showToast('Chưa có dữ liệu để xuất báo cáo', 'warning'); return; }

    showToast('Đang tạo báo cáo PDF...', 'info');

    try {
        const avg = currentReportData.totalBookings > 0 ? Math.round(currentReportData.totalRevenue / currentReportData.totalBookings) : 0;
        const now = new Date().toLocaleString('vi-VN');

        // Tạo HTML ẩn chứa nội dung báo cáo tiếng Việt đầy đủ dấu
        const wrapper = document.createElement('div');
        wrapper.id = 'pdf-render-area';
        wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:0;font-family:Inter,Arial,sans-serif;color:#0f172a;z-index:-1;';

        let bookingRows = '';
        (currentReportData.bookings || []).forEach((b, i) => {
            bookingRows += `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px">${b.bookingCode}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${fmtDateTime(b.createdAt)}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600">${b.customerName}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${b.movieTitle}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${b.roomName}</td>
                <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#10b981">${fmtMoney(b.finalAmount)}</td>
            </tr>`;
        });

        // Lấy ảnh biểu đồ
        let chartImgTag = '';
        const chartCanvas = document.getElementById('reportRevenueChart');
        if (chartCanvas) {
            const chartImg = chartCanvas.toDataURL('image/png', 1.0);
            chartImgTag = `<img src="${chartImg}" style="width:100%;height:auto;border-radius:8px;margin-top:8px">`;
        }

        wrapper.innerHTML = `
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;color:#fff">
                <div style="font-size:26px;font-weight:800;letter-spacing:1px">CINEMA 8 STAR</div>
                <div style="font-size:13px;opacity:0.85;margin-top:4px">Hệ thống Rạp chiếu phim hiện đại & Tự động</div>
                <div style="font-size:11px;opacity:0.7;margin-top:4px">Ngày xuất báo cáo: ${now}</div>
            </div>

            <!-- Tiêu đề -->
            <div style="padding:28px 32px 0">
                <div style="font-size:22px;font-weight:800;color:#1e293b;margin-bottom:4px">BÁO CÁO DOANH THU CHI TIẾT</div>
                <div style="font-size:13px;color:#64748b;margin-bottom:24px">Kỳ báo cáo: ${currentPeriodText}</div>

                <!-- KPI Cards -->
                <div style="display:flex;gap:16px;margin-bottom:24px">
                    <div style="flex:1;background:#f0f9ff;border-radius:10px;padding:16px 20px;border-left:4px solid #6366f1">
                        <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tổng số vé bán ra</div>
                        <div style="font-size:24px;font-weight:800;color:#1e293b;margin-top:4px">${currentReportData.totalBookings} vé</div>
                    </div>
                    <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:16px 20px;border-left:4px solid #10b981">
                        <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tổng doanh thu thực tế</div>
                        <div style="font-size:24px;font-weight:800;color:#10b981;margin-top:4px">${fmtMoney(currentReportData.totalRevenue)}</div>
                    </div>
                    <div style="flex:1;background:#fffbeb;border-radius:10px;padding:16px 20px;border-left:4px solid #f59e0b">
                        <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Giá trị trung bình mỗi vé</div>
                        <div style="font-size:24px;font-weight:800;color:#f59e0b;margin-top:4px">${fmtMoney(avg)}</div>
                    </div>
                </div>

                <!-- Biểu đồ -->
                <div style="margin-bottom:24px">
                    <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px">
                        Biểu đồ doanh thu
                    </div>
                    ${chartImgTag}
                </div>

                <!-- Bảng giao dịch -->
                <div style="margin-bottom:24px">
                    <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px">
                        Danh sách giao dịch chi tiết
                    </div>
                    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden">
                        <thead>
                            <tr style="background:#4f46e5;color:#fff">
                                <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:700">Mã vé</th>
                                <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:700">Ngày mua</th>
                                <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:700">Khách hàng</th>
                                <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:700">Phim</th>
                                <th style="padding:10px 10px;text-align:left;font-size:12px;font-weight:700">Phòng</th>
                                <th style="padding:10px 10px;text-align:right;font-size:12px;font-weight:700">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>${bookingRows}</tbody>
                        <tfoot>
                            <tr style="background:#eef2ff">
                                <td colspan="5" style="padding:10px;font-weight:800;font-size:13px;color:#1e293b">TỔNG CỘNG DOANH THU</td>
                                <td style="padding:10px;text-align:right;font-weight:800;font-size:14px;color:#10b981">${fmtMoney(currentReportData.totalRevenue)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Footer -->
                <div style="text-align:center;padding:16px 0;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px">
                    Cinema 8 Star &mdash; Báo cáo được tạo tự động bởi hệ thống quản trị
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);

        // Dùng html2canvas để render toàn bộ nội dung (giữ dấu tiếng Việt)
        const canvas = await html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        document.body.removeChild(wrapper);

        // Chuyển canvas thành PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width mm
        const pageHeight = 297; // A4 height mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const doc = new jsPDF('p', 'mm', 'a4');
        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = -(pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(heightLeft / pageHeight)));
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const safeName = currentPeriodText.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9\-àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '');
        doc.save(`bao-cao-doanh-thu-${safeName || 'report'}.pdf`);
        showToast('Xuất báo cáo PDF thành công!', 'success');
    } catch(err) {
        console.error('Lỗi xuất PDF:', err);
        showToast('Lỗi khi tạo tệp PDF', 'error');
    }
}

// =============== EXPORT EXCEL ===============
function exportReportToExcel() {
    if (!currentReportData) { showToast('Chưa có dữ liệu để xuất báo cáo', 'warning'); return; }
    try {
        const wb = XLSX.utils.book_new();
        const avg = currentReportData.totalBookings > 0 ? Math.round(currentReportData.totalRevenue / currentReportData.totalBookings) : 0;

        const wsData = [
            ["BÁO CÁO DOANH THU CHI TIẾT - CINEMA 8 STAR"],
            [`Kỳ báo cáo: ${currentPeriodText}`],
            [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
            [],
            ["TÓM TẮT CHỈ SỐ DOANH THU (KPI)"],
            ["Tổng số vé bán ra", `${currentReportData.totalBookings} vé`],
            ["Tổng doanh thu thực tế", currentReportData.totalRevenue],
            ["Giá trị trung bình mỗi vé", avg],
            [],
            ["Mã vé", "Ngày mua", "Khách hàng", "Phim", "Phòng chiếu", "Suất chiếu", "Doanh thu (VND)"]
        ];
        (currentReportData.bookings || []).forEach(b => {
            wsData.push([b.bookingCode, fmtDateTime(b.createdAt), b.customerName, b.movieTitle, b.roomName, fmtDateTime(b.showtimeStart), b.finalAmount]);
        });
        wsData.push([]);
        wsData.push(["TỔNG CỘNG", "", "", "", "", "", currentReportData.totalRevenue]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:15},{wch:22},{wch:24},{wch:32},{wch:15},{wch:22},{wch:18}];
        XLSX.utils.book_append_sheet(wb, ws, "Chi tiết doanh thu");

        // Sheet 2: Monthly
        const mEl = document.querySelector('#monthly-summary table tbody');
        if (mEl) {
            const mRows = [["BÁO CÁO DOANH THU THEO THÁNG"],[`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],[],["Tháng","Số vé","Doanh thu (VND)"]];
            mEl.querySelectorAll('tr').forEach(r => {
                const c = r.querySelectorAll('td');
                if (c.length >= 3) mRows.push([c[0].textContent.trim(), parseInt(c[1].textContent.replace(/[^\d]/g,''))||0, parseInt(c[2].textContent.replace(/[^\d]/g,''))||0]);
            });
            const wsM = XLSX.utils.aoa_to_sheet(mRows);
            wsM['!cols'] = [{wch:18},{wch:12},{wch:20}];
            XLSX.utils.book_append_sheet(wb, wsM, "Doanh thu theo tháng");
        }

        const safeName = removeVietnameseTones(currentPeriodText).replace(/\s+/g, '-').toLowerCase();
        XLSX.writeFile(wb, `bao-cao-doanh-thu-${safeName}.xlsx`);
        showToast('Xuất báo cáo Excel thành công!', 'success');
    } catch(err) {
        console.error('Excel export error:', err);
        showToast('Lỗi khi tạo tệp Excel', 'error');
    }
}
