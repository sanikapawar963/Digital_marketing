/**
 * NexaStudio – Creative JavaScript Engine
 * script.js · v2.0
 *
 * Features:
 *  1. Custom magnetic cursor
 *  2. Particle canvas (hero background)
 *  3. Typewriter effect (hero)
 *  4. Navbar: scroll + active-section + mobile toggle
 *  5. Scroll-reveal via IntersectionObserver
 *  6. 3D card tilt effect (services)
 *  7. Animated counter (about stats)
 *  8. Project filter
 *  9. Magnetic button effect
 * 10. Back-to-top
 * 11. Contact form with floating-label validation
 *     (POST /api/contact — Node.js/Express ready)
 */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Wait for DOM ── */
document.addEventListener('DOMContentLoaded', init);

function init() {
  initCursor();
  initParticles();
  initTypewriter();
  initNavbar();
  initScrollReveal();
  initTilt();
  initCounters();
  initFilter();
  initMagnetic();
  initBackToTop();
  initContactForm();
}

/* ============================================================
   1. CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  /* Skip on touch devices */
  if ('ontouchstart' in window) return;

  const cursor    = qs('#cursor');
  const cursorDot = qs('#cursorDot');
  if (!cursor || !cursorDot) return;

  let mx = 0, my = 0; /* mouse */
  let cx = 0, cy = 0; /* cursor (smooth) */

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursorDot.style.left = mx + 'px';
    cursorDot.style.top  = my + 'px';
  });

  /* Smooth follow loop for outer ring */
  function loop() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  /* Hover states */
  const hoverEls = 'a, button, .svc-card, .proj-card, .testi-card, .stat-card, .badge, .pf-btn, .btt, .soc-btn';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });
}

/* ============================================================
   2. PARTICLE CANVAS
   ============================================================ */
function initParticles() {
  const canvas = qs('#particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = Math.min(window.innerWidth < 768 ? 40 : 80, 100);

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.5 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.alpha = 0;
      this.maxAlpha = Math.random() * 0.5 + 0.1;
      this.life = 0;
      this.maxLife = Math.random() * 200 + 100;
      /* colour: violet or pink */
      this.hue = Math.random() > 0.5 ? '260,39%,65%' : '330,85%,65%';
    }
    update() {
      this.life++;
      const t = this.life / this.maxLife;
      this.alpha = t < 0.2 ? t / 0.2 * this.maxAlpha
                 : t > 0.8 ? (1 - (t - 0.8) / 0.2) * this.maxAlpha
                 : this.maxAlpha;
      this.x += this.vx; this.y += this.vy;
      if (this.life >= this.maxLife) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue},${this.alpha})`;
      ctx.fill();
    }
  }

  function setup() {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });

    /* Draw faint connections */
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = (1 - dist / 100) * 0.08;
          ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  setup();
  frame();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 200);
  });
}

/* ============================================================
   3. TYPEWRITER EFFECT
   ============================================================ */
function initTypewriter() {
  const el = qs('#typewriter');
  if (!el) return;

  const words  = ['Immersive', 'Stunning', 'Powerful', 'Beautiful', 'Unforgettable'];
  let wIdx = 0, cIdx = 0, deleting = false;
  const SPEED_TYPE = 90, SPEED_DEL = 45, PAUSE = 1800;

  function type() {
    const word  = words[wIdx];
    const shown = deleting ? word.slice(0, cIdx--) : word.slice(0, cIdx++);
    el.textContent = shown;

    let delay = deleting ? SPEED_DEL : SPEED_TYPE;

    if (!deleting && cIdx > word.length) {
      deleting = true;
      delay = PAUSE;
    } else if (deleting && cIdx < 0) {
      deleting = false;
      wIdx = (wIdx + 1) % words.length;
      cIdx = 0;
      delay = 400;
    }
    setTimeout(type, delay);
  }
  type();
}

/* ============================================================
   4. NAVBAR
   ============================================================ */
function initNavbar() {
  const navbar   = qs('#navbar');
  const toggle   = qs('#navToggle');
  const navLinks = qs('#navLinks');
  const links    = qsa('.nav-link');

  /* Scroll → .scrolled */
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile toggle */
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  links.forEach(l => l.addEventListener('click', () => {
    toggle.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  /* Active section via IntersectionObserver */
  const sections = qsa('section[id]');
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    });
  }, { threshold: 0.35, rootMargin: `-${navH}px 0px 0px 0px` });

  sections.forEach(s => io.observe(s));

  /* Smooth scroll with nav offset */
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = qs(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   5. SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  qsa('.reveal').forEach(el => io.observe(el));
}

/* ============================================================
   6. 3D CARD TILT EFFECT
   ============================================================ */
function initTilt() {
  if (window.innerWidth < 768) return; /* skip on mobile */

  qsa('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)';
    });
  });
}

/* ============================================================
   7. ANIMATED COUNTERS
   ============================================================ */
function initCounters() {
  const nums = qsa('.stat-num[data-count]');
  if (!nums.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1800;
      const start = performance.now();

      function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

      function tick(now) {
        const t   = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor(easeOut(t) * end);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = end;
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => io.observe(n));
}

/* ============================================================
   8. PROJECT FILTER
   ============================================================ */
function initFilter() {
  const btns  = qsa('.pf-btn');
  const cards = qsa('.proj-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.classList.remove('hidden');
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
        } else {
          card.style.opacity    = '0';
          card.style.transform  = 'scale(0.95)';
          setTimeout(() => { if (!card.matches(`[data-category="${filter}"]`) && filter !== 'all') card.classList.add('hidden'); }, 300);
        }
      });
    });
  });

  cards.forEach(c => { c.style.transition = 'opacity .3s ease, transform .3s ease'; });
}

/* ============================================================
   9. MAGNETIC BUTTON EFFECT
   ============================================================ */
function initMagnetic() {
  if (window.innerWidth < 768 || 'ontouchstart' in window) return;

  qsa('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width  / 2) * 0.3;
      const y = (e.clientY - rect.top  - rect.height / 2) * 0.3;
      el.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

/* ============================================================
   10. BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = qs('#backToTop');
  if (!btn) return;
  const onScroll = () => btn.classList.toggle('visible', window.scrollY > 400);
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   11. CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form    = qs('#contactForm');
  const submitBtn  = qs('#submitBtn');
  const successEl  = qs('#formSuccess');
  if (!form) return;

  const rules = {
    firstName: { label: 'First name', minLen: 2 },
    lastName:  { label: 'Last name',  minLen: 2 },
    email:     { label: 'Email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    message:   { label: 'Message',    minLen: 10 },
  };

  function validate(name, value) {
    const r = rules[name];
    if (!r) return null;
    if (!value.trim()) return `${r.label} is required.`;
    if (r.minLen && value.trim().length < r.minLen)
      return `${r.label} must be at least ${r.minLen} characters.`;
    if (r.pattern && !r.pattern.test(value.trim()))
      return `Please enter a valid ${r.label.toLowerCase()}.`;
    return null;
  }

  function showErr(field, msg) {
    const input = qs(`#${field}`);
    const errEl = qs(`#${field}Error`);
    if (input) input.classList.toggle('input-error', !!msg);
    if (errEl) errEl.textContent = msg || '';
  }

  Object.keys(rules).forEach(field => {
    const input = qs(`#${field}`);
    if (!input) return;
    input.addEventListener('blur',  () => showErr(field, validate(field, input.value)));
    input.addEventListener('input', () => { if (input.classList.contains('input-error')) showErr(field, validate(field, input.value)); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    Object.keys(rules).forEach(f => {
      const input = qs(`#${f}`);
      const err = validate(f, input?.value || '');
      showErr(f, err);
      if (err) valid = false;
    });
    if (!valid) return;

    submitBtn.disabled = true;
    const btnText = qs('.btn-text', submitBtn);
    const origText = btnText.textContent;
    btnText.textContent = 'Sending…';

    const payload = {
      firstName: qs('#firstName').value.trim(),
      lastName:  qs('#lastName').value.trim(),
      email:     qs('#email').value.trim(),
      service:   qs('#service').value,
      message:   qs('#message').value.trim(),
    };

    try {
      /**
       * ── NODE.JS / EXPRESS INTEGRATION ──────────────────────────────
       * Uncomment below and set up your Express route:
       *
       *   app.post('/api/contact', express.json(), (req, res) => {
       *     const { firstName, lastName, email, service, message } = req.body;
       *     // sendEmail(...) or save to DB
       *     res.json({ ok: true });
       *   });
       *
       * const res = await fetch('/api/contact', {
       *   method: 'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body: JSON.stringify(payload),
       * });
       * const data = await res.json();
       * if (!data.ok) throw new Error(data.error || 'Server error');
       * ───────────────────────────────────────────────────────────────
       */

      /* Demo delay – remove when wired to real backend */
      await new Promise(r => setTimeout(r, 1400));
      console.log('[NexaStudio] Form payload ready:', payload);

      successEl.hidden = false;
      form.reset();
      Object.keys(rules).forEach(f => showErr(f, null));
      setTimeout(() => { successEl.hidden = true; }, 7000);

    } catch (err) {
      console.error(err);
      alert('Something went wrong — please email us directly at hello@nexastudio.com');
    } finally {
      submitBtn.disabled     = false;
      btnText.textContent    = origText;
    }
  });
}
