import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroScene } from './scenes/heroScene.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * ARAVALLI RETREAT - EDITORIAL INTERACTION ENGINE
 * --------------------------------------------------------------------------
 */

// Application State
const appState = {
  heroScene: null,
  activeLenis: null,
  galleryIndex: 0,
  galleryImages: [
    { src: '/images/gallery-pool.jpg', caption: 'Stepwell swimming pool shaded by native trees (Sample image)' },
    { src: '/images/gallery-room.jpg', caption: 'Suite interior with linen and wooden louvers (Sample image)' },
    { src: '/images/gallery-firepit.jpg', caption: 'Open fire pit under starlight (Sample image)' },
    { src: '/images/gallery-hills.jpg', caption: 'Aravalli ridges and granite boulder scenery (Sample image)' }
  ],
  mapPoints: {
    retreat: {
      title: 'Aravalli Retreat (Center)',
      text: 'Secluded valley setting in the Pali district. Elevation ~520 m MSL (Sample). Surrounding acacia forests and granite hills.'
    },
    ranakpur: {
      title: 'Ranakpur Temples',
      text: '15th-century temple complex with 1,444 sculptured columns. ~18 km, 25 minutes drive (Sample).'
    },
    jawai: {
      title: 'Jawai Leopards',
      text: 'Granite hills where leopards roam alongside Rabari pastoral settlements. ~24 km, 35 minutes drive (Sample).'
    },
    dam: {
      title: 'Jawai Dam Wetlands',
      text: 'Expansive water reservoir hosting flamingos, cranes, and migratory water birds. ~28 km, 40 minutes drive (Sample).'
    },
    udaipur: {
      title: 'Udaipur Airport Gateway (UDR)',
      text: 'Primary regional airport connected via scenic mountain highway. ~110 km, 2.5 hours drive (Sample).'
    }
  }
};

// 1. Initialize Lenis Smooth Scrolling
function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;

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

  appState.activeLenis = lenis;
  return lenis;
}

// 2. Setup Hero Three.js & Parallax
function setupHero() {
  const container = document.getElementById('hero-webgl-container');
  if (container) {
    appState.heroScene = new HeroScene(container);
  }

  // Subtle photo parallax on mouse move
  const heroPhoto = document.querySelector('.hero-base-photo');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroPhoto && !prefersReducedMotion && window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      const xNorm = (e.clientX / window.innerWidth - 0.5) * 15;
      const yNorm = (e.clientY / window.innerHeight - 0.5) * 15;
      gsap.to(heroPhoto, {
        x: xNorm,
        y: yNorm,
        duration: 1.4,
        ease: 'power3.out'
      });
    }, { passive: true });
  }

  // Initialize Hero Booking Dates
  const checkinInput = document.getElementById('hero-checkin');
  const checkoutInput = document.getElementById('hero-checkout');

  if (checkinInput && checkoutInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 3);

    checkinInput.value = tomorrow.toISOString().split('T')[0];
    checkinInput.min = today.toISOString().split('T')[0];

    checkoutInput.value = dayAfter.toISOString().split('T')[0];
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

  // Hero Booking Form Submit
  const bookingForm = document.getElementById('hero-booking-form');
  const bookingError = document.getElementById('hero-booking-error');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const checkin = checkinInput?.value;
      const checkout = checkoutInput?.value;
      const guests = document.getElementById('hero-guests')?.value || '2 Guests';
      const suite = document.getElementById('hero-suite')?.value || 'Aravalli Forest Suite';

      if (!checkin || !checkout) {
        if (bookingError) {
          bookingError.textContent = 'Please select both check-in and check-out dates.';
          bookingError.style.display = 'inline-block';
        }
        return;
      }

      if (new Date(checkout) <= new Date(checkin)) {
        if (bookingError) {
          bookingError.textContent = 'Check-out date must be after check-in date.';
          bookingError.style.display = 'inline-block';
        }
        return;
      }

      if (bookingError) {
        bookingError.style.display = 'none';
      }

      // Sync with enquiry modal and open it
      openEnquiryModal({
        checkin,
        checkout,
        guests,
        suite
      });
    });
  }
}

// 3. Setup Navigation & Audio
function setupNavbar() {
  const navbar = document.querySelector('.editorial-navbar');
  const navLinks = document.querySelectorAll('.nav-item-link');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  // Sticky Navbar class on scroll
  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: (self) => {
      navbar?.classList.toggle('scrolled', self.progress > 0);
    }
  });

  // Back to top button
  ScrollTrigger.create({
    start: 'top -400',
    onUpdate: (self) => {
      backToTopBtn?.classList.toggle('visible', self.progress > 0);
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (appState.activeLenis) {
        appState.activeLenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ScrollSpy for Nav Links
  const sections = ['story', 'suites', 'timeline', 'dining', 'experiences', 'gallery', 'location'];
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


  // Mobile Menu Drawer Toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
  const mobileClose = document.getElementById('mobile-drawer-close-btn');
  const mobileLinks = document.querySelectorAll('.mobile-drawer-link');

  function openMobileMenu() {
    mobileDrawer?.classList.add('open');
    mobileBackdrop?.classList.add('open');
    document.body.classList.add('modal-open');
    if (appState.activeLenis) appState.activeLenis.stop();
  }

  function closeMobileMenu() {
    mobileDrawer?.classList.remove('open');
    mobileBackdrop?.classList.remove('open');
    document.body.classList.remove('modal-open');
    if (appState.activeLenis) appState.activeLenis.start();
  }

  mobileToggle?.addEventListener('click', openMobileMenu);
  mobileClose?.addEventListener('click', closeMobileMenu);
  mobileBackdrop?.addEventListener('click', closeMobileMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMobileMenu));
}

// 4. Modal Scroll Locking Helper
function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  if (appState.activeLenis) appState.activeLenis.stop();
  if (appState.heroScene) appState.heroScene.pause();
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (appState.activeLenis) appState.activeLenis.start();
  if (appState.heroScene) appState.heroScene.resume();
}

// 5. Setup Gallery Lightbox
function setupGallery() {
  const modal = document.getElementById('gallery-lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const counterEl = document.getElementById('lightbox-counter');
  const galleryItems = document.querySelectorAll('.gallery-item');

  function showImage(idx) {
    if (idx < 0) idx = appState.galleryImages.length - 1;
    if (idx >= appState.galleryImages.length) idx = 0;
    appState.galleryIndex = idx;

    const item = appState.galleryImages[idx];
    if (imgEl) {
      imgEl.src = item.src;
      imgEl.alt = item.caption;
    }
    if (captionEl) captionEl.textContent = item.caption;
    if (counterEl) counterEl.textContent = `${idx + 1} / ${appState.galleryImages.length}`;
  }

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-index') || '0', 10);
      showImage(idx);
      openModal(modal);
    });
  });

  prevBtn?.addEventListener('click', () => showImage(appState.galleryIndex - 1));
  nextBtn?.addEventListener('click', () => showImage(appState.galleryIndex + 1));
  closeBtn?.addEventListener('click', () => closeModal(modal));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
}

// 6. Setup Location Waypoints
function setupLocation() {
  const chips = document.querySelectorAll('.map-chip');
  const pins = document.querySelectorAll('.map-marker-pin');
  const detailTitle = document.getElementById('map-detail-title');
  const detailText = document.getElementById('map-detail-text');

  function setActivePoint(pointId) {
    const point = appState.mapPoints[pointId];
    if (!point) return;

    chips.forEach((c) => c.classList.toggle('active', c.getAttribute('data-point') === pointId));
    pins.forEach((p) => p.classList.toggle('active', p.getAttribute('data-point') === pointId));

    if (detailTitle) detailTitle.textContent = point.title;
    if (detailText) detailText.textContent = point.text;
  }

  chips.forEach((c) => {
    c.addEventListener('click', () => setActivePoint(c.getAttribute('data-point')));
  });

  pins.forEach((p) => {
    p.addEventListener('click', () => setActivePoint(p.getAttribute('data-point')));
  });
}

// 7. Setup Enquiry Modals & Forms
function openEnquiryModal(params = {}) {
  const modal = document.getElementById('enquiry-modal');
  const formView = document.getElementById('enquiry-form-view');
  const successView = document.getElementById('enquiry-success-view');

  if (formView) formView.style.display = 'block';
  if (successView) successView.style.display = 'none';

  const checkinInput = document.getElementById('modal-checkin');
  const checkoutInput = document.getElementById('modal-checkout');
  const suiteSelect = document.getElementById('modal-suite');
  const guestsSelect = document.getElementById('modal-guests');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 3);

  if (checkinInput) {
    checkinInput.value = params.checkin || tomorrow.toISOString().split('T')[0];
    checkinInput.min = today.toISOString().split('T')[0];
  }
  if (checkoutInput) {
    checkoutInput.value = params.checkout || dayAfter.toISOString().split('T')[0];
    checkoutInput.min = tomorrow.toISOString().split('T')[0];
  }
  if (suiteSelect && params.suite) {
    suiteSelect.value = params.suite;
  }
  if (guestsSelect && params.guests) {
    guestsSelect.value = params.guests.toString().replace(' Guests', '').replace(' Guest', '');
  }

  openModal(modal);
}

function setupEnquiryForms() {
  // Modal triggers
  document.querySelectorAll('.open-enquiry-modal-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const suite = btn.getAttribute('data-suite') || undefined;
      openEnquiryModal({ suite });
    });
  });

  // Setup Popup Modal Form
  const modal = document.getElementById('enquiry-modal');
  const closeBtn = document.getElementById('enquiry-modal-close');
  const successCloseBtn = document.getElementById('success-close-btn');
  const modalForm = document.getElementById('enquiry-form');
  const modalFormView = document.getElementById('enquiry-form-view');
  const modalSuccessView = document.getElementById('enquiry-success-view');

  closeBtn?.addEventListener('click', () => closeModal(modal));
  successCloseBtn?.addEventListener('click', () => closeModal(modal));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  modalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('guest-name');
    const emailInput = document.getElementById('guest-email');
    const checkinInput = document.getElementById('modal-checkin');
    const checkoutInput = document.getElementById('modal-checkout');
    const suiteSelect = document.getElementById('modal-suite');
    const guestsSelect = document.getElementById('modal-guests');

    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const datesError = document.getElementById('dates-error');

    let valid = true;
    if (!nameInput?.value.trim()) {
      if (nameError) { nameError.textContent = 'Please enter your full name.'; nameError.classList.add('visible'); }
      valid = false;
    } else if (nameError) { nameError.classList.remove('visible'); }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput?.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      if (emailError) { emailError.textContent = 'Please enter a valid email address.'; emailError.classList.add('visible'); }
      valid = false;
    } else if (emailError) { emailError.classList.remove('visible'); }

    if (!checkinInput?.value || !checkoutInput?.value) {
      if (datesError) { datesError.textContent = 'Please select both check-in and check-out dates.'; datesError.classList.add('visible'); }
      valid = false;
    } else if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
      if (datesError) { datesError.textContent = 'Check-out date must be after check-in date.'; datesError.classList.add('visible'); }
      valid = false;
    } else if (datesError) { datesError.classList.remove('visible'); }

    if (!valid) return;

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('receipt-ref').textContent = `#ARV-DEMO-${randomCode}`;
    document.getElementById('receipt-suite').textContent = suiteSelect?.value || 'Aravalli Forest Suite';
    document.getElementById('receipt-guests').textContent = `${guestsSelect?.value} ${guestsSelect?.value === '1' ? 'Guest' : 'Guests'}`;
    document.getElementById('receipt-dates').textContent = `${checkinInput?.value} to ${checkoutInput?.value}`;

    if (modalFormView) modalFormView.style.display = 'none';
    if (modalSuccessView) modalSuccessView.style.display = 'block';
  });

  // Setup Inline Section Form
  const inlineForm = document.getElementById('inline-enquiry-form');
  const inlineSuccessBox = document.getElementById('inline-success-box');
  const inlineCheckin = document.getElementById('inline-checkin');
  const inlineCheckout = document.getElementById('inline-checkout');

  if (inlineCheckin && inlineCheckout) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 3);

    inlineCheckin.value = tomorrow.toISOString().split('T')[0];
    inlineCheckin.min = today.toISOString().split('T')[0];
    inlineCheckout.value = dayAfter.toISOString().split('T')[0];
    inlineCheckout.min = tomorrow.toISOString().split('T')[0];

    inlineCheckin.addEventListener('change', () => {
      if (inlineCheckin.value) {
        const nextDay = new Date(inlineCheckin.value);
        nextDay.setDate(nextDay.getDate() + 1);
        inlineCheckout.min = nextDay.toISOString().split('T')[0];
        if (new Date(inlineCheckout.value) <= new Date(inlineCheckin.value)) {
          inlineCheckout.value = nextDay.toISOString().split('T')[0];
        }
      }
    });
  }

  inlineForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('inline-name');
    const emailInput = document.getElementById('inline-email');
    const suiteSelect = document.getElementById('inline-suite');
    const guestsSelect = document.getElementById('inline-guests');

    const nameError = document.getElementById('inline-name-error');
    const emailError = document.getElementById('inline-email-error');
    const datesError = document.getElementById('inline-dates-error');

    let valid = true;
    if (!nameInput?.value.trim()) {
      if (nameError) { nameError.textContent = 'Please enter your full name.'; nameError.classList.add('visible'); }
      valid = false;
    } else if (nameError) { nameError.classList.remove('visible'); }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput?.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      if (emailError) { emailError.textContent = 'Please enter a valid email address.'; emailError.classList.add('visible'); }
      valid = false;
    } else if (emailError) { emailError.classList.remove('visible'); }

    if (!inlineCheckin?.value || !inlineCheckout?.value) {
      if (datesError) { datesError.textContent = 'Please select both check-in and check-out dates.'; datesError.classList.add('visible'); }
      valid = false;
    } else if (new Date(inlineCheckout.value) <= new Date(inlineCheckin.value)) {
      if (datesError) { datesError.textContent = 'Check-out date must be after check-in date.'; datesError.classList.add('visible'); }
      valid = false;
    } else if (datesError) { datesError.classList.remove('visible'); }

    if (!valid) return;

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('inline-receipt-ref').textContent = `#ARV-DEMO-${randomCode}`;
    document.getElementById('inline-receipt-suite').textContent = suiteSelect?.value || 'Aravalli Forest Suite';
    document.getElementById('inline-receipt-guests').textContent = `${guestsSelect?.value} ${guestsSelect?.value === '1' ? 'Guest' : 'Guests'}`;
    document.getElementById('inline-receipt-dates').textContent = `${inlineCheckin?.value} to ${inlineCheckout?.value}`;

    if (inlineForm) inlineForm.style.display = 'none';
    if (inlineSuccessBox) inlineSuccessBox.style.display = 'block';
  });
}

// 8. Global Escape Key Listener for Modals
function setupGlobalKeyEvents() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.editorial-modal-backdrop.open');
      openModals.forEach((m) => closeModal(m));

      const mobileDrawer = document.getElementById('mobile-nav-drawer');
      const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
      if (mobileDrawer?.classList.contains('open')) {
        mobileDrawer.classList.remove('open');
        mobileBackdrop?.classList.remove('open');
        document.body.classList.remove('modal-open');
        if (appState.activeLenis) appState.activeLenis.start();
      }
    }
  });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  setupHero();
  setupNavbar();
  setupGallery();
  setupLocation();
  setupEnquiryForms();
  setupGlobalKeyEvents();
});
