// ==========================================================================
// EUREKA — Unified Topic-Aware Background Engine & Ambient Kinetic Typography
// Delivers the signature chromatic plasma aura, stardust, and 3D parallax
// across all pages, including when reading blog posts.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Trigger smooth website open animation & dismiss intro
  const introOverlay = document.getElementById('site-intro-overlay');
  if (introOverlay) {
    setTimeout(() => {
      introOverlay.classList.add('intro-hidden');
      document.body.classList.add('page-loaded');
    }, 1100);
  } else {
    requestAnimationFrame(() => {
      document.body.classList.add('page-loaded');
    });
  }

  const canvas = document.getElementById('dynamic-bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let animationId = null;

  // Topic detection: check body dataset
  const topic = document.body.dataset.topic || 'default';
  const isPost = document.body.dataset.page === 'post';
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  // 3D Parallax Typography Controller for .eureka-bg-letters
  const bgLettersContainer = document.querySelector('.eureka-bg-letters');

  const tilt = {
    currRotX: 0,
    currRotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    currTransX: 0,
    currTransY: 0,
    targetTransX: 0,
    targetTransY: 0
  };

  // Mouse tracking with smooth interpolation
  const mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    active: false
  };

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;

    if (width > 0 && height > 0) {
      const normX = (e.clientX / width) - 0.5; // -0.5 to 0.5
      const normY = (e.clientY / height) - 0.5;

      tilt.targetRotY = normX * 10;  // -5 to +5 deg
      tilt.targetRotX = -normY * 8;  // -4 to +4 deg
      tilt.targetTransX = normX * 24; // -12 to +12 px
      tilt.targetTransY = normY * 18;
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    tilt.targetRotX = 0;
    tilt.targetRotY = 0;
    tilt.targetTransX = 0;
    tilt.targetTransY = 0;
  });

  // Resize handler
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
  };

  window.addEventListener('resize', resize);
  resize();

  // Helper: Update 3D Parallax on EUREKA background watermark
  const updateTypographyParallax = () => {
    if (!bgLettersContainer) return;

    tilt.currRotX += (tilt.targetRotX - tilt.currRotX) * 0.05;
    tilt.currRotY += (tilt.targetRotY - tilt.currRotY) * 0.05;
    tilt.currTransX += (tilt.targetTransX - tilt.currTransX) * 0.05;
    tilt.currTransY += (tilt.targetTransY - tilt.currTransY) * 0.05;

    bgLettersContainer.style.transform = 
      `translate(calc(-50% + ${tilt.currTransX.toFixed(2)}px), calc(-50% + ${tilt.currTransY.toFixed(2)}px)) ` +
      `rotateX(${tilt.currRotX.toFixed(2)}deg) rotateY(${tilt.currRotY.toFixed(2)}deg)`;
  };

  // ========================================================================
  // UNIFIED CHROMATIC PLASMA ORBS CONFIGURATION (ADAPTS TO TOPIC & POST)
  // ========================================================================
  let orbs = [];

  if (topic === 'quantum') {
    // Quantum Palette: Deep Cerulean, Electric Cyan, Quantum Violet, Indigo
    orbs = [
      { color: dark => dark ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.14)', radius: 460, xFreq: 0.0006, yFreq: 0.0009, xPhase: 0, yPhase: 1 },
      { color: dark => dark ? 'rgba(124, 58, 237, 0.19)' : 'rgba(168, 85, 247, 0.12)', radius: 480, xFreq: 0.0008, yFreq: 0.0005, xPhase: 2, yPhase: 0.5 },
      { color: dark => dark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.11)', radius: 410, xFreq: 0.0005, yFreq: 0.0007, xPhase: 3.5, yPhase: 2.2 },
      { color: dark => dark ? 'rgba(56, 189, 248, 0.17)' : 'rgba(14, 165, 233, 0.10)', radius: 440, xFreq: 0.0007, yFreq: 0.0008, xPhase: 1.2, yPhase: 3 }
    ];
  } else if (topic === 'psychology') {
    // Psychology Palette: Amethyst Violet, Rose Fuchsia, Coral Crimson, Mindful Lavender
    orbs = [
      { color: dark => dark ? 'rgba(124, 58, 237, 0.22)' : 'rgba(168, 85, 247, 0.14)', radius: 460, xFreq: 0.0006, yFreq: 0.0009, xPhase: 0, yPhase: 1 },
      { color: dark => dark ? 'rgba(236, 72, 153, 0.20)' : 'rgba(236, 72, 153, 0.13)', radius: 480, xFreq: 0.0008, yFreq: 0.0005, xPhase: 2, yPhase: 0.5 },
      { color: dark => dark ? 'rgba(244, 63, 94, 0.18)' : 'rgba(244, 63, 94, 0.11)', radius: 420, xFreq: 0.0005, yFreq: 0.0007, xPhase: 3.5, yPhase: 2.2 },
      { color: dark => dark ? 'rgba(217, 70, 239, 0.16)' : 'rgba(217, 70, 239, 0.10)', radius: 440, xFreq: 0.0007, yFreq: 0.0008, xPhase: 1.2, yPhase: 3 }
    ];
  } else if (topic === 'rome') {
    // Roman Imperial Palette: Radiant Molten Gold, Tyrian Crimson, Sunlit Amber, Antique Bronze
    orbs = [
      { color: dark => dark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(217, 119, 6, 0.14)', radius: 480, xFreq: 0.0005, yFreq: 0.0008, xPhase: 0, yPhase: 1 },
      { color: dark => dark ? 'rgba(185, 28, 28, 0.18)' : 'rgba(190, 18, 60, 0.11)', radius: 500, xFreq: 0.0007, yFreq: 0.0004, xPhase: 2, yPhase: 0.5 },
      { color: dark => dark ? 'rgba(217, 119, 6, 0.17)' : 'rgba(245, 158, 11, 0.12)', radius: 420, xFreq: 0.0004, yFreq: 0.0006, xPhase: 3.5, yPhase: 2.2 },
      { color: dark => dark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(217, 119, 6, 0.10)', radius: 440, xFreq: 0.0006, yFreq: 0.0007, xPhase: 1.2, yPhase: 3 }
    ];
  } else {
    // General / Home Color Palette: Rainbow Chromatic
    orbs = [
      { color: dark => dark ? 'rgba(124, 58, 237, 0.13)' : 'rgba(168, 85, 247, 0.08)', radius: 380, xFreq: 0.0006, yFreq: 0.0009, xPhase: 0, yPhase: 1 },
      { color: dark => dark ? 'rgba(236, 72, 153, 0.11)' : 'rgba(236, 72, 153, 0.07)', radius: 420, xFreq: 0.0008, yFreq: 0.0005, xPhase: 2, yPhase: 0.5 },
      { color: dark => dark ? 'rgba(56, 189, 248, 0.09)' : 'rgba(14, 165, 233, 0.06)', radius: 330, xFreq: 0.0005, yFreq: 0.0007, xPhase: 3.5, yPhase: 2.2 },
      { color: dark => dark ? 'rgba(99, 102, 241, 0.11)' : 'rgba(99, 102, 241, 0.07)', radius: 390, xFreq: 0.0007, yFreq: 0.0008, xPhase: 1.2, yPhase: 3 }
    ];
  }

  // Sparkling Cosmic Stardust / Golden Embers (Runs on ALL pages)
  const stardustCount = Math.min(Math.floor((width * height) / (isPost ? 30000 : 25000)), 45);
  const stardust = [];
  for (let i = 0; i < stardustCount; i++) {
    stardust.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (topic === 'rome' ? 0.35 : (isPost ? 0.22 : 0.3)),
      vy: topic === 'rome' ? -(Math.random() * 0.45 + 0.15) : (Math.random() - 0.5) * (isPost ? 0.22 : 0.3),
      radius: topic === 'rome' ? Math.random() * 2.4 + 0.8 : Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.45 + 0.2,
      sparkleSpeed: 0.02 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      color: topic === 'quantum' 
        ? (Math.random() > 0.4 ? '#38bdf8' : '#a855f7')
        : topic === 'rome'
        ? (Math.random() > 0.6 ? '#fbbf24' : Math.random() > 0.3 ? '#f59e0b' : '#ef4444')
        : (Math.random() > 0.4 ? '#ec4899' : '#a855f7')
    });
  }

  // Floating Topic Elements: Quantum Glyphs & Physics Equations
  const quantumGlyphs = [];
  if (topic === 'quantum') {
    const glyphs = [
      '|Ψ⟩', 
      'ℏ = h/2π', 
      'e⁻', 
      '|0⟩ + |1⟩', 
      'Δx · Δp ≥ ℏ/2', 
      'iℏ ∂/∂t |Ψ⟩', 
      'E = mc²', 
      'λ = h/p', 
      'Ĥ|Ψ⟩ = E|Ψ⟩', 
      'SUPERPOSITION', 
      'ENTANGLEMENT', 
      'QUANTUM TUNNELING'
    ];
    const glyphCount = isPost ? 12 : 15;
    for (let i = 0; i < glyphCount; i++) {
      quantumGlyphs.push({
        text: glyphs[i % glyphs.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        fontSize: Math.floor(Math.random() * 6) + 13,
        opacity: isPost ? 0.12 : 0.16,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // Floating Topic Elements: Psychology & Attachment Concepts
  const psychologyGlyphs = [];
  const neuralNodes = [];
  if (topic === 'psychology') {
    const glyphs = [
      'ATTACHMENT THEORY',
      'SECURE BOND',
      'OXYTOCIN · DOPAMINE',
      'LIMBIC SYSTEM',
      'NEURAL PLASTICITY',
      'AMYGDALA',
      'SELF-REGULATION',
      'EMPATHY',
      'COGNITIVE COHERENCE',
      'INNER CHILD',
      'BOUNDARIES',
      'SAFE HAVEN'
    ];
    const glyphCount = isPost ? 12 : 15;
    for (let i = 0; i < glyphCount; i++) {
      psychologyGlyphs.push({
        text: glyphs[i % glyphs.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.20,
        vy: (Math.random() - 0.5) * 0.16,
        fontSize: Math.floor(Math.random() * 6) + 13,
        opacity: isPost ? 0.12 : 0.16,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Neural Synapse Nodes for Interpersonal Attachment
    const nodeCount = isPost ? 18 : 24;
    for (let i = 0; i < nodeCount; i++) {
      neuralNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.5 + 1.2
      });
    }
  }

  // Floating Topic Elements: Roman Classical Inscriptions & Mottos
  const romanGlyphs = [];
  if (topic === 'rome') {
    const glyphs = [
      'SPQR', 
      'PAX ROMANA', 
      'SENATVS POPVLVSQVE ROMANVS', 
      'ROMA INVICTA', 
      'AETERNITAS', 
      'AQVILA', 
      'LEGIO XII', 
      'VIA APPIA', 
      'MCMXXVI', 
      'ALEA IACTA EST', 
      'VBI CONCORDIA, IBI VICTORIA',
      'GLORIA ROMAE'
    ];
    const glyphCount = isPost ? 12 : 15;
    for (let i = 0; i < glyphCount; i++) {
      romanGlyphs.push({
        text: glyphs[i % glyphs.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18,
        fontSize: Math.floor(Math.random() * 8) + 14, // 14px to 21px
        opacity: isPost ? 0.12 : 0.16,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // Meditative Breathing Pulse Rings: Psychology
  const pulseRings = [];
  if (topic === 'psychology') {
    for (let i = 0; i < (isPost ? 3 : 5); i++) {
      pulseRings.push({
        x: width * (0.2 + (i / 4) * 0.6),
        y: height * (0.25 + (i % 2) * 0.5),
        maxRadius: 110 + i * 35,
        phase: i * 1.3
      });
    }
  }

  let engineTime = 0;

  // ========================================================================
  // UNIFIED RENDERING LOOP
  // ========================================================================
  const renderLoop = () => {
    ctx.clearRect(0, 0, width, height);
    engineTime += 16;
    const dark = isDark();

    // 1. Update 3D Parallax Typography
    updateTypographyParallax();

    // 2. Draw Chromatic Fluid Plasma Orbs
    orbs.forEach((orb) => {
      const cx = (width * 0.5) + Math.sin(engineTime * orb.xFreq + orb.xPhase) * (width * 0.34);
      const cy = (height * 0.4) + Math.cos(engineTime * orb.yFreq + orb.yPhase) * (height * 0.28);

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.radius);
      gradient.addColorStop(0, orb.color(dark));
      gradient.addColorStop(0.5, orb.color(dark).replace(/[\d\.]+\)$/, '0.03)'));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Interactive Cursor Halo & Ripple
    if (mouse.active) {
      const cursorGlow = ctx.createRadialGradient(
        mouse.targetX,
        mouse.targetY,
        0,
        mouse.targetX,
        mouse.targetY,
        280
      );
      cursorGlow.addColorStop(0, dark ? 'rgba(236, 72, 153, 0.09)' : 'rgba(168, 85, 247, 0.06)');
      cursorGlow.addColorStop(0.6, dark ? 'rgba(124, 58, 237, 0.03)' : 'rgba(236, 72, 153, 0.02)');
      cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(mouse.targetX, mouse.targetY, 280, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Topic Specific Ambiance: Quantum Glyphs & Atomic Orbitals
    if (topic === 'quantum' && quantumGlyphs.length > 0) {
      ctx.save();
      quantumGlyphs.forEach((g) => {
        g.x += g.vx;
        g.y += g.vy;
        if (g.x < -160) g.x = width + 160;
        if (g.x > width + 160) g.x = -160;
        if (g.y < -40) g.y = height + 40;
        if (g.y > height + 40) g.y = -40;

        const pulse = Math.sin(engineTime * 0.002 + g.phase) * 0.025;
        const totalOpacity = Math.max(0.04, g.opacity + pulse);

        ctx.font = `700 ${g.fontSize || 14}px "JetBrains Mono", monospace`;
        ctx.fillStyle = dark
          ? `rgba(56, 189, 248, ${totalOpacity})`
          : `rgba(2, 132, 199, ${totalOpacity * 0.9})`;
        ctx.fillText(g.text, g.x, g.y);
      });
      ctx.restore();

      // 4b. Subtle Quantum Atomic Orbitals & Probability Cloud Watermark
      ctx.save();
      const qCenterX = width * 0.5;
      const qCenterY = isPost ? 280 : height * 0.38;
      const qRadius = Math.min(width * 0.28, 230);
      const qAlpha = dark ? 0.08 : 0.05;

      ctx.strokeStyle = dark ? `rgba(56, 189, 248, ${qAlpha})` : `rgba(2, 132, 199, ${qAlpha * 0.8})`;
      ctx.lineWidth = 1.4;

      // 3 tilted elliptical orbits (0, 60, 120 degrees)
      [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((tiltAngle, oIdx) => {
        ctx.save();
        ctx.translate(qCenterX, qCenterY);
        ctx.rotate(tiltAngle + engineTime * 0.0003 * (oIdx % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, qRadius, qRadius * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Revolving electron particle
        const electronAngle = engineTime * 0.0018 * (oIdx + 1) + oIdx * 2;
        const ex = Math.cos(electronAngle) * qRadius;
        const ey = Math.sin(electronAngle) * (qRadius * 0.42);

        ctx.fillStyle = dark ? '#38bdf8' : '#0284c7';
        ctx.globalAlpha = dark ? 0.35 : 0.22;
        ctx.beginPath();
        ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Central nucleus wave glow
      const nucPulse = (Math.sin(engineTime * 0.003) + 1) / 2;
      ctx.fillStyle = dark ? `rgba(124, 58, 237, ${0.08 + nucPulse * 0.06})` : `rgba(99, 102, 241, ${0.05 + nucPulse * 0.04})`;
      ctx.beginPath();
      ctx.arc(qCenterX, qCenterY, 22 + nucPulse * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Topic Specific Ambiance: Psychology Concepts, Pulse Rings & Synaptic Axons
    if (topic === 'psychology') {
      // 5a. Floating Psychology Concepts
      if (psychologyGlyphs.length > 0) {
        ctx.save();
        psychologyGlyphs.forEach((g) => {
          g.x += g.vx;
          g.y += g.vy;
          if (g.x < -180) g.x = width + 180;
          if (g.x > width + 180) g.x = -180;
          if (g.y < -40) g.y = height + 40;
          if (g.y > height + 40) g.y = -40;

          const pulse = Math.sin(engineTime * 0.002 + g.phase) * 0.025;
          const totalOpacity = Math.max(0.04, g.opacity + pulse);

          ctx.font = `600 ${g.fontSize || 14}px "Lora", Georgia, serif`;
          ctx.fillStyle = dark
            ? `rgba(236, 72, 153, ${totalOpacity})`
            : `rgba(168, 85, 247, ${totalOpacity * 0.9})`;
          ctx.fillText(g.text, g.x, g.y);
        });
        ctx.restore();
      }

      // 5b. Meditative Concentric Breathing Pulse Rings
      if (pulseRings.length > 0) {
        pulseRings.forEach((r) => {
          const breathProgress = (Math.sin(engineTime * 0.0012 + r.phase) + 1) / 2;
          const radius = 25 + breathProgress * r.maxRadius;
          const alpha = (1 - breathProgress) * (dark ? (isPost ? 0.08 : 0.13) : (isPost ? 0.05 : 0.09));

          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = dark
            ? `rgba(236, 72, 153, ${alpha})`
            : `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        });
      }

      // 5c. Interpersonal Neural Synapse Nodes & Axon Connections
      if (neuralNodes.length > 0) {
        ctx.save();
        neuralNodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0) node.x = width;
          if (node.x > width) node.x = 0;
          if (node.y < 0) node.y = height;
          if (node.y > height) node.y = 0;

          if (mouse.active) {
            const mdx = mouse.targetX - node.x;
            const mdy = mouse.targetY - node.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < 120) {
              node.x -= (mdx / mDist) * 0.6;
              node.y -= (mdy / mDist) * 0.6;
            }
          }

          ctx.fillStyle = dark ? 'rgba(236, 72, 153, 0.28)' : 'rgba(168, 85, 247, 0.20)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        for (let i = 0; i < neuralNodes.length; i++) {
          for (let j = i + 1; j < neuralNodes.length; j++) {
            const dx = neuralNodes[i].x - neuralNodes[j].x;
            const dy = neuralNodes[i].y - neuralNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130) {
              const connAlpha = (1 - dist / 130) * (dark ? 0.13 : 0.08);
              ctx.strokeStyle = dark
                ? `rgba(236, 72, 153, ${connAlpha})`
                : `rgba(168, 85, 247, ${connAlpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(neuralNodes[i].x, neuralNodes[i].y);
              ctx.lineTo(neuralNodes[j].x, neuralNodes[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }
    }

    // 6. Topic Specific Ambiance: Roman Classical Inscriptions & Mottos
    if (topic === 'rome' && romanGlyphs.length > 0) {
      ctx.save();
      romanGlyphs.forEach((g) => {
        g.x += g.vx;
        g.y += g.vy;
        if (g.x < -200) g.x = width + 200;
        if (g.x > width + 200) g.x = -200;
        if (g.y < -50) g.y = height + 50;
        if (g.y > height + 50) g.y = -50;

        const pulse = Math.sin(engineTime * 0.002 + g.phase) * 0.025;
        const totalOpacity = Math.max(0.04, g.opacity + pulse);

        ctx.font = `700 ${g.fontSize || 16}px "Cinzel", "Lora", Georgia, serif`;
        ctx.fillStyle = dark
          ? `rgba(245, 158, 11, ${totalOpacity})`
          : `rgba(180, 83, 9, ${totalOpacity * 0.9})`;
        ctx.fillText(g.text, g.x, g.y);
      });
      ctx.restore();

      // 7. Subtle Classical Roman Laurel Wreath Watermark
      ctx.save();
      const centerX = width * 0.5;
      const centerY = isPost ? 280 : height * 0.38;
      const wreathRadius = Math.min(width * 0.28, 220);
      const wreathAlpha = dark ? 0.08 : 0.05;

      ctx.strokeStyle = dark ? `rgba(245, 158, 11, ${wreathAlpha})` : `rgba(180, 83, 9, ${wreathAlpha * 0.8})`;
      ctx.fillStyle = dark ? `rgba(245, 158, 11, ${wreathAlpha * 0.75})` : `rgba(217, 119, 6, ${wreathAlpha * 0.7})`;
      ctx.lineWidth = 1.5;

      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.ellipse(centerX + side * (wreathRadius * 0.55), centerY, wreathRadius * 0.55, wreathRadius * 0.85, side * 0.15, Math.PI * 0.5, Math.PI * 1.5, side === 1);
        ctx.stroke();

        for (let i = 0; i < 7; i++) {
          const t = i / 6;
          const angle = Math.PI * 0.6 + t * Math.PI * 0.8;
          const lx = centerX + side * (wreathRadius * 0.55 + Math.cos(angle) * wreathRadius * 0.45);
          const ly = centerY + Math.sin(angle) * wreathRadius * 0.8;

          ctx.beginPath();
          ctx.ellipse(lx, ly, 14, 6, angle + side * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 6. Sparkling Cosmic Stardust (Universal Across All Pages)
    stardust.forEach((star) => {
      star.x += star.vx;
      star.y += star.vy;
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      // Subtle cursor attraction
      if (mouse.active) {
        const dx = mouse.targetX - star.x;
        const dy = mouse.targetY - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          star.x += (dx / dist) * force * 0.5;
          star.y += (dy / dist) * force * 0.5;
        }
      }

      const twinkle = (Math.sin(engineTime * 0.002 * star.sparkleSpeed * 100 + star.phase) + 1) / 2;
      const currentAlpha = (star.alpha * (0.4 + twinkle * 0.6)) * (dark ? 1 : 0.65);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = currentAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    animationId = requestAnimationFrame(renderLoop);
  };

  animationId = requestAnimationFrame(renderLoop);
});
