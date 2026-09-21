import * as THREE from 'three';

/**
 * --------------------------------------------------------------------------
 * HERO ATMOSPHERE LAYER (Subtle Three.js Enhancement)
 * --------------------------------------------------------------------------
 * Features:
 * - Gentle floating dust motes / sunbeam particles over the editorial photo
 * - Subtle mouse parallax & inertia
 * - Automatically pauses rendering when off-screen or tab hidden
 * - Caps pixel ratio at 2.0 (1.5 on mobile)
 * - Safe fallback if WebGL fails or prefers-reduced-motion is active
 */
export class HeroScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.isPaused = false;
    this.disposed = false;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Do not initialize WebGL if reduced motion is requested
      return;
    }

    try {
      this.init();
    } catch (err) {
      console.warn('HeroScene WebGL initialization skipped/failed:', err);
    }
  }

  init() {
    if (!this.container) return;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 15);

    // 3. Subtle Warm Ambient Dust Particles
    const count = this.isMobile ? 35 : 75;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = Math.random() * 0.8 + 0.4;
      speeds[i] = Math.random() * 0.3 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scales = scales;
    this.speeds = speeds;

    // Particle texture (soft circular glow)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 235, 205, 0.9)');
    grad.addColorStop(0.4, 'rgba(235, 200, 150, 0.35)');
    grad.addColorStop(1, 'rgba(235, 200, 150, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: this.isMobile ? 0.35 : 0.45,
      map: texture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // 4. Mouse Move Listener
    this.onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouse.targetX = normX * 0.6;
      this.mouse.targetY = normY * 0.4;
    };
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });

    // 5. Resize Listener
    this.onResize = () => {
      if (!this.container || this.disposed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize, { passive: true });

    // 6. Intersection Observer to Pause when out of view
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.resume();
          } else {
            this.pause();
          }
        });
      }, { threshold: 0.05 });
      this.observer.observe(this.container);
    }

    // 7. Animation Loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  animate() {
    if (this.disposed) return;

    if (!this.isPaused) {
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Smooth mouse interpolation
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

      this.camera.position.x = this.mouse.x * 1.2;
      this.camera.position.y = this.mouse.y * 0.8;
      this.camera.lookAt(0, 0, 0);

      // Gentle particle drift
      if (this.particles) {
        const posAttr = this.particles.geometry.attributes.position;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          let y = posAttr.getY(i);
          y += this.speeds[i] * 0.015;
          if (y > 7) y = -7;
          posAttr.setY(i, y);

          let x = posAttr.getX(i);
          x += Math.sin(elapsed * 0.5 + i) * 0.003;
          posAttr.setX(i, x);
        }
        posAttr.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    this.animId = requestAnimationFrame(this.animate);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.disposed) return;
    this.isPaused = false;
    this.clock.start();
  }

  dispose() {
    this.disposed = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
