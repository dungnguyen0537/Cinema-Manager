/* =============================================
   Cinema 8 Star — Công cụ Xử lý Animation
   Tối ưu GPU, hiệu suất cao, dễ tiếp cận
   ============================================= */

(function() {
    'use strict';

    // Tôn trọng cài đặt hệ thống của người dùng (giảm chuyển động)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    /* ===== 1. HIỆU ỨNG HIỆN DẦN KHI CUỘN (Scroll Reveal) ===== */
    function initScrollReveal() {
        if (prefersReducedMotion) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target); // Chỉ chạy animation một lần
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        // Theo dõi tất cả phần tử có class reveal
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            observer.observe(el);
        });
    }

    /* Tự động áp dụng hiệu ứng cho nội dung động sau khi render trang */
    function applyRevealToPage() {
        if (prefersReducedMotion) return;

        // Thẻ phim — hiệu ứng hiện dần so le (staggered)
        document.querySelectorAll('.movie-grid .movie-card').forEach((card, i) => {
            if (!card.classList.contains('reveal') && !card.classList.contains('revealed')) {
                card.classList.add('reveal');
                card.style.transitionDelay = `${i * 60}ms`;
            }
        });

        // Tiêu đề các mục
        document.querySelectorAll('.section-header').forEach(el => {
            if (!el.classList.contains('reveal') && !el.classList.contains('revealed')) {
                el.classList.add('reveal');
            }
        });

        // Mục suất chiếu tại rạp
        document.querySelectorAll('.cinema-showtimes').forEach((el, i) => {
            if (!el.classList.contains('reveal') && !el.classList.contains('revealed')) {
                el.classList.add('reveal');
                el.style.transitionDelay = `${i * 80}ms`;
            }
        });

        // Tóm tắt đặt vé
        document.querySelectorAll('.booking-summary').forEach(el => {
            if (!el.classList.contains('reveal-scale') && !el.classList.contains('revealed')) {
                el.classList.add('reveal-scale');
            }
        });

        // Thẻ vé
        document.querySelectorAll('.ticket-card').forEach((el, i) => {
            if (!el.classList.contains('reveal') && !el.classList.contains('revealed')) {
                el.classList.add('reveal');
                el.style.transitionDelay = `${i * 80}ms`;
            }
        });

        // Chân trang
        const footer = document.getElementById('footer');
        if (footer && !footer.classList.contains('reveal') && !footer.classList.contains('revealed')) {
            footer.classList.add('reveal');
        }

        // Khởi tạo lại observer cho các phần tử mới
        initScrollReveal();
    }

    /* ===== 2. HIỆU ỨNG SÓNG NƯỚC KHI CLICK (Ripple Effect) ===== */
    function initRipple() {
        if (prefersReducedMotion) return;

        document.addEventListener('pointerdown', (e) => {
            const target = e.target.closest('.btn, .btn-primary, .btn-ghost, .btn-outline, .showtime-btn, .date-item, .nav-link');
            if (!target) return;

            const rect = target.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
            target.style.position = target.style.position || 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);

            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    /* ===== 3. HIỆU ỨNG NGHIÊNG 3D THẺ PHIM (Movie Card 3D Tilt) ===== */
    function initCardTilt() {
        if (prefersReducedMotion || isMobile) return;

        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.movie-poster');
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const tiltX = (y - 0.5) * -8; // độ
            const tiltY = (x - 0.5) * 8;

            card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        });

        document.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.movie-poster');
            if (card) {
                card.style.transform = '';
            }
        }, true);
    }

    /* ===== 4. HIỆU ỨNG CUỘN SONG SONG (Parallax Hero) ===== */
    function initParallax() {
        if (prefersReducedMotion || isMobile) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const hero = document.querySelector('.hero');
                    if (hero) {
                        const scrolled = window.scrollY;
                        const rate = scrolled * 0.3;
                        hero.style.setProperty('--parallax-y', `${rate}px`);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ===== 5. NÚT BẤM "NAM CHÂM" (Magnetic Buttons) ===== */
    function initMagneticButtons() {
        if (prefersReducedMotion || isMobile) return;

        document.addEventListener('mousemove', (e) => {
            const btn = e.target.closest('.btn-primary, .btn-lg');
            if (!btn) return;

            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        document.addEventListener('mouseleave', (e) => {
            const btn = e.target.closest('.btn-primary, .btn-lg');
            if (btn) {
                btn.style.transform = '';
            }
        }, true);
    }

    /* ===== 6. HIỆU ỨNG CHUYỂN TRANG (Page Transitions) ===== */
    function initPageTransitions() {
        if (prefersReducedMotion) return;

        const app = document.getElementById('app');
        if (!app) return;

        // Theo dõi thay đổi nội dung trang
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.addedNodes.length > 0) {
                    app.classList.remove('page-enter');
                    void app.offsetWidth; // kích hoạt reflow
                    app.classList.add('page-enter');

                    // Áp dụng hiệu ứng hiện dần cho nội dung mới sau một frame
                    requestAnimationFrame(() => {
                        applyRevealToPage();
                    });
                    break;
                }
            }
        });

        observer.observe(app, { childList: true });
    }

    /* ===== 7. HIỆU ỨNG NAVBAR KHI CUỘN ===== */
    function initNavbarScroll() {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const navbar = document.getElementById('navbar');
                    if (navbar) {
                        navbar.classList.toggle('scrolled', window.scrollY > 20);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ===== 8. HIỆU ỨNG NẨY KHI CHỌN GHẾ (Seat Selection Bounce) ===== */
    function initSeatBounce() {
        if (prefersReducedMotion) return;

        document.addEventListener('click', (e) => {
            const seat = e.target.closest('.seat:not(.seat-booked):not(.seat-held)');
            if (!seat) return;

            seat.classList.add('seat-bounce');
            seat.addEventListener('animationend', () => {
                seat.classList.remove('seat-bounce');
            }, { once: true });
        });
    }

    /* ===== 9. BỘ ĐẾM SỐ MƯỢT MÀ (Smooth Number Counter) ===== */
    window.animateCounter = function(el, target, duration = 1200) {
        if (prefersReducedMotion) {
            el.textContent = target.toLocaleString('vi-VN');
            return;
        }
        let start = 0;
        const startTime = performance.now();
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            el.textContent = current.toLocaleString('vi-VN');
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    };

    /* ===== KHỞI TẠO ===== */
    function init() {
        initNavbarScroll();
        initRipple();
        initCardTilt();
        initParallax();
        initMagneticButtons();
        initPageTransitions();
        initSeatBounce();

        // Hiển thị nội dung ban đầu
        requestAnimationFrame(() => {
            applyRevealToPage();
        });
    }

    // Chạy khi DOM đã sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Xuất hàm để kích hoạt lại thủ công sau khi tải nội dung AJAX
    window.refreshAnimations = applyRevealToPage;

})();
