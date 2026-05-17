/* Trang Tổng quan — Phân tích doanh thu & Hoạt động */
async function renderDashboard(container) {
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

    container.innerHTML = `
        <!-- Welcome Banner -->
        <div class="dash-welcome">
            <div class="dash-welcome-text">
                <h2>${greeting}</h2>
                <p>Tổng quan hoạt động hệ thống Cinema 8 Star hôm nay</p>
            </div>
            <div class="dash-welcome-date">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ${now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>

        <!-- KPI Cards -->
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
                    <div class="dash-kpi-trend" id="kpi-daily-trend">
                        <span class="dash-kpi-trend-orders" id="kpi-daily-orders">— đơn</span>
                    </div>
                </div>
            </div>

            <div class="dash-kpi-card dash-kpi-cyan">
                <div class="dash-kpi-glow"></div>
                <div class="dash-kpi-content">
                    <div class="dash-kpi-top">
                        <div class="dash-kpi-icon-wrap">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        </div>
                        <span class="dash-kpi-badge">${monthNames[now.getMonth()]}</span>
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

        <!-- Chart + Stats -->
        <div class="dash-main-row">
            <div class="dash-chart-card">
                <div class="dash-card-header">
                    <div>
                        <h3 class="dash-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>Biểu đồ doanh thu</h3>
                        <p class="dash-card-subtitle">Doanh thu theo ngày trong ${monthNames[now.getMonth()]} ${now.getFullYear()}</p>
                    </div>
                    <div class="dash-chart-legend">
                        <span class="dash-legend-dot"></span> Doanh thu (VNĐ)
                    </div>
                </div>
                <div class="dash-chart-body">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <div class="dash-stats-card">
                <div class="dash-card-header">
                    <h3 class="dash-card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>Chi tiết</h3>
                </div>
                <div class="dash-stats-list">
                    <div class="dash-stat-group-title">Doanh thu</div>
                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #6366f1">₫</div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">Doanh thu ngày</span>
                            <span class="dash-stat-value" id="stat-daily">—</span>
                        </div>
                    </div>
                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #06b6d4">₫</div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">Doanh thu tháng</span>
                            <span class="dash-stat-value" id="stat-monthly">—</span>
                        </div>
                    </div>
                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #10b981">₫</div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">Tổng doanh thu</span>
                            <span class="dash-stat-value" id="stat-total">—</span>
                        </div>
                    </div>

                    <div class="dash-stat-divider"></div>
                    <div class="dash-stat-group-title">Đặt vé</div>

                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #a855f7"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg></div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">Tổng booking</span>
                            <span class="dash-stat-value" id="stat-bookings">—</span>
                        </div>
                    </div>
                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #f59e0b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg></div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">Đơn hôm nay</span>
                            <span class="dash-stat-value" id="stat-daily-bookings">—</span>
                        </div>
                    </div>
                    <div class="dash-stat-item">
                        <div class="dash-stat-icon" style="--si-color: #ef4444"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
                        <div class="dash-stat-info">
                            <span class="dash-stat-label">TB mỗi đơn</span>
                            <span class="dash-stat-value" id="stat-avg">—</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

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

            document.getElementById('stat-daily').textContent = fmtMoney(d.dailyRevenue || 0);
            document.getElementById('stat-monthly').textContent = fmtMoney(d.monthlyRevenue || 0);
            document.getElementById('stat-total').textContent = fmtMoney(d.totalRevenue || 0);
            document.getElementById('stat-bookings').textContent = new Intl.NumberFormat('vi-VN').format(d.totalBookings || 0);
            document.getElementById('stat-daily-bookings').textContent = new Intl.NumberFormat('vi-VN').format(d.dailyBookings || 0);

            const avg = d.totalBookings > 0 ? Math.round((d.totalRevenue || 0) / d.totalBookings) : 0;
            document.getElementById('stat-avg').textContent = fmtMoney(avg);

            renderRevenueChart(d.chartData);
        }
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

function renderRevenueChart(chartData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#525264' : '#94a3b8';

    const context = ctx.getContext('2d');

    // Hiệu ứng Gradient cho các cột của biểu đồ (Bar chart)
    const barGrad = context.createLinearGradient(0, 0, 0, 300);
    barGrad.addColorStop(0, isDark ? '#818cf8' : '#6366f1');
    barGrad.addColorStop(1, isDark ? '#4f46e5' : '#4338ca');

    // Hiệu ứng Gradient khi di chuột (hover) vào cột
    const hoverGrad = context.createLinearGradient(0, 0, 0, 300);
    hoverGrad.addColorStop(0, '#a5b4fc');
    hoverGrad.addColorStop(1, '#6366f1');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Doanh thu',
                data: chartData.map(d => d.revenue),
                backgroundColor: barGrad,
                hoverBackgroundColor: hoverGrad,
                borderWidth: 0,
                borderRadius: { topLeft: 8, topRight: 8 },
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.75,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1200, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(10,10,20,0.95)' : '#fff',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: '#6366f1',
                    borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
                    borderWidth: 1,
                    padding: { top: 12, bottom: 12, left: 16, right: 16 },
                    cornerRadius: 12,
                    titleFont: { family: 'Inter', size: 12, weight: '500' },
                    bodyFont: { family: 'Inter', size: 15, weight: '700' },
                    displayColors: false,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    callbacks: {
                        title: (items) => items[0].label,
                        label: (ctx) => `${new Intl.NumberFormat('vi-VN').format(ctx.raw)}đ`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, lineWidth: 1, drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 11, weight: '500' },
                        padding: 12,
                        maxTicksLimit: 6,
                        callback: v => v === 0 ? '0' : new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v)
                    }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10, weight: '500' },
                        maxRotation: 0
                    }
                }
            }
        }
    });
}

function animateNumber(id, target, isMoney = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (target === 0) { el.textContent = isMoney ? '0đ' : '0'; return; }

    let current = 0;
    const duration = 800;
    const steps = 40;
    const step = Math.max(1, Math.ceil(target / steps));
    const interval = duration / steps;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = isMoney ? fmtMoney(current) : new Intl.NumberFormat('vi-VN').format(current);
    }, interval);
}
