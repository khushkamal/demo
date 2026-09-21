import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroScene } from './scenes/heroScene.js';
import { RoomViewer } from './scenes/roomViewer.js';
import { soundscape } from './utils/audioEngine.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * ARAVALLI RETREAT - INTERACTION ENGINE & 3D CONTROLLER
 * Lenis Smooth Scroll + Three.js 3D WebGL + Generative Soundscape + Interactive HUD
 * --------------------------------------------------------------------------
 */

// Global Application State
const appState = {
  isNight: false,
  hero3DActive: true,
  heroScene: null,
  roomViewer: null,
  currency: 'INR',
  currencyRates: {
    INR: { symbol: '₹', rate: 1, suffix: '' },
    USD: { symbol: '$', rate: 0.012, suffix: '' },
    EUR: { symbol: '€', rate: 0.011, suffix: '' },
    GBP: { symbol: '£', rate: 0.0095, suffix: '' }
  },
  suitesData: {
    marble: {
      kicker: 'Forest Wing · Plunge Pool',
      name: 'Aravalli Marble Suite',
      desc: 'Makrana marble floors, private sunlit jharokha balcony overlooking the forest canopy, deep copper soaking bath, and four-poster Sheesham canopy bed.',
      area: '1,150 sq ft',
      view: 'Forest Ridge',
      feature: 'Plunge Pool',
      rateINR: 38000
    },
    tent: {
      kicker: 'Granite Ridge · Safari Pavilion',
      name: 'Jawai Leopard Pavilion',
      desc: 'Set alongside ancient granite monoliths with a wide private stargazing deck, brass telescope, outdoor rain shower, and leather-accented lounge.',
      area: '1,400 sq ft',
      view: 'Granite Monoliths',
      feature: 'Stargazing Deck',
      rateINR: 46000
    },
    rabari: {
      kicker: 'Private Courtyard · Heated Pool',
      name: 'Rabari Royal Villa & Tent',
      desc: 'A bespoke canvas and sandstone villa celebrating pastoral crafts, featuring hand-embroidered textiles, private stone courtyard, heated plunge pool, and fire pit.',
      area: '1,750 sq ft',
      view: 'Private Valley',
      feature: 'Heated Pool',
      rateINR: 54000
    }
  },
  mapWaypoints: {
    retreat: {
      kicker: 'Sanctuary Center',
      title: 'Aravalli Retreat',
      desc: 'Situated in an undisturbed valley corridor with zero light pollution, private stepwells, and direct access to both teak forests and leopard caves.',
      dist: 'Center Point',
      time: '0 min',
      elev: '520 m MSL',
      terrain: 'Forest & Granite',
      highlights: [
        '✓ 16 private villas & luxury tented pavilions',
        '✓ Baori stepwell dining under starry skies',
        '✓ Private naturalist-guided 4x4 safaris'
      ]
    },
    ranakpur: {
      kicker: '15th-Century Sacred Architecture',
      title: 'Ranakpur Jain Temples',
      desc: 'World-renowned architectural masterpiece carved from light-reflecting Makrana marble with 1,444 uniquely sculptured columns, where no two pillars are alike.',
      dist: '~18 km',
      time: '25 mins drive',
      elev: '486 m MSL',
      terrain: 'Forest Foothills',
      highlights: [
        '✓ Dawn private access before general public entry',
        '✓ Expert architectural historian accompaniment',
        '✓ Spectacular early-morning marble light resonance'
      ]
    },
    jawai: {
      kicker: 'Granite Monolith Wilderness',
      title: 'Jawai Leopard Monoliths',
      desc: 'Pre-Cambrian granite hills where wild leopards dwell freely alongside the semi-nomadic Rabari shepherds in unbroken peace and mutual respect.',
      dist: '~24 km',
      time: '35 mins drive',
      elev: '410 m MSL',
      terrain: 'Granite Boulders & Caves',
      highlights: [
        '✓ Custom open-top 4x4 tracking safaris',
        '✓ Naturalists with ancestral cave tracking knowledge',
        '✓ High density of leopard sightings in rocky caves'
      ]
    },
    dam: {
      kicker: 'Wetlands & Water Birds',
      title: 'Jawai Bandh Dam & Wetlands',
      desc: 'The largest water reservoir in western Rajasthan, serving as an oasis for winter migratory birds including flamingos, pelicans, sarus cranes, and Indian mugger crocodiles.',
      dist: '~28 km',
      time: '40 mins drive',
      elev: '360 m MSL',
      terrain: 'Expansive Lake & Shoreline',
      highlights: [
        '✓ Afternoon sunset tea by the water banks',
        '✓ Over 100 species of migratory and resident birds',
        '✓ Scenic granite boulder reflections across the lake'
      ]
    },
    udaipur: {
      kicker: 'Royal Aviation Gateway',
      title: 'Udaipur Airport (UDR)',
      desc: 'Maharana Pratap Airport in Udaipur serves as the primary gateway for private aviation and commercial flights arriving into Southern Rajasthan.',
      dist: '~110 km',
      time: '2.5 hrs drive',
      elev: '513 m MSL',
      terrain: 'Scenic Mountain Highway',
      highlights: [
        '✓ Chauffeur-driven private luxury SUV transfers',
        '✓ Scenic drive crossing the forested Aravalli passes',
        '✓ In-vehicle refreshments and chilled towels'
      ]
    }
  }
};

let activeLenis = null;

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
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
    infinite: false,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  activeLenis = lenis;
  return lenis;
}

// 2. Setup Cursor Glow Aura
function setupCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.innerWidth < 1024) return;

  window.addEventListener('mousemove', (e) => {
    gsap.to(glow, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.6,
      ease: 'power2.out'
    });
  }, { passive: true });
}

// 3. Setup Navbar Scroll State, ScrollSpy & Parallax
function setupScrollParallax() {
  const navbar = document.querySelector('.editorial-navbar');
  const navLinks = document.querySelectorAll('.nav-item-link');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  // Sticky Navbar Blur & Shadow on scroll
  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: (self) => {
      if (self.progress > 0) {
        navbar?.classList.add('scrolled');
      } else {
        navbar?.classList.remove('scrolled');
      }
    }
  });

  // Back to top button visibility trigger
  ScrollTrigger.create({
    start: 'top -400',
    onUpdate: (self) => {
      if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', self.progress > 0);
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (activeLenis) {
        activeLenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ScrollSpy: Highlight active section in navigation
  const sections = [
    { id: 'story', link: 'a[href="#story"]' },
    { id: 'suites', link: 'a[href="#suites"]' },
    { id: 'suite-3d-explorer', link: 'a[href="#suite-3d-explorer"]' },
    { id: 'corridor-map-section', link: 'a[href="#corridor-map-section"]' },
    { id: 'experiences', link: 'a[href="#experiences"]' },
    { id: 'journey-planner-section', link: 'a[href="#journey-planner-section"]' },
    { id: 'gallery', link: 'a[href="#gallery"]' },
    { id: 'location', link: 'a[href="#location"]' }
  ];

  sections.forEach(({ id, link }) => {
    const el = document.getElementById(id);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 45%',
      end: 'bottom 45%',
      onEnter: () => setActiveNavLink(link),
      onEnterBack: () => setActiveNavLink(link)
    });
  });

  function setActiveNavLink(linkSelector) {
    navLinks.forEach(item => item.classList.remove('active'));
    const targetLink = document.querySelector(`.editorial-navbar ${linkSelector}`);
    if (targetLink) {
      targetLink.classList.add('active');
    }
  }

  // Hero scroll down indicator button
  const heroScrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (heroScrollIndicator) {
    heroScrollIndicator.addEventListener('click', (e) => {
      e.preventDefault();
      const storySec = document.getElementById('story');
      if (storySec) {
        if (activeLenis) {
          activeLenis.scrollTo(storySec, { offset: -60, duration: 1.2 });
        } else {
          storySec.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Story primary photo parallax
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

  // Full-bleed cinematic photo parallax
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

// 4. Setup 3D WebGL Hero Scene
function initHero3D() {
  const container = document.getElementById('hero-webgl-container');
  if (!container) return;

  try {
    appState.heroScene = new HeroScene(container, (pct, status) => {
      const hint = document.getElementById('hero-dock-hint');
      if (hint && pct < 100) {
        hint.innerHTML = `<span class="pulse-indicator"></span> Loading 3D World: ${pct}% (${status})`;
      } else if (hint) {
        hint.innerHTML = `<span class="pulse-indicator"></span> Move mouse or scroll to pan 3D sanctuary`;
      }
    });
  } catch (err) {
    console.warn('Hero 3D fallback to photo layer:', err);
    toggleHeroView(false);
  }

  // Hero View Switcher Buttons (3D vs Photo)
  const btn3D = document.getElementById('view-mode-3d');
  const btnPhoto = document.getElementById('view-mode-photo');

  if (btn3D && btnPhoto) {
    btn3D.addEventListener('click', () => toggleHeroView(true));
    btnPhoto.addEventListener('click', () => toggleHeroView(false));
  }
}

function toggleHeroView(enable3D) {
  appState.hero3DActive = enable3D;
  const canvasWrap = document.getElementById('hero-webgl-container');
  const photoLayer = document.getElementById('hero-photo-layer');
  const btn3D = document.getElementById('view-mode-3d');
  const btnPhoto = document.getElementById('view-mode-photo');
  const hint = document.getElementById('hero-dock-hint');

  if (enable3D) {
    if (btn3D) btn3D.classList.add('active');
    if (btnPhoto) btnPhoto.classList.remove('active');
    if (canvasWrap) canvasWrap.classList.remove('hidden');
    if (photoLayer) photoLayer.classList.remove('active');
    if (appState.heroScene) appState.heroScene.resume();
    if (hint) hint.innerHTML = `<span class="pulse-indicator"></span> Move mouse or scroll to pan 3D sanctuary`;
  } else {
    if (btnPhoto) btnPhoto.classList.add('active');
    if (btn3D) btn3D.classList.remove('active');
    if (canvasWrap) canvasWrap.classList.add('hidden');
    if (photoLayer) photoLayer.classList.add('active');
    if (appState.heroScene) appState.heroScene.pause();
    if (hint) hint.innerHTML = `<span>📷</span> High-resolution photography vista`;
  }
}

// 5. Setup 3D Sanctuary Suite Explorer
function initRoomViewer() {
  const container = document.getElementById('room-canvas-container');
  if (!container) return;

  try {
    appState.roomViewer = new RoomViewer(container, () => {
      // Room ready
    });
  } catch (err) {
    console.warn('Room Viewer init failed:', err);
  }

  // Suite Preset Switcher Buttons
  const presetBtns = document.querySelectorAll('.suite-preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');
      if (appState.roomViewer) appState.roomViewer.setPreset(preset);
      updateSuiteSpecsHUD(preset);
    });
  });

  // "3D View ✦" buttons on 2D suite cards
  const card3DBtns = document.querySelectorAll('.view-in-3d-btn');
  card3DBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const preset = btn.getAttribute('data-suite-preset');
      const explorer = document.getElementById('suite-3d-explorer');
      if (explorer) {
        if (activeLenis) {
          activeLenis.scrollTo(explorer, { offset: -40, duration: 1.2 });
        } else {
          explorer.scrollIntoView({ behavior: 'smooth' });
        }
      }
      presetBtns.forEach(b => {
        if (b.getAttribute('data-preset') === preset) {
          b.click();
        }
      });
    });
  });

  // Auto-Rotate Toggle
  const autoRotateBtn = document.getElementById('toggle-room-autorotate');
  if (autoRotateBtn) {
    autoRotateBtn.addEventListener('click', () => {
      if (appState.roomViewer) {
        appState.roomViewer.autoRotate = !appState.roomViewer.autoRotate;
        if (appState.roomViewer.autoRotate) {
          autoRotateBtn.classList.add('active');
          autoRotateBtn.innerHTML = `<span class="hud-icon">⟳</span> Auto-Rotate: On`;
        } else {
          autoRotateBtn.classList.remove('active');
          autoRotateBtn.innerHTML = `<span class="hud-icon">⏸</span> Auto-Rotate: Paused`;
        }
      }
    });
  }

  // Evening Mood Toggle
  const lightingBtn = document.getElementById('toggle-room-lighting');
  if (lightingBtn) {
    let roomNight = false;
    lightingBtn.addEventListener('click', () => {
      roomNight = !roomNight;
      if (appState.roomViewer) {
        appState.roomViewer.setLighting(roomNight);
      }
      lightingBtn.classList.toggle('active', roomNight);
      lightingBtn.innerHTML = roomNight 
        ? `<span class="hud-icon">🕯️</span> Evening Mood: On` 
        : `<span class="hud-icon">☀️</span> Daylight`;
    });
  }
}

function updateSuiteSpecsHUD(preset) {
  const data = appState.suitesData[preset];
  if (!data) return;

  const kicker = document.getElementById('specs-kicker');
  const title = document.getElementById('specs-title');
  const desc = document.getElementById('specs-desc');
  const area = document.getElementById('specs-area');
  const view = document.getElementById('specs-view');
  const feature = document.getElementById('specs-feature');
  const price = document.getElementById('specs-price');
  const enquireBtn = document.getElementById('specs-enquire-btn');

  if (kicker) kicker.textContent = data.kicker;
  if (title) title.textContent = data.name;
  if (desc) desc.textContent = data.desc;
  if (area) area.textContent = data.area;
  if (view) view.textContent = data.view;
  if (feature) feature.textContent = data.feature;
  if (price) {
    const cur = appState.currencyRates[appState.currency];
    const converted = Math.round(data.rateINR * cur.rate);
    price.textContent = `${cur.symbol}${converted.toLocaleString()} / Night`;
  }
  if (enquireBtn) {
    enquireBtn.setAttribute('data-suite', data.name);
  }
}

// 6. Setup Generative Ambient Soundscape
function setupAudioSoundscape() {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  const mobileToggleBtn = document.getElementById('mobile-audio-toggle');
  const btnText = document.getElementById('audio-btn-text');
  const mobileText = document.getElementById('mobile-audio-text');

  const handleToggle = () => {
    const isPlaying = soundscape.toggle();
    if (toggleBtn) toggleBtn.classList.toggle('playing', isPlaying);
    if (mobileToggleBtn) mobileToggleBtn.classList.toggle('playing', isPlaying);
    
    if (btnText) btnText.textContent = isPlaying ? 'Soundscape: Live' : 'Soundscape: Off';
    if (mobileText) mobileText.textContent = isPlaying ? 'Soundscape: Playing (Live)' : 'Ambient Soundscape: Off';
  };

  if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
  if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleToggle);
}

// 7. Setup Atmosphere Day / Night Toggle
function setupAtmosphereToggle() {
  const toggleBtn = document.getElementById('atmosphere-toggle-btn');
  const mobileToggleBtn = document.getElementById('mobile-atmosphere-toggle');
  const icon = document.getElementById('atmosphere-icon');
  const label = document.getElementById('atmosphere-label');
  const mobileIcon = document.getElementById('mobile-atmosphere-icon');
  const mobileText = document.getElementById('mobile-atmosphere-text');

  const handleAtmosphere = () => {
    appState.isNight = !appState.isNight;
    document.body.classList.toggle('theme-night', appState.isNight);

    if (appState.heroScene) {
      appState.heroScene.setDayNight(appState.isNight);
    }

    if (appState.isNight) {
      if (icon) icon.textContent = '🌌';
      if (label) label.textContent = 'Starlight Night';
      if (mobileIcon) mobileIcon.textContent = '🌌';
      if (mobileText) mobileText.textContent = 'Switch to Golden Hour';
    } else {
      if (icon) icon.textContent = '🌅';
      if (label) label.textContent = 'Golden Hour';
      if (mobileIcon) mobileIcon.textContent = '🌅';
      if (mobileText) mobileText.textContent = 'Switch to Starlight Night';
    }
  };

  if (toggleBtn) toggleBtn.addEventListener('click', handleAtmosphere);
  if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleAtmosphere);
}

// 8. Setup Interactive Corridor Map & Selector Chips
function setupCorridorMap() {
  const waypoints = document.querySelectorAll('.map-waypoint-node');
  const chipBtns = document.querySelectorAll('.map-chip-btn');
  const kicker = document.getElementById('map-node-kicker');
  const title = document.getElementById('map-node-title');
  const desc = document.getElementById('map-node-desc');
  const dist = document.getElementById('map-metric-dist');
  const time = document.getElementById('map-metric-time');
  const elev = document.getElementById('map-metric-elev');
  const terrain = document.getElementById('map-metric-terrain');
  const highlights = document.getElementById('map-node-highlights');

  function selectWaypoint(id) {
    waypoints.forEach(n => n.classList.toggle('active', n.getAttribute('data-id') === id));
    chipBtns.forEach(c => c.classList.toggle('active', c.getAttribute('data-target-id') === id));

    const data = appState.mapWaypoints[id];
    if (!data) return;

    if (kicker) kicker.textContent = data.kicker;
    if (title) title.textContent = data.title;
    if (desc) desc.textContent = data.desc;
    if (dist) dist.textContent = data.dist;
    if (time) time.textContent = data.time;
    if (elev) elev.textContent = data.elev;
    if (terrain) terrain.textContent = data.terrain;

    if (highlights) {
      highlights.innerHTML = data.highlights.map(h => `<div class="h-item">${h}</div>`).join('');
    }
  }

  waypoints.forEach(node => {
    node.addEventListener('click', () => {
      const id = node.getAttribute('data-id');
      selectWaypoint(id);
    });
  });

  chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-target-id');
      selectWaypoint(id);
    });
  });
}

// 9. Setup Bespoke Journey & Cost Estimator
function setupJourneyPlanner() {
  const nightsSlider = document.getElementById('planner-nights-slider');
  const nightsBadge = document.getElementById('planner-nights-badge');
  const guestPills = document.querySelectorAll('.guest-pill');
  const guestsBadge = document.getElementById('planner-guests-badge');
  const suiteRadios = document.querySelectorAll('input[name="planner-suite"]');
  const expChecks = document.querySelectorAll('.planner-exp-check');
  const currencyPills = document.querySelectorAll('.currency-pill');

  const proposalSuite = document.getElementById('proposal-suite-name');
  const proposalNights = document.getElementById('proposal-nights-label');
  const itemsList = document.getElementById('proposal-items-list');
  const totalDisplay = document.getElementById('planner-total-amount');
  const bookBtn = document.getElementById('book-curated-journey-btn');

  function calculateProposal() {
    const nights = parseInt(nightsSlider ? nightsSlider.value : 3, 10);
    if (nightsBadge) nightsBadge.textContent = `${nights} Nights`;

    const guests = appState.guests || 2;
    if (guestsBadge) guestsBadge.textContent = `${guests} ${guests === 1 ? 'Guest' : 'Guests'}`;

    // Selected Suite
    let selectedSuiteKey = 'marble';
    let suiteRate = 38000;
    suiteRadios.forEach(radio => {
      const parentLabel = radio.closest('.sanctuary-radio-card');
      if (radio.checked) {
        selectedSuiteKey = radio.value;
        suiteRate = parseInt(radio.getAttribute('data-rate'), 10);
        if (parentLabel) parentLabel.classList.add('active');
      } else {
        if (parentLabel) parentLabel.classList.remove('active');
      }
    });

    const suiteData = appState.suitesData[selectedSuiteKey];
    const roomSubtotal = suiteRate * nights;

    // Experiences
    let expSubtotal = 0;
    const selectedExps = [];
    expChecks.forEach(check => {
      if (check.checked) {
        const cost = parseInt(check.getAttribute('data-cost'), 10);
        const name = check.getAttribute('data-name');
        expSubtotal += cost;
        selectedExps.push({ name, cost });
      }
    });

    const totalINR = roomSubtotal + expSubtotal;
    const cur = appState.currencyRates[appState.currency];

    // Format & Render
    if (proposalSuite && suiteData) {
      proposalSuite.textContent = `${suiteData.name} Journey`;
    }
    if (proposalNights) {
      proposalNights.textContent = `${nights} Nights · ${guests} ${guests === 1 ? 'Guest' : 'Guests'} · Bespoke Retreat`;
    }

    if (itemsList) {
      let html = `
        <div class="line-item">
          <span>${nights} Nights: ${suiteData.name}</span>
          <span>${cur.symbol}${Math.round(roomSubtotal * cur.rate).toLocaleString()}</span>
        </div>
      `;
      selectedExps.forEach(exp => {
        html += `
          <div class="line-item">
            <span>${exp.name}</span>
            <span>${cur.symbol}${Math.round(exp.cost * cur.rate).toLocaleString()}</span>
          </div>
        `;
      });
      itemsList.innerHTML = html;
    }

    if (totalDisplay) {
      const convertedTotal = Math.round(totalINR * cur.rate);
      totalDisplay.textContent = `${cur.symbol}${convertedTotal.toLocaleString()}`;
    }

    // Connect Book button to Enquiry Modal
    if (bookBtn) {
      bookBtn.onclick = (e) => {
        e.preventDefault();
        const suiteSelect = document.getElementById('suite-select');
        const guestSelect = document.getElementById('guest-count');
        const specialNotes = document.getElementById('special-notes');
        const modal = document.getElementById('enquiry-modal');

        if (suiteSelect && suiteData) {
          for (let i = 0; i < suiteSelect.options.length; i++) {
            if (suiteSelect.options[i].value === suiteData.name) {
              suiteSelect.selectedIndex = i;
              break;
            }
          }
        }

        if (guestSelect) {
          const guestStr = guests >= 4 ? '4+' : String(guests);
          for (let i = 0; i < guestSelect.options.length; i++) {
            if (guestSelect.options[i].value === guestStr) {
              guestSelect.selectedIndex = i;
              break;
            }
          }
        }

        if (specialNotes) {
          const expNames = selectedExps.map(e => e.name).join(', ');
          specialNotes.value = `Custom Itinerary Proposal: ${nights} Nights for ${guests} guests in ${suiteData.name}.\nInclusions: ${expNames || 'Standard Sanctuary Stay'}.\nEstimated Quote: ${totalDisplay.textContent}.`;
        }

        if (modal) {
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
        }
      };
    }
  }

  if (nightsSlider) nightsSlider.addEventListener('input', calculateProposal);
  suiteRadios.forEach(r => r.addEventListener('change', calculateProposal));
  expChecks.forEach(c => c.addEventListener('change', calculateProposal));

  // Guest count selector
  guestPills.forEach(pill => {
    pill.addEventListener('click', () => {
      guestPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.guests = parseInt(pill.getAttribute('data-guests'), 10) || 2;
      calculateProposal();
    });
  });

  // Currency switcher
  currencyPills.forEach(pill => {
    pill.addEventListener('click', () => {
      currencyPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.currency = pill.getAttribute('data-currency');
      calculateProposal();
      updateSuiteSpecsHUD('tent');
    });
  });

  calculateProposal();
}

// 10. Setup Gallery Lightbox Modal with Full Playlist Controls
function setupGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  const galleryItems = document.querySelectorAll('.gallery-tile-item');
  const imagesList = [];

  galleryItems.forEach((item, index) => {
    const img = item.querySelector('img');
    const caption = item.getAttribute('data-caption') || '';
    if (img) {
      imagesList.push({
        src: img.src,
        alt: img.alt || 'Aravalli Retreat',
        caption: caption
      });
    }

    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  let currentIndex = 0;

  function openLightbox(index) {
    if (!imagesList[index]) return;
    currentIndex = index;
    updateLightboxContent();
    if (lightbox) {
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
    }
  }

  function updateLightboxContent() {
    const current = imagesList[currentIndex];
    if (!current) return;

    if (lightboxImg) {
      lightboxImg.src = current.src;
      lightboxImg.alt = current.alt;
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = current.caption;
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${imagesList.length}`;
    }
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % imagesList.length;
    updateLightboxContent();
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + imagesList.length) % imagesList.length;
    updateLightboxContent();
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', nextImage);
  if (prevBtn) prevBtn.addEventListener('click', prevImage);

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  });
}

// 11. Setup Booking Enquiry Modal & Client-Side Inline Validation
function setupEnquiryModal() {
  const modal = document.getElementById('enquiry-modal');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('enquiry-form');
  const formView = document.getElementById('enquiry-form-view');
  const confirmView = document.getElementById('enquiry-confirmation-view');
  const returnBtn = document.getElementById('confirmation-return-btn');
  const suiteSelect = document.getElementById('suite-select');
  const guestSelect = document.getElementById('guest-count');
  const refNumFull = document.getElementById('demo-ref-full');
  const copyBtn = document.getElementById('copy-ref-btn');
  const copyToast = document.getElementById('copy-toast');
  const modalNightsBadge = document.getElementById('modal-nights-badge');
  const receiptSuiteVal = document.getElementById('receipt-suite-val');
  const receiptDatesVal = document.getElementById('receipt-dates-val');

  const nameInput = document.getElementById('guest-name');
  const emailInput = document.getElementById('guest-email');
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');

  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const datesError = document.getElementById('dates-error');

  const openButtons = document.querySelectorAll('.open-enquiry-modal-btn');

  // Set default sample dates (+3 days from now to +7 days)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (checkinInput) {
    checkinInput.min = todayStr;
    const checkin = new Date(today);
    checkin.setDate(checkin.getDate() + 3);
    checkinInput.value = checkin.toISOString().split('T')[0];
  }
  if (checkoutInput) {
    const checkout = new Date(today);
    checkout.setDate(checkout.getDate() + 7);
    checkoutInput.value = checkout.toISOString().split('T')[0];
  }

  function updateNightsBadge() {
    if (!checkinInput || !checkoutInput) return;
    const d1 = new Date(checkinInput.value);
    const d2 = new Date(checkoutInput.value);
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      if (modalNightsBadge) modalNightsBadge.textContent = `${diffDays} Nights Stay`;
      if (datesError) datesError.textContent = '';
      checkoutInput.classList.remove('has-error');
    } else {
      if (modalNightsBadge) modalNightsBadge.textContent = `Invalid Dates`;
      if (datesError) datesError.textContent = 'Check-out date must be after check-in date.';
      checkoutInput.classList.add('has-error');
    }
  }

  if (checkinInput) checkinInput.addEventListener('change', updateNightsBadge);
  if (checkoutInput) checkoutInput.addEventListener('change', updateNightsBadge);
  updateNightsBadge();

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

      if (formView) formView.style.display = 'block';
      if (confirmView) confirmView.classList.remove('active');
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  });

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (returnBtn) returnBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Clear errors on input typing
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      nameInput.classList.remove('has-error');
      if (nameError) nameError.textContent = '';
    });
  }
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailInput.classList.remove('has-error');
      if (emailError) emailError.textContent = '';
    });
  }

  // Form submission with inline validation
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;

      // Name validation
      if (!nameInput || !nameInput.value.trim()) {
        if (nameInput) nameInput.classList.add('has-error');
        if (nameError) nameError.textContent = 'Please enter your full name.';
        isValid = false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput || !emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        if (emailInput) emailInput.classList.add('has-error');
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      // Date validation
      const d1 = new Date(checkinInput.value);
      const d2 = new Date(checkoutInput.value);
      const nights = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (nights <= 0) {
        if (checkoutInput) checkoutInput.classList.add('has-error');
        if (datesError) datesError.textContent = 'Check-out date must be at least 1 day after check-in.';
        isValid = false;
      }

      if (!isValid) return;

      // Generate simulated reference
      const randomRef = `#ARV-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
      if (refNumFull) refNumFull.textContent = randomRef;

      if (receiptSuiteVal && suiteSelect) {
        receiptSuiteVal.textContent = suiteSelect.value;
      }
      if (receiptDatesVal && guestSelect) {
        receiptDatesVal.textContent = `${nights} Nights · ${guestSelect.options[guestSelect.selectedIndex].text}`;
      }

      if (formView) formView.style.display = 'none';
      if (confirmView) confirmView.classList.add('active');
    });
  }

  // Copy reference code button
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = refNumFull ? refNumFull.textContent : '#ARV-DEMO-8492';
      navigator.clipboard?.writeText(code).then(() => {
        if (copyToast) {
          copyToast.classList.add('show');
          setTimeout(() => copyToast.classList.remove('show'), 2500);
        }
      }).catch(() => {
        // Fallback
        if (copyToast) {
          copyToast.textContent = `Code: ${code}`;
          copyToast.classList.add('show');
        }
      });
    });
  }
}

// 12. Setup Mobile Drawer Navigation & Backdrop
function setupMobileNav() {
  const toggleBtn = document.getElementById('mobile-nav-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  const closeBtn = document.getElementById('mobile-drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-link');

  if (!toggleBtn || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    if (backdrop) backdrop.classList.add('active');
  };

  const closeDrawer = () => {
    drawer.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('active');
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  drawerLinks.forEach((link) => {
    link.addEventListener('click', closeDrawer);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (drawer.classList.contains('active')) closeDrawer();
      const modal = document.getElementById('enquiry-modal');
      if (modal?.classList.contains('active')) {
        modal.classList.remove('active');
      }
    }
  });
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  setupCursorGlow();
  setupScrollParallax();
  initHero3D();
  initRoomViewer();
  setupAudioSoundscape();
  setupAtmosphereToggle();
  setupCorridorMap();
  setupJourneyPlanner();
  setupGalleryLightbox();
  setupEnquiryModal();
  setupMobileNav();
});
