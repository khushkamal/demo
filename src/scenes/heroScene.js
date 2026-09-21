import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  createSandstoneTexture,
  createMarbleTexture,
  createGraniteTexture,
  createJaaliTexture,
  createStarfieldTexture
} from '../utils/proceduralTextures.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * --------------------------------------------------------------------------
 * 3D HERO & SCROLL LANDSCAPE SCENE (Three.js)
 * --------------------------------------------------------------------------
 * Architecture Overview:
 * 1. Terrain & Ridges: Procedural low-poly Aravalli mountain ranges and Jawai granite monoliths.
 * 2. Heritage Haveli: Stylized marble Baradari pavilion with carved pillars, chhatri domes, and jaali lattice.
 * 3. Water Mirror: Stepwell (Baori) reflection pool reflecting golden sunset / starlit skies.
 * 4. Atmosphere & Lighting: Dual state (Golden Hour Day vs. Royal Midnight Starlight with glowing lanterns).
 * 5. Scroll Camera: Synchronized cinematic camera flythrough mapped to scroll position via GSAP.
 * 6. Performance & Mobile: Capped pixel ratio (1.5 on mobile, 2.0 on desktop), adaptive particle counts,
 *    and pause/resume lifecycle controls to prevent GPU overhead.
 */
export class HeroScene {
  constructor(canvasContainer, onProgressUpdate) {
    this.container = canvasContainer;
    this.onProgressUpdate = onProgressUpdate || (() => {});
    this.isNight = false;
    this.isPaused = false;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Mouse Parallax & Inertia State
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();
    this.disposed = false;

    this.init();
  }

  init() {
    this.reportProgress(10, 'Initializing 3D WebGL context...');

    // ==========================================
    // 1. RENDERER SETUP & CAPABILITIES
    // ==========================================
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile, // Disable MSAA on low-end mobile for 60fps
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    // Cap pixel ratio: max 1.5 on mobile to avoid fill-rate bottlenecks, 2.0 on desktop
    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    
    // Tonemapping for rich warm cinematic golden-hour highlights
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.container.appendChild(this.renderer.domElement);
    this.reportProgress(25, 'Building Aravalli & Jawai terrain...');

    // ==========================================
    // 2. SCENE GRAPH & ATMOSPHERIC FOG
    // ==========================================
    // Fog simulates the warm desert dust haze during sunset and deep blue night
    this.scene = new THREE.Scene();
    this.dayFogColor = new THREE.Color('#f4cca1');
    this.nightFogColor = new THREE.Color('#0b132b');
    this.scene.fog = new THREE.FogExp2(this.dayFogColor, 0.0085);

    // ==========================================
    // 3. PERSPECTIVE CAMERA SETUP
    // ==========================================
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      650
    );
    // Initial camera position for Hero vista
    this.camera.position.set(0, 18, 55);
    this.cameraTarget = new THREE.Vector3(0, 8, 0);
    this.camera.lookAt(this.cameraTarget);

    // ==========================================
    // 4. PROCEDURAL ASSETS & ENVIRONMENT BUILD
    // ==========================================
    this.reportProgress(45, 'Generating procedural sandstone & marble textures...');
    this.createTextures();

    this.reportProgress(60, 'Constructing heritage pavilion & water stepwell...');
    this.createSkyDome();
    this.createTerrainAndHills();
    this.createJawaiBoulders();
    this.createHaveliPavilion();
    this.createStepwellWater();

    this.reportProgress(80, 'Setting up lighting rigs & atmospheric particles...');
    this.createLighting();
    this.createParticles();

    // ==========================================
    // 5. SCROLL CHOREOGRAPHY & INTERACTION
    // ==========================================
    this.setupScrollAnimation();
    this.setupInteractions();

    this.reportProgress(100, 'Heritage world ready.');

    // 6. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  reportProgress(pct, status) {
    if (this.onProgressUpdate) {
      this.onProgressUpdate(pct, status);
    }
  }

  createTextures() {
    // Generate canvas-based textures with zero external network latency
    this.textures = {
      sandstone: createSandstoneTexture(512, 512),
      marble: createMarbleTexture(512, 512),
      granite: createGraniteTexture(512, 512),
      jaali: createJaaliTexture(256, 256),
      starfield: createStarfieldTexture(1024, 512)
    };
  }

  createSkyDome() {
    // Hemisphere sky dome that smoothly interpolates between day gradient and starlight
    const skyGeo = new THREE.SphereGeometry(320, 32, 24);
    
    this.skyDayMat = new THREE.MeshBasicMaterial({
      color: 0xfce4c8,
      side: THREE.BackSide,
      fog: false
    });

    this.skyNightMat = new THREE.MeshBasicMaterial({
      map: this.textures.starfield,
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      opacity: 0
    });

    this.skyDomeDay = new THREE.Mesh(skyGeo, this.skyDayMat);
    this.skyDomeNight = new THREE.Mesh(skyGeo, this.skyNightMat);
    this.scene.add(this.skyDomeDay);
    this.scene.add(this.skyDomeNight);
  }

  createTerrainAndHills() {
    // Main courtyard terrace ground
    const groundGeo = new THREE.PlaneGeometry(320, 320, 48, 48);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);
      if (distFromCenter > 32) {
        // Natural desert dunes around periphery
        const zNoise = (Math.sin(vx * 0.045) + Math.cos(vy * 0.045)) * 4.2;
        pos.setZ(i, Math.max(0, zNoise));
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.sandstone,
      roughness: 0.85,
      metalness: 0.05,
      color: 0xd89f66
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Distant Aravalli Mountain Ranges (stylized conical ridges)
    const mountainGroup = new THREE.Group();
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x9b6a43,
      roughness: 0.9,
      flatShading: true
    });

    const numPeaks = this.isMobile ? 12 : 20;
    for (let i = 0; i < numPeaks; i++) {
      const radius = 25 + Math.random() * 35;
      const height = 40 + Math.random() * 55;
      const coneGeo = new THREE.ConeGeometry(radius, height, 5);
      const peak = new THREE.Mesh(coneGeo, mountainMat);

      const angle = (i / numPeaks) * Math.PI * 2 + Math.random() * 0.25;
      const dist = 130 + Math.random() * 70;
      peak.position.set(
        Math.cos(angle) * dist,
        height / 2 - 10,
        Math.sin(angle) * dist
      );
      peak.rotation.y = Math.random() * Math.PI;
      mountainGroup.add(peak);
    }
    this.scene.add(mountainGroup);
  }

  createJawaiBoulders() {
    // Stylized Jawai granite monoliths flanking the courtyard
    const boulderMat = new THREE.MeshStandardMaterial({
      map: this.textures.granite,
      roughness: 0.75,
      metalness: 0.1,
      bumpMap: this.textures.granite,
      bumpScale: 0.06
    });

    const boulderPositions = [
      { x: -36, y: 5, z: 10, s: 9, rz: 0.2 },
      { x: -46, y: 8, z: -15, s: 14, rz: -0.1 },
      { x: -28, y: 3, z: 26, s: 6, rz: 0.4 },
      { x: 38, y: 6, z: 12, s: 10, rz: -0.3 },
      { x: 48, y: 11, z: -20, s: 16, rz: 0.15 },
      { x: 28, y: 4, z: 30, s: 7, rz: -0.2 }
    ];

    this.boulders = new THREE.Group();
    boulderPositions.forEach(p => {
      const geo = new THREE.DodecahedronGeometry(p.s, 1);
      const mesh = new THREE.Mesh(geo, boulderMat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, p.rz);
      mesh.castShadow = !this.isMobile;
      mesh.receiveShadow = true;
      this.boulders.add(mesh);
    });
    this.scene.add(this.boulders);
  }

  createHaveliPavilion() {
    // Stylized Rajasthani Heritage Baradari (12-pillar pavilion with marble domes)
    this.pavilion = new THREE.Group();

    const marbleMat = new THREE.MeshStandardMaterial({
      map: this.textures.marble,
      roughness: 0.35,
      metalness: 0.05,
      color: 0xfbf9f5
    });

    const sandstoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.sandstone,
      roughness: 0.7,
      metalness: 0.05,
      color: 0xe0a976
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdfab37,
      roughness: 0.25,
      metalness: 0.85
    });

    // 1. Plinth Platform
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(34, 1.8, 28), sandstoneMat);
    plinth.position.set(0, 0.9, 0);
    plinth.receiveShadow = true;
    plinth.castShadow = !this.isMobile;
    this.pavilion.add(plinth);

    // 2. Pillars & Capitals
    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.55, 7.5, 10);
    const capGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);

    const pillarCoords = [
      [-12, -8], [-6, -8], [0, -8], [6, -8], [12, -8],
      [-12, 8], [-6, 8], [0, 8], [6, 8], [12, 8],
      [-12, 0], [12, 0]
    ];

    pillarCoords.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, marbleMat);
      pillar.position.set(px, 5.5, pz);
      pillar.castShadow = !this.isMobile;
      pillar.receiveShadow = true;

      const cap = new THREE.Mesh(capGeo, marbleMat);
      cap.position.set(px, 9.2, pz);
      cap.castShadow = !this.isMobile;

      const base = new THREE.Mesh(capGeo, marbleMat);
      base.position.set(px, 1.9, pz);
      base.receiveShadow = true;

      this.pavilion.add(pillar);
      this.pavilion.add(cap);
      this.pavilion.add(base);
    });

    // 3. Arch Lintels
    const lintelGeo = new THREE.BoxGeometry(6.2, 0.6, 1.0);
    for (let i = -1; i <= 1; i++) {
      const archFront = new THREE.Mesh(lintelGeo, sandstoneMat);
      archFront.position.set(i * 6, 8.8, 8);
      this.pavilion.add(archFront);

      const archBack = new THREE.Mesh(lintelGeo, sandstoneMat);
      archBack.position.set(i * 6, 8.8, -8);
      this.pavilion.add(archBack);
    }

    // 4. Jaali Screens on Sides
    const jaaliMat = new THREE.MeshStandardMaterial({
      map: this.textures.jaali,
      roughness: 0.8,
      color: 0xdeb887,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    });
    const jaaliGeo = new THREE.PlaneGeometry(5.2, 6.0);

    const leftJaali = new THREE.Mesh(jaaliGeo, jaaliMat);
    leftJaali.position.set(-12, 5.5, -4);
    leftJaali.rotation.y = Math.PI / 2;
    this.pavilion.add(leftJaali);

    const rightJaali = new THREE.Mesh(jaaliGeo, jaaliMat);
    rightJaali.position.set(12, 5.5, -4);
    rightJaali.rotation.y = Math.PI / 2;
    this.pavilion.add(rightJaali);

    // 5. Grand Cornice (Chhajja)
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(32, 0.8, 24), sandstoneMat);
    cornice.position.set(0, 9.7, 0);
    cornice.castShadow = !this.isMobile;
    this.pavilion.add(cornice);

    // 6. Central Chhatri Dome & Finials
    const domeGeo = new THREE.SphereGeometry(3.5, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const centerDome = new THREE.Mesh(domeGeo, marbleMat);
    centerDome.position.set(0, 10.1, 0);
    centerDome.scale.set(1.1, 1.4, 1.1);
    centerDome.castShadow = !this.isMobile;
    this.pavilion.add(centerDome);

    const finialGeo = new THREE.ConeGeometry(0.3, 2.2, 8);
    const finial = new THREE.Mesh(finialGeo, goldMat);
    finial.position.set(0, 15.6, 0);
    this.pavilion.add(finial);

    // 4 Corner Chhatris
    const cornerOffsets = [
      [-13, -9], [13, -9], [-13, 9], [13, 9]
    ];
    const miniDomeGeo = new THREE.SphereGeometry(1.6, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    cornerOffsets.forEach(([cx, cz]) => {
      const miniDome = new THREE.Mesh(miniDomeGeo, marbleMat);
      miniDome.position.set(cx, 10.1, cz);
      miniDome.scale.set(1, 1.3, 1);
      miniDome.castShadow = !this.isMobile;

      const miniFinial = new THREE.Mesh(finialGeo, goldMat);
      miniFinial.scale.set(0.6, 0.6, 0.6);
      miniFinial.position.set(cx, 12.8, cz);

      this.pavilion.add(miniDome);
      this.pavilion.add(miniFinial);
    });

    this.scene.add(this.pavilion);
  }

  createStepwellWater() {
    // Stepped reflection pool (Baori / Kund)
    this.stepwellGroup = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.sandstone,
      roughness: 0.8,
      color: 0xba8855
    });

    // 3 Stepped tiers
    for (let s = 0; s < 3; s++) {
      const outerW = 22 - s * 1.5;
      const outerD = 14 - s * 1.5;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(outerW, 0.5, outerD), stoneMat);
      frame.position.set(0, 0.2 - s * 0.4, 22);
      this.stepwellGroup.add(frame);
    }

    // Mirror Water Plane
    const waterGeo = new THREE.PlaneGeometry(18, 10, 16, 16);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0e2f44,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, 0.25, 22);
    this.stepwellGroup.add(this.waterMesh);

    // Floating Brass Urli Bowl
    const urliGeo = new THREE.TorusGeometry(0.8, 0.15, 10, 20);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2
    });
    const urli = new THREE.Mesh(urliGeo, goldMat);
    urli.rotation.x = Math.PI / 2;
    urli.position.set(0, 0.35, 22);
    this.stepwellGroup.add(urli);

    this.scene.add(this.stepwellGroup);
  }

  createLighting() {
    // 1. Ambient Light (Soft Desert Sky Fill)
    this.ambientLight = new THREE.AmbientLight(0xffecd2, 0.7);
    this.scene.add(this.ambientLight);

    // 2. Golden Hour Sun (Main Key Light)
    this.sunLight = new THREE.DirectionalLight(0xffaa5e, 2.2);
    this.sunLight.position.set(45, 38, 50);
    if (!this.isMobile) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 160;
      this.sunLight.shadow.camera.left = -35;
      this.sunLight.shadow.camera.right = 35;
      this.sunLight.shadow.camera.top = 35;
      this.sunLight.shadow.camera.bottom = -35;
    }
    this.scene.add(this.sunLight);

    // 3. Hemisphere bounce light
    this.hemiLight = new THREE.HemisphereLight(0xfff3e0, 0x8a5b32, 0.6);
    this.scene.add(this.hemiLight);

    // 4. Night Lanterns (Warm glowing point lights)
    this.lanternLights = [];
    this.lanternMeshes = [];

    const lanternPositions = [
      [-12, 4.5, 8],
      [12, 4.5, 8],
      [-12, 4.5, -8],
      [12, 4.5, -8],
      [0, 5.0, 0],
      [-8, 1.2, 17],
      [8, 1.2, 17]
    ];

    const lanternGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const lanternGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.9
    });

    lanternPositions.forEach(lp => {
      const pLight = new THREE.PointLight(0xff9e2c, 0, 16, 1.2);
      pLight.position.set(lp[0], lp[1], lp[2]);

      const bulb = new THREE.Mesh(lanternGeo, lanternGlowMat);
      bulb.position.copy(pLight.position);

      this.scene.add(pLight);
      this.scene.add(bulb);
      this.lanternLights.push(pLight);
      this.lanternMeshes.push(bulb);
    });
  }

  createParticles() {
    // Adaptive particle count: 80 on mobile, 220 on desktop for optimal frame budget
    const particleCount = this.isMobile ? 80 : 220;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = 1.0 + Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      speeds[i * 3] = (Math.random() - 0.5) * 0.02;
      speeds[i * 3 + 1] = 0.005 + Math.random() * 0.015;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleSpeeds = speeds;

    this.particleMat = new THREE.PointsMaterial({
      color: 0xffd166,
      size: this.isMobile ? 0.8 : 0.65,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particles);
  }

  setupScrollAnimation() {
    // Skip scroll camera scrub if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Cinematic scroll camera path orchestrated with GSAP ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2
      }
    });

    // Step 1: Hero -> About (Camera swoops down closer to the courtyard)
    tl.to(this.camera.position, {
      x: -6,
      y: 8.5,
      z: 32,
      ease: 'none'
    }, 0);
    tl.to(this.cameraTarget, {
      x: 0,
      y: 5.0,
      z: 4,
      ease: 'none'
    }, 0);

    // Step 2: About -> Rooms & Suites (Glide past arches and reflection pool)
    tl.to(this.camera.position, {
      x: 10,
      y: 6.0,
      z: 18,
      ease: 'none'
    }, 0.35);
    tl.to(this.cameraTarget, {
      x: -4,
      y: 5.5,
      z: -2,
      ease: 'none'
    }, 0.35);

    // Step 3: Rooms -> Experiences (Pan around granite boulders)
    tl.to(this.camera.position, {
      x: -14,
      y: 12.0,
      z: 22,
      ease: 'none'
    }, 0.65);
    tl.to(this.cameraTarget, {
      x: 2,
      y: 6.0,
      z: 0,
      ease: 'none'
    }, 0.65);

    // Step 4: Experiences -> Location/Footer (Rise towards horizon starlight)
    tl.to(this.camera.position, {
      x: 0,
      y: 24.0,
      z: 46,
      ease: 'none'
    }, 1.0);
    tl.to(this.cameraTarget, {
      x: 0,
      y: 12.0,
      z: -10,
      ease: 'none'
    }, 1.0);
  }

  setupInteractions() {
    // Desktop Mouse Parallax (Never hijacks scroll)
    const onMouseMove = (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      this.mouse.targetX = (e.clientX - halfW) / halfW;
      this.mouse.targetY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Window Resize Handler
    this.onResize = () => {
      if (!this.container || this.disposed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', this.onResize);
  }

  setDayNight(isNight, duration = 1.6) {
    this.isNight = isNight;

    if (isNight) {
      // Transition to Midnight Starlight
      gsap.to(this.scene.fog.color, {
        r: this.nightFogColor.r,
        g: this.nightFogColor.g,
        b: this.nightFogColor.b,
        duration
      });
      gsap.to(this.ambientLight, {
        intensity: 0.18,
        duration
      });
      gsap.to(this.ambientLight.color, {
        r: 0.2, g: 0.3, b: 0.6,
        duration
      });
      gsap.to(this.sunLight, {
        intensity: 0.15,
        duration
      });
      gsap.to(this.sunLight.color, {
        r: 0.3, g: 0.45, b: 0.8,
        duration
      });
      gsap.to(this.skyNightMat, {
        opacity: 1.0,
        duration
      });
      gsap.to(this.particleMat, {
        size: 0.9,
        opacity: 0.95,
        duration
      });

      // Ignite courtyard lanterns
      this.lanternLights.forEach(light => {
        gsap.to(light, {
          intensity: 2.8,
          duration: duration * 0.8,
          delay: 0.2
        });
      });
      this.lanternMeshes.forEach(mesh => {
        mesh.material.color.set(0xffbe3b);
      });
    } else {
      // Transition to Warm Golden Hour
      gsap.to(this.scene.fog.color, {
        r: this.dayFogColor.r,
        g: this.dayFogColor.g,
        b: this.dayFogColor.b,
        duration
      });
      gsap.to(this.ambientLight, {
        intensity: 0.7,
        duration
      });
      gsap.to(this.ambientLight.color, {
        r: 1.0, g: 0.92, b: 0.82,
        duration
      });
      gsap.to(this.sunLight, {
        intensity: 2.2,
        duration
      });
      gsap.to(this.sunLight.color, {
        r: 1.0, g: 0.66, b: 0.37,
        duration
      });
      gsap.to(this.skyNightMat, {
        opacity: 0.0,
        duration
      });
      gsap.to(this.particleMat, {
        size: 0.65,
        opacity: 0.75,
        duration
      });

      // Extinguish lantern lights
      this.lanternLights.forEach(light => {
        gsap.to(light, {
          intensity: 0.0,
          duration
        });
      });
      this.lanternMeshes.forEach(mesh => {
        mesh.material.color.set(0xffe29a);
      });
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.clock.getDelta(); // reset delta clock
    }
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);

    // Skip computation when paused (e.g. room viewer open or tab hidden)
    if (this.isPaused) return;

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Mouse Parallax Smoothing
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    const parallaxX = this.mouse.x * 2.8;
    const parallaxY = -this.mouse.y * 1.6;

    // Apply lookAt target
    this.camera.lookAt(this.cameraTarget);

    // 2. Animate Water Ripples
    if (this.waterMesh) {
      this.waterMesh.rotation.z = Math.sin(time * 0.4) * 0.02;
    }

    // 3. Floating Dust & Firefly Simulation
    if (this.particles) {
      const posAttr = this.particles.geometry.attributes.position;
      const posArr = posAttr.array;
      const speeds = this.particleSpeeds;

      for (let i = 0; i < posArr.length / 3; i++) {
        posArr[i * 3] += speeds[i * 3] + Math.sin(time + i) * 0.008;
        posArr[i * 3 + 1] += speeds[i * 3 + 1];
        posArr[i * 3 + 2] += speeds[i * 3 + 2] + Math.cos(time + i) * 0.008;

        if (posArr[i * 3 + 1] > 24) {
          posArr[i * 3 + 1] = 1.0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 4. Subtle Lantern Flicker at Night
    if (this.isNight && this.lanternLights.length > 0) {
      this.lanternLights.forEach((light, i) => {
        const flicker = Math.sin(time * 8 + i * 2.5) * 0.18 + Math.cos(time * 12 + i) * 0.12;
        light.intensity = 2.8 + flicker;
      });
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    ScrollTrigger.getAll().forEach(t => t.kill());

    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
