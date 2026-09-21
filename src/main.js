import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroScene } from './scenes/heroScene.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * ARAVALLI RETREAT — EDITORIAL SCRIPT ENGINE
 * --------------------------------------------------------------------------
 */

const appState = {
  lenis: null,
  heroScene: null,
};

// 1. Initial Page Loader (Minimal cream screen lift under 2 seconds)
function setupLoader() {
  const loader = document.getElementById('app-loader');
  if (!loader) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = prefersReduced ? 100 : 1200;

  setTimeout(() => {
    loader.classList.add('loaded');
  }, delay);
}

// 2. Lenis Smooth Scrolling
function initSmoothScroll() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  appState.lenis = lenis;
  return lenis;
}

// 3. Three.js Hero Scene & Parallax
function setupHero() {
  const container = document.getElementById('hero-webgl-container');
  if (container) {
    appState.heroScene = new HeroScene(container);
  }

  // Gentle mouse parallax on hero photo (desktop only)
  const heroPhoto = document.querySelector('.hero-photo');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroPhoto && !prefersReduced && window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      const xNorm = (e.clientX / window.innerWidth - 0.5) * 12;
      const yNorm = (e.clientY / window.innerHeight - 0.5) * 12;
      gsap.to(heroPhoto, {
        x: xNorm,
        y: yNorm,
        duration: 1.4,
        ease: 'power3.out'
      });
    }, { passive: true });
  }
}

// 4. Navbar Scroll & Mobile Navigation
function setupNavbar() {
  const navbar = document.querySelector('.editorial-navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  // Solid cream state after scrolling past 60px
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => {
      navbar?.classList.toggle('scrolled', self.progress > 0);
    }
  });

  // Section ScrollSpy for Nav Links
  const sections = ['stay', 'dining', 'experiences', 'gallery', 'location'];
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 45%',
      end: 'bottom 45%',
      onEnter: () => setActiveNav(id),
      onEnterBack: () => setActiveNav(id)
    });
  });

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === `#${id}`);
    });
  }

  // Mobile Drawer Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobile-menu-drawer');
  const mobileBackdrop = document.getElementById('mobile-menu-backdrop');
  const mobileClose = document.getElementById('mobile-menu-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-enquire-btn');

  function openMobileMenu() {
    mobileDrawer?.classList.add('open');
    mobileBackdrop?.classList.add('open');
    mobileDrawer?.setAttribute('aria-hidden', 'false');
    mobileToggle?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-locked');
    if (appState.lenis) appState.lenis.stop();
  }

  function closeMobileMenu() {
    mobileDrawer?.classList.remove('open');
    mobileBackdrop?.classList.remove('open');
    mobileDrawer?.setAttribute('aria-hidden', 'true');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-locked');
    if (appState.lenis) appState.lenis.start();
  }

  mobileToggle?.addEventListener('click', openMobileMenu);
  mobileClose?.addEventListener('click', closeMobileMenu);
  mobileBackdrop?.addEventListener('click', closeMobileMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMobileMenu));
}

// 5. GSAP ScrollTrigger Reveals (Slow, 1.2s power3.out, 24px rise + fade)
function setupScrollAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Reveal Section Headers & Headings
  const revealElements = document.querySelectorAll('.section-heading, .section-lead, .intro-body-paragraphs, .wildlife-disclaimer-box, .location-subhead');
  revealElements.forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      },
      y: 24,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
  });

  // Reveal Suite Rows
  const suiteRows = document.querySelectorAll('.suite-row');
  suiteRows.forEach((row) => {
    gsap.from(row, {
      scrollTrigger: {
        trigger: row,
        start: 'top 80%',
        once: true
      },
      y: 28,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
  });

  // Reveal Experience Items & Dining Cards
  const cards = document.querySelectorAll('.exp-item, .dining-card, .gallery-tile');
  cards.forEach((card) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true
      },
      y: 24,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
  });
}

// 6. Enquiry Form & Suite Pre-fill
function setupEnquiryForm() {
  const form = document.getElementById('enquiry-form');
  const successBox = document.getElementById('enquiry-success');
  const resetBtn = document.getElementById('reset-enquiry-btn');
  const checkinInput = document.getElementById('enquiry-checkin');
  const checkoutInput = document.getElementById('enquiry-checkout');
  const suiteSelect = document.getElementById('enquiry-suite');
  const nameInput = document.getElementById('enquiry-name');
  const emailInput = document.getElementById('enquiry-email');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const datesError = document.getElementById('dates-error');

  // Set default check-in tomorrow, check-out in 3 days
  if (checkinInput && checkoutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date(tomorrow);
    threeDays.setDate(threeDays.getDate() + 3);

    checkinInput.value = tomorrow.toISOString().split('T')[0];
    checkinInput.min = today.toISOString().split('T')[0];
    checkoutInput.value = threeDays.toISOString().split('T')[0];
    checkoutInput.min = tomorrow.toISOString().split('T')[0];

    checkinInput.addEventListener('change', () => {
      if (checkinInput.value) {
        const nextDay = new Date(checkinInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutInput.min = nextDay.toISOString().split('T')[0];
        if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
          checkoutInput.value = nextDay.toISOString().split('T')[0];
        }
      }
    });
  }

  // Suite "Enquire for this suite" buttons pre-fill selection and scroll
  document.querySelectorAll('.suite-enquire-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const suiteName = btn.getAttribute('data-suite');
      if (suiteSelect && suiteName) {
        suiteSelect.value = suiteName;
      }
    });
  });

  // Form Submit Handler
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Name validation
    if (!nameInput?.value.trim()) {
      nameError?.classList.add('visible');
      valid = false;
    } else {
      nameError?.classList.remove('visible');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput?.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      emailError?.classList.add('visible');
      valid = false;
    } else {
      emailError?.classList.remove('visible');
    }

    // Dates validation
    if (!checkinInput?.value || !checkoutInput?.value || new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
      datesError?.classList.add('visible');
      valid = false;
    } else {
      datesError?.classList.remove('visible');
    }

    if (!valid) return;

    // Show Demo Confirmation
    const randomRef = Math.floor(1000 + Math.random() * 9000);
    const summaryRef = document.getElementById('summary-ref');
    const summarySuite = document.getElementById('summary-suite');
    const summaryDates = document.getElementById('summary-dates');

    if (summaryRef) summaryRef.textContent = `#ARV-SAMPLE-${randomRef}`;
    if (summarySuite) summarySuite.textContent = suiteSelect?.value || 'Aravalli Forest Suite';
    if (summaryDates) summaryDates.textContent = `${checkinInput?.value} to ${checkoutInput?.value}`;

    form.style.display = 'none';
    if (successBox) successBox.style.display = 'block';
  });

  resetBtn?.addEventListener('click', () => {
    form.reset();
    if (checkinInput && checkoutInput) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const threeDays = new Date(tomorrow);
      threeDays.setDate(threeDays.getDate() + 3);
      checkinInput.value = tomorrow.toISOString().split('T')[0];
      checkoutInput.value = threeDays.toISOString().split('T')[0];
    }
    if (successBox) successBox.style.display = 'none';
    if (form) form.style.display = 'flex';
  });
}

// 7. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupLoader();
  initSmoothScroll();
  setupHero();
  setupNavbar();
  setupScrollAnimations();
  setupEnquiryForm();
});
