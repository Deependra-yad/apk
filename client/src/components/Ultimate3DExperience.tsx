"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Ultimate3DExperienceProps {
  mitmActive?: boolean;
}

export default function Ultimate3DExperience({ mitmActive = false }: Ultimate3DExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mitmRef = useRef(mitmActive);

  useEffect(() => {
    mitmRef.current = mitmActive;
  }, [mitmActive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.028);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 0, 8.5);

    // 2. High Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    container.appendChild(renderer.domElement);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0c16, 2.2);
    scene.add(ambientLight);

    const dirKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    dirKeyLight.position.set(6, 10, 8);
    scene.add(dirKeyLight);

    const purplePoint = new THREE.PointLight(0xa855f7, 5.5, 35);
    purplePoint.position.set(-5, 4, 4);
    scene.add(purplePoint);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 5.5, 35);
    cyanPoint.position.set(5, -3, 4);
    scene.add(cyanPoint);

    const emeraldPoint = new THREE.PointLight(0x10b981, 4.0, 30);
    emeraldPoint.position.set(0, -6, 2);
    scene.add(emeraldPoint);

    // =========================================================================
    // 4. HIGH-RES DYNAMIC 2D CANVAS SCREEN TEXTURE (1024x2048)
    // =========================================================================
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 2048;
    const sctx = screenCanvas.getContext('2d');

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    const renderScreen = (time: number) => {
      if (!sctx) return;

      // Dark Obsidian Fluid Gradient
      const grad = sctx.createLinearGradient(0, 0, 0, 2048);
      grad.addColorStop(0, '#090b14');
      grad.addColorStop(0.5, '#05070e');
      grad.addColorStop(1, '#020306');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 1024, 2048);

      // Subtle Cybernetic Grid
      sctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
      sctx.lineWidth = 2;
      for (let x = 0; x < 1024; x += 64) {
        sctx.beginPath();
        sctx.moveTo(x, 0);
        sctx.lineTo(x, 2048);
        sctx.stroke();
      }
      for (let y = 0; y < 2048; y += 64) {
        sctx.beginPath();
        sctx.moveTo(0, y);
        sctx.lineTo(1024, y);
        sctx.stroke();
      }

      // Dynamic Island
      sctx.fillStyle = '#000000';
      sctx.beginPath();
      sctx.roundRect(362, 40, 300, 72, 36);
      sctx.fill();

      // Pulsing Security Dot
      const pulse = 0.5 + Math.sin(time * 4) * 0.5;
      sctx.fillStyle = mitmRef.current ? `rgba(239, 68, 68, ${pulse})` : `rgba(16, 185, 129, ${pulse})`;
      sctx.beginPath();
      sctx.arc(405, 76, 10, 0, Math.PI * 2);
      sctx.fill();

      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 22px monospace';
      sctx.fillText(mitmRef.current ? 'MITM TAMPER DETECTED' : 'CURVE25519 VERIFIED', 430, 83);

      // Status Bar Times
      sctx.fillStyle = '#94a3b8';
      sctx.font = 'bold 26px sans-serif';
      sctx.fillText('09:41', 60, 88);
      sctx.fillText('100% ⚡', 860, 88);

      // Chat Header
      sctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      sctx.fillRect(0, 150, 1024, 160);
      sctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(0, 310);
      sctx.lineTo(1024, 310);
      sctx.stroke();

      // Avatar
      sctx.fillStyle = '#1e1b4b';
      sctx.beginPath();
      sctx.arc(120, 230, 48, 0, Math.PI * 2);
      sctx.fill();
      sctx.strokeStyle = '#a855f7';
      sctx.lineWidth = 3;
      sctx.stroke();

      sctx.font = '46px sans-serif';
      sctx.textAlign = 'center';
      sctx.fillText('🌸', 120, 245);
      sctx.textAlign = 'left';

      // Title & Status
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 38px sans-serif';
      sctx.fillText('Sakura (Tokyo)', 195, 215);

      sctx.fillStyle = mitmRef.current ? '#f87171' : '#34d399';
      sctx.font = 'bold 22px monospace';
      sctx.fillText(mitmRef.current ? '⚠️ SIGNATURE MISMATCH' : '● ONLINE • AES-256-GCM', 195, 255);

      // Incoming Chat Bubble
      sctx.fillStyle = 'rgba(30, 27, 75, 0.75)';
      sctx.beginPath();
      sctx.roundRect(60, 370, 740, 170, 30);
      sctx.fill();
      sctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      sctx.lineWidth = 2;
      sctx.stroke();

      sctx.fillStyle = '#ffffff';
      sctx.font = '32px sans-serif';
      sctx.fillText('Secret rendezvous in Tokyo at 7 PM 🌸', 95, 435);
      sctx.fillStyle = '#a5b4fc';
      sctx.font = '20px monospace';
      sctx.fillText('09:40 PM • Ephemeral Key Ratchet Verified', 95, 495);

      // Outgoing Chat Bubble
      const myGrad = sctx.createLinearGradient(220, 580, 964, 750);
      myGrad.addColorStop(0, '#7c3aed');
      myGrad.addColorStop(1, '#06b6d4');
      sctx.fillStyle = myGrad;
      sctx.beginPath();
      sctx.roundRect(224, 580, 740, 170, 30);
      sctx.fill();

      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 32px sans-serif';
      sctx.fillText('Sealed. Zero plaintext on cloud! 🛡️', 260, 645);
      sctx.fillStyle = '#e0e7ff';
      sctx.font = 'bold 20px monospace';
      sctx.fillText('09:41 PM • Delivered & Decrypted Locally ✓✓', 260, 705);

      // Audio Waveform Player Bubble
      sctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      sctx.beginPath();
      sctx.roundRect(60, 790, 700, 160, 30);
      sctx.fill();
      sctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      sctx.lineWidth = 2;
      sctx.stroke();

      // Play Button
      sctx.fillStyle = '#06b6d4';
      sctx.beginPath();
      sctx.arc(130, 870, 38, 0, Math.PI * 2);
      sctx.fill();
      sctx.fillStyle = '#05070e';
      sctx.beginPath();
      sctx.moveTo(122, 855);
      sctx.lineTo(145, 870);
      sctx.lineTo(122, 885);
      sctx.fill();

      // Pulsing Waveform Bars
      for (let b = 0; b < 28; b++) {
        const h = 18 + Math.abs(Math.sin(time * 3 + b * 0.45)) * 60;
        sctx.fillStyle = b < 14 ? '#06b6d4' : 'rgba(255, 255, 255, 0.25)';
        sctx.fillRect(195 + b * 16, 870 - h / 2, 8, h);
      }
      sctx.fillStyle = '#94a3b8';
      sctx.font = '20px monospace';
      sctx.fillText('0:14 • Tokyo Chime Synthesizer', 195, 925);

      // Security Hardware Seal
      sctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      sctx.beginPath();
      sctx.roundRect(80, 1010, 864, 150, 24);
      sctx.fill();
      sctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      sctx.lineWidth = 1.5;
      sctx.stroke();

      sctx.fillStyle = '#c084fc';
      sctx.font = 'bold 28px monospace';
      sctx.fillText('⚡ SILICON ENCLAVE ACTIVE', 120, 1070);
      sctx.fillStyle = '#e2e8f0';
      sctx.font = '24px sans-serif';
      sctx.fillText('ECDH X25519 Seed Stored in Cold Storage SQLite', 120, 1115);

      // Message Input Box at bottom
      sctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      sctx.beginPath();
      sctx.roundRect(50, 1860, 924, 110, 55);
      sctx.fill();
      sctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      sctx.lineWidth = 2;
      sctx.stroke();

      sctx.fillStyle = '#64748b';
      sctx.font = '28px sans-serif';
      sctx.fillText('Type sovereign message...', 120, 1928);

      // Send Button
      sctx.fillStyle = '#a855f7';
      sctx.beginPath();
      sctx.arc(910, 1915, 38, 0, Math.PI * 2);
      sctx.fill();
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 32px sans-serif';
      sctx.fillText('➤', 895, 1927);

      screenTexture.needsUpdate = true;
    };

    // =========================================================================
    // 5. INTERNAL SOVEREIGN LOGIC BOARD CANVAS (1024x2048)
    // =========================================================================
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 1024;
    circuitCanvas.height = 2048;
    const cctx = circuitCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = '#050711';
      cctx.fillRect(0, 0, 1024, 2048);

      // Circuit gold traces
      cctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
      cctx.lineWidth = 4;
      for (let i = 0; i < 28; i++) {
        cctx.beginPath();
        const startX = (i * 38) % 1024;
        cctx.moveTo(startX, 0);
        cctx.lineTo(startX, 650 + (i * 35));
        cctx.lineTo(512, 1024);
        cctx.stroke();
      }

      // Central Sovereign Processor Chip
      cctx.fillStyle = '#0f172a';
      cctx.fillRect(256, 800, 512, 448);
      cctx.strokeStyle = '#a855f7';
      cctx.lineWidth = 8;
      cctx.strokeRect(256, 800, 512, 448);

      cctx.fillStyle = '#ffffff';
      cctx.font = 'bold 44px monospace';
      cctx.textAlign = 'center';
      cctx.fillText('X25519 SECURE ENCLAVE', 512, 980);
      cctx.fillStyle = '#34d399';
      cctx.font = 'bold 30px monospace';
      cctx.fillText('AES-256-GCM HARDWARE RATCHET', 512, 1040);
      cctx.fillText('ZERO CLOUD TELEMETRY', 512, 1100);
    }
    const circuitTexture = new THREE.CanvasTexture(circuitCanvas);

    // =========================================================================
    // 6. 3D CYBER SMARTPHONE & HARDWARE EXPLODED ASSEMBLY
    // =========================================================================
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);

    const phoneW = 2.4;
    const phoneH = 4.8;
    const phoneD = 0.22;

    // Layer 4: Titanium Chassis (Base)
    const chassisGeo = new THREE.BoxGeometry(phoneW, phoneH, phoneD);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x080a12,
      metalness: 0.96,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    phoneGroup.add(chassisMesh);

    // Camera bump
    const camGeo = new THREE.BoxGeometry(0.95, 1.15, 0.12);
    const camMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const camMesh = new THREE.Mesh(camGeo, camMat);
    camMesh.position.set(-0.55, 1.55, -0.16);
    phoneGroup.add(camMesh);

    // Camera Lenses
    const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0.95, roughness: 0.1, transmission: 0.7 });
    [-0.22, 0.22].forEach((lx) => {
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(camMesh.position.x + lx, camMesh.position.y + 0.25, -0.22);
      phoneGroup.add(lens);
    });

    // Layer 3: Sovereign Logic Board & Enclave Chip
    const chipGeo = new THREE.PlaneGeometry(phoneW * 0.92, phoneH * 0.92);
    const chipMat = new THREE.MeshStandardMaterial({
      map: circuitTexture,
      roughness: 0.35,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.z = 0.02;
    phoneGroup.add(chipMesh);

    // Layer 2: Liquid AMOLED Screen
    const screenGeo = new THREE.PlaneGeometry(phoneW * 0.96, phoneH * 0.96);
    const screenMat = new THREE.MeshPhysicalMaterial({
      map: screenTexture,
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      emissive: new THREE.Color(0x110d29),
      emissiveIntensity: 0.4,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = phoneD / 2 + 0.01;
    phoneGroup.add(screenMesh);

    // Layer 1: Front Cyber Glass
    const glassGeo = new THREE.PlaneGeometry(phoneW * 0.98, phoneH * 0.98);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.52,
      clearcoat: 1.0,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = phoneD / 2 + 0.03;
    phoneGroup.add(glassMesh);

    // Connecting 3D Laser Guidelines between layers
    const laserLineMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 0.12,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.7,
    });
    const cornerLines: THREE.Line[] = [];
    for (let c = 0; c < 4; c++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -2),
        new THREE.Vector3(0, 0, 2),
      ]);
      const line = new THREE.Line(lineGeo, laserLineMat);
      line.computeLineDistances();
      line.visible = false;
      phoneGroup.add(line);
      cornerLines.push(line);
    }

    // =========================================================================
    // 7. STAGE 3: 3D CRYPTOGRAPHIC DATA PRISM & FORCEFIELD SHIELD
    // =========================================================================
    const prismGroup = new THREE.Group();
    scene.add(prismGroup);

    const prismCoreGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const prismCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.1,
    });
    const prismCore = new THREE.Mesh(prismCoreGeo, prismCoreMat);
    prismGroup.add(prismCore);

    // Inner wireframe core
    const prismWireGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const prismWireMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 });
    const prismWire = new THREE.Mesh(prismWireGeo, prismWireMat);
    prismGroup.add(prismWire);

    // Hexagonal forcefield sphere
    const shieldGeo = new THREE.SphereGeometry(1.45, 18, 14);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.4 });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    prismGroup.add(shieldMesh);

    // Dual orbiting energy rings
    const ring1Geo = new THREE.TorusGeometry(1.7, 0.02, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const prismRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    prismGroup.add(prismRing1);

    const ring2Geo = new THREE.TorusGeometry(1.9, 0.015, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const prismRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    prismGroup.add(prismRing2);

    prismGroup.position.set(0, -30, 0); // Initially hidden

    // =========================================================================
    // 8. STAGE 4: 3D GEODESIC SOVEREIGN MESH GLOBE
    // =========================================================================
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeGeo = new THREE.IcosahedronGeometry(2.7, 2);
    const globeWireMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.3 });
    const globeMesh = new THREE.Mesh(globeGeo, globeWireMat);
    globeGroup.add(globeMesh);

    // Dark core inside globe
    const globeCoreGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const globeCoreMat = new THREE.MeshBasicMaterial({ color: 0x060813, transparent: true, opacity: 0.9 });
    const globeCore = new THREE.Mesh(globeCoreGeo, globeCoreMat);
    globeGroup.add(globeCore);

    // Global city transit hubs
    const cityCoords = [
      { lat: 35.6762, lon: 139.6503, name: "Tokyo" },
      { lat: 47.3769, lon: 8.5417, name: "Zurich" },
      { lat: 40.7128, lon: -74.006, name: "New York" },
      { lat: 1.3521, lon: 103.8198, name: "Singapore" },
      { lat: 51.5074, lon: -0.1278, name: "London" },
      { lat: 64.1466, lon: -21.9426, name: "Reykjavik" },
    ];

    const latLonToVec = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    const nodePositions: THREE.Vector3[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    cityCoords.forEach(c => {
      const pos = latLonToVec(c.lat, c.lon, 2.72);
      nodePositions.push(pos);
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      globeGroup.add(nodeMesh);
    });

    // Spline Arcs Connecting Cities
    const arcMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.65 });
    for (let i = 0; i < nodePositions.length; i++) {
      const v1 = nodePositions[i];
      const v2 = nodePositions[(i + 1) % nodePositions.length];
      const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(3.3);
      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
      const arc = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arc);
    }
    globeGroup.position.set(0, -30, 0); // Initially hidden

    // =========================================================================
    // 9. QUANTUM PARTICLE FIELD & WARP TUNNEL
    // =========================================================================
    const particleCount = 2500;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);
    const pRadii = new Float32Array(particleCount);
    const pAngles = new Float32Array(particleCount);

    const cPurple = new THREE.Color(0xa855f7);
    const cCyan = new THREE.Color(0x06b6d4);
    const cEmerald = new THREE.Color(0x10b981);

    for (let i = 0; i < particleCount; i++) {
      const r = 1.2 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 40;

      pRadii[i] = r;
      pAngles[i] = angle;
      pSpeeds[i] = 0.6 + Math.random() * 1.8;

      pPositions[i * 3] = Math.cos(angle) * r;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(angle) * r;

      const pick = Math.random();
      const col = pick < 0.4 ? cPurple : pick < 0.75 ? cCyan : cEmerald;
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 16 Orbiting Polyhedral Crystals
    const crystals: { mesh: THREE.Mesh; orbitSpeed: number; orbitRadius: number; rotSpeed: THREE.Vector3; initialAngle: number; yOffset: number }[] = [];
    const crystalGeo = new THREE.OctahedronGeometry(0.35, 0);

    for (let i = 0; i < 16; i++) {
      const cmat = new THREE.MeshPhysicalMaterial({
        color: i % 2 === 0 ? 0xa855f7 : 0x06b6d4,
        emissive: i % 2 === 0 ? 0x4c1d95 : 0x083344,
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0,
      });
      const cmesh = new THREE.Mesh(crystalGeo, cmat);
      scene.add(cmesh);
      crystals.push({
        mesh: cmesh,
        orbitSpeed: 0.25 + Math.random() * 0.35,
        orbitRadius: 3.5 + Math.random() * 3.0,
        rotSpeed: new THREE.Vector3(Math.random() * 0.03, Math.random() * 0.03, Math.random() * 0.03),
        initialAngle: (i / 16) * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 5,
      });
    }

    // =========================================================================
    // 10. SCROLL & MOUSE INTERACTION SYSTEM
    // =========================================================================
    let targetScroll = 0;
    let curScroll = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    const handleScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docH > 0 ? Math.max(0, Math.min(1, window.scrollY / docH)) : 0;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 11. 60/120 FPS HIGH FIDELITY ANIMATION ENGINE
    // =========================================================================
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Fluid Lerping
      curScroll += (targetScroll - curScroll) * 0.08;
      curMouseX += (targetMouseX - curMouseX) * 0.06;
      curMouseY += (targetMouseY - curMouseY) * 0.06;

      // Update 2D Screen Canvas Texture
      renderScreen(elapsed);

      // Camera Parallax Float
      camera.position.x = curMouseX * 0.45;
      camera.position.y = -curMouseY * 0.45;
      camera.lookAt(0, 0, 0);

      // =====================================================================
      // 5-STAGE CINEMATIC SCROLL TRANSFORMATIONS
      // =====================================================================

      // STAGE 1: HERO VIEWPORT (0.0 to 0.20)
      if (curScroll < 0.20) {
        const t = curScroll / 0.20;

        phoneGroup.visible = true;
        phoneGroup.position.set(
          THREE.MathUtils.lerp(0, 0, t),
          THREE.MathUtils.lerp(0, 0.1, t),
          THREE.MathUtils.lerp(0, 0.5, t)
        );

        // Gyroscopic mouse tilt + subtle breathing float
        phoneGroup.rotation.set(
          curMouseY * 0.35 + Math.sin(elapsed * 0.8) * 0.04,
          curMouseX * 0.45 + Math.cos(elapsed * 0.6) * 0.04,
          0
        );

        // Keep Layers clamped together
        screenMesh.position.z = phoneD / 2 + 0.01;
        glassMesh.position.z = phoneD / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        cornerLines.forEach(l => { l.visible = false; });

        prismGroup.position.set(0, -30, 0);
        globeGroup.position.set(0, -30, 0);

      // STAGE 2: 3D HARDWARE EXPLODED VIEW (0.20 to 0.45)
      } else if (curScroll < 0.45) {
        const t = (curScroll - 0.20) / 0.25;

        phoneGroup.visible = true;
        phoneGroup.position.set(0, 0, 0.8);

        // Rotate into 45° isometric perspective
        phoneGroup.rotation.set(
          THREE.MathUtils.lerp(0.1, 0.55, t) + curMouseY * 0.2,
          THREE.MathUtils.lerp(0, -0.75, t) + curMouseX * 0.25,
          THREE.MathUtils.lerp(0, 0.12, t)
        );

        // Disassemble the physical layers apart in 3D!
        const explodeDist = THREE.MathUtils.lerp(0.05, 2.0, t);
        glassMesh.position.z = phoneD / 2 + 0.03 + explodeDist * 1.4; // Layer 1: Front Cyber Glass
        screenMesh.position.z = phoneD / 2 + 0.01 + explodeDist * 0.75; // Layer 2: AMOLED Display
        chipMesh.position.z = 0.02; // Layer 3: Logic Board & Enclave
        chassisMesh.position.z = -explodeDist * 1.3; // Layer 4: Titanium Chassis

        // 3D Laser guidelines between layers
        cornerLines.forEach((line, idx) => {
          line.visible = true;
          const cornerX = (idx % 2 === 0 ? 1 : -1) * (phoneW / 2);
          const cornerY = (idx < 2 ? 1 : -1) * (phoneH / 2);
          const pos = line.geometry.attributes.position as THREE.BufferAttribute;
          pos.setXYZ(0, cornerX, cornerY, chassisMesh.position.z);
          pos.setXYZ(1, cornerX, cornerY, glassMesh.position.z);
          pos.needsUpdate = true;
        });

        prismGroup.position.set(0, -30, 0);
        globeGroup.position.set(0, -30, 0);

      // STAGE 3: CRYPTOGRAPHIC QUANTUM PACKET SCROLLYTELLING (0.45 to 0.70)
      } else if (curScroll < 0.70) {
        const t = (curScroll - 0.45) / 0.25;

        // Snap phone back together and dock to left
        phoneGroup.visible = true;
        phoneGroup.position.set(-2.8, 0, -1.0);
        phoneGroup.rotation.set(0.2, 0.4, 0);

        screenMesh.position.z = phoneD / 2 + 0.01;
        glassMesh.position.z = phoneD / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        cornerLines.forEach(l => { l.visible = false; });

        // Launch 3D Cryptographic Quantum Data Prism into Center Stage!
        prismGroup.position.set(
          THREE.MathUtils.lerp(-1.8, 1.8, t),
          Math.sin(elapsed * 2.5) * 0.35,
          THREE.MathUtils.lerp(-0.5, 0.8, t)
        );

        prismCore.rotation.x = elapsed * 1.8;
        prismCore.rotation.y = elapsed * 2.4;
        prismWire.rotation.x = -elapsed * 1.4;
        prismWire.rotation.z = elapsed * 1.6;

        shieldMesh.rotation.y = -elapsed * 1.6;
        shieldMesh.rotation.z = elapsed * 1.2;
        const sPulse = 1 + Math.sin(elapsed * 4) * 0.12;
        shieldMesh.scale.set(sPulse, sPulse, sPulse);

        if (t > 0.8) {
          shieldMat.color.setHex(0x10b981); // Emerald verified
        } else if (mitmRef.current) {
          shieldMat.color.setHex(0xef4444); // Red alert
        } else {
          shieldMat.color.setHex(0x06b6d4); // Cyan active
        }

        prismRing1.rotation.z = elapsed * 2.2;
        prismRing2.rotation.y = elapsed * 1.8;

        globeGroup.position.set(0, -30, 0);

      // STAGE 4: 3D GEODESIC SOVEREIGN MESH GLOBE (0.70 to 0.88)
      } else if (curScroll < 0.88) {
        const t = (curScroll - 0.70) / 0.18;

        phoneGroup.visible = false;
        prismGroup.position.set(0, -30, 0);

        globeGroup.position.set(0, 0, THREE.MathUtils.lerp(-4, 0.5, t));
        globeGroup.rotation.y = elapsed * 0.25 + curMouseX * 0.35;
        globeGroup.rotation.x = 0.25 + curMouseY * 0.3;

      // STAGE 5: DOWNLOAD LAUNCHPAD & MONOLITH (0.88 to 1.0)
      } else {
        const t = (curScroll - 0.88) / 0.12;

        globeGroup.position.set(0, -30, 0);
        prismGroup.position.set(0, -30, 0);

        phoneGroup.visible = true;
        phoneGroup.position.set(0, THREE.MathUtils.lerp(1, 0, t), THREE.MathUtils.lerp(-2, 0.8, t));
        phoneGroup.rotation.set(curMouseY * 0.25, curMouseX * 0.3, 0);

        screenMesh.position.z = phoneD / 2 + 0.01;
        glassMesh.position.z = phoneD / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        cornerLines.forEach(l => { l.visible = false; });
      }

      // =====================================================================
      // PARTICLES SPEED ACCELERATION ACROSS SECTIONS
      // =====================================================================
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const speedMult = 1 + curScroll * 5.0;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        pAngles[i] += 0.005 * pSpeeds[i] * speedMult;
        const r = pRadii[i];
        posArr[idx] = Math.cos(pAngles[i]) * r;
        posArr[idx + 2] = Math.sin(pAngles[i]) * r;

        posArr[idx + 1] += 0.04 * pSpeeds[i] * speedMult;
        if (posArr[idx + 1] > 22) {
          posArr[idx + 1] = -22;
        }
      }
      posAttr.needsUpdate = true;

      // Crystals Orbit
      crystals.forEach(c => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsed * c.orbitSpeed + curScroll * Math.PI * 2.5;
        const radius = c.orbitRadius * (1 + curScroll * 0.15);
        c.mesh.position.x = Math.cos(angle) * radius;
        c.mesh.position.z = Math.sin(angle) * radius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsed * 1.5 + c.initialAngle) * 0.6;
      });

      // Ambient Point Lights Orbit
      purplePoint.position.x = Math.sin(elapsed * 0.8) * 8;
      purplePoint.position.y = Math.cos(elapsed * 0.6) * 6;

      cyanPoint.position.x = Math.cos(elapsed * 0.7) * -8;
      cyanPoint.position.y = Math.sin(elapsed * 0.9) * -6;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Complete Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      chassisGeo.dispose();
      chassisMat.dispose();
      camGeo.dispose();
      camMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();

      prismCoreGeo.dispose();
      prismCoreMat.dispose();
      prismWireGeo.dispose();
      prismWireMat.dispose();
      shieldGeo.dispose();
      shieldMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();

      globeGeo.dispose();
      globeWireMat.dispose();
      globeCoreGeo.dispose();
      globeCoreMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      arcMat.dispose();

      particleGeo.dispose();
      particleMat.dispose();
      crystalGeo.dispose();

      crystals.forEach(c => {
        (c.mesh.material as THREE.Material).dispose();
      });

      screenTexture.dispose();
      circuitTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}
