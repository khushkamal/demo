import * as THREE from 'three';

/**
 * --------------------------------------------------------------------------
 * 360° EQUIRECTANGULAR PANORAMA VIEWER (Three.js)
 * --------------------------------------------------------------------------
 * Features:
 * - Equirectangular photo sphere mapping
 * - Mouse drag & touch pan orbit controls with inertia
 * - Scroll wheel zoom (clamped FOV 35° to 75°)
 * - Single WebGL lifecycle: full disposal of geometry, textures, and canvas
 */
export class PanoramaViewer {
  constructor(canvasContainer, suiteId = 'marble', onReady) {
    this.container = canvasContainer;
    this.suiteId = suiteId;
    this.onReady = onReady || (() => {});
    this.disposed = false;
    this.isUserInteracting = false;
    
    this.lon = 0;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;
    this.targetLon = 0;
    this.targetLat = 0;

    this.onPointerDownPointerX = 0;
    this.onPointerDownPointerY = 0;
    this.onPointerDownLon = 0;
    this.onPointerDownLat = 0;

    this.fov = 65;

    this.init();
  }

  init() {
    if (!this.container) return;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    const maxDpr = isMobile ? 1.5 : 2.0;

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera & Scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.container.clientWidth / this.container.clientHeight,
      1,
      1100
    );
    this.camera.target = new THREE.Vector3(0, 0, 0);

    // 3. Sphere Geometry (Inverted normals for interior viewing)
    this.geometry = new THREE.SphereGeometry(500, 60, 40);
    this.geometry.scale(-1, 1, 1);

    // 4. Texture Loader
    const textureLoader = new THREE.TextureLoader();
    
    // Pick appropriate image or default panorama
    const imagePath = '/images/panorama-suite.jpg';

    textureLoader.load(
      imagePath,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        this.material = new THREE.MeshBasicMaterial({ map: texture });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        if (this.onReady) this.onReady();
      },
      undefined,
      (err) => {
        console.warn('Could not load panorama texture, using fallback ambient room:', err);
        // Fallback smooth warm ambient texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2A2421';
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = '#F6F0E6';
        ctx.font = '24px Cormorant Garamond, serif';
        ctx.fillText('360° Suite View (Sample Prototype)', 340, 256);
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        this.material = new THREE.MeshBasicMaterial({ map: fallbackTexture });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        if (this.onReady) this.onReady();
      }
    );

    // 5. Event Listeners
    this.setupListeners();

    // 6. Animation loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  setupListeners() {
    this.onPointerDown = (event) => {
      if (event.isPrimary === false) return;
      this.isUserInteracting = true;

      this.onPointerDownPointerX = event.clientX;
      this.onPointerDownPointerY = event.clientY;

      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      document.addEventListener('pointermove', this.onPointerMove);
      document.addEventListener('pointerup', this.onPointerUp);
    };

    this.onPointerMove = (event) => {
      if (event.isPrimary === false) return;
      this.targetLon = (this.onPointerDownPointerX - event.clientX) * 0.15 + this.onPointerDownLon;
      this.targetLat = (event.clientY - this.onPointerDownPointerY) * 0.15 + this.onPointerDownLat;
    };

    this.onPointerUp = (event) => {
      if (event.isPrimary === false) return;
      this.isUserInteracting = false;
      document.removeEventListener('pointermove', this.onPointerMove);
      document.removeEventListener('pointerup', this.onPointerUp);
    };

    this.onWheel = (event) => {
      event.preventDefault();
      this.fov += event.deltaY * 0.05;
      this.fov = Math.max(35, Math.min(75, this.fov));
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    };

    this.onResize = () => {
      if (!this.container || this.disposed) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };

    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  animate() {
    if (this.disposed) return;

    if (!this.isUserInteracting) {
      this.targetLon += 0.03; // Gentle slow ambient rotation
    }

    // Smooth interpolation
    this.lon += (this.targetLon - this.lon) * 0.1;
    this.lat += (this.targetLat - this.lat) * 0.1;

    this.lat = Math.max(-85, Math.min(85, this.lat));
    this.phi = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    const x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
    const y = 500 * Math.cos(this.phi);
    const z = 500 * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.lookAt(x, y, z);
    this.renderer.render(this.scene, this.camera);

    this.animId = requestAnimationFrame(this.animate);
  }

  dispose() {
    this.disposed = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.onPointerDown);
      this.container.removeEventListener('wheel', this.onWheel);
    }
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);

    if (this.geometry) this.geometry.dispose();
    if (this.material) {
      if (this.material.map) this.material.map.dispose();
      this.material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
