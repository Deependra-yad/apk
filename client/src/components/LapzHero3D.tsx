"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LapzHero3DProps {
  scrollYProgress?: number;
}

export default function LapzHero3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Apple-Grade Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x1a1a24, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLightBlue = new THREE.PointLight(0x38bdf8, 4.5, 25);
    rimLightBlue.position.set(-4, 3, 3);
    scene.add(rimLightBlue);

    const rimLightPurple = new THREE.PointLight(0xa855f7, 4.5, 25);
    rimLightPurple.position.set(4, -2, 3);
    scene.add(rimLightPurple);

    // 4. Dynamic Offscreen High-Res Canvas Textures for Floating Spatial UI Panels
    // --- Texture 1: Main Spatial Chat Window ---
    const chatCanvas = document.createElement('canvas');
    chatCanvas.width = 1024;
    chatCanvas.height = 1024;
    const cctx = chatCanvas.getContext('2d');
    if (cctx) {
      // Dark Glassmorphic background
      cctx.fillStyle = '#08080c';
      cctx.fillRect(0, 0, 1024, 1024);

      // Glass border
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      cctx.lineWidth = 4;
      cctx.strokeRect(2, 2, 1020, 1020);

      // Header Bar
      cctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      cctx.fillRect(0, 0, 1024, 120);

      // Status dots (Apple Vision Pro style)
      cctx.fillStyle = '#ef4444';
      cctx.beginPath(); cctx.arc(50, 60, 12, 0, Math.PI * 2); cctx.fill();
      cctx.fillStyle = '#f59e0b';
      cctx.beginPath(); cctx.arc(90, 60, 12, 0, Math.PI * 2); cctx.fill();
      cctx.fillStyle = '#10b981';
      cctx.beginPath(); cctx.arc(130, 60, 12, 0, Math.PI * 2); cctx.fill();

      // Title
      cctx.fillStyle = '#ffffff';
      cctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      cctx.fillText('Liquid Chat • Spatial Room', 200, 72);
      cctx.fillStyle = '#10b981';
      cctx.font = 'bold 22px monospace';
      cctx.fillText('CURVE25519 E2EE ACTIVE', 700, 72);

      // Message 1 (Incoming)
      cctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      cctx.beginPath(); cctx.roundRect(60, 180, 680, 160, 24); cctx.fill();
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; cctx.stroke();

      cctx.fillStyle = '#ffffff';
      cctx.font = '32px sans-serif';
      cctx.fillText('Welcome to spatial sovereign messaging 🌊', 100, 245);
      cctx.fillStyle = '#94a3b8';
      cctx.font = '22px monospace';
      cctx.fillText('09:41 AM • 0 bytes stored on cloud', 100, 305);

      // Message 2 (Outgoing)
      const grad = cctx.createLinearGradient(280, 380, 960, 540);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#818cf8');
      cctx.fillStyle = grad;
      cctx.beginPath(); cctx.roundRect(280, 380, 680, 160, 24); cctx.fill();

      cctx.fillStyle = '#05070e';
      cctx.font = 'bold 32px sans-serif';
      cctx.fillText('Direct WebRTC stream established. 🛡️', 320, 445);
      cctx.fillStyle = '#0f172a';
      cctx.font = 'bold 22px monospace';
      cctx.fillText('09:42 AM • Verified Poly1305 Tag ✓✓', 320, 505);

      // Audio waveform bar inside chat
      cctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      cctx.beginPath(); cctx.roundRect(60, 580, 640, 140, 24); cctx.fill();
      cctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; cctx.stroke();

      cctx.fillStyle = '#38bdf8';
      cctx.beginPath(); cctx.arc(125, 650, 32, 0, Math.PI * 2); cctx.fill();
      cctx.fillStyle = '#05070e';
      cctx.beginPath(); cctx.moveTo(118, 638); cctx.lineTo(138, 650); cctx.lineTo(118, 662); cctx.fill();

      for (let b = 0; b < 24; b++) {
        const bh = 15 + Math.sin(b * 0.45) * 35;
        cctx.fillStyle = b < 12 ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)';
        cctx.fillRect(185 + b * 18, 650 - bh / 2, 8, bh);
      }
      cctx.fillStyle = '#94a3b8';
      cctx.font = '20px monospace';
      cctx.fillText('0:18 • Tokyo Synthesizer Chime', 185, 700);

      // Bottom Input Box
      cctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      cctx.beginPath(); cctx.roundRect(60, 860, 904, 100, 50); cctx.fill();
      cctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; cctx.stroke();
      cctx.fillStyle = '#64748b';
      cctx.font = '28px sans-serif';
      cctx.fillText('Message sealed with hardware keys...', 130, 922);
    }
    const chatTexture = new THREE.CanvasTexture(chatCanvas);

    // --- Texture 2: Floating Key Exchange Panel ---
    const keyCanvas = document.createElement('canvas');
    keyCanvas.width = 600;
    keyCanvas.height = 600;
    const kctx = keyCanvas.getContext('2d');
    if (kctx) {
      kctx.fillStyle = '#0a0b12';
      kctx.fillRect(0, 0, 600, 600);
      kctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      kctx.lineWidth = 3;
      kctx.strokeRect(2, 2, 596, 596);

      kctx.fillStyle = '#38bdf8';
      kctx.font = 'bold 28px monospace';
      kctx.fillText('HARDWARE ENCLAVE', 50, 70);

      kctx.fillStyle = '#ffffff';
      kctx.font = 'bold 36px sans-serif';
      kctx.fillText('X25519 Ratchet', 50, 130);

      kctx.fillStyle = '#94a3b8';
      kctx.font = '20px sans-serif';
      kctx.fillText('Ephemeral ECDH keypair generated', 50, 175);
      kctx.fillText('Private seed zeroized every 60s', 50, 210);

      kctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
      kctx.fillRect(50, 260, 500, 160);
      kctx.strokeStyle = '#38bdf8';
      kctx.strokeRect(50, 260, 500, 160);

      kctx.fillStyle = '#38bdf8';
      kctx.font = 'bold 18px monospace';
      kctx.fillText('PUBLIC RATCHET KEY:', 70, 305);
      kctx.fillStyle = '#e2e8f0';
      kctx.font = '16px monospace';
      kctx.fillText('9f8a4b2c7e1d5a8f6b3c9e2a4d7f1b8a', 70, 345);
      kctx.fillText('5c8e2f9d1a4b7c3e6f8a2b5d9c1e4f7a', 70, 385);

      kctx.fillStyle = '#10b981';
      kctx.font = 'bold 22px monospace';
      kctx.fillText('● 100% LOCAL SILICON COMPLIANT', 50, 510);
    }
    const keyTexture = new THREE.CanvasTexture(keyCanvas);

    // --- Texture 3: Floating P2P Video Call Panel ---
    const callCanvas = document.createElement('canvas');
    callCanvas.width = 600;
    callCanvas.height = 600;
    const vctx = callCanvas.getContext('2d');
    if (vctx) {
      vctx.fillStyle = '#080811';
      vctx.fillRect(0, 0, 600, 600);
      vctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      vctx.lineWidth = 3;
      vctx.strokeRect(2, 2, 596, 596);

      vctx.fillStyle = '#a855f7';
      vctx.font = 'bold 28px monospace';
      vctx.fillText('WEBRTC DIRECT STREAM', 50, 70);

      vctx.fillStyle = '#ffffff';
      vctx.font = 'bold 36px sans-serif';
      vctx.fillText('Spatial Video Call', 50, 130);

      // Video preview frame
      vctx.fillStyle = '#161329';
      vctx.beginPath(); vctx.roundRect(50, 180, 500, 260, 20); vctx.fill();
      vctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'; vctx.stroke();

      // Simulated participant avatar
      vctx.fillStyle = '#312e81';
      vctx.beginPath(); vctx.arc(300, 300, 60, 0, Math.PI * 2); vctx.fill();
      vctx.strokeStyle = '#a855f7'; vctx.lineWidth = 4; vctx.stroke();

      vctx.font = '54px sans-serif';
      vctx.textAlign = 'center';
      vctx.fillText('💎', 300, 320);
      vctx.textAlign = 'left';

      vctx.fillStyle = '#10b981';
      vctx.font = 'bold 20px monospace';
      vctx.fillText('● DTLS-SRTP ENCRYPTED • 0 SERVER RELAY', 50, 510);
    }
    const callTexture = new THREE.CanvasTexture(callCanvas);

    // =========================================================================
    // 5. BUILD SPATIAL FLOATING GLASS UI RIG (Vision Pro / Lapz.io Style)
    // =========================================================================
    const spatialRig = new THREE.Group();
    scene.add(spatialRig);

    // Material helper with glass transmission and subtle sheen
    const createGlassMat = (texture: THREE.CanvasTexture) => {
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        transparent: true,
        opacity: 0.96,
        roughness: 0.1,
        metalness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
      });
    };

    // Panel 1: Centerpiece Spatial Chat Window
    const chatPanelGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const chatPanelMat = createGlassMat(chatTexture);
    const chatPanel = new THREE.Mesh(chatPanelGeo, chatPanelMat);
    chatPanel.position.set(0, 0, 0);
    spatialRig.add(chatPanel);

    // Panel 1 Shadow Plane (Lapz.io drop shadow)
    const shadowGeo = new THREE.PlaneGeometry(4.0, 4.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const chatShadow = new THREE.Mesh(shadowGeo, shadowMat);
    chatShadow.position.set(0.15, -0.15, -0.2);
    spatialRig.add(chatShadow);

    // Panel 2: Floating Key Exchange Panel (Left spatial depth)
    const keyPanelGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const keyPanelMat = createGlassMat(keyTexture);
    const keyPanel = new THREE.Mesh(keyPanelGeo, keyPanelMat);
    keyPanel.position.set(-2.8, 0.4, 0.8);
    keyPanel.rotation.y = 0.25;
    spatialRig.add(keyPanel);

    // Panel 3: Floating P2P Video Call Panel (Right spatial depth)
    const callPanelGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const callPanelMat = createGlassMat(callTexture);
    const callPanel = new THREE.Mesh(callPanelGeo, callPanelMat);
    callPanel.position.set(2.8, -0.4, 0.8);
    callPanel.rotation.y = -0.25;
    spatialRig.add(callPanel);

    // 6. Floating Polyhedral Crystal Nodes around Spatial Rig
    const nodeGeo = new THREE.IcosahedronGeometry(0.18, 0);
    const nodeMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
    });
    const nodes: { mesh: THREE.Mesh; angle: number; speed: number; radius: number; y: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      spatialRig.add(mesh);
      nodes.push({
        mesh,
        angle: (i / 12) * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.3,
        radius: 3.4 + Math.random() * 1.2,
        y: (Math.random() - 0.5) * 3,
      });
    }

    // 7. Mouse & Scroll Parallax Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    let targetScroll = 0;
    let curScroll = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docH > 0 ? scrollY / docH : 0;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // 8. 60/120 FPS Cinematic Spatial Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth Lerping
      curMouseX += (targetMouseX - curMouseX) * 0.05;
      curMouseY += (targetMouseY - curMouseY) * 0.05;
      curScroll += (targetScroll - curScroll) * 0.07;

      // Spatial Rig Parallax & Rotation
      spatialRig.rotation.y = curMouseX * 0.25 + Math.sin(elapsed * 0.5) * 0.03;
      spatialRig.rotation.x = -curMouseY * 0.2 + Math.cos(elapsed * 0.6) * 0.02;

      // Scroll-Linked Spatial Disassembly & Parallax Depth:
      // As user scrolls, the floating panels spread outwards in 3D perspective
      const spread = 1.0 + curScroll * 1.8;
      const zOffset = curScroll * 2.5;

      chatPanel.position.z = zOffset * 0.5;
      chatShadow.position.z = chatPanel.position.z - 0.2;

      keyPanel.position.x = -2.8 * spread;
      keyPanel.position.z = 0.8 + zOffset * 1.2;
      keyPanel.rotation.y = 0.25 + curScroll * 0.3;

      callPanel.position.x = 2.8 * spread;
      callPanel.position.z = 0.8 + zOffset * 1.2;
      callPanel.rotation.y = -0.25 - curScroll * 0.3;

      // Orbiting crystal nodes
      nodes.forEach(n => {
        const a = n.angle + elapsed * n.speed;
        n.mesh.position.x = Math.cos(a) * (n.radius * (1 + curScroll * 0.4));
        n.mesh.position.z = Math.sin(a) * (n.radius * (1 + curScroll * 0.4));
        n.mesh.position.y = n.y + Math.sin(elapsed * 1.5 + n.angle) * 0.3;
        n.mesh.rotation.x += 0.02;
        n.mesh.rotation.y += 0.03;
      });

      // Camera micro-movement
      camera.position.x = curMouseX * 0.3;
      camera.position.y = -curMouseY * 0.3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      chatPanelGeo.dispose();
      chatPanelMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      keyPanelGeo.dispose();
      keyPanelMat.dispose();
      callPanelGeo.dispose();
      callPanelMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();

      chatTexture.dispose();
      keyTexture.dispose();
      callTexture.dispose();
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

