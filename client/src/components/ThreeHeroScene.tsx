"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & Viewport Setup
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

    // 2. Cyber Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 4, 30);
    cyanLight.position.set(6, 6, 6);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xff4b82, 4, 30);
    pinkLight.position.set(-6, -5, 6);
    scene.add(pinkLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3, 25);
    purpleLight.position.set(0, 4, 4);
    scene.add(purpleLight);

    // 3. Central Quantum Torus Knot & Resonant Rings (Ambient 3D Sculpture)
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(2.2, 0.3, -1.0); // Floats elegantly in hero background
    scene.add(sculptureGroup);

    // Outer Wireframe Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(1.6, 0.42, 160, 32, 2, 3);
    const wireframeMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x004466,
      wireframe: true,
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 0.55
    });
    const knotWireframe = new THREE.Mesh(knotGeo, wireframeMat);
    sculptureGroup.add(knotWireframe);

    // Inner Glowing Sakura Core
    const innerKnotGeo = new THREE.TorusKnotGeometry(1.25, 0.22, 100, 20, 2, 3);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xff4b82,
      emissive: 0xaa1144,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.45
    });
    const innerKnot = new THREE.Mesh(innerKnotGeo, innerMat);
    sculptureGroup.add(innerKnot);

    // Orbital Resonant Rings
    const ringGeo = new THREE.TorusGeometry(2.5, 0.035, 16, 80);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6b21a8,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.5;
    sculptureGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 2.5;
    sculptureGroup.add(ring2);

    // 4. Orbiting Geometric Crystals (16 Polyhedra)
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
        geo = new THREE.IcosahedronGeometry(0.25 + Math.random() * 0.18, 0);
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
        orbitRadius: 3.6 + Math.random() * 3.0,
        initialAngle: Math.random() * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 5
      });
    }

    // 5. 1,800-Point Quantum Data Stream Particle Cloud
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
      particlePositions[idx] = (Math.random() - 0.5) * 40;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 40;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 24 - 4;

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
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Smooth Lerp Physics for Mouse and Scroll
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

    // 7. Viewport Resize Handler
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

      // Lerp transitions
      curScroll += (targetScroll - curScroll) * 0.08;
      curMouseX += (targetMouseX - curMouseX) * 0.06;
      curMouseY += (targetMouseY - curMouseY) * 0.06;

      // Sculpture motion across sections:
      // In Hero: slightly right (x: 2.2, y: 0.3)
      // In Middle: moves towards center (x: 0, y: 0)
      // In Bottom: pulled back and centered (x: 0, z: -3)
      const targetSculptureX = THREE.MathUtils.lerp(2.2, -1.5, Math.min(1, curScroll * 2));
      const targetSculptureY = THREE.MathUtils.lerp(0.3, -0.2, curScroll);
      const targetSculptureZ = THREE.MathUtils.lerp(-1.0, -2.5, curScroll);

      sculptureGroup.position.x += (targetSculptureX + curMouseX * 0.3 - sculptureGroup.position.x) * 0.08;
      sculptureGroup.position.y += (targetSculptureY - curMouseY * 0.3 - sculptureGroup.position.y) * 0.08;
      sculptureGroup.position.z += (targetSculptureZ - sculptureGroup.position.z) * 0.08;

      // Rotations
      sculptureGroup.rotation.x = elapsed * 0.2 + curScroll * Math.PI * 2 + curMouseY * 0.3;
      sculptureGroup.rotation.y = elapsed * 0.3 + curScroll * Math.PI * 3 + curMouseX * 0.4;
      sculptureGroup.rotation.z = Math.sin(elapsed * 0.4) * 0.15;

      ring1.rotation.z = elapsed * 0.5;
      ring2.rotation.z = -elapsed * 0.4;

      // Camera Parallax
      camera.position.x = curMouseX * 0.5;
      camera.position.y = -curMouseY * 0.5;
      camera.lookAt(0, 0, 0);

      // Orbiting crystals
      crystals.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsed * c.orbitSpeed + curScroll * Math.PI * 2.2;
        const radius = c.orbitRadius * (1 + curScroll * 0.2);
        c.mesh.position.x = Math.cos(angle) * radius + (sculptureGroup.position.x * 0.3);
        c.mesh.position.z = Math.sin(angle) * radius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsed * 1.2 + c.initialAngle) * 0.5;
      });

      // Quantum Particles Flow with Scroll Velocity
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const speed = 1 + curScroll * 3.5;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        positions[idx + 1] += particleVelocities[i] * speed * 0.06;
        if (positions[idx + 1] > 20) {
          positions[idx + 1] = -20;
          positions[idx] = (Math.random() - 0.5) * 40;
        }
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = elapsed * 0.015 + curScroll * 0.6;

      // Lights
      cyanLight.position.x = Math.sin(elapsed * 0.7) * 7;
      cyanLight.position.y = Math.cos(elapsed * 0.5) * 7;

      pinkLight.position.x = Math.cos(elapsed * 0.6) * -7;
      pinkLight.position.y = Math.sin(elapsed * 0.8) * -7;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Complete Cleanup
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
