import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * ARAVALLI RETREAT - EDITORIAL INTERACTION ENGINE
 * Reference Feel: Aman, Six Senses, SUJÁN Jawai, Oberoi Udaivilas
 * Lenis Smooth Scrolling + GSAP Scroll Parallax & Zoom Animations
 * --------------------------------------------------------------------------
 */

// 1. Initialize Lenis Smooth Scrolling
function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;

  const lenis = new Lenis({
    duration: 1.3,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease-out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// 2. Setup Cinematic Scroll Parallax & Zoom Effects
function setupScrollParallax() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Navbar background change on scroll
  const navbar = document.querySelector('.editorial-navbar');
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => {
      if (self.progress > 0) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  // Hero main photo smooth zoom-out & parallax drift on scroll
  const heroPhoto = document.querySelector('.hero-main-photo');
  if (heroPhoto) {
    gsap.to(heroPhoto, {
      yPercent: 18,
      scale: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Story primary photo subtle parallax
  const storyPhoto = document.querySelector('.story-primary-photo');
  if (storyPhoto) {
    gsap.to(storyPhoto, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: '.story-imagery-frame',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Full-bleed cinematic interlude photo parallax
  const cinematicPhoto = document.querySelector('.cinematic-bg-photo');
  if (cinematicPhoto) {
    gsap.to(cinematicPhoto, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cinematic-interlude-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Suite cards smooth fade-up reveals
  const suiteCards = document.querySelectorAll('.suite-magazine-card');
  suiteCards.forEach((card) => {
    gsap.from(card, {
      opacity: 0,
      y: 45,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Experience cards staggered reveal
  const expCards = document.querySelectorAll('.experience-card-item');
  if (expCards.length > 0) {
    gsap.from(expCards, {
      opacity: 0,
      y: 40,
      duration: 1.0,
      stagger: 0.14,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.experiences-magazine-grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
  }
}

// 3. Setup Atmosphere Lightbox Modal
function setupGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');

  const galleryItems = document.querySelectorAll('.gallery-tile-item');

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.getAttribute('data-caption');

      if (img && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Aravalli Retreat';
      }
      if (lightboxCaption && caption) {
        lightboxCaption.textContent = caption;
      }

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// 4. Setup Booking Enquiry Modal & Client-Side Validation
function setupEnquiryModal() {
  const modal = document.getElementById('enquiry-modal');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('enquiry-form');
  const formView = document.getElementById('enquiry-form-view');
  const confirmView = document.getElementById('enquiry-confirmation-view');
  const returnBtn = document.getElementById('confirmation-return-btn');
  const suiteSelect = document.getElementById('suite-select');
  const refNumSpan = document.getElementById('demo-ref-number');

  const openButtons = document.querySelectorAll('.open-enquiry-modal-btn');

  // Set default sample dates (+3 days from now)
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  if (checkinInput && checkoutInput) {
    const today = new Date();
    const checkin = new Date(today);
    checkin.setDate(checkin.getDate() + 3);
    const checkout = new Date(today);
    checkout.setDate(checkout.getDate() + 7);

    checkinInput.value = checkin.toISOString().split('T')[0];
    checkoutInput.value = checkout.toISOString().split('T')[0];
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const suiteName = btn.getAttribute('data-suite');
      if (suiteName && suiteSelect) {
        for (let i = 0; i < suiteSelect.options.length; i++) {
          if (suiteSelect.options[i].value === suiteName) {
            suiteSelect.selectedIndex = i;
            break;
          }
        }
      }

      formView.style.display = 'block';
      confirmView.classList.remove('active');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (returnBtn) returnBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('guest-name').value.trim();
      const email = document.getElementById('guest-email').value.trim();

      if (!name || !email) {
        alert('Please provide your name and email address for this demo enquiry.');
        return;
      }

      if (refNumSpan) {
        refNumSpan.textContent = Math.floor(1000 + Math.random() * 9000);
      }

      formView.style.display = 'none';
      confirmView.classList.add('active');
    });
  }
}

// 5. Setup Mobile Drawer Navigation
function setupMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');

  if (!toggleBtn || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
  };

  const closeDrawer = () => {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  setupScrollParallax();
  setupGalleryLightbox();
  setupEnquiryModal();
  setupMobileNav();
});

