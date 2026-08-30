"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Hero3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Constellation Network
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPrimary = new THREE.Color("#10b981");
    const colorSecondary = new THREE.Color("#38bdf8");
    const colorAccent = new THREE.Color("#8b5cf6");

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      const mixRatio = Math.random();
      const mixedColor = mixRatio < 0.5 
        ? colorPrimary.clone().lerp(colorSecondary, mixRatio * 2)
        : colorSecondary.clone().lerp(colorAccent, (mixRatio - 0.5) * 2);

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    // Floating 3D Wireframe Geometry Node 1 (Icosahedron - Scrutiny Engine)
    const icoGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    icoMesh.position.set(-6, 2, -2);
    scene.add(icoMesh);

    // Floating 3D Node 2 (Inner Core)
    const coreGeo = new THREE.OctahedronGeometry(1.8, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(-6, 2, -2);
    scene.add(coreMesh);

    // Floating 3D Node 3 (Right Crystal Prism - Trace Matrix)
    const prismGeo = new THREE.DodecahedronGeometry(2.8, 0);
    const prismMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismMesh.position.set(7, -2, -1);
    scene.add(prismMesh);

    // Interactive Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x10b981, 2, 50);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // Mouse Tracking Physics
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotate objects
      icoMesh.rotation.x = elapsedTime * 0.2 + targetY * 0.5;
      icoMesh.rotation.y = elapsedTime * 0.3 + targetX * 0.5;

      coreMesh.rotation.x = -elapsedTime * 0.4;
      coreMesh.rotation.y = -elapsedTime * 0.5;

      prismMesh.rotation.x = elapsedTime * 0.25;
      prismMesh.rotation.z = elapsedTime * 0.15;

      particleSystem.rotation.y = elapsedTime * 0.03 + targetX * 0.2;
      particleSystem.rotation.x = targetY * 0.1;

      // Floating oscillation
      icoMesh.position.y = 2 + Math.sin(elapsedTime * 1.5) * 0.4;
      coreMesh.position.y = 2 + Math.sin(elapsedTime * 1.5) * 0.4;
      prismMesh.position.y = -2 + Math.cos(elapsedTime * 1.2) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      prismGeo.dispose();
      prismMat.dispose();
      geometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
