"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LiquidHeroSphereProps {
  scrollYProgress?: number;
}

export default function LiquidHeroSphere() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // 2. High Quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // 3. Cinematic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x0a0a14, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLightPurple = new THREE.PointLight(0xa855f7, 6.0, 15);
    rimLightPurple.position.set(-3.5, 2.5, 2);
    scene.add(rimLightPurple);

    const rimLightCyan = new THREE.PointLight(0x06b6d4, 5.0, 15);
    rimLightCyan.position.set(3.5, -2.5, 2);
    scene.add(rimLightCyan);

    const centerGlow = new THREE.PointLight(0x7c3aed, 3.5, 10);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    // 4. Fluid Morphing 3D Liquid Chrome Orb
    const sphereGeo = new THREE.IcosahedronGeometry(1.35, 64);
    const originalPositions = sphereGeo.attributes.position.clone();

    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x0c0d14,
      emissive: 0x1f1438,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      wireframe: false,
    });

    const liquidOrb = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(liquidOrb);

    // Outer subtle glowing aura ring
    const ringGeo = new THREE.TorusGeometry(1.7, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4
    });
    const auraRing = new THREE.Mesh(ringGeo, ringMat);
    auraRing.rotation.x = Math.PI / 3;
    scene.add(auraRing);

    const ringGeo2 = new THREE.TorusGeometry(1.9, 0.01, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.3
    });
    const auraRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    auraRing2.rotation.x = -Math.PI / 4;
    scene.add(auraRing2);

    // 5. Mouse & Scroll Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    let targetScroll = 0;
    let curScroll = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = docH > 0 ? scrollY / docH : 0;
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop with Fluid Sim
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      curMouseX += (targetMouseX - curMouseX) * 0.05;
      curMouseY += (targetMouseY - curMouseY) * 0.05;
      curScroll += (targetScroll - curScroll) * 0.08;

      // Dynamic liquid wave deformation
      const posAttr = sphereGeo.attributes.position as THREE.BufferAttribute;
      const origAttr = originalPositions as THREE.BufferAttribute;

      for (let i = 0; i < posAttr.count; i++) {
        const ox = origAttr.getX(i);
        const oy = origAttr.getY(i);
        const oz = origAttr.getZ(i);

        // Multi-frequency harmonic liquid ripple
        const wave1 = Math.sin(ox * 3.0 + elapsed * 1.5) * 0.06;
        const wave2 = Math.cos(oy * 3.5 + elapsed * 1.8) * 0.06;
        const wave3 = Math.sin(oz * 2.8 + elapsed * 1.2) * 0.06;
        const totalWave = 1.0 + wave1 + wave2 + wave3;

        posAttr.setXYZ(i, ox * totalWave, oy * totalWave, oz * totalWave);
      }
      posAttr.needsUpdate = true;
      sphereGeo.computeVertexNormals();

      // Parallax Scale & Rotation
      const scrollScale = 1.0 + curScroll * 0.8;
      liquidOrb.scale.set(scrollScale, scrollScale, scrollScale);

      liquidOrb.rotation.x = elapsed * 0.15 + curMouseY * 0.4;
      liquidOrb.rotation.y = elapsed * 0.2 + curMouseX * 0.5;

      auraRing.rotation.z = elapsed * 0.2;
      auraRing2.rotation.z = -elapsed * 0.15;

      // Light orbiting
      rimLightPurple.position.x = Math.sin(elapsed * 0.8) * 4;
      rimLightPurple.position.y = Math.cos(elapsed * 0.6) * 3;

      rimLightCyan.position.x = -Math.sin(elapsed * 0.7) * 4;
      rimLightCyan.position.y = -Math.cos(elapsed * 0.5) * 3;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Clean Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      sphereGeo.dispose();
      originalPositions.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full flex items-center justify-center pointer-events-none select-none"
    />
  );
}

