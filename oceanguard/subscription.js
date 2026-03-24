/**
 * subscription.js — OceanGuard Pricing Page
 * ─────────────────────────────────────────────────────────────
 * Modules:
 *  1. BillingToggle  — Monthly / Annual switch with price update
 *  2. FAQAccordion   — Accessible keyboard + click accordion
 *  3. ScrollReveal   — IntersectionObserver-based reveal/stagger
 *  4. NavbarScroll   — Sticky navbar scroll effect
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   MODULE 1 — BILLING TOGGLE
   Switches all .amount spans between monthly and annual prices.
   Annual = 20% discount (pre-computed in data attributes).
═══════════════════════════════════════════════════════════════ */
const BillingToggle = (() => {

    /* State */
    let isAnnual = false;

    /* DOM refs */
    const track       = document.getElementById('toggleTrack');
    const optMonthly  = document.getElementById('toggleMonthly');
    const optAnnual   = document.getElementById('toggleAnnual');
    const allAmounts  = document.querySelectorAll('.amount[data-monthly]');

    /**
     * Apply the current cycle to all price elements.
     * @param {boolean} annual
     */
    function applyPrices(annual) {
        allAmounts.forEach((el) => {
            el.textContent = annual
                ? el.dataset.annual
                : el.dataset.monthly;
        });
    }

    /**
     * Update all visual states.
     * @param {boolean} annual
     */
    function updateUI(annual) {
        isAnnual = annual;

        /* Track & thumb */
        track.classList.toggle('on', annual);
        track.setAttribute('aria-checked', String(annual));

        /* Option labels */
        optMonthly.classList.toggle('active', !annual);
        optAnnual.classList.toggle('active', annual);

        /* Prices */
        applyPrices(annual);

        /* Body class so CSS can show/hide annual notes */
        document.body.classList.toggle('annual', annual);
    }

    /* ── Event: track click ── */
    track.addEventListener('click', () => updateUI(!isAnnual));

    /* ── Event: track keyboard ── */
    track.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            updateUI(!isAnnual);
        }
    });

    /* ── Event: option buttons ── */
    optMonthly.addEventListener('click', () => updateUI(false));
    optAnnual.addEventListener('click',  () => updateUI(true));

    /* Init */
    updateUI(false);

    return { isAnnual: () => isAnnual };

})();


/* ═══════════════════════════════════════════════════════════════
   MODULE 2 — FAQ ACCORDION
   Fully accessible: aria-expanded, aria-controls, keyboard nav.
═══════════════════════════════════════════════════════════════ */
const FAQAccordion = (() => {

    const faqList  = document.getElementById('faqList');
    if (!faqList) return;

    const items    = faqList.querySelectorAll('.faq-item');
    const questions = faqList.querySelectorAll('.faq-question');

    /**
     * Open a specific FAQ item.
     * @param {Element} item
     * @param {Element} btn
     * @param {Element} answer
     */
    function openItem(item, btn, answer) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
        /* Animate: set max-height after removing hidden so CSS transition fires */
        requestAnimationFrame(() => answer.classList.add('expanded'));
    }

    /**
     * Close a specific FAQ item.
     * @param {Element} item
     * @param {Element} btn
     * @param {Element} answer
     */
    function closeItem(item, btn, answer) {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        answer.classList.remove('expanded');

        /* Re-add hidden after transition completes */
        const onEnd = () => {
            if (!item.classList.contains('open')) {
                answer.setAttribute('hidden', '');
            }
            answer.removeEventListener('transitionend', onEnd);
        };
        answer.addEventListener('transitionend', onEnd);
    }

    /**
     * Toggle a FAQ item.
     * @param {Element} item
     */
    function toggle(item) {
        const btn    = item.querySelector('.faq-question');
        const answerId = btn.getAttribute('aria-controls');
        const answer = document.getElementById(answerId);
        const isOpen = item.classList.contains('open');

        /* Close all others (only one open at a time) */
        items.forEach((otherItem) => {
            if (otherItem !== item && otherItem.classList.contains('open')) {
                const otherBtn    = otherItem.querySelector('.faq-question');
                const otherAnsId  = otherBtn.getAttribute('aria-controls');
                const otherAnswer = document.getElementById(otherAnsId);
                closeItem(otherItem, otherBtn, otherAnswer);
            }
        });

        /* Toggle clicked item */
        if (isOpen) {
            closeItem(item, btn, answer);
        } else {
            openItem(item, btn, answer);
        }
    }

    /* ── Click events ── */
    questions.forEach((btn) => {
        btn.addEventListener('click', () => {
            toggle(btn.closest('.faq-item'));
        });
    });

    /* ── Keyboard navigation: Arrow keys move between questions ── */
    questions.forEach((btn, idx) => {
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = questions[idx + 1];
                if (next) next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = questions[idx - 1];
                if (prev) prev.focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                questions[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                questions[questions.length - 1].focus();
            }
        });
    });

    /* Open first item by default for better UX */
    if (items.length) {
        const firstBtn    = items[0].querySelector('.faq-question');
        const firstAnsId  = firstBtn.getAttribute('aria-controls');
        const firstAnswer = document.getElementById(firstAnsId);
        openItem(items[0], firstBtn, firstAnswer);
    }

})();


/* ═══════════════════════════════════════════════════════════════
   MODULE 3 — SCROLL REVEAL
   Observes .reveal and .stagger elements and adds .visible.
═══════════════════════════════════════════════════════════════ */
const ScrollReveal = (() => {

    const targets = document.querySelectorAll('.reveal, .stagger');

    if (!targets.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((el) => observer.observe(el));

})();


/* ═══════════════════════════════════════════════════════════════
   MODULE 4 — NAVBAR SCROLL EFFECT
   Adds .scrolled class after 60px of scroll.
═══════════════════════════════════════════════════════════════ */
const NavbarScroll = (() => {

    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastY = 0;
    let ticking = false;

    function update() {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 60);
        lastY = y;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    /* Run once on load */
    update();

})();


/* ═══════════════════════════════════════════════════════════════
   MODULE 5 — SMOOTH ACTIVE NAV LINK HIGHLIGHTING
   Highlights nav link for the section currently in viewport.
═══════════════════════════════════════════════════════════════ */
const ActiveNavLinks = (() => {

    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = document.querySelectorAll('section[id], div[id]');

    if (!navLinks.length) return;

    function update() {
        let current = '';
        sections.forEach((sec) => {
            if (window.scrollY >= sec.offsetTop - 140) {
                current = sec.id;
            }
        });

        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${current}`;
            link.style.color = isActive ? 'var(--teal)' : '';
            link.style.background = isActive ? 'rgba(0,200,220,0.08)' : '';
        });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

})();


/* ═══════════════════════════════════════════════════════════════
   MODULE 6 — ANIMATED NUMBER COUNTERS (Hero Stats)
   Counts up from 0 on first scroll into view.
═══════════════════════════════════════════════════════════════ */
const CounterAnimation = (() => {

    const statNums = document.querySelectorAll('.stat-num');
    if (!statNums.length) return;

    function animateValue(el, raw, duration = 1400) {
        /* Extract numeric portion */
        const numMatch = raw.match(/[\d,]+/);
        if (!numMatch) return; /* Skip non-numeric like "18 States" */

        const numStr = numMatch[0].replace(/,/g, '');
        const target = parseFloat(numStr);
        const prefix = raw.slice(0, raw.indexOf(numMatch[0]));
        const suffix = raw.slice(raw.indexOf(numMatch[0]) + numMatch[0].length);

        const start     = performance.now();
        const hasDecimal = numStr.includes('.');

        const step = (now) => {
            const elapsed = Math.min(now - start, duration);
            const ease    = 1 - Math.pow(1 - elapsed / duration, 3);
            const current = ease * target;

            const formatted = hasDecimal
                ? current.toFixed(1)
                : Math.round(current).toLocaleString('en-IN');

            el.textContent = prefix + formatted + suffix;

            if (elapsed < duration) requestAnimationFrame(step);
            else el.textContent = raw; /* Restore original exact string */
        };

        requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el  = entry.target;
                    const raw = el.textContent;
                    animateValue(el, raw);
                    observer.unobserve(el);
                }
            });
        },
        { threshold: 0.5 }
    );

    statNums.forEach((el) => observer.observe(el));

})();