/* Trang Báo cáo Doanh thu - Admin */
let reportChartInstance = null;
let currentReportData = null;
let currentPeriodText = "Tháng này";

async function renderReportsPage(container) {
    container.innerHTML = `
        <div class="page-header">
            <div class="page-title">Báo cáo doanh thu & Phân tích</div>
            <div class="header-actions" style="display: flex; gap: 12px;">
                <button class="btn-primary" id="btn-export-pdf" onclick="exportReportToPDF()" style="background: linear-gradient(135deg, #ef4444, #b91c1c);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Xuất PDF
                </button>
                <button class="btn-primary" id="btn-export-excel" onclick="exportReportToExcel()" style="background: linear-gradient(135deg, #10b981, #047857);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>
                    Xuất Excel
                </button>
            </div>
        </div>

        <!-- Filter Controls -->
        <div class="section-card filter-container-card" style="margin-bottom: 24px;">
            <div class="filter-row">
                <div class="filter-presets">
                    <button class="btn-filter-preset active" data-preset="this-month">Tháng này</button>
                    <button class="btn-filter-preset" data-preset="last-month">Tháng trước</button>
                    <button class="btn-filter-preset" data-preset="this-week">Tuần này</button>
                    <button class="btn-filter-preset" data-preset="today">Hôm nay</button>
                    <button class="btn-filter-preset" data-preset="yesterday">Hôm qua</button>
                    <button class="btn-filter-preset" data-preset="custom">Tùy chọn</button>
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
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid" id="report-kpis" style="margin-bottom: 24px;">
            <div class="kpi-card info">
                <div class="kpi-icon-wrap" style="--si-color: #6366f1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">Tổng vé bán ra</div>
                    <div class="kpi-value" id="rp-bookings">—</div>
                </div>
            </div>
            <div class="kpi-card success">
                <div class="kpi-icon-wrap" style="--si-color: #10b981">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">Tổng doanh thu thực tế</div>
                    <div class="kpi-value" id="rp-revenue">—</div>
                </div>
            </div>
            <div class="kpi-card warning">
                <div class="kpi-icon-wrap" style="--si-color: #f59e0b">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>
                </div>
                <div class="kpi-details">
                    <div class="kpi-label">Giá trị trung bình mỗi vé</div>
                    <div class="kpi-value" id="rp-avg-amount">—</div>
                </div>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="dash-main-row" style="margin-bottom: 24px; display: grid; grid-template-columns: 1fr; gap: 24px;">
            <div class="dash-chart-card">
                <div class="dash-card-header">
                    <div>
                        <h3 class="dash-card-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                            Xu hướng doanh thu
                        </h3>
                        <p class="dash-card-subtitle" id="chart-period-title">Doanh thu theo ngày liên tục</p>
                    </div>
                </div>
                <div class="dash-chart-body" style="height: 320px; position: relative;">
                    <canvas id="reportRevenueChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Detail Table & Monthly Table -->
        <div style="display: grid; grid-template-columns: 2.2fr 1fr; gap: 24px;" class="report-table-row">
            <div class="section-card">
                <div class="section-title-sm">Danh sách giao dịch chi tiết</div>
                <div id="report-detail" class="table-responsive">${tableSkeleton(5)}</div>
            </div>
            
            <div class="section-card">
                <div class="section-title-sm">Doanh thu từng tháng</div>
                <div id="monthly-summary" class="table-responsive">${tableSkeleton(5)}</div>
            </div>
        </div>
    `;

    // Thiết lập sự kiện cho các bộ lọc cài sẵn
    const presets = container.querySelectorAll('.btn-filter-preset');
    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            presets.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            
            const preset = btn.dataset.preset;
            const customDates = document.getElementById('custom-date-selectors');
            
            if (preset === 'custom') {
                customDates.classList.remove('hidden');
                // Đặt ngày mặc định là đầu tháng và ngày hôm nay
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

    // Sự kiện nút áp dụng bộ lọc ngày tùy chọn
    document.getElementById('btn-apply-custom-filter').addEventListener('click', () => {
        const start = document.getElementById('filter-start-date').value;
        const end = document.getElementById('filter-end-date').value;
        if (!start || !end) {
            showToast('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc', 'warning');
            return;
        }
        if (new Date(start) > new Date(end)) {
            showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'warning');
            return;
        }
        currentPeriodText = `Từ ${fmtDate(start)} đến ${fmtDate(end)}`;
        loadReportData(start, end);
    });

    // Tải dữ liệu ban đầu (Mặc định: Tháng này)
    applyPresetFilter('this-month');
    loadMonthlyReport();
}

// Xử lý bộ lọc có sẵn
function applyPresetFilter(preset) {
    const todayObj = new Date();
    let start = "";
    let end = todayObj.toISOString().split('T')[0];

    if (preset === 'today') {
        start = end;
    } else if (preset === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(todayObj.getDate() - 1);
        start = yesterday.toISOString().split('T')[0];
        end = start;
    } else if (preset === 'this-week') {
        // Thứ 2 tuần này
        const day = todayObj.getDay();
        const diff = todayObj.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(todayObj.setDate(diff));
        start = monday.toISOString().split('T')[0];
        end = new Date().toISOString().split('T')[0]; // reset to original today
    } else if (preset === 'this-month') {
        start = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
    } else if (preset === 'last-month') {
        const firstDayOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 0);
        start = firstDayOfLastMonth.toISOString().split('T')[0];
        end = lastDayOfLastMonth.toISOString().split('T')[0];
    }

    loadReportData(start, end);
}

// Tải dữ liệu báo cáo từ API
async function loadReportData(startDate, endDate) {
    const detailEl = document.getElementById('report-detail');
    if (detailEl) detailEl.innerHTML = tableSkeleton(5);
    
    document.getElementById('chart-period-title').textContent = `Doanh thu chi tiết kì báo cáo (${currentPeriodText})`;

    try {
        const res = await api.get(`/admin/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`);
        if (res && res.data) {
            const data = res.data;
            currentReportData = data;

            // Cập nhật KPIs
            animateNumber('rp-bookings', data.totalBookings || 0);
            animateNumber('rp-revenue', data.totalRevenue || 0, true);
            const avg = data.totalBookings > 0 ? Math.round(data.totalRevenue / data.totalBookings) : 0;
            animateNumber('rp-avg-amount', avg, true);

            // Vẽ biểu đồ dây liên tục
            renderReportChart(data.chartData);

            // Cập nhật bảng chi tiết giao dịch
            if (data.bookings && data.bookings.length > 0) {
                detailEl.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Mã vé</th>
                                <th>Ngày mua</th>
                                <th>Khách hàng</th>
                                <th>Phim</th>
                                <th>Phòng chiếu</th>
                                <th>Suất chiếu</th>
                                <th style="text-align:right">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.bookings.map(b => `
                                <tr>
                                    <td><span class="badge" style="font-family:monospace; font-size:0.9rem">${b.bookingCode}</span></td>
                                    <td>${fmtDateTime(b.createdAt)}</td>
                                    <td><strong>${b.customerName}</strong></td>
                                    <td>${b.movieTitle}</td>
                                    <td>${b.roomName}</td>
                                    <td>${fmtDateTime(b.showtimeStart)}</td>
                                    <td style="text-align:right; font-weight:700" class="text-success">${fmtMoney(b.finalAmount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                detailEl.innerHTML = `<div class="table-empty" style="padding:40px 0">Không có giao dịch nào trong khoảng thời gian này</div>`;
            }
        }
    } catch (err) {
        console.error('Lỗi tải báo cáo:', err);
        showToast('Không thể tải báo cáo doanh thu', 'error');
    }
}

// Tải báo cáo doanh thu từng tháng
async function loadMonthlyReport() {
    const monthlyEl = document.getElementById('monthly-summary');
    try {
        const res = await api.get('/admin/reports/monthly');
        if (res && res.data) {
            const data = res.data;
            if (data && data.length > 0) {
                monthlyEl.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Tháng</th>
                                <th style="text-align:center">Số vé</th>
                                <th style="text-align:right">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(m => `
                                <tr>
                                    <td><strong>${m.month}</strong></td>
                                    <td style="text-align:center">${new Intl.NumberFormat('vi-VN').format(m.count)} vé</td>
                                    <td style="text-align:right; font-weight:700">${fmtMoney(m.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                monthlyEl.innerHTML = `<div class="table-empty">Chưa có dữ liệu doanh thu tháng</div>`;
            }
        }
    } catch(err) {
        console.error('Monthly report error:', err);
    }
}

// Vẽ biểu đồ dây báo cáo doanh thu
function renderReportChart(chartData) {
    const ctx = document.getElementById('reportRevenueChart');
    if (!ctx) return;

    if (reportChartInstance) {
        reportChartInstance.destroy();
    }

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#525264' : '#94a3b8';
    
    const context = ctx.getContext('2d');
    const lineGrad = context.createLinearGradient(0, 0, 0, 300);
    lineGrad.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)');
    lineGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

    reportChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                label: 'Doanh thu',
                data: chartData.map(d => d.revenue),
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                backgroundColor: lineGrad,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: isDark ? '#0a0a0c' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: chartData.length > 31 ? 1 : 3,
                pointHoverRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(10,10,20,0.95)' : '#fff',
                    titleColor: isDark ? '#e2e8f0' : '#1e293b',
                    bodyColor: '#6366f1',
                    borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'Inter', size: 12 },
                    bodyFont: { family: 'Inter', size: 14, weight: '700' },
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            const raw = chartData[items[0].dataIndex];
                            return `Ngày ${fmtDate(raw.date)}`;
                        },
                        label: (ctx) => `Doanh thu: ${new Intl.NumberFormat('vi-VN').format(ctx.raw)}đ`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    border: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 },
                        callback: v => v === 0 ? '0' : new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v)
                    }
                },
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 9 },
                        maxTicksLimit: 15
                    }
                }
            }
        }
    });
}

// Loại bỏ dấu tiếng Việt để không bị lỗi font trong PDF
function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

// Xuất báo cáo doanh thu ra PDF
function exportReportToPDF() {
    if (!currentReportData) {
        showToast('Chưa có dữ liệu để xuất báo cáo', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Tiêu đề & Header
        doc.setFillColor(79, 70, 229); // Màu primary #4f46e5
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("CINEMA 8 STAR", 15, 18);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text("He thong Rap chieu phim hien dai & Tu dong", 15, 25);
        doc.text("Generated: " + new Date().toLocaleString(), 155, 25);

        // Nội dung tiêu đề chính của PDF
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.setFont('Helvetica', 'bold');
        doc.text("BAO CAO DOANH THU CHI TIET", 15, 52);

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Ky bao cao: " + removeVietnameseTones(currentPeriodText), 15, 59);

        // Bảng tóm tắt KPIs
        const avg = currentReportData.totalBookings > 0 ? Math.round(currentReportData.totalRevenue / currentReportData.totalBookings) : 0;
        
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text("CHISO TOM TAT (KPI):", 15, 72);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text("1. Tong so ve ban ra: " + currentReportData.totalBookings + " ve", 20, 80);
        doc.text("2. Tong doanh thu thuc te: " + fmtMoney(currentReportData.totalRevenue), 20, 86);
        doc.text("3. Gia tri ve trung binh: " + fmtMoney(avg), 20, 92);

        let currentY = 100;

        // Trích xuất biểu đồ doanh thu dạng hình ảnh
        const chartCanvas = document.getElementById('reportRevenueChart');
        if (chartCanvas) {
            const chartImg = chartCanvas.toDataURL('image/png', 1.0);
            doc.setFont('Helvetica', 'bold');
            doc.text("BIEU DO DOANH THU:", 15, 102);
            doc.addImage(chartImg, 'PNG', 15, 106, 180, 70);
            currentY = 184;
        }

        // Bảng chi tiết giao dịch (sử dụng jspdf-autotable)
        const tableBody = (currentReportData.bookings || []).map(b => [
            b.bookingCode,
            fmtDateTime(b.createdAt),
            removeVietnameseTones(b.customerName),
            removeVietnameseTones(b.movieTitle),
            removeVietnameseTones(b.roomName),
            fmtMoney(b.finalAmount)
        ]);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("DANH SACH GIAO DICH CHI TIET:", 15, currentY);

        doc.autoTable({
            startY: currentY + 4,
            head: [['Ma ve', 'Ngay mua', 'Khach hang', 'Phim', 'Phong', 'Doanh thu']],
            body: tableBody,
            styles: { font: 'Helvetica', fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] },
            columnStyles: {
                5: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Tải xuống file PDF
        const safePeriodName = removeVietnameseTones(currentPeriodText).replace(/\s+/g, '-').toLowerCase();
        doc.save(`bao-cao-doanh-thu-${safePeriodName}.pdf`);
        showToast('Xuất báo cáo PDF thành công!', 'success');
    } catch(err) {
        console.error('Lỗi xuất PDF:', err);
        showToast('Lỗi khi tạo và xuất tệp PDF', 'error');
    }
}

// Xuất báo cáo doanh thu ra Excel (.xlsx) sử dụng thư viện SheetJS (XLSX)
function exportReportToExcel() {
    if (!currentReportData) {
        showToast('Chưa có dữ liệu để xuất báo cáo', 'warning');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        
        // 1. Sheet 1: Dữ liệu chi tiết giao dịch
        const wsData = [
            ["BÁO CÁO DOANH THU CHI TIẾT - CINEMA 8 STAR"],
            [`Kỳ báo cáo: ${currentPeriodText}`],
            [`Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`],
            [],
            ["TÓM TẮT CHỈ SỐ DOANH THU (KPI)"],
            ["Tổng số vé bán ra", `${currentReportData.totalBookings} vé`],
            ["Tổng doanh thu thực tế", `${currentReportData.totalRevenue} VND`],
            ["Giá trị trung bình mỗi vé", `${currentReportData.totalBookings > 0 ? Math.round(currentReportData.totalRevenue / currentReportData.totalBookings) : 0} VND`],
            [],
            ["Mã vé", "Ngày mua", "Khách hàng", "Phim", "Phòng chiếu", "Suất chiếu", "Doanh thu (VND)"]
        ];

        (currentReportData.bookings || []).forEach(b => {
            wsData.push([
                b.bookingCode,
                fmtDateTime(b.createdAt),
                b.customerName,
                b.movieTitle,
                b.roomName,
                fmtDateTime(b.showtimeStart),
                b.finalAmount
            ]);
        });

        // Thêm dòng trống và dòng tổng cộng doanh thu
        wsData.push([]);
        wsData.push(["TỔNG CỘNG DOANH THU", "", "", "", "", "", currentReportData.totalRevenue]);

        // Tạo sheet từ mảng dữ liệu
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Thiết lập độ rộng cột cho đẹp mắt và không bị che khuất chữ
        const colWidths = [
            { wch: 15 }, // Mã vé
            { wch: 22 }, // Ngày mua
            { wch: 24 }, // Khách hàng
            { wch: 32 }, // Phim
            { wch: 15 }, // Phòng
            { wch: 22 }, // Suất chiếu
            { wch: 18 }  // Doanh thu
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "Chi tiết doanh thu");

        // 2. Sheet 2: Doanh thu gom nhóm theo từng tháng
        const monthlySummaryEl = document.querySelector('#monthly-summary table tbody');
        if (monthlySummaryEl) {
            const monthlyRows = [
                ["BÁO CÁO DOANH THU THEO TỪNG THÁNG"],
                [`Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`],
                [],
                ["Tháng", "Số vé bán", "Doanh thu (VND)"]
            ];
            
            const rows = monthlySummaryEl.querySelectorAll('tr');
            rows.forEach(r => {
                const cols = r.querySelectorAll('td');
                if (cols.length >= 3) {
                    const monthText = cols[0].textContent.trim();
                    const ticketsText = cols[1].textContent.trim().replace(' vé', '').replace(/\./g, '');
                    const revText = cols[2].textContent.trim().replace('đ', '').replace(/\./g, '').replace(/\s/g, '');
                    
                    monthlyRows.push([
                        monthText,
                        parseInt(ticketsText) || 0,
                        parseInt(revText) || 0
                    ]);
                }
            });
            
            const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows);
            wsMonthly['!cols'] = [
                { wch: 15 }, // Tháng
                { wch: 15 }, // Số vé
                { wch: 20 }  // Doanh thu
            ];
            XLSX.utils.book_append_sheet(wb, wsMonthly, "Doanh thu theo tháng");
        }

        // Tải xuống file Excel
        const safePeriodName = removeVietnameseTones(currentPeriodText).replace(/\s+/g, '-').toLowerCase();
        XLSX.writeFile(wb, `bao-cao-doanh-thu-${safePeriodName}.xlsx`);
        showToast('Xuất báo cáo Excel thành công!', 'success');
    } catch(err) {
        console.error('Lỗi xuất Excel:', err);
        showToast('Lỗi khi tạo và xuất tệp Excel', 'error');
    }
}
