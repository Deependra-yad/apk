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
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Multi-Point Cyber Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 4, 25);
    cyanLight.position.set(6, 6, 6);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff4b82, 4, 25);
    pinkLight.position.set(-6, -5, 5);
    scene.add(pinkLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 3, 20);
    purpleLight.position.set(0, 4, 4);
    scene.add(purpleLight);

    // 3. Central Quantum Torus Knot Group
    const knotGroup = new THREE.Group();
    knotGroup.position.set(1.4, 0.2, 0); // Positioned harmoniously in hero
    scene.add(knotGroup);

    // Outer Glowing Wireframe Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(1.65, 0.44, 180, 36, 2, 3);
    const wireframeMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x004466,
      wireframe: true,
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 0.7
    });
    const knotWireframe = new THREE.Mesh(knotGeo, wireframeMat);
    knotGroup.add(knotWireframe);

    // Inner Luminous Core
    const innerKnotGeo = new THREE.TorusKnotGeometry(1.32, 0.22, 120, 24, 2, 3);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xff4b82,
      emissive: 0xbb1144,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.55
    });
    const innerKnot = new THREE.Mesh(innerKnotGeo, innerMat);
    knotGroup.add(innerKnot);

    // Middle Resonant Energy Ring
    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x581c87,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6
    });
    const energyRing = new THREE.Mesh(ringGeo, ringMat);
    energyRing.rotation.x = Math.PI / 2;
    knotGroup.add(energyRing);

    // 4. Orbiting Geometric Cryptographic Crystals (16 Units)
    const crystals: Array<{
      mesh: THREE.Mesh;
      rotSpeed: { x: number; y: number; z: number };
      orbitSpeed: number;
      orbitRadius: number;
      initialAngle: number;
      yOffset: number;
    }> = [];

    const crystalColors = [0x00f2fe, 0xff4b82, 0xa855f7, 0x10b981, 0xff7597];

    for (let i = 0; i < 16; i++) {
      let geo: THREE.BufferGeometry;
      if (i % 3 === 0) {
        geo = new THREE.IcosahedronGeometry(0.24 + Math.random() * 0.18, 0);
      } else if (i % 3 === 1) {
        geo = new THREE.OctahedronGeometry(0.28 + Math.random() * 0.16, 0);
      } else {
        geo = new THREE.TetrahedronGeometry(0.26 + Math.random() * 0.14, 0);
      }

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
        orbitSpeed: 0.004 + Math.random() * 0.008,
        orbitRadius: 3.4 + Math.random() * 2.8,
        initialAngle: Math.random() * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 4.5
      });
    }

    // 5. 1,600-Point Quantum Data Stream Particle Cloud
    const particleCount = 1600;
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

    // 6. Smooth Lerping Physics for Mouse and Scroll
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

    // 7. Strict Viewport Resize Listener
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 8. 60/120 FPS Animation Loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Lerp transitions
      curScroll += (targetScroll - curScroll) * 0.08;
      curMouseX += (targetMouseX - curMouseX) * 0.06;
      curMouseY += (targetMouseY - curMouseY) * 0.06;

      // Section-Aware 3D Transformations based on curScroll:
      // Phase 1 (0.0 to 0.3): Hero view -> knot at (1.4, 0.2, 0)
      // Phase 2 (0.3 to 0.6): Scrollytelling -> knot glides to (-1.2, -0.4, -0.8)
      // Phase 3 (0.6 to 0.85): Security/Features -> knot glides to (0, -0.2, -1.2)
      // Phase 4 (0.85 to 1.0): Download/CTA -> knot centers at (0, 0, -1.8)
      let targetKnotX = 1.4;
      let targetKnotY = 0.2;
      let targetKnotZ = 0;
      let knotScale = 1;

      if (curScroll < 0.3) {
        const t = curScroll / 0.3;
        targetKnotX = THREE.MathUtils.lerp(1.4, -1.2, t);
        targetKnotY = THREE.MathUtils.lerp(0.2, -0.3, t);
        targetKnotZ = THREE.MathUtils.lerp(0, -0.8, t);
        knotScale = THREE.MathUtils.lerp(1, 0.85, t);
      } else if (curScroll < 0.6) {
        const t = (curScroll - 0.3) / 0.3;
        targetKnotX = THREE.MathUtils.lerp(-1.2, 0, t);
        targetKnotY = THREE.MathUtils.lerp(-0.3, -0.2, t);
        targetKnotZ = THREE.MathUtils.lerp(-0.8, -1.2, t);
        knotScale = THREE.MathUtils.lerp(0.85, 0.9, t);
      } else if (curScroll < 0.85) {
        const t = (curScroll - 0.6) / 0.25;
        targetKnotX = THREE.MathUtils.lerp(0, 0.8, t);
        targetKnotY = THREE.MathUtils.lerp(-0.2, -0.1, t);
        targetKnotZ = THREE.MathUtils.lerp(-1.2, -1.5, t);
        knotScale = THREE.MathUtils.lerp(0.9, 0.95, t);
      } else {
        const t = (curScroll - 0.85) / 0.15;
        targetKnotX = THREE.MathUtils.lerp(0.8, 0, t);
        targetKnotY = THREE.MathUtils.lerp(-0.1, 0, t);
        targetKnotZ = THREE.MathUtils.lerp(-1.5, -2, t);
        knotScale = THREE.MathUtils.lerp(0.95, 1.1, t);
      }

      // Apply lerped knot position with mouse parallax
      knotGroup.position.x += (targetKnotX + curMouseX * 0.4 - knotGroup.position.x) * 0.08;
      knotGroup.position.y += (targetKnotY - curMouseY * 0.4 - knotGroup.position.y) * 0.08;
      knotGroup.position.z += (targetKnotZ - knotGroup.position.z) * 0.08;

      // Rotation driven by time + scroll velocity
      knotGroup.rotation.x = elapsed * 0.22 + curScroll * Math.PI * 2.5 + curMouseY * 0.35;
      knotGroup.rotation.y = elapsed * 0.32 + curScroll * Math.PI * 3.5 + curMouseX * 0.45;
      knotGroup.rotation.z = Math.sin(elapsed * 0.3) * 0.18;

      // Gentle pulsing breathing
      const pulse = knotScale * (1 + Math.sin(elapsed * 1.8) * 0.025);
      knotGroup.scale.set(pulse, pulse, pulse);

      energyRing.rotation.z = elapsed * 0.6;

      // Dynamic Camera Parallax
      camera.position.x = curMouseX * 0.6;
      camera.position.y = -curMouseY * 0.6;
      camera.lookAt(0, 0, 0);

      // Orbiting Crystals Animation
      crystals.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsed * c.orbitSpeed + curScroll * Math.PI * 2.2;
        const radius = c.orbitRadius * (1 + curScroll * 0.3);
        c.mesh.position.x = Math.cos(angle) * radius + (knotGroup.position.x * 0.4);
        c.mesh.position.z = Math.sin(angle) * radius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsed * 1.2 + c.initialAngle) * 0.6 + (knotGroup.position.y * 0.4);
      });

      // Quantum Particle Flow with Scroll Acceleration
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const scrollSpeedBoost = 1 + curScroll * 3;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        positions[idx + 1] += particleVelocities[i] * scrollSpeedBoost * 0.05;
        if (positions[idx + 1] > 18) {
          positions[idx + 1] = -18;
          positions[idx] = (Math.random() - 0.5) * 36;
        }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = elapsed * 0.015 + curScroll * 0.6;

      // Orbiting Lights
      cyanLight.position.x = Math.sin(elapsed * 0.7) * 7;
      cyanLight.position.y = Math.cos(elapsed * 0.5) * 7;

      pinkLight.position.x = Math.cos(elapsed * 0.6) * -7;
      pinkLight.position.y = Math.sin(elapsed * 0.8) * -7;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Comprehensive Clean up
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      knotGeo.dispose();
      wireframeMat.dispose();
      innerKnotGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();

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
