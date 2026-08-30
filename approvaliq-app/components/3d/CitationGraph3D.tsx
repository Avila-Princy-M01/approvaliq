"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ShieldAlert } from "lucide-react";

interface StatutoryAct {
  id: string;
  shortName: string;
  name: string;
  authority: string;
  citation: string;
  slaDays: number;
  processDesc: string;
  color: number;
  hexColor: string;
  position: [number, number, number];
}

const STATUTORY_ACTS: StatutoryAct[] = [
  {
    id: "mpcb",
    shortName: "MPCB Pollution Rules",
    name: "Water & Air (Prevention & Control of Pollution) Acts 1974/1981",
    authority: "Maharashtra Pollution Control Board",
    citation: "Section 25 Water Act & Section 21 Air Act",
    slaDays: 120,
    processDesc: "Mandatory Consent to Establish (CTE) & Consent to Operate (CTO) for industrial process discharge.",
    color: 0x10b981,
    hexColor: "#10b981",
    position: [-3.2, 1.8, 0.5],
  },
  {
    id: "factories",
    shortName: "Factories Act 1948",
    name: "The Factories Act, 1948 & DISH Maharashtra Rules",
    authority: "Directorate of Industrial Safety and Health (DISH)",
    citation: "Section 6 (Plan Approval) & Section 2(m) (Worker Threshold)",
    slaDays: 60,
    processDesc: "Factory layout drawing registration & operating license for 10+ workers with power or 20+ without power.",
    color: 0x38bdf8,
    hexColor: "#38bdf8",
    position: [3.2, 1.6, -0.4],
  },
  {
    id: "boilers",
    shortName: "Indian Boilers Act 1923",
    name: "The Indian Boilers Act, 1923 (Amended 2007)",
    authority: "Directorate of Steam Boilers, Maharashtra",
    citation: "Section 2 read with Regulation 2",
    slaDays: 45,
    processDesc: "Pressure vessel testing, design certificate validation, and registration before steam generation.",
    color: 0xf59e0b,
    hexColor: "#f59e0b",
    position: [0, 3.2, 0.8],
  },
  {
    id: "fssai",
    shortName: "FSSAI Food Safety Rules",
    name: "Food Safety and Standards (Licensing & Registration) Regulations 2011",
    authority: "Food Safety and Standards Authority of India / FDA Maharashtra",
    citation: "Section 31 Food Safety Act 2006",
    slaDays: 60,
    processDesc: "Food manufacturing hygiene audit & State/Central FSSAI license based on turnover.",
    color: 0x8b5cf6,
    hexColor: "#8b5cf6",
    position: [-2.8, -2.2, 0.6],
  },
  {
    id: "hazardous",
    shortName: "Hazardous Waste Rules 2016",
    name: "Hazardous and Other Wastes (Management & Transboundary) Rules 2016",
    authority: "Maharashtra Pollution Control Board (Hazardous Waste Cell)",
    citation: "Rule 5 Hazardous Waste Authorization",
    slaDays: 90,
    processDesc: "Authorization for handling, storage, treatment, and disposal of toxic industrial waste streams.",
    color: 0xef4444,
    hexColor: "#ef4444",
    position: [2.8, -2.0, -0.5],
  },
  {
    id: "rts",
    shortName: "Maharashtra RTS Act 2015",
    name: "Maharashtra Right to Public Services Act, 2015",
    authority: "General Administration Dept, Govt of Maharashtra",
    citation: "Section 3 Statutory SLA Guarantee",
    slaDays: 30,
    processDesc: "Enforces strict statutory turnaround deadlines; triggers escalation if officers delay approvals.",
    color: 0xec4899,
    hexColor: "#ec4899",
    position: [0, -3.5, 0.2],
  },
];

export function CitationGraph3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAct, setSelectedAct] = useState<StatutoryAct>(STATUTORY_ACTS[0]);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // 1. Central Core Octahedron Crystal (ApprovalIQ Rule Engine Core)
    const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    graphGroup.add(coreMesh);

    // 2. Orbital Glowing Rings
    const ring1Geo = new THREE.RingGeometry(4.2, 4.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    graphGroup.add(ring1);

    const ring2 = new THREE.Mesh(ring1Geo, new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.DoubleSide, transparent: true, opacity: 0.2 }));
    ring2.rotation.y = Math.PI / 4;
    graphGroup.add(ring2);

    // 3. Animated 120-Particle Starfield
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 120;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 20;
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x64748b,
      transparent: true,
      opacity: 0.5,
    });
    const starfield = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starfield);

    // 4. Statutory Act Nodes and Connecting Arcs
    const actMeshes: Array<{ mesh: THREE.Mesh; act: StatutoryAct }> = [];

    STATUTORY_ACTS.forEach((act) => {
      // Act Sphere Node
      const nodeGeo = new THREE.SphereGeometry(0.42, 24, 24);
      const nodeMat = new THREE.MeshBasicMaterial({ color: act.color });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(...act.position);
      graphGroup.add(nodeMesh);

      // Glowing outer ring around each node
      const outerRingGeo = new THREE.RingGeometry(0.55, 0.65, 32);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: act.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.position.set(...act.position);
      outerRing.lookAt(0, 0, 0);
      graphGroup.add(outerRing);

      actMeshes.push({ mesh: nodeMesh, act });

      // Laser Line Connection to Central Core
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(...act.position)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: act.color,
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      graphGroup.add(line);
    });

    // Mouse Drag Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        targetRotationRef.current.y += deltaX * 0.005;
        targetRotationRef.current.x += deltaY * 0.005;

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous crystal spin & particle pulse
      coreMesh.rotation.y = elapsedTime * 0.4;
      coreMesh.rotation.x = elapsedTime * 0.2;
      ring1.rotation.z = elapsedTime * 0.15;
      ring2.rotation.z = -elapsedTime * 0.12;
      starfield.rotation.y = elapsedTime * 0.02;

      // Lerp smooth rotation
      if (!isDraggingRef.current) {
        targetRotationRef.current.y += 0.002;
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.05;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.05;

      graphGroup.rotation.x = currentRotationRef.current.x;
      graphGroup.rotation.y = currentRotationRef.current.y;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full glass-panel rounded-2xl p-6 flex flex-col lg:flex-row items-stretch gap-6 border border-white/10 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div className="w-full lg:w-1/2 min-h-[380px] relative rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden flex flex-col justify-between p-4">
        <div className="flex items-center justify-between z-10">
          <Badge variant="outline" className="border-cyan-500/40 bg-cyan-950/40 text-cyan-400 font-mono text-[11px] px-2.5 py-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>3D STATUTORY EVIDENCE GRAPH</span>
          </Badge>
          <span className="text-[10px] text-gray-400 font-mono">6 Connected Acts</span>
        </div>

        {/* 3D Canvas */}
        <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Legend */}
        <div className="z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono text-gray-300">
          <span className="text-emerald-400 font-bold">Interactive 3D Mouse Orbit</span>
          <span className="text-gray-400">Click Act Pill Below to Inspect</span>
        </div>
      </div>

      {/* Act Inspector Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-4 z-10">
        <div className="space-y-2 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              style={{ borderColor: `${selectedAct.hexColor}60`, color: selectedAct.hexColor }}
              className="font-mono text-[10px] uppercase"
            >
              {selectedAct.id.toUpperCase()} CLEARANCE FRAMEWORK
            </Badge>
            <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Max SLA: {selectedAct.slaDays} Days
            </span>
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-white">{selectedAct.name}</h3>
          <p className="text-xs font-mono text-emerald-400">{selectedAct.authority}</p>
        </div>

        {/* Act Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Select Statutory Act Node</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUTORY_ACTS.map((act) => (
              <button
                key={act.id}
                onClick={() => setSelectedAct(act)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  selectedAct.id === act.id
                    ? "bg-slate-900 text-white border font-bold shadow-lg"
                    : "bg-slate-950/60 text-gray-400 hover:text-white border border-white/10"
                }`}
                style={{
                  borderColor: selectedAct.id === act.id ? act.hexColor : undefined,
                  color: selectedAct.id === act.id ? act.hexColor : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: act.hexColor }} />
                <span>{act.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Act Citation Detail Box */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
            <BookOpen className="w-4 h-4" />
            <span>Statutory Citation Reference</span>
          </div>
          <p className="text-xs font-mono text-amber-300 font-semibold">{selectedAct.citation}</p>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">{selectedAct.processDesc}</p>
        </div>
      </div>
    </div>
  );
}
