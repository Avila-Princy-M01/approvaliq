"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Building2, Navigation, Layers } from "lucide-react";

interface DistrictNode {
  id: string;
  name: string;
  shortName: string;
  zoneCode: string;
  department: string;
  applications: number;
  highRisk: number;
  medRisk: number;
  lowRisk: number;
  avgSlaDays: number;
  readinessScore: number;
  lat: number;
  lon: number;
}

const DISTRICTS: DistrictNode[] = [
  {
    id: "mumbai",
    name: "Mumbai Suburban District",
    shortName: "Mumbai",
    zoneCode: "MUM-ZONE-01",
    department: "DISH Factories & MPCB West",
    applications: 42,
    highRisk: 12,
    medRisk: 18,
    lowRisk: 12,
    avgSlaDays: 14.2,
    readinessScore: 84,
    lat: 19.076,
    lon: 72.877,
  },
  {
    id: "pune",
    name: "Pune Industrial Belt",
    shortName: "Pune",
    zoneCode: "PUN-ZONE-02",
    department: "MPCB Auto Cluster & Steam Boilers",
    applications: 38,
    highRisk: 9,
    medRisk: 15,
    lowRisk: 14,
    avgSlaDays: 12.8,
    readinessScore: 78,
    lat: 18.52,
    lon: 73.856,
  },
  {
    id: "thane",
    name: "Thane Industrial Corridor",
    shortName: "Thane",
    zoneCode: "THA-ZONE-03",
    department: "Hazardous Materials & Fire NOC",
    applications: 29,
    highRisk: 8,
    medRisk: 12,
    lowRisk: 9,
    avgSlaDays: 16.5,
    readinessScore: 81,
    lat: 19.218,
    lon: 72.978,
  },
  {
    id: "nagpur",
    name: "Nagpur Logistics Hub",
    shortName: "Nagpur",
    zoneCode: "NAG-ZONE-04",
    department: "RTS Single Window & FSSAI East",
    applications: 19,
    highRisk: 3,
    medRisk: 6,
    lowRisk: 10,
    avgSlaDays: 9.4,
    readinessScore: 92,
    lat: 21.145,
    lon: 79.088,
  },
  {
    id: "nashik",
    name: "Nashik Wine & Pharma Region",
    shortName: "Nashik",
    zoneCode: "NAS-ZONE-05",
    department: "FDA Maharashtra & MPCB North",
    applications: 24,
    highRisk: 5,
    medRisk: 9,
    lowRisk: 10,
    avgSlaDays: 11.1,
    readinessScore: 86,
    lat: 19.997,
    lon: 73.789,
  },
  {
    id: "aurangabad",
    name: "Chhatrapati Sambhajinagar",
    shortName: "Chhatrapati",
    zoneCode: "AUR-ZONE-06",
    department: "MIDC Heavy Machinery & DISH",
    applications: 17,
    highRisk: 4,
    medRisk: 5,
    lowRisk: 8,
    avgSlaDays: 10.7,
    readinessScore: 88,
    lat: 19.876,
    lon: 75.343,
  },
];

// Convert Lat/Lon spherical coordinates to 3D Vector3 on globe radius R
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function RiskGlobe3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictNode>(DISTRICTS[0]);

  // Target rotation for smooth lerp focusing on selected district
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const GLOBE_RADIUS = 3.8;

    // Outer Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Globe Mesh Sphere
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x060d19,
      wireframe: false,
      transparent: true,
      opacity: 0.85,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 2. Latitude/Longitude Grid Lines Wireframe
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const gridMesh = new THREE.Mesh(globeGeo, gridMat);
    globeGroup.add(gridMesh);

    // 3. Equatorial Radar Sweeper Ring
    const ringGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.05, GLOBE_RADIUS * 1.25, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const radarRing = new THREE.Mesh(ringGeo, ringMat);
    radarRing.rotation.x = Math.PI / 2;
    globeGroup.add(radarRing);

    // 4. Center Glowing Core Crystal
    const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 5. District Nodes & Arcs Group
    const nodeGroup = new THREE.Group();
    const nodeMeshes: Array<{ mesh: THREE.Mesh; district: DistrictNode }> = [];

    // Map District Lat/Lon to Vector3
    const districtVectors: Record<string, THREE.Vector3> = {};

    DISTRICTS.forEach((district) => {
      const pos = latLonToVector3(district.lat, district.lon, GLOBE_RADIUS * 1.02);
      districtVectors[district.id] = pos;

      // Node Marker Group
      const markerGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const color = district.highRisk > 8 ? 0xef4444 : district.highRisk > 4 ? 0xf59e0b : 0x10b981;
      const markerMat = new THREE.MeshBasicMaterial({ color });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);

      // Glowing outer ring for each marker
      const ringMarkerGeo = new THREE.RingGeometry(0.24, 0.32, 24);
      const ringMarkerMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMarker = new THREE.Mesh(ringMarkerGeo, ringMarkerMat);
      ringMarker.position.copy(pos.clone().multiplyScalar(1.02));
      ringMarker.lookAt(new THREE.Vector3(0, 0, 0));

      nodeGroup.add(markerMesh);
      nodeGroup.add(ringMarker);

      nodeMeshes.push({ mesh: markerMesh, district });
    });

    // 6. Connect Districts with Flow Arcs (Mumbai to all other districts)
    const mumbaiPos = districtVectors["mumbai"];
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.5,
    });

    Object.entries(districtVectors).forEach(([id, targetPos]) => {
      if (id === "mumbai") return;

      // Create curved Bezier arc elevated above globe surface
      const midPoint = new THREE.Vector3()
        .addVectors(mumbaiPos, targetPos)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(GLOBE_RADIUS * 1.35);

      const curve = new THREE.QuadraticBezierCurve3(mumbaiPos, midPoint, targetPos);
      const points = curve.getPoints(30);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, arcMaterial);
      nodeGroup.add(arcLine);
    });

    globeGroup.add(nodeGroup);

    // Mouse Controls for 3D Dragging
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

    // Animation loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Core crystal spin & pulse
      coreMesh.rotation.y = elapsedTime * 0.5;
      coreMesh.rotation.x = elapsedTime * 0.3;
      radarRing.rotation.z = elapsedTime * 0.25;

      // Lerp smooth rotation towards target rotation
      if (!isDraggingRef.current) {
        targetRotationRef.current.y += 0.002; // Slow default rotation
      }

      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.05;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.05;

      globeGroup.rotation.x = currentRotationRef.current.x;
      globeGroup.rotation.y = currentRotationRef.current.y;

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

  // Update 3D camera target rotation when user selects a district tab
  useEffect(() => {
    const vec = latLonToVector3(selectedDistrict.lat, selectedDistrict.lon, 1);
    // Align district to face camera (+Z axis)
    const targetY = -Math.atan2(vec.x, vec.z);
    const targetX = Math.asin(vec.y);
    targetRotationRef.current = { x: targetX, y: targetY };
  }, [selectedDistrict]);

  return (
    <div className="relative w-full glass-panel rounded-2xl p-6 flex flex-col lg:flex-row items-stretch gap-6 overflow-hidden border border-white/10 shadow-2xl">
      {/* Left Column: 3D Interactive WebGL Scrutiny Globe Radar */}
      <div className="w-full lg:w-1/2 min-h-[380px] relative rounded-xl bg-slate-950/70 border border-white/10 overflow-hidden flex flex-col justify-between p-4">
        {/* Radar Overlay Controls Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-mono text-[11px] px-2.5 py-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MAHARASHTRA 3D SCRUTINY RADAR</span>
            </Badge>
          </div>
          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
            <Navigation className="w-3 h-3 text-cyan-400" /> 3D Orbit Drag Enabled
          </span>
        </div>

        {/* 3D WebGL Canvas */}
        <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Floating Globe Canvas Legend */}
        <div className="z-10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono text-gray-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> High Scrutiny
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Risk
            </span>
          </div>
          <span className="text-gray-400">6 Active Zones</span>
        </div>
      </div>

      {/* Right Column: Structured Scrutiny Intelligence & Analytics Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-5 z-10">
        {/* Selected Zone Header */}
        <div className="space-y-2 border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-[10px] uppercase">
              {selectedDistrict.zoneCode}
            </Badge>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {selectedDistrict.department}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white">{selectedDistrict.name}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Real-time statutory scrutiny distribution, RTS SLA compliance metrics, and risk tier evaluation across Maharashtra.
          </p>
        </div>

        {/* District Selector Pill Tabs */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Select Scrutiny District Zone</label>
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                  selectedDistrict.id === d.id
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10 font-bold"
                    : "bg-slate-900/80 text-gray-400 hover:text-white border border-white/10"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    d.highRisk > 8 ? "bg-red-500" : d.highRisk > 4 ? "bg-amber-500" : "bg-emerald-400"
                  }`}
                />
                <span>{d.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-3 rounded-xl text-center border-white/5">
            <p className="text-2xl font-extrabold text-white">{selectedDistrict.applications}</p>
            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-mono mt-0.5">Applications</p>
          </div>

          <div className="glass-card p-3 rounded-xl text-center border-red-500/30 bg-red-950/20">
            <p className="text-2xl font-extrabold text-red-400">{selectedDistrict.highRisk}</p>
            <p className="text-[9px] uppercase tracking-wider text-red-300 font-mono mt-0.5">High Scrutiny</p>
          </div>

          <div className="glass-card p-3 rounded-xl text-center border-cyan-500/30 bg-cyan-950/20">
            <p className="text-2xl font-extrabold text-cyan-400">{selectedDistrict.avgSlaDays}d</p>
            <p className="text-[9px] uppercase tracking-wider text-cyan-300 font-mono mt-0.5">Avg RTS Turnaround</p>
          </div>

          <div className="glass-card p-3 rounded-xl text-center border-emerald-500/30 bg-emerald-950/20">
            <p className="text-2xl font-extrabold text-emerald-400">{selectedDistrict.readinessScore}%</p>
            <p className="text-[9px] uppercase tracking-wider text-emerald-300 font-mono mt-0.5">Readiness Index</p>
          </div>
        </div>

        {/* Risk Distribution Breakdown Stacked Bar */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Risk Distribution Stack
            </span>
            <span className="text-gray-400">{selectedDistrict.applications} Total Projects</span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
            <div
              style={{ width: `${(selectedDistrict.highRisk / selectedDistrict.applications) * 100}%` }}
              className="bg-red-500 h-full"
              title={`High Risk: ${selectedDistrict.highRisk}`}
            />
            <div
              style={{ width: `${(selectedDistrict.medRisk / selectedDistrict.applications) * 100}%` }}
              className="bg-amber-500 h-full"
              title={`Medium Risk: ${selectedDistrict.medRisk}`}
            />
            <div
              style={{ width: `${(selectedDistrict.lowRisk / selectedDistrict.applications) * 100}%` }}
              className="bg-emerald-500 h-full"
              title={`Low Risk: ${selectedDistrict.lowRisk}`}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-gray-400 pt-0.5">
            <span className="text-red-400 font-semibold">{selectedDistrict.highRisk} High</span>
            <span className="text-amber-400 font-semibold">{selectedDistrict.medRisk} Medium</span>
            <span className="text-emerald-400 font-semibold">{selectedDistrict.lowRisk} Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
