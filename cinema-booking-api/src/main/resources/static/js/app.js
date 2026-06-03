/* Khởi tạo Ứng dụng */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateAuthUI();
    renderCurrentRoute();

    // Kiểm tra đơn đặt vé chưa thanh toán
    setTimeout(() => {
        if (typeof checkAndShowPendingBar === 'function') checkAndShowPendingBar();
    }, 1500);

    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
    });

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    const infoModal = document.getElementById('info-modal');
    if (infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) closeInfoModal();
        });
    }
});

/* --- Quản lý Giao diện (Sáng/Tối) --- */
function initTheme() {
    const savedTheme = localStorage.getItem('cinema_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('cinema_theme', theme);
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }
}

/* --- Hộp thoại Thông tin (Modal) --- */
const infoContents = {
    guide: '<h2 class="modal-title" style="color:var(--accent)">H\u01b0\u1edbng d\u1eabn \u0111\u1eb7t v\u00e9</h2>'
        + '<div style="margin-top:20px;line-height:1.8;color:var(--text-secondary)">'
        + '<p>1. Ch\u1ecdn tab <strong>Phim</strong> tr\u00ean thanh \u0111i\u1ec1u h\u01b0\u1edbng ho\u1eb7c l\u01b0\u1edbt xu\u1ed1ng danh s\u00e1ch phim \u0111ang chi\u1ebfu.</p>'
        + '<p>2. Ch\u1ecdn phim b\u1ea1n mu\u1ed1n xem v\u00e0 b\u1ea5m n\u00fat <strong>Mua v\u00e9</strong>.</p>'
        + '<p>3. T\u1ea1i trang chi ti\u1ebft, ch\u1ecdn R\u1ea1p chi\u1ebfu, Ng\u00e0y chi\u1ebfu v\u00e0 Gi\u1edd chi\u1ebfu ph\u00f9 h\u1ee3p.</p>'
        + '<p>4. Ch\u1ecdn v\u1ecb tr\u00ed gh\u1ebf ng\u1ed3i tr\u00ean s\u01a1 \u0111\u1ed3. Gh\u1ebf m\u00e0u \u0111\u1ecf l\u00e0 \u0111\u00e3 c\u00f3 ng\u01b0\u1eddi \u0111\u1eb7t, gh\u1ebf x\u00e1m l\u00e0 \u0111ang tr\u1ed1ng.</p>'
        + '<p>5. B\u1ea5m <strong>Thanh to\u00e1n</strong> v\u00e0 qu\u00e9t m\u00e3 VietQR. H\u1ec7 th\u1ed1ng s\u1ebd t\u1ef1 \u0111\u1ed9ng x\u00e1c nh\u1eadn trong v\u00f2ng v\u00e0i gi\u00e2y.</p>'
        + '<p style="margin-top:15px;font-weight:bold;color:var(--text-primary)">L\u01b0u \u00fd: Gh\u1ebf s\u1ebd \u0111\u01b0\u1ee3c gi\u1eef trong 10 ph\u00fat \u0111\u1ec3 b\u1ea1n thanh to\u00e1n. Qu\u00e1 th\u1eddi gian, h\u1ec7 th\u1ed1ng s\u1ebd t\u1ef1 nh\u1ea3 gh\u1ebf.</p>'
        + '</div>',
    policy: '<h2 class="modal-title" style="color:var(--accent)">Ch\u00ednh s\u00e1ch ho\u00e0n v\u00e9</h2>'
        + '<div style="margin-top:20px;line-height:1.8;color:var(--text-secondary)">'
        + '<p><strong>\u0110i\u1ec1u ki\u1ec7n \u0111\u1ed5i/tr\u1ea3 v\u00e9:</strong></p>'
        + '<ul style="padding-left:20px;margin-bottom:15px">'
        + '<li>Kh\u00e1ch h\u00e0ng c\u00f3 th\u1ec3 h\u1ee7y ho\u1eb7c \u0111\u1ed5i v\u00e9 tr\u1ef1c tuy\u1ebfn tr\u01b0\u1edbc \u00edt nh\u1ea5t <strong>60 ph\u00fat</strong> so v\u1edbi gi\u1edd chi\u1ebfu.</li>'
        + '<li>Giao d\u1ecbch ho\u00e0n ti\u1ec1n s\u1ebd \u0111\u01b0\u1ee3c t\u1ef1 \u0111\u1ed9ng chuy\u1ec3n v\u1ec1 t\u00e0i kho\u1ea3n thanh to\u00e1n ban \u0111\u1ea7u trong v\u00f2ng 3-5 ng\u00e0y l\u00e0m vi\u1ec7c.</li>'
        + '<li>Kh\u00f4ng \u00e1p d\u1ee5ng ho\u00e0n v\u00e9 \u0111\u1ed1i v\u1edbi c\u00e1c ch\u01b0\u01a1ng tr\u00ecnh khuy\u1ebfn m\u00e3i \u0111\u1eb7c bi\u1ec7t (flash sale, mua 1 t\u1eb7ng 1...).</li>'
        + '</ul>'
        + '<p>Trong tr\u01b0\u1eddng h\u1ee3p g\u1eb7p s\u1ef1 c\u1ed1 h\u1ec7 th\u1ed1ng kh\u00f4ng t\u1ef1 \u0111\u1ed9ng duy\u1ec7t v\u00e9, vui l\u00f2ng li\u00ean h\u1ec7 ngay v\u1edbi hotline 1900 6868 \u0111\u1ec3 \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3 th\u1ee7 c\u00f4ng.</p>'
        + '</div>',
    contact: '<h2 class="modal-title" style="color:var(--accent)">Li\u00ean h\u1ec7</h2>'
        + '<div style="margin-top:20px;line-height:1.8;color:var(--text-secondary)">'
        + '<p><strong>C\u00d4NG TY C\u1ed4 PH\u1ea6N R\u1ea0P CHI\u1ebeU PHIM CINEMA 8 STAR</strong></p>'
        + '<p><strong>Tr\u1ee5 s\u1edf ch\u00ednh:</strong> T\u1ea7ng 8, T\u00f2a nh\u00e0 Cinema 8 Star, Qu\u1eadn C\u1ea7u Gi\u1ea5y, TP. H\u00e0 N\u1ed9i</p>'
        + '<p><strong>Hotline:</strong> 1900 6868 (24/7)</p>'
        + '<p><strong>Email:</strong> support@cinemastar.vn</p>'
        + '<p style="margin-top:15px">Ch\u00fang t\u00f4i lu\u00f4n s\u1eb5n s\u00e0ng l\u1eafng nghe m\u1ecdi \u00fd ki\u1ebfn \u0111\u00f3ng g\u00f3p t\u1eeb qu\u00fd kh\u00e1ch h\u00e0ng \u0111\u1ec3 kh\u00f4ng ng\u1eebng c\u1ea3i thi\u1ec7n v\u00e0 n\u00e2ng cao ch\u1ea5t l\u01b0\u1ee3ng d\u1ecbch v\u1ee5.</p>'
        + '</div>'
};

window.openInfoModal = function(type) {
    const modal = document.getElementById('info-modal');
    const contentBox = document.getElementById('info-content');
    if (modal && contentBox && infoContents[type]) {
        contentBox.innerHTML = infoContents[type];
        modal.classList.remove('hidden');
    }
};

window.closeInfoModal = function() {
    const modal = document.getElementById('info-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};
