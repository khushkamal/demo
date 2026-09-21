import * as THREE from 'three';
import {
  createSandstoneTexture,
  createMarbleTexture,
  createGraniteTexture,
  createJaaliTexture
} from '../utils/proceduralTextures.js';

/**
 * --------------------------------------------------------------------------
 * INTERACTIVE 3D ROOM & SUITE VIEWER (Three.js)
 * --------------------------------------------------------------------------
 * Features:
 * 1. Procedural Luxury Rajasthani Suite architecture (canopy bed, jaali windows, brass lamps, kilim rug).
 * 2. 360-degree Orbit & Zoom controls via mouse / single-touch drag.
 * 3. Lifecycle awareness: pause/resume hooks to stop rendering when hidden or inactive.
 * 4. Room preset switcher: Jawai Royal Tent, Marble Sanctum Suite, Rabari Heritage Villa.
 */
export class RoomViewer {
  constructor(canvasContainer, onSceneReady) {
    this.container = canvasContainer;
    this.onSceneReady = onSceneReady || (() => {});
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationSpeed = 0.005;
    this.autoRotate = true;
    this.isPaused = false;
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.disposed = false;

    this.init();
  }

  init() {
    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      42,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      120
    );
    this.camera.position.set(14, 11, 16);
    this.cameraTarget = new THREE.Vector3(0, 3.2, 0);
    this.camera.lookAt(this.cameraTarget);

    // 3. Textures
    this.textures = {
      sandstone: createSandstoneTexture(256, 256),
      marble: createMarbleTexture(256, 256),
      granite: createGraniteTexture(256, 256),
      jaali: createJaaliTexture(256, 256)
    };

    // 4. Room Model Hierarchy
    this.roomGroup = new THREE.Group();
    this.scene.add(this.roomGroup);

    this.buildSuite('tent');
    this.setupLighting();
    this.setupControls();

    if (this.onSceneReady) {
      this.onSceneReady();
    }

    // 5. Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildSuite(preset = 'tent') {
    // Clear previous elements
    while (this.roomGroup.children.length > 0) {
      this.roomGroup.remove(this.roomGroup.children[0]);
    }

    const isMarble = preset === 'marble';
    const isRabari = preset === 'rabari';

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({
      color: isMarble ? 0x2b1d14 : 0x4a2c11,
      roughness: 0.45,
      metalness: 0.1
    });

    const fabricMat = new THREE.MeshStandardMaterial({
      color: isMarble ? 0xfbf9f5 : (isRabari ? 0xfffaed : 0xf4ede2),
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: isRabari ? 0xb84a28 : (isMarble ? 0x4a6b6c : 0x9e2a2b),
      roughness: 0.7
    });

    const floorMat = new THREE.MeshStandardMaterial({
      map: isMarble ? this.textures.marble : this.textures.sandstone,
      roughness: isMarble ? 0.35 : 0.65,
      metalness: 0.05
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: isMarble ? 0xf8f6f0 : 0xfdf8f2,
      roughness: 0.85
    });

    // 1. Floor Platform
    const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 14), floorMat);
    floor.position.set(0, -0.3, 0);
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // 2. Back & Left Walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 0.6), wallMat);
    backWall.position.set(0, 4.2, -7);
    backWall.receiveShadow = true;
    this.roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9, 14), wallMat);
    leftWall.position.set(-8, 4.2, 0);
    leftWall.receiveShadow = true;
    this.roomGroup.add(leftWall);

    // 3. Jaali Lattice Window
    const jaaliMat = new THREE.MeshStandardMaterial({
      map: this.textures.jaali,
      color: 0xdeb887,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    });
    const windowJaali = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.0), jaaliMat);
    windowJaali.position.set(-7.68, 4.5, 0);
    windowJaali.rotation.y = Math.PI / 2;
    this.roomGroup.add(windowJaali);

    // 4. Four-Poster Royal Canopy Bed
    const bedGroup = new THREE.Group();

    // Bed Base & Mattress
    const bedBase = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.9, 7.4), woodMat);
    bedBase.position.set(0, 0.75, -1.8);
    bedBase.castShadow = !this.isMobile;
    bedBase.receiveShadow = true;
    bedGroup.add(bedBase);

    const mattress = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.8, 7.0), fabricMat);
    mattress.position.set(0, 1.4, -1.8);
    mattress.castShadow = !this.isMobile;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);

    // Bed Silk Runner
    const runner = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.82, 2.0), accentMat);
    runner.position.set(0, 1.41, 0.2);
    bedGroup.add(runner);

    // Pillows & Bolsters
    for (let px of [-1.8, 0, 1.8]) {
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.2), fabricMat);
      pillow.position.set(px, 1.9, -4.2);
      pillow.rotation.x = 0.25;
      pillow.castShadow = !this.isMobile;
      bedGroup.add(pillow);

      const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 12), accentMat);
      bolster.rotation.z = Math.PI / 2;
      bolster.position.set(px, 2.05, -3.2);
      bedGroup.add(bolster);
    }

    // 4 Carved Wooden Corner Posts
    const postCoords = [
      [-3.1, -5.4], [3.1, -5.4],
      [-3.1, 1.8], [3.1, 1.8]
    ];
    postCoords.forEach(([cx, cz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 7.0, 10), woodMat);
      post.position.set(cx, 3.5, cz);
      post.castShadow = !this.isMobile;
      bedGroup.add(post);

      const brassCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), goldMat);
      brassCap.position.set(cx, 7.05, cz);
      bedGroup.add(brassCap);
    });

    // Canopy Roof & Drapery
    const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.15, 7.4), woodMat);
    canopyFrame.position.set(0, 7.0, -1.8);
    bedGroup.add(canopyFrame);

    const canopyCloth = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 7.2), fabricMat);
    canopyCloth.position.set(0, 6.95, -1.8);
    canopyCloth.rotation.x = Math.PI / 2;
    bedGroup.add(canopyCloth);

    this.roomGroup.add(bedGroup);

    // 5. Kilim / Woven Carpet
    const rugMat = new THREE.MeshStandardMaterial({
      color: isRabari ? 0xa83b24 : 0x7c3427,
      roughness: 0.95
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 6.0), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.02, 2.5);
    rug.receiveShadow = true;
    this.roomGroup.add(rug);

    // 6. Beside Tables & Table Lamps
    [-4.5, 4.5].forEach(nx => {
      const nightstand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), woodMat);
      nightstand.position.set(nx, 0.7, -4.8);
      nightstand.castShadow = !this.isMobile;
      nightstand.receiveShadow = true;
      this.roomGroup.add(nightstand);

      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.0, 10), goldMat);
      lampBase.position.set(nx, 1.8, -4.8);
      lampBase.castShadow = !this.isMobile;
      this.roomGroup.add(lampBase);

      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 12, 1, true), fabricMat);
      shade.position.set(nx, 2.3, -4.8);
      this.roomGroup.add(shade);

      const pLight = new THREE.PointLight(0xffbe6f, 1.2, 8, 1.5);
      pLight.position.set(nx, 2.2, -4.8);
      this.roomGroup.add(pLight);
    });

    // 7. Hanging Brass Jharokha Lantern
    const lanternGlobe = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 1), goldMat);
    lanternGlobe.position.set(0, 5.2, 0);
    lanternGlobe.castShadow = !this.isMobile;
    this.roomGroup.add(lanternGlobe);

    const centerLight = new THREE.PointLight(0xffaa44, 2.0, 12, 1.2);
    centerLight.position.set(0, 5.0, 0);
    this.roomGroup.add(centerLight);

    // 8. Heritage Balcony Railing
    const railMat = new THREE.MeshStandardMaterial({
      map: this.textures.marble,
      roughness: 0.4
    });
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 0.6), railMat);
    railTop.position.set(0, 1.8, 6.7);
    this.roomGroup.add(railTop);

    for (let bx = -7; bx <= 7; bx += 1.4) {
      const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), railMat);
      baluster.position.set(bx, 0.9, 6.7);
      baluster.castShadow = !this.isMobile;
      this.roomGroup.add(baluster);
    }
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfff0dd, 0.9);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffc58a, 1.8);
    this.sunLight.position.set(12, 18, 15);
    if (!this.isMobile) {
      this.sunLight.castShadow = true;
    }
    this.scene.add(this.sunLight);
  }

  setupControls() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      this.roomGroup.rotation.y += deltaX * this.rotationSpeed;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch controls
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      this.roomGroup.rotation.y += deltaX * this.rotationSpeed * 1.5;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    dom.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Zoom
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.multiplyScalar(1 + e.deltaY * 0.001);
      const dist = this.camera.position.length();
      if (dist < 10) this.camera.position.setLength(10);
      if (dist > 35) this.camera.position.setLength(35);
    }, { passive: false });

    // Resize
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

  setPreset(preset) {
    this.buildSuite(preset);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    if (this.autoRotate && !this.isDragging) {
      this.roomGroup.rotation.y += 0.003;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
