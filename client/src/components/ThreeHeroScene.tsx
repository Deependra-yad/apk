"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroSceneProps {
  scrollProgress?: number;
}

export default function ThreeHeroScene({ scrollProgress = 0 }: ThreeHeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d2ff, 3, 20);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff4b82, 3, 20);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x7928ca, 2, 20);
    pointLight3.position.set(0, 0, 3);
    scene.add(pointLight3);

    // 3. Central Quantum Torus Knot (Wireframe + Glass core)
    const knotGroup = new THREE.Group();
    scene.add(knotGroup);

    // Outer Wireframe Torus Knot
    const knotGeometry = new THREE.TorusKnotGeometry(1.6, 0.42, 160, 32, 2, 3);
    const wireframeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x005577,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65
    });
    const knotWireframe = new THREE.Mesh(knotGeometry, wireframeMaterial);
    knotGroup.add(knotWireframe);

    // Inner Glowing Core (Double knot slightly smaller)
    const innerKnotGeo = new THREE.TorusKnotGeometry(1.3, 0.22, 100, 20, 2, 3);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4b82,
      emissive: 0xaa1144,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.45
    });
    const innerKnot = new THREE.Mesh(innerKnotGeo, innerMaterial);
    knotGroup.add(innerKnot);

    // 4. Orbiting Geometric Floating Crystals (Icosahedrons & Octahedrons)
    const crystals: Array<{ mesh: THREE.Mesh; rotSpeed: { x: number; y: number; z: number }; orbitSpeed: number; orbitRadius: number; initialAngle: number; yOffset: number }> = [];
    const crystalColors = [0x00d2ff, 0xff4b82, 0x00f2fe, 0x9b51e0, 0xff7597];

    for (let i = 0; i < 14; i++) {
      const geo = i % 2 === 0 ? new THREE.IcosahedronGeometry(0.25 + Math.random() * 0.2, 0) : new THREE.OctahedronGeometry(0.3 + Math.random() * 0.2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: crystalColors[i % crystalColors.length],
        emissive: crystalColors[i % crystalColors.length],
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: i % 3 === 0
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
        orbitRadius: 3.2 + Math.random() * 2.5,
        initialAngle: Math.random() * Math.PI * 2,
        yOffset: (Math.random() - 0.5) * 4
      });
    }

    // 5. Star Particle Cloud with 1,200 points
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cCyan = new THREE.Color(0x00d2ff);
    const cPink = new THREE.Color(0xff4b82);
    const cPurple = new THREE.Color(0x7928ca);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 30;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 30;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 20 - 5;

      const pickColor = Math.random() < 0.4 ? cCyan : Math.random() < 0.7 ? cPink : cPurple;
      particleColors[idx] = pickColor.r;
      particleColors[idx + 1] = pickColor.g;
      particleColors[idx + 2] = pickColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Interactive Mouse & Scroll Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;
    let curMouseX = 0;
    let curMouseY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handlePointerMove);

    let targetScroll = 0;
    let curScroll = 0;

    const handleScroll = () => {
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      targetScroll = Math.min(1, Math.max(0, window.scrollY / max));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Scroll & Mouse Lerping
      curScroll += (targetScroll - curScroll) * 0.08;
      const currentScroll = curScroll;

      // Mouse Lerping
      curMouseX += (targetMouseX - curMouseX) * 0.05;
      curMouseY += (targetMouseY - curMouseY) * 0.05;

      // Rotate central Torus Knot based on time + scroll + mouse
      knotGroup.rotation.x = elapsedTime * 0.25 + currentScroll * Math.PI * 2 + curMouseY * 0.4;
      knotGroup.rotation.y = elapsedTime * 0.35 + currentScroll * Math.PI * 3 + curMouseX * 0.5;
      knotGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.2;

      // Scale pulse
      const pulse = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      knotGroup.scale.set(pulse, pulse, pulse);

      // Camera parallax
      camera.position.x = curMouseX * 0.8;
      camera.position.y = -curMouseY * 0.8 + currentScroll * -2;
      camera.lookAt(0, currentScroll * -2, 0);

      // Rotate Orbiting Crystals
      crystals.forEach((c) => {
        c.mesh.rotation.x += c.rotSpeed.x;
        c.mesh.rotation.y += c.rotSpeed.y;
        c.mesh.rotation.z += c.rotSpeed.z;

        const angle = c.initialAngle + elapsedTime * c.orbitSpeed + currentScroll * Math.PI * 2;
        c.mesh.position.x = Math.cos(angle) * c.orbitRadius;
        c.mesh.position.z = Math.sin(angle) * c.orbitRadius;
        c.mesh.position.y = c.yOffset + Math.sin(elapsedTime + c.initialAngle) * 0.5;
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.02 + currentScroll * 0.5;
      particles.rotation.x = Math.sin(elapsedTime * 0.01) * 0.1;

      // Move Point Lights
      pointLight1.position.x = Math.sin(elapsedTime * 0.8) * 6;
      pointLight1.position.y = Math.cos(elapsedTime * 0.6) * 6;

      pointLight2.position.x = Math.cos(elapsedTime * 0.7) * -6;
      pointLight2.position.y = Math.sin(elapsedTime * 0.9) * -6;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      // Memory cleanup
      knotGeometry.dispose();
      wireframeMaterial.dispose();
      innerKnotGeo.dispose();
      innerMaterial.dispose();
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
      className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden" 
      style={{ zIndex: 0 }}
    />
  );
}
