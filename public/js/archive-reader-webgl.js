// ==========================================================================
// ARCHIVE READER — ThreeJS & WebGL Dot-Matrix Particle Field Engine
// Stack: ThreeJS (r128), WebGL
// Scene: Full-bleed background field with layered spatial depth
// Effect: Dot-matrix particle field (green on black, sparse spacing)
// Motion: Slow breathing pulse, timeline-led reveals
// Interaction: Pointer-reactive drift
// Render: WebGL, Renderer, alpha, antialias, DPR clamp (~75deg FOV)
// DOM Fallback: 2D Canvas graceful degradation
// ==========================================================================

(function initArchiveReaderWebGL() {
  function startEngine() {
    const canvas = document.getElementById('archive-reader-canvas');
    if (!canvas) return;

    // Check if WebGL & Three.js are available
    if (typeof THREE === 'undefined') {
      console.warn('[Archive Reader] Three.js not found, falling back to 2D matrix engine.');
      init2DFallback(canvas);
      return;
    }

    try {
      // 1. Renderer Setup with DPR Clamp, Alpha, Antialias
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(window.innerWidth, window.innerHeight);

      // 2. Perspective Camera (~75deg FOV)
      const fov = 75;
      const aspect = window.innerWidth / window.innerHeight;
      const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
      camera.position.set(0, 0, 110);

      // 3. Scene & Three-Point Lighting (Ambient + Key + Rim)
      const scene = new THREE.Scene();
      const ambientLight = new THREE.AmbientLight(0x0f291e, 0.9);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0x22c55e, 1.4);
      keyLight.position.set(40, 60, 80);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x00ff66, 0.8);
      rimLight.position.set(-60, -40, 50);
      scene.add(rimLight);

      // 4. Circular Soft Glow Dot Texture Generation (In-Memory Canvas)
      const dotCanvas = document.createElement('canvas');
      dotCanvas.width = 64;
      dotCanvas.height = 64;
      const dCtx = dotCanvas.getContext('2d');
      const grad = dCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(57, 255, 20, 0.9)');
      grad.addColorStop(0.65, 'rgba(34, 197, 94, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      dCtx.fillStyle = grad;
      dCtx.fillRect(0, 0, 64, 64);

      const dotTexture = new THREE.CanvasTexture(dotCanvas);
      dotTexture.generateMipmaps = false;
      dotTexture.minFilter = THREE.LinearFilter;

      // 5. Sparse Dot-Matrix Particle Field Construction
      // Layered spatial depth: multiple z-planes with retro-futurist sparse spacing
      const cols = 48;
      const rows = 32;
      const layers = 3;
      const totalParticles = cols * rows * layers;

      const positions = new Float32Array(totalParticles * 3);
      const originalY = new Float32Array(totalParticles);
      const colors = new Float32Array(totalParticles * 3);
      const baseSizes = new Float32Array(totalParticles);

      // Technical Green Palette: Matrix emerald, phosphor green, lime highlights
      const greenPalette = [
        new THREE.Color(0x00ff66), // Retro Matrix Green
        new THREE.Color(0x22c55e), // Emerald technical
        new THREE.Color(0x4ade80), // Soft depth green
        new THREE.Color(0x10b981), // Deep mint
        new THREE.Color(0x86efac)  // Bright node highlight
      ];

      let idx = 0;
      const xSpacing = 6.2;
      const ySpacing = 5.8;
      const zSpacing = 35.0;

      for (let l = 0; l < layers; l++) {
        const z = (l - 1) * zSpacing;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = (c - cols / 2) * xSpacing + (Math.random() - 0.5) * 0.8;
            const y = (r - rows / 2) * ySpacing + (Math.random() - 0.5) * 0.8;

            positions[idx * 3] = x;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = z + (Math.random() - 0.5) * 8.0;

            originalY[idx] = y;

            // Depth color fading: closer layers brighter, background deeper
            const depthFactor = 0.5 + (l / layers) * 0.5;
            const colorChoice = greenPalette[Math.floor(Math.random() * greenPalette.length)].clone();
            colorChoice.multiplyScalar(depthFactor);

            colors[idx * 3] = colorChoice.r;
            colors[idx * 3 + 1] = colorChoice.g;
            colors[idx * 3 + 2] = colorChoice.b;

            baseSizes[idx] = (3.2 + Math.random() * 2.2) * (0.7 + (l / layers) * 0.6);
            idx++;
          }
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // 6. Dot Particles Material + Soft Depth Fade
      const material = new THREE.PointsMaterial({
        size: 4.5,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.0, // Timeline reveal starts at 0
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);

      // 7. Timeline-Led Reveal Animation
      let timelineProgress = 0;
      const revealDuration = 1400; // ms
      const startTime = performance.now();

      canvas.classList.add('webgl-active');

      // 8. Interaction: Pointer-Reactive Drift
      const pointer = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
      };

      const onPointerMove = (e) => {
        const normX = (e.clientX / window.innerWidth) - 0.5;
        const normY = (e.clientY / window.innerHeight) - 0.5;
        pointer.targetX = normX * 18; // Max horizontal drift
        pointer.targetY = -normY * 12; // Max vertical drift
      };

      window.addEventListener('mousemove', onPointerMove, { passive: true });

      // 9. Resize Handler with DPR Clamp
      const onResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      };

      window.addEventListener('resize', onResize);

      // 10. Animation Loop: Breathing Pulse & Pointer Parallax Drift
      let clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        const now = performance.now();

        // Timeline reveal easing
        if (timelineProgress < 1.0) {
          timelineProgress = Math.min((now - startTime) / revealDuration, 1.0);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - timelineProgress, 3);
          material.opacity = eased * 0.88;
          particleSystem.scale.set(0.9 + eased * 0.1, 0.9 + eased * 0.1, 0.9 + eased * 0.1);
        } else {
          // Slow breathing pulse on opacity (0.76 to 0.94)
          const breathing = Math.sin(elapsedTime * 0.9) * 0.09;
          material.opacity = 0.85 + breathing;
        }

        // Pointer-reactive drift interpolation
        pointer.x += (pointer.targetX - pointer.x) * 0.045;
        pointer.y += (pointer.targetY - pointer.y) * 0.045;

        camera.position.x = pointer.x;
        camera.position.y = pointer.y;
        camera.lookAt(0, 0, 0);

        // Slow breathing pulse across dot-matrix height & subtle undulation
        const posAttr = geometry.attributes.position;
        const posArray = posAttr.array;

        for (let i = 0; i < totalParticles; i++) {
          const px = posArray[i * 3];
          const basePosY = originalY[i];

          // Gentle sine-wave technical breathing pulse
          const wave = Math.sin(px * 0.04 + elapsedTime * 0.8) * 1.8;
          posArray[i * 3 + 1] = basePosY + wave;
        }
        posAttr.needsUpdate = true;

        // Subtle overall rotation drift
        particleSystem.rotation.y = Math.sin(elapsedTime * 0.25) * 0.04 + (pointer.x * 0.003);
        particleSystem.rotation.x = Math.cos(elapsedTime * 0.2) * 0.025 + (-pointer.y * 0.003);

        renderer.render(scene, camera);
      }

      animate();

    } catch (err) {
      console.error('[Archive Reader WebGL Error]:', err);
      init2DFallback(canvas);
    }
  }

  // ========================================================================
  // DOM / 2D Canvas Fallback Engine
  // ========================================================================
  function init2DFallback(canvas) {
    canvas.classList.add('webgl-active');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const cols = 36;
    const rows = 24;
    let t = 0;

    const mouse = { x: width / 2, y: height / 2 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function renderFallback() {
      ctx.clearRect(0, 0, width, height);
      t += 0.02;

      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;

          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const pulse = (Math.sin(t + c * 0.15 + r * 0.15) + 1) / 2;
          const alpha = 0.15 + pulse * 0.45 * Math.max(0.2, 1 - dist / 600);

          ctx.beginPath();
          ctx.arc(x, y, 1.8 + pulse * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(renderFallback);
    }
    renderFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startEngine);
  } else {
    startEngine();
  }
})();
