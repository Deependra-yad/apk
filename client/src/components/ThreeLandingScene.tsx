"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeLandingSceneProps {
  activeContactName?: string;
  activeContactAvatar?: string;
  activeMessage?: string;
  isTampered?: boolean;
}

export default function ThreeLandingScene({
  activeContactName = "Sakura (Tokyo)",
  activeContactAvatar = "🌸",
  activeMessage = "Secret rendezvous in Tokyo at 7 PM 🌸",
  isTampered = false,
}: ThreeLandingSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest props in refs for the RAF loop
  const propsRef = useRef({
    activeContactName,
    activeContactAvatar,
    activeMessage,
    isTampered,
  });

  useEffect(() => {
    propsRef.current = {
      activeContactName,
      activeContactAvatar,
      activeMessage,
      isTampered,
    };
  }, [activeContactName, activeContactAvatar, activeMessage, isTampered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060d, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.5);

    // 2. High-Performance WebGL Renderer
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
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Cyber Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x0b1329, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x00d2ff, 4.5, 30);
    cyanPoint.position.set(4, 3, 5);
    scene.add(cyanPoint);

    const pinkPoint = new THREE.PointLight(0xff4b82, 4.5, 30);
    pinkPoint.position.set(-4, -2, 4);
    scene.add(pinkPoint);

    const greenPoint = new THREE.PointLight(0x00ffa3, 3.5, 25);
    greenPoint.position.set(0, -4, 3);
    scene.add(greenPoint);

    // =========================================================================
    // 4. DYNAMIC HIGH-RES 2D PHONE SCREEN CANVAS & TEXTURE
    // =========================================================================
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 2048;
    const ctx = screenCanvas.getContext('2d');

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    const renderScreenTexture = (time: number) => {
      if (!ctx) return;
      const { activeContactName, activeContactAvatar, activeMessage, isTampered } = propsRef.current;

      // Background Cyber Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 2048);
      grad.addColorStop(0, '#090d19');
      grad.addColorStop(0.5, '#050811');
      grad.addColorStop(1, '#020408');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 2048);

      // Subtle Cyber Grid Lines
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let x = 0; x < 1024; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 2048);
        ctx.stroke();
      }
      for (let y = 0; y < 2048; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // Dynamic Island / Status Bar
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.roundRect(362, 36, 300, 70, 35);
      ctx.fill();

      // Pulsing Dot inside Dynamic Island
      const pulseAlpha = 0.5 + Math.sin(time * 4) * 0.5;
      ctx.fillStyle = isTampered ? `rgba(255, 75, 75, ${pulseAlpha})` : `rgba(0, 255, 163, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.arc(410, 71, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(isTampered ? 'MITM DETECTED' : 'CURVE25519 E2EE', 440, 78);

      // Status Bar Times & Battery
      ctx.fillStyle = '#a0aec0';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('08:12', 60, 80);
      ctx.fillText('5G • 100% ⚡', 830, 80);

      // Chat Header Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 140, 1024, 160);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 300);
      ctx.lineTo(1024, 300);
      ctx.stroke();

      // Avatar circle
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(120, 220, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeContactAvatar, 120, 236);
      ctx.textAlign = 'left';

      // Name & Status
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(activeContactName, 200, 205);

      ctx.fillStyle = isTampered ? '#ff4b82' : '#00ffa3';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(isTampered ? '⚠️ TAMPER ALERT • SIGNATURE MISMATCH' : '● ONLINE • AES-256-GCM SECURE', 200, 248);

      // Chat Body: Incoming Message
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.beginPath();
      ctx.roundRect(60, 360, 720, 180, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '32px sans-serif';
      ctx.fillText(activeMessage, 95, 430);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('08:11 PM  •  Verified Double-Ratchet Key', 95, 495);

      // Outgoing Message (Me)
      const myGrad = ctx.createLinearGradient(240, 580, 964, 760);
      myGrad.addColorStop(0, '#00d2ff');
      myGrad.addColorStop(1, '#ff4b82');
      ctx.fillStyle = myGrad;
      ctx.beginPath();
      ctx.roundRect(244, 580, 720, 180, 32);
      ctx.fill();

      ctx.fillStyle = '#050811';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Keys validated. 0 plaintext on cloud! 🛡️', 280, 650);

      ctx.fillStyle = '#0a1020';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('08:12 PM  •  Delivered & Read ✓✓', 280, 715);

      // Audio Waveform Message
      ctx.fillStyle = 'rgba(20, 30, 50, 0.85)';
      ctx.beginPath();
      ctx.roundRect(60, 800, 680, 160, 32);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 75, 130, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Play button
      ctx.fillStyle = '#ff4b82';
      ctx.beginPath();
      ctx.arc(130, 880, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(122, 865);
      ctx.lineTo(145, 880);
      ctx.lineTo(122, 895);
      ctx.fill();

      // Audio waveform bars
      const barCount = 28;
      for (let b = 0; b < barCount; b++) {
        const barH = 20 + Math.abs(Math.sin(time * 3 + b * 0.4)) * 65;
        ctx.fillStyle = b < 14 ? '#00d2ff' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(200 + b * 16, 880 - barH / 2, 8, barH);
      }
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('0:14  •  Tokyo Synth Preview', 200, 935);

      // Floating Hardware Security Badge inside screen
      ctx.fillStyle = 'rgba(0, 210, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(120, 1020, 784, 160, 24);
      ctx.fill();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#00d2ff';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('⚡ HARDWARE ROOT-OF-TRUST', 160, 1080);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px sans-serif';
      ctx.fillText('ECDH X25519 Ephemeral Key Ratchet in Silicon', 160, 1130);

      // Bottom Message Input Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(40, 1850, 944, 120, 60);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '30px sans-serif';
      ctx.fillText('Type encrypted message...', 120, 1922);

      // Send circle
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.arc(914, 1910, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#050811';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('➤', 898, 1923);

      screenTexture.needsUpdate = true;
    };

    // =========================================================================
    // 5. INTERNAL LOGIC BOARD CANVAS & TEXTURE
    // =========================================================================
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 1024;
    circuitCanvas.height = 2048;
    const cctx = circuitCanvas.getContext('2d');
    if (cctx) {
      cctx.fillStyle = '#050a14';
      cctx.fillRect(0, 0, 1024, 2048);

      // Circuit lines
      cctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
      cctx.lineWidth = 4;
      for (let i = 0; i < 30; i++) {
        cctx.beginPath();
        const startX = (i * 35) % 1024;
        cctx.moveTo(startX, 0);
        cctx.lineTo(startX, 600 + (i * 40));
        cctx.lineTo(512, 1024);
        cctx.stroke();
      }

      // Central Processor Chip
      cctx.fillStyle = '#0b162c';
      cctx.fillRect(256, 800, 512, 448);
      cctx.strokeStyle = '#ff4b82';
      cctx.lineWidth = 8;
      cctx.strokeRect(256, 800, 512, 448);

      cctx.fillStyle = '#ffffff';
      cctx.font = 'bold 44px monospace';
      cctx.textAlign = 'center';
      cctx.fillText('LIQUID SECURE CORE', 512, 980);
      cctx.fillStyle = '#00ffa3';
      cctx.font = 'bold 32px monospace';
      cctx.fillText('X25519 • AES-256-GCM', 512, 1040);
      cctx.fillText('LOCAL VAULT CO-PROCESSOR', 512, 1100);
    }
    const circuitTexture = new THREE.CanvasTexture(circuitCanvas);

    // =========================================================================
    // 6. BUILD THE 3D CYBER-PHONE MODEL
    // =========================================================================
    const phoneRootGroup = new THREE.Group();
    scene.add(phoneRootGroup);

    const phoneWidth = 2.4;
    const phoneHeight = 4.8;
    const phoneDepth = 0.22;

    // A. Titanium Unibody Chassis
    const chassisGeo = new THREE.BoxGeometry(phoneWidth, phoneHeight, phoneDepth);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x070b14,
      metalness: 0.95,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    phoneRootGroup.add(chassisMesh);

    // Camera bump on the back
    const camBumpGeo = new THREE.BoxGeometry(1.0, 1.2, 0.1);
    const camBumpMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c1322,
      metalness: 0.9,
      roughness: 0.2,
    });
    const camBumpMesh = new THREE.Mesh(camBumpGeo, camBumpMat);
    camBumpMesh.position.set(-0.55, 1.55, -0.16);
    phoneRootGroup.add(camBumpMesh);

    // 3 Camera Lenses
    const lensGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0.95,
      roughness: 0.1,
      transmission: 0.6,
    });
    [-0.25, 0.25].forEach((lx) => {
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(camBumpMesh.position.x + lx, camBumpMesh.position.y + 0.25, -0.22);
      phoneRootGroup.add(lens);
    });
    const lens3 = new THREE.Mesh(lensGeo, lensMat);
    lens3.rotation.x = Math.PI / 2;
    lens3.position.set(camBumpMesh.position.x, camBumpMesh.position.y - 0.28, -0.22);
    phoneRootGroup.add(lens3);

    // B. Internal Sovereign Logic Board
    const chipGeo = new THREE.PlaneGeometry(phoneWidth * 0.92, phoneHeight * 0.92);
    const chipMat = new THREE.MeshStandardMaterial({
      map: circuitTexture,
      roughness: 0.4,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.z = 0.02;
    phoneRootGroup.add(chipMesh);

    // C. Ultra-Retina Liquid AMOLED Screen
    const screenGeo = new THREE.PlaneGeometry(phoneWidth * 0.96, phoneHeight * 0.96);
    const screenMat = new THREE.MeshPhysicalMaterial({
      map: screenTexture,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      emissive: new THREE.Color(0x002233),
      emissiveIntensity: 0.35,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = phoneDepth / 2 + 0.01;
    phoneRootGroup.add(screenMesh);

    // D. Front Cyber Glass Protective Layer
    const glassGeo = new THREE.PlaneGeometry(phoneWidth * 0.98, phoneHeight * 0.98);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      clearcoat: 1.0,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = phoneDepth / 2 + 0.03;
    phoneRootGroup.add(glassMesh);

    // E. Outer Glowing Neon Chassis Bezel Rings
    const bezelGeo = new THREE.RingGeometry(phoneWidth * 0.47, phoneWidth * 0.49, 4);
    const bezelMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.z = phoneDepth / 2 + 0.02;
    phoneRootGroup.add(bezelMesh);

    // F. Exploded Connector Laser Lines (Drawn between layers during Phase 2)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00d2ff,
      dashSize: 0.1,
      gapSize: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const connectorLinesGroup = new THREE.Group();
    phoneRootGroup.add(connectorLinesGroup);

    // 4 Corner Connector Line Meshes
    const cornerLines: THREE.Line[] = [];
    for (let c = 0; c < 4; c++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -2),
        new THREE.Vector3(0, 0, 2),
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      line.visible = false;
      connectorLinesGroup.add(line);
      cornerLines.push(line);
    }

    // =========================================================================
    // 7. STAGE 3: CRYPTOGRAPHIC QUANTUM PACKET & SHIELD
    // =========================================================================
    const packetGroup = new THREE.Group();
    scene.add(packetGroup);

    // Glowing Prism Core
    const packetCoreGeo = new THREE.IcosahedronGeometry(0.75, 0);
    const packetCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0x00d2ff,
      emissive: 0xff4b82,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false,
    });
    const packetCore = new THREE.Mesh(packetCoreGeo, packetCoreMat);
    packetGroup.add(packetCore);

    // Inner Wireframe
    const innerWireGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const innerWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const innerWire = new THREE.Mesh(innerWireGeo, innerWireMat);
    packetGroup.add(innerWire);

    // Hexagonal Forcefield Shield
    const shieldGeo = new THREE.SphereGeometry(1.4, 16, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    packetGroup.add(shieldMesh);

    // Dual Orbital Energy Rings around the packet
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.02, 12, 48);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const packetRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    packetGroup.add(packetRing1);

    const ringGeo2 = new THREE.TorusGeometry(1.8, 0.02, 12, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff4b82 });
    const packetRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    packetGroup.add(packetRing2);

    // Deflected MITM Laser Beams
    const laserGroup = new THREE.Group();
    packetGroup.add(laserGroup);

    const laserLines: THREE.Line[] = [];
    for (let l = 0; l < 4; l++) {
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(3, 2, 0),
        new THREE.Vector3(1.2, 0.5, 0),
        new THREE.Vector3(2.5, -1.5, 1),
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0xff3366,
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laserGroup.add(laser);
      laserLines.push(laser);
    }
    packetGroup.position.set(0, -25, 0); // hidden initially

    // =========================================================================
    // 8. STAGE 4: 3D GEODESIC SOVEREIGN MESH GLOBE
    // =========================================================================
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const globeGeo = new THREE.IcosahedronGeometry(2.6, 2);
    const globeWireMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeWireMat);
    globeGroup.add(globeMesh);

    // Glowing Core inside globe
    const coreSphereGeo = new THREE.SphereGeometry(2.3, 24, 24);
    const coreSphereMat = new THREE.MeshBasicMaterial({
      color: 0x050d24,
      transparent: true,
      opacity: 0.85,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    globeGroup.add(coreSphere);

    // Global Network Cities (Nodes)
    const cityCoords = [
      { lat: 35.6762, lon: 139.6503, name: "Tokyo" },
      { lat: 47.3769, lon: 8.5417, name: "Zurich" },
      { lat: 40.7128, lon: -74.006, name: "New York" },
      { lat: 1.3521, lon: 103.8198, name: "Singapore" },
      { lat: 51.5074, lon: -0.1278, name: "London" },
      { lat: 64.1466, lon: -21.9426, name: "Reykjavik" },
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const nodeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x00ffa3 });
    const nodePositions: THREE.Vector3[] = [];

    cityCoords.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, 2.62);
      nodePositions.push(pos);
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(pos);
      globeGroup.add(node);
    });

    // Spline Arcs Connecting Cities
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < nodePositions.length; i++) {
      const nextIdx = (i + 1) % nodePositions.length;
      const v1 = nodePositions[i];
      const v2 = nodePositions[nextIdx];
      const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(3.2);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(32);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
    }
    globeGroup.position.set(0, -25, 0); // hidden initially

    // =========================================================================
    // 9. STAGE 5: QUANTUM PARTICLE ACCELERATOR VORTEX
    // =========================================================================
    const particleCount = 2400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleRadii = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount);

    const c1 = new THREE.Color(0x00d2ff);
    const c2 = new THREE.Color(0xff4b82);
    const c3 = new THREE.Color(0x00ffa3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.0 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 35;

      particleRadii[i] = radius;
      particleAngles[i] = angle;
      particleSpeeds[i] = 0.5 + Math.random() * 1.5;

      particlePos[i * 3] = Math.cos(angle) * radius;
      particlePos[i * 3 + 1] = y;
      particlePos[i * 3 + 2] = Math.sin(angle) * radius;

      const mixedColor = Math.random() < 0.4 ? c1 : Math.random() < 0.7 ? c2 : c3;
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Floating 3D Polyhedral Crystals
    const crystalCount = 14;
    const crystals: { mesh: THREE.Mesh; orbitSpeed: number; orbitRadius: number; rotSpeed: THREE.Vector3; initialAngle: number; yOffset: number }[] = [];
    const crystalGeo = new THREE.OctahedronGeometry(0.32, 0);

    for (let i = 0; i < crystalCount; i++) {
      const cmat = new THREE.MeshPhysicalMaterial({
        color: i % 2 === 0 ? 0x00d2ff : 0xff4b82,
        emissive: i % 2 === 0 ? 0x004488 : 0x660033,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1.0,
      });
      const cmesh = new THREE.Mesh(crystalGeo, cmat);
      scene.add(cmesh);
      crystals.push({
        mesh: cmesh,
        orbitSpeed: 0.3 + Math.random() * 0.4,
        orbitRadius: 3.2 + Math.random() * 2.5,
        rotSpeed: new THREE.Vector3(Math.random() * 0.04, Math.random() * 0.04, Math.random() * 0.04),
        initialAngle: (i / crystalCount) * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 4,
      });
    }

    // =========================================================================
    // 10. SCROLL, MOUSE & RESIZE INTERACTION CONTROLLERS
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
    // 11. 60/120 FPS HIGH-FIDELITY RENDER LOOP
    // =========================================================================
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Fluid Lerping for Scroll and Mouse
      curScroll += (targetScroll - curScroll) * 0.08;
      curMouseX += (targetMouseX - curMouseX) * 0.06;
      curMouseY += (targetMouseY - curMouseY) * 0.06;

      // Update 2D Phone Screen Canvas Texture
      renderScreenTexture(elapsed);

      // Camera Parallax Micro-movement
      camera.position.x = curMouseX * 0.4;
      camera.position.y = -curMouseY * 0.4;
      camera.lookAt(0, 0, 0);

      // =====================================================================
      // STAGE-BASED 3D STATE ENGINE
      // =====================================================================

      // ---------------------------------------------------------------------
      // PHASE 1: HERO ORBIT (0.0 to 0.20)
      // ---------------------------------------------------------------------
      if (curScroll < 0.20) {
        const t = curScroll / 0.20;

        phoneRootGroup.visible = true;
        // Phone position: start slightly to the right, moves to center
        phoneRootGroup.position.set(
          THREE.MathUtils.lerp(1.5, 0, t),
          THREE.MathUtils.lerp(0.1, 0, t),
          THREE.MathUtils.lerp(0, 0.4, t)
        );

        // Gyroscopic Mouse Tilt + Organic Floating Motion
        phoneRootGroup.rotation.set(
          curMouseY * 0.45 + Math.sin(elapsed * 0.9) * 0.05,
          curMouseX * 0.55 - 0.25 + Math.cos(elapsed * 0.7) * 0.05,
          THREE.MathUtils.lerp(0, 0.05, t)
        );

        // Keep Layers clamped together
        screenMesh.position.z = phoneDepth / 2 + 0.01;
        glassMesh.position.z = phoneDepth / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        bezelMesh.position.z = phoneDepth / 2 + 0.02;

        cornerLines.forEach(l => { l.visible = false; });

        // Hide other stages
        packetGroup.position.set(0, -25, 0);
        globeGroup.position.set(0, -25, 0);

      // ---------------------------------------------------------------------
      // PHASE 2: 3D HARDWARE EXPLODED ARCHITECTURE (0.20 to 0.45)
      // ---------------------------------------------------------------------
      } else if (curScroll < 0.45) {
        const t = (curScroll - 0.20) / 0.25;

        phoneRootGroup.visible = true;
        phoneRootGroup.position.set(0, 0, 0.5);

        // Rotate into a dramatic 45° isometric perspective
        phoneRootGroup.rotation.set(
          THREE.MathUtils.lerp(0.1, 0.55, t) + curMouseY * 0.2,
          THREE.MathUtils.lerp(-0.25, -0.75, t) + curMouseX * 0.25,
          THREE.MathUtils.lerp(0.05, 0.12, t)
        );

        // Physically explode the layers apart along Z axis!
        const explodeDistance = THREE.MathUtils.lerp(0.05, 1.8, t);

        glassMesh.position.z = phoneDepth / 2 + 0.03 + explodeDistance * 1.5; // Layer 1: Front Cyber Glass
        screenMesh.position.z = phoneDepth / 2 + 0.01 + explodeDistance * 0.8; // Layer 2: Ultra Retina AMOLED
        chipMesh.position.z = 0.02; // Layer 3: Sovereign Logic Board & Enclave
        chassisMesh.position.z = -explodeDistance * 1.2; // Layer 4: Titanium Chassis

        bezelMesh.position.z = screenMesh.position.z + 0.01;

        // Draw connecting 3D laser guide-lines between the 4 corners of layers
        cornerLines.forEach((line, idx) => {
          line.visible = true;
          const cornerX = (idx % 2 === 0 ? 1 : -1) * (phoneWidth / 2);
          const cornerY = (idx < 2 ? 1 : -1) * (phoneHeight / 2);
          const positions = line.geometry.attributes.position as THREE.BufferAttribute;
          positions.setXYZ(0, cornerX, cornerY, chassisMesh.position.z);
          positions.setXYZ(1, cornerX, cornerY, glassMesh.position.z);
          positions.needsUpdate = true;
        });

        packetGroup.position.set(0, -25, 0);
        globeGroup.position.set(0, -25, 0);

      // ---------------------------------------------------------------------
      // PHASE 3: CRYPTOGRAPHIC SCROLLYTELLING PACKET FLIGHT (0.45 to 0.70)
      // ---------------------------------------------------------------------
      } else if (curScroll < 0.70) {
        const t = (curScroll - 0.45) / 0.25;

        // Snap phone back together and dock to left
        phoneRootGroup.visible = true;
        phoneRootGroup.position.set(-2.6, 0.2, -0.5);
        phoneRootGroup.rotation.set(0.2, 0.4, 0);

        screenMesh.position.z = phoneDepth / 2 + 0.01;
        glassMesh.position.z = phoneDepth / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        cornerLines.forEach(l => { l.visible = false; });

        // Launch 3D Cryptographic Quantum Data Prism into Center Stage!
        packetGroup.position.set(
          THREE.MathUtils.lerp(-1.8, 1.8, t),
          Math.sin(elapsed * 2.5) * 0.35,
          THREE.MathUtils.lerp(-0.5, 0.6, t)
        );

        packetCore.rotation.x = elapsed * 1.6;
        packetCore.rotation.y = elapsed * 2.2;
        innerWire.rotation.x = -elapsed * 1.2;
        innerWire.rotation.z = elapsed * 1.4;

        // Shield pulses with forcefield energy
        shieldMesh.rotation.y = -elapsed * 1.5;
        shieldMesh.rotation.z = elapsed * 1.0;
        const shieldPulse = 1 + Math.sin(elapsed * 4) * 0.12;
        shieldMesh.scale.set(shieldPulse, shieldPulse, shieldPulse);

        // Turn shield green when packet reaches destination (t > 0.8)
        if (t > 0.8) {
          shieldMat.color.setHex(0x00ffa3);
        } else if (propsRef.current.isTampered) {
          shieldMat.color.setHex(0xff3366);
        } else {
          shieldMat.color.setHex(0x00d2ff);
        }

        packetRing1.rotation.z = elapsed * 2.0;
        packetRing2.rotation.y = elapsed * 1.6;

        globeGroup.position.set(0, -25, 0);

      // ---------------------------------------------------------------------
      // PHASE 4: 3D GEODESIC SOVEREIGN MESH GLOBE (0.70 to 0.88)
      // ---------------------------------------------------------------------
      } else if (curScroll < 0.88) {
        const t = (curScroll - 0.70) / 0.18;

        phoneRootGroup.visible = false;
        packetGroup.position.set(0, -25, 0);

        // Bring 3D Globe into center
        globeGroup.position.set(
          THREE.MathUtils.lerp(0, 0, t),
          THREE.MathUtils.lerp(-10, 0, Math.min(1, t * 2)),
          THREE.MathUtils.lerp(-3, 0.5, t)
        );

        // Rotate globe continuously + mouse interaction
        globeGroup.rotation.y = elapsed * 0.25 + curMouseX * 0.4;
        globeGroup.rotation.x = 0.2 + curMouseY * 0.3;

      // ---------------------------------------------------------------------
      // PHASE 5: VORTEX MONOLITH & LAUNCHPAD (0.88 to 1.0)
      // ---------------------------------------------------------------------
      } else {
        const t = (curScroll - 0.88) / 0.12;

        globeGroup.position.set(0, -25, 0);
        packetGroup.position.set(0, -25, 0);

        // Phone reappears centered, facing user, ready for action!
        phoneRootGroup.visible = true;
        phoneRootGroup.position.set(
          0,
          THREE.MathUtils.lerp(0.8, 0, t),
          THREE.MathUtils.lerp(-2, 0.8, t)
        );
        phoneRootGroup.rotation.set(
          curMouseY * 0.25,
          curMouseX * 0.3,
          0
        );

        screenMesh.position.z = phoneDepth / 2 + 0.01;
        glassMesh.position.z = phoneDepth / 2 + 0.03;
        chipMesh.position.z = 0.02;
        chassisMesh.position.z = 0;
        cornerLines.forEach(l => { l.visible = false; });
      }

      // =====================================================================
      // FLOATING 3D CRYSTALS & PARTICLE VORTEX
      // =====================================================================
      crystals.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsed * c.orbitSpeed + curScroll * Math.PI * 2.5;
        const radius = c.orbitRadius * (1 + curScroll * 0.15);
        c.mesh.position.x = Math.cos(angle) * radius + (phoneRootGroup.visible ? phoneRootGroup.position.x * 0.3 : 0);
        c.mesh.position.z = Math.sin(angle) * radius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsed * 1.5 + c.initialAngle) * 0.6;
      });

      // Particle Vortex Velocity
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const speedMultiplier = 1 + curScroll * 4.5;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        particleAngles[i] += 0.005 * particleSpeeds[i] * speedMultiplier;
        const r = particleRadii[i];
        posArr[idx] = Math.cos(particleAngles[i]) * r;
        posArr[idx + 2] = Math.sin(particleAngles[i]) * r;

        posArr[idx + 1] += 0.04 * particleSpeeds[i] * speedMultiplier;
        if (posArr[idx + 1] > 20) {
          posArr[idx + 1] = -20;
        }
      }
      posAttr.needsUpdate = true;

      // Dynamic Lights Orbit
      cyanPoint.position.x = Math.sin(elapsed * 0.8) * 8;
      cyanPoint.position.y = Math.cos(elapsed * 0.6) * 6;

      pinkPoint.position.x = Math.cos(elapsed * 0.7) * -8;
      pinkPoint.position.y = Math.sin(elapsed * 0.9) * -6;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      chassisGeo.dispose();
      chassisMat.dispose();
      camBumpGeo.dispose();
      camBumpMat.dispose();
      lensGeo.dispose();
      lensMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      bezelGeo.dispose();
      bezelMat.dispose();

      packetCoreGeo.dispose();
      packetCoreMat.dispose();
      innerWireGeo.dispose();
      innerWireMat.dispose();
      shieldGeo.dispose();
      shieldMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();

      globeGeo.dispose();
      globeWireMat.dispose();
      coreSphereGeo.dispose();
      coreSphereMat.dispose();
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
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
}

