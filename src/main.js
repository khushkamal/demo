import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroScene } from './scenes/heroScene.js';
import { soundscape } from './utils/audioEngine.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * ARAVALLI RETREAT - EDITORIAL INTERACTION ENGINE
 * --------------------------------------------------------------------------
 */

// Application State
const appState = {
  heroScene: null,
  panoramaViewer: null,
  activeLenis: null,
  isAudioPlaying: false,
  galleryIndex: 0,
  galleryImages: [
    { src: '/images/gallery-1.jpg', caption: 'Sandstone colonnade in morning light (Sample image)' },
    { src: '/images/gallery-2.jpg', caption: 'Jaali screen pattern and shadow (Sample image)' },
    { src: '/images/gallery-3.jpg', caption: 'Copper soaking tub with valley view (Sample image)' },
    { src: '/images/gallery-4.jpg', caption: 'Starlit courtyard with brass lanterns (Sample image)' }
  ],
  mapPoints: {
    retreat: {
      title: 'Aravalli Retreat (Center)',
      text: 'Secluded valley setting in the Pali district. Elevation ~520 m MSL (Sample). Surrounding acacia forests and granite hills.'
    },
    ranakpur: {
      title: 'Ranakpur Jain Temples',
      text: '15th-century marble temple complex with 1,444 uniquely carved pillars. ~18 km, 25 minutes drive (Sample).'
    },
    jawai: {
      title: 'Jawai Leopard Monoliths',
      text: 'Pre-Cambrian granite hills where leopards roam alongside Rabari pastoral settlements. ~24 km, 35 minutes drive (Sample).'
    },
    dam: {
      title: 'Jawai Bandh Wetlands',
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
      const suite = document.getElementById('hero-suite')?.value || 'Aravalli Marble Suite';

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
  const sections = ['suites', 'experiences', 'dining', 'gallery', 'location', 'enquiry'];
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

  // Soundscape audio toggle
  const audioBtn = document.getElementById('audio-toggle-btn');
  const audioBtnText = document.getElementById('audio-btn-text');
  const mobileAudioBtn = document.getElementById('mobile-audio-toggle');
  const mobileAudioText = document.getElementById('mobile-audio-text');

  function toggleAudio() {
    if (soundscape) {
      soundscape.toggle();
      appState.isAudioPlaying = soundscape.isPlaying;
      const label = appState.isAudioPlaying ? 'Audio: On' : 'Audio: Off';
      
      if (audioBtn) {
        audioBtn.classList.toggle('playing', appState.isAudioPlaying);
        if (audioBtnText) audioBtnText.textContent = label;
      }
      if (mobileAudioBtn) {
        mobileAudioBtn.classList.toggle('playing', appState.isAudioPlaying);
        if (mobileAudioText) mobileAudioText.textContent = `Ambient ${label}`;
      }
    }
  }

  audioBtn?.addEventListener('click', toggleAudio);
  mobileAudioBtn?.addEventListener('click', toggleAudio);

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

// 5. Setup Stay Estimator
function setupEstimator() {
  const suiteRadios = document.querySelectorAll('input[name="est-suite"]');
  const nightsSlider = document.getElementById('est-nights-slider');
  const nightsCount = document.getElementById('est-nights-count');
  const guestsSelect = document.getElementById('est-guests-select');
  const addonChecks = document.querySelectorAll('.est-addon-check');

  const summarySuiteTitle = document.getElementById('summary-suite-title');
  const summaryMetaLine = document.getElementById('summary-meta-line');
  const summaryLineItems = document.getElementById('summary-line-items');
  const subtotalVal = document.getElementById('est-subtotal-val');
  const gstVal = document.getElementById('est-gst-val');
  const totalVal = document.getElementById('est-total-val');
  const proceedBtn = document.getElementById('est-proceed-btn');

  function calculate() {
    let selectedSuiteRadio = document.querySelector('input[name="est-suite"]:checked');
    if (!selectedSuiteRadio && suiteRadios.length > 0) {
      selectedSuiteRadio = suiteRadios[0];
      selectedSuiteRadio.checked = true;
    }

    const suiteRate = parseInt(selectedSuiteRadio?.getAttribute('data-rate') || '38000', 10);
    const suiteName = selectedSuiteRadio?.getAttribute('data-name') || 'Aravalli Marble Suite';
    const nights = parseInt(nightsSlider?.value || '3', 10);
    const guests = guestsSelect?.value || '2';

    if (nightsCount) nightsCount.textContent = nights;
    if (summarySuiteTitle) summarySuiteTitle.textContent = suiteName;
    if (summaryMetaLine) summaryMetaLine.textContent = `${nights} ${nights === 1 ? 'Night' : 'Nights'} \u00B7 ${guests} ${guests === '1' ? 'Guest' : 'Guests'}`;

    // Update active radio border styling
    document.querySelectorAll('.est-radio-item').forEach((item) => {
      const radio = item.querySelector('input[type="radio"]');
      item.classList.toggle('active', !!radio?.checked);
    });

    const roomTotal = suiteRate * nights;
    let addonsTotal = 0;
    let lineItemsHtml = `
      <div class="summary-row">
        <span>${nights} ${nights === 1 ? 'Night' : 'Nights'} Accommodation</span>
        <span>\u20B9${roomTotal.toLocaleString('en-IN')}</span>
      </div>
    `;

    addonChecks.forEach((chk) => {
      if (chk.checked) {
        const cost = parseInt(chk.getAttribute('data-cost') || '0', 10);
        const name = chk.getAttribute('data-name') || '';
        addonsTotal += cost;
        lineItemsHtml += `
          <div class="summary-row">
            <span>${name}</span>
            <span>\u20B9${cost.toLocaleString('en-IN')}</span>
          </div>
        `;
      }
    });

    if (summaryLineItems) summaryLineItems.innerHTML = lineItemsHtml;

    const subtotal = roomTotal + addonsTotal;
    const gst = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gst;

    if (subtotalVal) subtotalVal.textContent = `\u20B9${subtotal.toLocaleString('en-IN')}`;
    if (gstVal) gstVal.textContent = `\u20B9${gst.toLocaleString('en-IN')}`;
    if (totalVal) totalVal.textContent = `\u20B9${grandTotal.toLocaleString('en-IN')}`;
  }

  suiteRadios.forEach((r) => r.addEventListener('change', calculate));
  nightsSlider?.addEventListener('input', calculate);
  guestsSelect?.addEventListener('change', calculate);
  addonChecks.forEach((c) => c.addEventListener('change', calculate));

  proceedBtn?.addEventListener('click', () => {
    const selectedSuiteRadio = document.querySelector('input[name="est-suite"]:checked');
    const suiteName = selectedSuiteRadio?.getAttribute('data-name') || 'Aravalli Marble Suite';
    const nights = parseInt(nightsSlider?.value || '3', 10);
    const guests = guestsSelect?.value || '2';

    // Calculate dates based on nights
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkinStr = tomorrow.toISOString().split('T')[0];

    const checkoutDate = new Date(tomorrow);
    checkoutDate.setDate(checkoutDate.getDate() + nights);
    const checkoutStr = checkoutDate.toISOString().split('T')[0];

    openEnquiryModal({
      checkin: checkinStr,
      checkout: checkoutStr,
      guests: guests === '1' ? '1' : guests === '2' ? '2' : guests === '3' ? '3' : '4+',
      suite: suiteName
    });
  });

  calculate();
}

// 6. Setup 360° Panorama Viewer Modal (Dynamic Three.js import)
function setupPanoramaViewer() {
  const modal = document.getElementById('panorama-modal');
  const closeBtn = document.getElementById('panorama-close-btn');
  const container = document.getElementById('panorama-viewer-container');
  const title = document.getElementById('panorama-title');
  const viewBtns = document.querySelectorAll('.btn-open-360');

  async function openViewer(suiteId) {
    const suiteNames = {
      marble: 'Aravalli Marble Suite',
      tent: 'Jawai Leopard Pavilion',
      rabari: 'Rabari Royal Villa'
    };

    if (title) {
      title.innerHTML = `${suiteNames[suiteId] || 'Suite'} &middot; 360&deg; View`;
    }

    openModal(modal);

    if (container) {
      try {
        const { PanoramaViewer } = await import('./scenes/panoramaViewer.js');
        if (appState.panoramaViewer) {
          appState.panoramaViewer.dispose();
        }
        appState.panoramaViewer = new PanoramaViewer(container, suiteId);
      } catch (err) {
        console.warn('Failed to load 360 panorama viewer:', err);
      }
    }
  }

  function closeViewer() {
    closeModal(modal);
    if (appState.panoramaViewer) {
      appState.panoramaViewer.dispose();
      appState.panoramaViewer = null;
    }
  }

  viewBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const suiteId = btn.getAttribute('data-suite') || 'marble';
      openViewer(suiteId);
    });
  });

  closeBtn?.addEventListener('click', closeViewer);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeViewer();
  });
}

// 7. Setup Gallery Lightbox
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

// 8. Setup Location Waypoints
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

// 9. Setup Enquiry Modal & Form Handling
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

function setupEnquiryForm() {
  const modal = document.getElementById('enquiry-modal');
  const closeBtn = document.getElementById('enquiry-modal-close');
  const successCloseBtn = document.getElementById('success-close-btn');
  const form = document.getElementById('enquiry-form');
  const formView = document.getElementById('enquiry-form-view');
  const successView = document.getElementById('enquiry-success-view');

  const nameInput = document.getElementById('guest-name');
  const emailInput = document.getElementById('guest-email');
  const checkinInput = document.getElementById('modal-checkin');
  const checkoutInput = document.getElementById('modal-checkout');
  const suiteSelect = document.getElementById('modal-suite');
  const guestsSelect = document.getElementById('modal-guests');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const datesError = document.getElementById('dates-error');

  const receiptRef = document.getElementById('receipt-ref');
  const receiptSuite = document.getElementById('receipt-suite');
  const receiptGuests = document.getElementById('receipt-guests');
  const receiptDates = document.getElementById('receipt-dates');

  // Trigger buttons across page
  document.querySelectorAll('.open-enquiry-modal-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const suite = btn.getAttribute('data-suite') || undefined;
      openEnquiryModal({ suite });
    });
  });

  closeBtn?.addEventListener('click', () => closeModal(modal));
  successCloseBtn?.addEventListener('click', () => closeModal(modal));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  // Checkin change updates checkout min
  checkinInput?.addEventListener('change', () => {
    if (checkinInput.value) {
      const nextDay = new Date(checkinInput.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkoutInput.min = nextDay.toISOString().split('T')[0];
      if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
        checkoutInput.value = nextDay.toISOString().split('T')[0];
      }
    }
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    // Validate Name
    if (!nameInput?.value.trim()) {
      if (nameError) {
        nameError.textContent = 'Please enter your full name.';
        nameError.classList.add('visible');
      }
      valid = false;
    } else if (nameError) {
      nameError.classList.remove('visible');
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput?.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      if (emailError) {
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('visible');
      }
      valid = false;
    } else if (emailError) {
      emailError.classList.remove('visible');
    }

    // Validate Dates
    if (!checkinInput?.value || !checkoutInput?.value) {
      if (datesError) {
        datesError.textContent = 'Please select both check-in and check-out dates.';
        datesError.classList.add('visible');
      }
      valid = false;
    } else if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
      if (datesError) {
        datesError.textContent = 'Check-out date must be after check-in date.';
        datesError.classList.add('visible');
      }
      valid = false;
    } else if (datesError) {
      datesError.classList.remove('visible');
    }

    if (!valid) return;

    // Populate Receipt
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    if (receiptRef) receiptRef.textContent = `#ARV-DEMO-${randomCode}`;
    if (receiptSuite) receiptSuite.textContent = suiteSelect?.value || 'Aravalli Marble Suite';
    if (receiptGuests) receiptGuests.textContent = `${guestsSelect?.value} ${guestsSelect?.value === '1' ? 'Guest' : 'Guests'}`;
    if (receiptDates) receiptDates.textContent = `${checkinInput?.value} to ${checkoutInput?.value}`;

    if (formView) formView.style.display = 'none';
    if (successView) successView.style.display = 'block';
  });
}

// 10. Global Escape Key Listener for Modals
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
  setupEstimator();
  setupPanoramaViewer();
  setupGallery();
  setupLocation();
  setupEnquiryForm();
  setupGlobalKeyEvents();
});
