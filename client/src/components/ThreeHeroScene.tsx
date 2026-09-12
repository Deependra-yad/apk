"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & Viewport Sizing (Strict Viewport Dimensions)
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Multi-Point Cyber Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 4.5, 30);
    cyanLight.position.set(6, 6, 7);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff4b82, 4.5, 30);
    pinkLight.position.set(-6, -5, 6);
    scene.add(pinkLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3.5, 25);
    purpleLight.position.set(0, 5, 5);
    scene.add(purpleLight);

    // 3. GENERATE CYBER SCREEN TEXTURE VIA HTML CANVAS
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 2048;
    const sCtx = screenCanvas.getContext('2d')!;

    const renderScreenTexture = (textIndex = 0) => {
      // Dark cyber-glass gradient background
      const bgGrad = sCtx.createLinearGradient(0, 0, 0, 2048);
      bgGrad.addColorStop(0, '#100a22');
      bgGrad.addColorStop(0.5, '#090514');
      bgGrad.addColorStop(1, '#130a26');
      sCtx.fillStyle = bgGrad;
      sCtx.fillRect(0, 0, 1024, 2048);

      // Top Status Bar
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 36px monospace';
      sCtx.fillText('9:41', 60, 80);
      sCtx.fillStyle = '#00f2fe';
      sCtx.font = 'bold 32px monospace';
      sCtx.fillText('LQ-ID: 2130-8255 • 256-bit E2EE', 280, 80);
      sCtx.fillStyle = '#10b981';
      sCtx.fillText('● 100%', 900, 80);

      // Header Bar
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      sCtx.fillRect(40, 130, 944, 150);
      sCtx.strokeStyle = 'rgba(255, 117, 151, 0.3)';
      sCtx.lineWidth = 3;
      sCtx.strokeRect(40, 130, 944, 150);

      // Avatar circle
      sCtx.beginPath();
      sCtx.arc(115, 205, 50, 0, Math.PI * 2);
      sCtx.fillStyle = '#ff4b82';
      sCtx.fill();
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 44px sans-serif';
      sCtx.fillText('🌸', 95, 220);

      // Header Title & Status
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 46px sans-serif';
      sCtx.fillText('Sakura (Tokyo)', 190, 195);
      sCtx.fillStyle = '#10b981';
      sCtx.font = '32px monospace';
      sCtx.fillText('● Curve25519 Verified • 1.2ms', 190, 245);

      // Chat Messages Area
      // Incoming Message Bubble
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      sCtx.fillRect(60, 360, 720, 180);
      sCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      sCtx.strokeRect(60, 360, 720, 180);
      sCtx.fillStyle = '#f3f4f6';
      sCtx.font = '38px sans-serif';
      sCtx.fillText('Secret rendezvous in Tokyo 🌸', 90, 440);
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      sCtx.font = '28px monospace';
      sCtx.fillText('8:11 PM • Verified Public Key', 90, 500);

      // Outgoing Message Bubble (Cyan/Pink gradient)
      const outGrad = sCtx.createLinearGradient(244, 600, 964, 780);
      outGrad.addColorStop(0, '#ff4b82');
      outGrad.addColorStop(1, '#a855f7');
      sCtx.fillStyle = outGrad;
      sCtx.fillRect(244, 600, 720, 180);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 38px sans-serif';
      sCtx.fillText('Ratchet keys verified. 0 bytes on disk.', 274, 680);
      sCtx.fillStyle = '#e0e7ff';
      sCtx.font = '28px monospace';
      sCtx.fillText('8:12 PM • 128-bit Auth Tag ✓✓', 274, 740);

      // Security Verification Card in chat
      sCtx.fillStyle = 'rgba(0, 242, 254, 0.1)';
      sCtx.fillRect(60, 850, 904, 220);
      sCtx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      sCtx.lineWidth = 3;
      sCtx.strokeRect(60, 850, 904, 220);
      sCtx.fillStyle = '#00f2fe';
      sCtx.font = 'bold 36px monospace';
      sCtx.fillText('🔒 ZERO-KNOWLEDGE HARDWARE VAULT', 90, 920);
      sCtx.fillStyle = '#9ca3af';
      sCtx.font = '30px sans-serif';
      sCtx.fillText('No phone number. No server storage. All messages', 90, 980);
      sCtx.fillText('vanish from relay queues upon receipt.', 90, 1030);

      // Bottom Input Bar
      sCtx.fillStyle = 'rgba(20, 14, 40, 0.9)';
      sCtx.fillRect(40, 1860, 944, 140);
      sCtx.strokeStyle = 'rgba(255, 117, 151, 0.4)';
      sCtx.strokeRect(40, 1860, 944, 140);
      sCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      sCtx.font = '38px sans-serif';
      sCtx.fillText('Message or /ai...', 80, 1945);

      // Send Button
      sCtx.beginPath();
      sCtx.arc(910, 1930, 48, 0, Math.PI * 2);
      sCtx.fillStyle = '#ff4b82';
      sCtx.fill();
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 40px sans-serif';
      sCtx.fillText('➤', 892, 1945);
    };

    renderScreenTexture(0);
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipmapLinearFilter;

    // 4. GENERATE CIRCUIT BOARD TEXTURE FOR PROCESSOR LAYER
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 1024;
    circuitCanvas.height = 2048;
    const cCtx = circuitCanvas.getContext('2d')!;

    cCtx.fillStyle = '#070512';
    cCtx.fillRect(0, 0, 1024, 2048);

    // Glowing circuit traces
    cCtx.strokeStyle = '#00f2fe';
    cCtx.lineWidth = 4;
    cCtx.beginPath();
    for (let i = 0; i < 24; i++) {
      const startX = 100 + Math.random() * 824;
      const startY = 200 + Math.random() * 1600;
      cCtx.moveTo(startX, startY);
      cCtx.lineTo(startX + (Math.random() - 0.5) * 300, startY + (Math.random() - 0.5) * 300);
      cCtx.lineTo(512, 1024);
    }
    cCtx.stroke();

    // Central Chip
    cCtx.fillStyle = '#160e2b';
    cCtx.fillRect(362, 874, 300, 300);
    cCtx.strokeStyle = '#ff7597';
    cCtx.lineWidth = 8;
    cCtx.strokeRect(362, 874, 300, 300);

    cCtx.fillStyle = '#00f2fe';
    cCtx.font = 'bold 36px monospace';
    cCtx.fillText('X25519', 440, 1010);
    cCtx.font = 'bold 24px monospace';
    cCtx.fillText('CRYPTO ENGINE', 410, 1060);

    const circuitTexture = new THREE.CanvasTexture(circuitCanvas);

    // 5. CONSTRUCT 3D CYBER-PHONE MODEL (WITH EXPLODED INTERNAL LAYERS)
    const phoneRootGroup = new THREE.Group();
    scene.add(phoneRootGroup);
    phoneRootGroup.position.set(1.4, 0, 0);

    // Layer A: Titanium Back Chassis
    const chassisGeo = new THREE.BoxGeometry(2.8, 5.6, 0.18);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x18112e,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x0c0717
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    phoneRootGroup.add(chassisMesh);

    // Camera bump on chassis
    const camBumpGeo = new THREE.BoxGeometry(0.9, 1.1, 0.08);
    const camBumpMat = new THREE.MeshStandardMaterial({
      color: 0x241842,
      roughness: 0.1,
      metalness: 0.95
    });
    const camBump = new THREE.Mesh(camBumpGeo, camBumpMat);
    camBump.position.set(-0.7, 2.0, -0.12);
    chassisMesh.add(camBump);

    // Camera lenses
    for (let l = 0; l < 2; l++) {
      const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 32);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x050508,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.9
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, l === 0 ? 0.25 : -0.25, -0.05);
      camBump.add(lens);
    }

    // Layer B: Cryptographic Processor Board (Circuit Layer)
    const chipGeo = new THREE.PlaneGeometry(2.7, 5.5);
    const chipMat = new THREE.MeshStandardMaterial({
      map: circuitTexture,
      roughness: 0.3,
      metalness: 0.85,
      emissive: 0x002233,
      transparent: true,
      opacity: 0.95
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(0, 0, 0.02);
    phoneRootGroup.add(chipMesh);

    // Layer C: Cyber-Glass Screen Display
    const screenGeo = new THREE.PlaneGeometry(2.74, 5.54);
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.1,
      metalness: 0.1,
      emissive: 0x110822,
      transparent: true,
      opacity: 0.98
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0.12);
    phoneRootGroup.add(screenMesh);

    // Outer Bezel Frame
    const bezelGeo = new THREE.BoxGeometry(2.88, 5.68, 0.22);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d61,
      roughness: 0.2,
      metalness: 0.95,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    phoneRootGroup.add(bezelMesh);

    // 6. 3D TRANSIT PACKET & DEFENSIVE FORCEFIELD
    const packetGroup = new THREE.Group();
    scene.add(packetGroup);
    packetGroup.position.set(0, -10, 0); // Hidden initially

    // Core Packet Crystal
    const packetCoreGeo = new THREE.IcosahedronGeometry(0.42, 1);
    const packetCoreMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x0088bb,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true
    });
    const packetCore = new THREE.Mesh(packetCoreGeo, packetCoreMat);
    packetGroup.add(packetCore);

    // Outer Hexagonal Forcefield
    const shieldGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xff7597,
      emissive: 0xaa1144,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    packetGroup.add(shieldMesh);

    // Defensive Energy Rings around packet
    const pRingGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 64);
    const pRingMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      roughness: 0.1,
      metalness: 0.9
    });
    const packetRing1 = new THREE.Mesh(pRingGeo, pRingMat);
    const packetRing2 = new THREE.Mesh(pRingGeo, pRingMat);
    packetRing2.rotation.x = Math.PI / 2;
    packetGroup.add(packetRing1);
    packetGroup.add(packetRing2);

    // 7. ORBITING CRYPTOGRAPHIC DATA NODES (14 Units)
    const crystals: Array<{
      mesh: THREE.Mesh;
      rotSpeed: { x: number; y: number; z: number };
      orbitSpeed: number;
      orbitRadius: number;
      initialAngle: number;
      yOffset: number;
    }> = [];

    const crystalColors = [0x00f2fe, 0xff4b82, 0xa855f7, 0x10b981, 0xff7597];

    for (let i = 0; i < 14; i++) {
      const geo = i % 2 === 0 ? new THREE.OctahedronGeometry(0.24 + Math.random() * 0.15, 0) : new THREE.TetrahedronGeometry(0.25 + Math.random() * 0.15, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: crystalColors[i % crystalColors.length],
        emissive: crystalColors[i % crystalColors.length],
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: i % 2 === 0
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      crystals.push({
        mesh,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.03,
          y: (Math.random() - 0.5) * 0.03,
          z: (Math.random() - 0.5) * 0.03
        },
        orbitSpeed: 0.005 + Math.random() * 0.008,
        orbitRadius: 3.5 + Math.random() * 2.5,
        initialAngle: Math.random() * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 4
      });
    }

    // 8. 1,800-Point Quantum Data Stream Particle Cloud
    const particleCount = 1800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount);

    const cCyan = new THREE.Color(0x00f2fe);
    const cPink = new THREE.Color(0xff4b82);
    const cPurple = new THREE.Color(0xa855f7);
    const cEmerald = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 36;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 36;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 22 - 4;

      const roll = Math.random();
      const color = roll < 0.35 ? cCyan : roll < 0.65 ? cPink : roll < 0.88 ? cPurple : cEmerald;
      particleColors[idx] = color.r;
      particleColors[idx + 1] = color.g;
      particleColors[idx + 2] = color.b;

      particleVelocities[i] = 0.02 + Math.random() * 0.05;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 9. Smooth Lerping Physics for Mouse and Scroll
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    let targetScroll = 0;
    let curScroll = 0;

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetScroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 10. Viewport Resize Handler
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 11. 60/120 FPS Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Lerp transitions
      curScroll += (targetScroll - curScroll) * 0.08;
      curMouseX += (targetMouseX - curMouseX) * 0.06;
      curMouseY += (targetMouseY - curMouseY) * 0.06;

      // ==========================================
      // SECTION-AWARE SCROLL-DRIVEN 3D TRANSFORMATION
      // ==========================================

      if (curScroll < 0.22) {
        // --- PHASE 1: HERO ENTRY (0.0 to 0.22) ---
        // Phone positioned in center-right of hero, gently tilted with mouse
        const t = curScroll / 0.22;
        phoneRootGroup.position.set(
          THREE.MathUtils.lerp(1.4, 0, t),
          THREE.MathUtils.lerp(0.1, 0, t),
          THREE.MathUtils.lerp(0, 0.5, t)
        );
        phoneRootGroup.rotation.set(
          curMouseY * 0.35 + Math.sin(elapsed * 0.8) * 0.04,
          curMouseX * 0.45 - 0.25 + Math.cos(elapsed * 0.6) * 0.04,
          0
        );

        // Layers closed together
        screenMesh.position.z = 0.12;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;

        packetGroup.position.set(0, -15, 0); // Out of view
      } else if (curScroll < 0.45) {
        // --- PHASE 2: EXPLODED VIEW (0.22 to 0.45) ---
        // Phone rotates into 3D isometric angle and layers EXPLODE apart!
        const t = (curScroll - 0.22) / 0.23;
        phoneRootGroup.position.set(0, 0, 0.5);
        phoneRootGroup.rotation.set(
          THREE.MathUtils.lerp(0.1, 0.45, t) + curMouseY * 0.2,
          THREE.MathUtils.lerp(-0.25, -0.65, t) + curMouseX * 0.2,
          THREE.MathUtils.lerp(0, 0.1, t)
        );

        // Exploded layer offsets
        const explodeDistance = THREE.MathUtils.lerp(0.1, 1.4, t);
        screenMesh.position.z = 0.12 + explodeDistance;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = -explodeDistance;

        packetGroup.position.set(0, -15, 0);
      } else if (curScroll < 0.72) {
        // --- PHASE 3: SCROLLYTELLING PACKET TRANSIT & DEFENSE (0.45 to 0.72) ---
        // Layers snap back together, phone shrinks slightly to the left, packet takes center stage!
        const t = (curScroll - 0.45) / 0.27;
        phoneRootGroup.position.set(-2.2, 0, -1.0);
        phoneRootGroup.rotation.set(0.2, 0.35, 0);

        screenMesh.position.z = 0.12;
        chassisMesh.position.z = 0;

        // Bring packet into view and animate along cyber path
        packetGroup.position.set(
          THREE.MathUtils.lerp(-1.8, 1.6, t),
          Math.sin(elapsed * 2) * 0.3,
          THREE.MathUtils.lerp(-0.5, 0.5, t)
        );

        packetCore.rotation.x = elapsed * 1.5;
        packetCore.rotation.y = elapsed * 2.0;

        shieldMesh.rotation.y = -elapsed * 1.2;
        shieldMesh.rotation.z = elapsed * 0.8;
        const shieldPulse = 1 + Math.sin(elapsed * 4) * 0.12;
        shieldMesh.scale.set(shieldPulse, shieldPulse, shieldPulse);

        packetRing1.rotation.z = elapsed * 1.8;
        packetRing2.rotation.y = elapsed * 1.4;
      } else {
        // --- PHASE 4: DOWNLOAD VORTEX & LAUNCHPAD (0.72 to 1.0) ---
        const t = (curScroll - 0.72) / 0.28;
        phoneRootGroup.position.set(
          THREE.MathUtils.lerp(-2.2, 0, t),
          THREE.MathUtils.lerp(0, -0.2, t),
          THREE.MathUtils.lerp(-1.0, -0.5, t)
        );
        phoneRootGroup.rotation.set(
          THREE.MathUtils.lerp(0.2, 0.15, t) + curMouseY * 0.2,
          THREE.MathUtils.lerp(0.35, 0, t) + curMouseX * 0.3,
          0
        );

        screenMesh.position.z = 0.12;
        chassisMesh.position.z = 0;

        packetGroup.position.set(0, -15, 0);
      }

      // Camera gentle lookAt center
      camera.position.x = curMouseX * 0.5;
      camera.position.y = -curMouseY * 0.5;
      camera.lookAt(0, 0, 0);

      // Orbiting crystals
      crystals.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsed * c.orbitSpeed + curScroll * Math.PI * 2.5;
        const radius = c.orbitRadius * (1 + curScroll * 0.2);
        c.mesh.position.x = Math.cos(angle) * radius + (phoneRootGroup.position.x * 0.3);
        c.mesh.position.z = Math.sin(angle) * radius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsed * 1.2 + c.initialAngle) * 0.5;
      });

      // Quantum Particles Flow
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const scrollSpeedBoost = 1 + curScroll * 3.5;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        positions[idx + 1] += particleVelocities[i] * scrollSpeedBoost * 0.06;
        if (positions[idx + 1] > 18) {
          positions[idx + 1] = -18;
          positions[idx] = (Math.random() - 0.5) * 36;
        }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = elapsed * 0.02 + curScroll * 0.8;

      // Pulsing Lights
      cyanLight.position.x = Math.sin(elapsed * 0.8) * 7;
      cyanLight.position.y = Math.cos(elapsed * 0.6) * 7;

      pinkLight.position.x = Math.cos(elapsed * 0.7) * -7;
      pinkLight.position.y = Math.sin(elapsed * 0.9) * -7;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Complete Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      chassisGeo.dispose();
      chassisMat.dispose();
      camBumpGeo.dispose();
      camBumpMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      bezelGeo.dispose();
      bezelMat.dispose();
      packetCoreGeo.dispose();
      packetCoreMat.dispose();
      shieldGeo.dispose();
      shieldMat.dispose();
      pRingGeo.dispose();
      pRingMat.dispose();

      screenTexture.dispose();
      circuitTexture.dispose();

      crystals.forEach(c => {
        c.mesh.geometry.dispose();
        if (Array.isArray(c.mesh.material)) {
          c.mesh.material.forEach(m => m.dispose());
        } else {
          c.mesh.material.dispose();
        }
      });

      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-screen h-screen pointer-events-none -z-10 overflow-hidden" 
      aria-hidden="true"
    />
  );
}
