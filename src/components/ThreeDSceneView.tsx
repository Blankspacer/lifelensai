import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Layers,
  RotateCw,
  Eye,
  Flame,
  Camera,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Compass,
  Zap,
  Coffee,
  Activity,
  ArrowRight
} from 'lucide-react';

export type ApparatusId = 'espresso_pump' | 'electric_meter' | 'optical_scanner';

interface PartData {
  id: string;
  name: string;
  code: string;
  role: string;
  status: 'optimal' | 'warning' | 'critical' | 'info';
  diagnostic: string;
  troubleshootingTip: string;
  explodeDirection: [number, number, number];
  restPosition: [number, number, number];
  geometryType: 'boiler' | 'valve' | 'coil' | 'manifold' | 'housing' | 'board' | 'relay' | 'display' | 'lens' | 'gimbal' | 'ring';
  baseColor: string;
  metalness: number;
  roughness: number;
  isTransparentShell?: boolean;
}

interface ApparatusConfig {
  id: ApparatusId;
  name: string;
  code?: string;
  category: string;
  tagline: string;
  icon: React.ReactNode;
  defaultError: string;
  parts: PartData[];
}

const APPARATUS_CONFIGS: ApparatusConfig[] = [
  {
    id: 'espresso_pump',
    name: 'De\'Longhi ECAM Hydraulic & Heating Unit',
    category: 'Home Appliances & Brewing Systems',
    tagline: 'Diagnose Error E-04, low pressure, scaling, and heating malfunctions',
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
    defaultError: 'Error E-04 / Flashing Triangle: Water circuit airlock or boiler calcification',
    parts: [
      {
        id: 'boiler_core',
        name: 'ThermoBlock Cast Aluminum Boiler Core',
        code: 'TB-ECAM-22',
        role: 'Flash-heats water up to 92°C with embedded high-efficiency heating elements.',
        status: 'optimal',
        diagnostic: 'Heating elements resistance: 42.8 Ω (Normal). Temperature sensor NTC readout: 91.4°C.',
        troubleshootingTip: 'If your coffee is lukewarm, check NTC thermistor contact paste or run the 35-min descaling cycle.',
        explodeDirection: [0, 1.2, 0],
        restPosition: [0, 0.4, 0],
        geometryType: 'boiler',
        baseColor: '#a1a1aa',
        metalness: 0.85,
        roughness: 0.25,
      },
      {
        id: 'solenoid_valve',
        name: '15-Bar Solenoid Pressure Valve Manifold',
        code: 'SV-BRASS-15B',
        role: 'Regulates high-pressure extraction and relieves backpressure after espresso shot.',
        status: 'warning',
        diagnostic: 'Moderate calcium carbonate crystal build-up detected inside plunger chamber.',
        troubleshootingTip: 'Symptom: Pump makes loud humming but no coffee drips out. Remedy: Soak solenoid plunger in food-grade citric acid solution.',
        explodeDirection: [1.4, 0, 0.4],
        restPosition: [0.75, 0.2, 0],
        geometryType: 'valve',
        baseColor: '#d97706',
        metalness: 0.9,
        roughness: 0.3,
      },
      {
        id: 'heat_exchanger',
        name: 'Dual-Spiral Copper Heat Exchanger Coil',
        code: 'CU-HEX-120',
        role: 'Transfers instant thermal energy to pressurized water without stagnant reservoir boiling.',
        status: 'optimal',
        diagnostic: 'Flow rate: 220 mL/min at 14.5 bar steady hydraulic load.',
        troubleshootingTip: 'Always use filtered or bottled water with TDS < 120 ppm to prevent mineral clogging.',
        explodeDirection: [-1.3, 0.4, 0.5],
        restPosition: [-0.65, 0.35, 0],
        geometryType: 'coil',
        baseColor: '#b45309',
        metalness: 0.95,
        roughness: 0.2,
      },
      {
        id: 'manifold_block',
        name: 'Machined Stainless Flow Distributor Block',
        code: 'MF-SS304',
        role: 'Directs pressurized water to the brew group piston and steam wand bypass valve.',
        status: 'optimal',
        diagnostic: 'O-ring sealing pressure intact. Zero hydraulic micro-leaks observed.',
        troubleshootingTip: 'Lubricate silicone O-rings with NSF food-grade silicone grease every 6 months.',
        explodeDirection: [0, -0.9, 1.2],
        restPosition: [0, -0.4, 0.3],
        geometryType: 'manifold',
        baseColor: '#cbd5e1',
        metalness: 0.8,
        roughness: 0.15,
      },
      {
        id: 'pump_motor',
        name: 'Ulka Vibration Pump & Dampener Armature',
        code: 'ULKA-EP5-48W',
        role: 'Generates 15-bar pulsating hydraulic pressure to extract rich crema from ground beans.',
        status: 'optimal',
        diagnostic: '48W induction coil active. Vibration dampener rubber mounts at 96% elasticity.',
        troubleshootingTip: 'If pump is unusually loud, the water intake silicone hose may be pinched or reservoir dry.',
        explodeDirection: [0, -1.2, -0.8],
        restPosition: [0, -0.85, -0.2],
        geometryType: 'relay',
        baseColor: '#1e293b',
        metalness: 0.6,
        roughness: 0.45,
      },
      {
        id: 'chassis_shell',
        name: 'Polycarbonate Structural Chassis Housing',
        code: 'CH-PC-ABS',
        role: 'Reinforced thermoplastic frame containing hydraulic vibration and heat dissipation.',
        status: 'info',
        diagnostic: 'Thermal vents clear. Internal ambient temperature: 38.2°C.',
        troubleshootingTip: 'Ensure at least 10 cm of clearance on top and sides for convection cooling.',
        explodeDirection: [0, 1.8, -1.2],
        restPosition: [0, 0, 0],
        geometryType: 'housing',
        baseColor: '#334155',
        metalness: 0.3,
        roughness: 0.6,
        isTransparentShell: true,
      },
      {
        id: 'diagnostic_gauge',
        name: 'Dynamic Barometer & Status Ring HUD',
        code: 'HUD-OLED-9BAR',
        role: 'Displays real-time extraction pressure (optimal espresso window is 9.0 to 9.5 bar).',
        status: 'optimal',
        diagnostic: 'Dynamic pressure: 9.3 bar (In optimal extraction gold-standard range).',
        troubleshootingTip: 'If needle dips below 7 bar: grind coffee finer or check tamp pressure.',
        explodeDirection: [0, 0.8, 1.6],
        restPosition: [0, 0.9, 0.6],
        geometryType: 'display',
        baseColor: '#06b6d4',
        metalness: 0.2,
        roughness: 0.1,
      },
    ],
  },
  {
    id: 'electric_meter',
    name: 'Smart Bi-Directional Utility Electric Meter',
    code: 'MET-SMART-3P',
    category: 'Energy & Utility Infrastructure',
    tagline: 'Understand surge spikes, kWh tariff tiers, anti-tamper flags, and phase balance',
    icon: <Zap className="w-4 h-4 text-cyan-400" />,
    defaultError: 'Tamper Alert / Reverse Flow Indicator: Unbalanced neutral or solar backfeed',
    parts: [
      {
        id: 'meter_enclosure',
        name: 'Flame-Retardant Anti-Tamper Enclosure',
        code: 'ENC-V0-IP54',
        role: 'Polycarbonate V0 flame-rated weatherized outer shell with optical tamper sensors.',
        status: 'optimal',
        diagnostic: 'Enclosure seals intact. Optical light-pipe tamper sensor un-triggered.',
        troubleshootingTip: 'Never break utility lead security seals; unauthorized opening triggers automated tamper report.',
        explodeDirection: [0, 0, -1.5],
        restPosition: [0, 0, -0.4],
        geometryType: 'housing',
        baseColor: '#1e293b',
        metalness: 0.4,
        roughness: 0.5,
      },
      {
        id: 'shunt_resistor',
        name: 'Manganin High-Precision Current Shunt',
        code: 'SH-MN-100U',
        role: 'Provides micro-ohm resistance sensing to measure current flow with 0.1% accuracy.',
        status: 'optimal',
        diagnostic: 'Current draw: 18.4 A RMS. Phase angle cos φ: 0.98 inductive power factor.',
        troubleshootingTip: 'High current spikes on bills usually come from water heaters, HVAC compressors, or induction stoves.',
        explodeDirection: [1.2, 0, 0],
        restPosition: [0.65, -0.2, 0],
        geometryType: 'valve',
        baseColor: '#94a3b8',
        metalness: 0.95,
        roughness: 0.2,
      },
      {
        id: 'current_transformer',
        name: 'Toroidal Ferrite Rogowski Current Transformer',
        code: 'CT-FER-60A',
        role: 'Measures alternating current fields through galvanic isolation for high surge loads.',
        status: 'optimal',
        diagnostic: 'Magnetic saturation margin: 340% headroom above maximum household rating.',
        troubleshootingTip: 'Detects illegal bypass attempts by comparing neutral vs phase current delta.',
        explodeDirection: [-1.2, 0, 0],
        restPosition: [-0.65, -0.2, 0],
        geometryType: 'coil',
        baseColor: '#b45309',
        metalness: 0.8,
        roughness: 0.35,
      },
      {
        id: 'meter_pcb',
        name: 'Metrology SoC & Encryption Core PCB',
        code: 'MCU-ARM-MET',
        role: 'Calculates active kWh, reactive kVARh, peak demand, and signs data cryptographically.',
        status: 'optimal',
        diagnostic: 'Voltage line: 228.4V. Grid frequency: 50.02 Hz. AES-256 telemetry active.',
        troubleshootingTip: 'Your tariff is lowest during off-peak hours (11 PM - 7 AM). Schedule heavy appliances then.',
        explodeDirection: [0, 1.2, 0.2],
        restPosition: [0, 0.3, 0],
        geometryType: 'board',
        baseColor: '#065f46',
        metalness: 0.5,
        roughness: 0.4,
      },
      {
        id: 'latching_relay',
        name: '100A Bi-Stable Latching Power Contactor',
        code: 'REL-100A-MAG',
        role: 'Remote disconnect mechanism capable of breaking 100A load without continuous power drain.',
        status: 'optimal',
        diagnostic: 'Contact resistance: < 0.25 mΩ. Contact wear indicator: 98% life remaining.',
        troubleshootingTip: 'If your power trips from the smart meter rather than breaker, contact your utility provider.',
        explodeDirection: [0, -1.2, 0.4],
        restPosition: [0, -0.65, 0.1],
        geometryType: 'relay',
        baseColor: '#0f172a',
        metalness: 0.7,
        roughness: 0.3,
      },
      {
        id: 'lcd_display',
        name: 'High-Contrast Backlit Segmented LCD Matrix',
        code: 'LCD-SEG-8D',
        role: 'Displays cumulative kWh, current kW demand, date, time, and tier tariff code.',
        status: 'optimal',
        diagnostic: 'Active Reading: 014,892.4 kWh. Current instantaneous load: 3.82 kW.',
        troubleshootingTip: 'Code 01 is total active energy; code 02 is peak energy; code 03 is off-peak energy.',
        explodeDirection: [0, 0.6, 1.4],
        restPosition: [0, 0.4, 0.35],
        geometryType: 'display',
        baseColor: '#0284c7',
        metalness: 0.1,
        roughness: 0.1,
      },
      {
        id: 'acrylic_faceplate',
        name: 'UV-Stabilized Crystal Clear Polycarbonate Lens',
        code: 'CVR-MAKROLON',
        role: 'Transparent protective outer cover with optical reading port for utility scanners.',
        status: 'info',
        diagnostic: 'Optical port sensitivity calibrated. Zero condensation inside chamber.',
        troubleshootingTip: 'Never use harsh chemical solvents (like acetone) to clean meter faces; use microfiber cloth.',
        explodeDirection: [0, 0, 1.8],
        restPosition: [0, 0.1, 0.6],
        geometryType: 'housing',
        baseColor: '#64748b',
        metalness: 0.2,
        roughness: 0.1,
        isTransparentShell: true,
      },
    ],
  },
  {
    id: 'optical_scanner',
    name: 'LifeLens AI Multi-Spectral Optical Scanner',
    code: 'LENS-NEURAL-V2',
    category: 'Optical Sensors & Neural Hardware',
    tagline: 'Dissect the multi-element lens, neural NPU engine, and laser LiDAR array',
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    defaultError: 'Optical Calibration Alert: Dirty front aspheric element or uneven focal plane',
    parts: [
      {
        id: 'front_lens',
        name: 'Aspheric Fluorite Primary Optical Element',
        code: 'ELE-F1.6-ASP',
        role: 'Gathers maximum ambient photons and eliminates chromatic aberration for document clarity.',
        status: 'optimal',
        diagnostic: 'Multi-layer anti-reflective transmission: 99.4%. Aperture: f/1.65 high-speed.',
        troubleshootingTip: 'Wipe with microfiber cloth to prevent smudges from skewing OCR receipt recognition.',
        explodeDirection: [0, 0, 1.6],
        restPosition: [0, 0, 0.8],
        geometryType: 'lens',
        baseColor: '#38bdf8',
        metalness: 0.1,
        roughness: 0.05,
      },
      {
        id: 'aperture_iris',
        name: 'Electromagnetic Micro-Iris Diaphragm',
        code: 'IRIS-9BLADE',
        role: 'Adjusts physical depth of field when capturing curved product labels or flat contracts.',
        status: 'optimal',
        diagnostic: '9-blade precision aperture. Transition response: 8.2 milliseconds.',
        troubleshootingTip: 'Automatic macro mode enables sharp focus down to 2.5 cm on tiny medicine ingredient text.',
        explodeDirection: [0, 0, 1.1],
        restPosition: [0, 0, 0.45],
        geometryType: 'valve',
        baseColor: '#334155',
        metalness: 0.85,
        roughness: 0.2,
      },
      {
        id: 'sensor_npu',
        name: '50MP Stacked CMOS Sensor & Neural NPU Die',
        code: 'NPU-TENSOR-G3',
        role: 'Captures raw 14-bit photons and runs on-device edge neural OCR inference in 45ms.',
        status: 'optimal',
        diagnostic: 'Pixel size: 1.4 µm. Quad-Bayer phase detection autofocus locked on target.',
        troubleshootingTip: 'On-device vision filtering transcribes Japanese Kanji, Bangla scripts, and complex fonts.',
        explodeDirection: [0, 0, 0.2],
        restPosition: [0, 0, 0],
        geometryType: 'board',
        baseColor: '#818cf8',
        metalness: 0.7,
        roughness: 0.2,
      },
      {
        id: 'stabilizer_gimbal',
        name: 'Voice-Coil Motor 5-Axis Optical Stabilizer',
        code: 'OIS-VCM-5X',
        role: 'Suspends the sensor block on magnetic coils to eliminate camera shake in dim lighting.',
        status: 'optimal',
        diagnostic: 'Counter-shake compensation: up to ±3.5 degrees of hand vibration.',
        troubleshootingTip: 'Hold steady for half a second when scanning long legal clauses for optimum OCR.',
        explodeDirection: [-1.2, 0, 0],
        restPosition: [-0.4, 0, -0.05],
        geometryType: 'gimbal',
        baseColor: '#64748b',
        metalness: 0.8,
        roughness: 0.25,
      },
      {
        id: 'lidar_tof',
        name: 'Time-of-Flight LiDAR Surface Scanner',
        code: 'TOF-LIDAR-940',
        role: 'Emits 940nm pulsed infrared photons to measure 3D document curvature and page fold angles.',
        status: 'optimal',
        diagnostic: '3D point cloud: 12,000 depth points. Page planar de-warping active.',
        troubleshootingTip: 'Flatten folded paper bills for even sharper automatic extraction of total amounts.',
        explodeDirection: [1.2, 0.4, 0.6],
        restPosition: [0.65, 0.45, 0.35],
        geometryType: 'display',
        baseColor: '#ec4899',
        metalness: 0.4,
        roughness: 0.2,
      },
      {
        id: 'led_ring',
        name: 'Full-Spectrum High-CRI 98+ Ring Illuminator',
        code: 'LED-CRI98-5000K',
        role: 'Casts shadowless 5000K daylight-balanced illumination onto reflective shiny packages.',
        status: 'optimal',
        diagnostic: 'Color Rendering Index: 98.6. Zero PWM flicker at 120 fps shutter.',
        troubleshootingTip: 'Helps penetrate plastic packaging reflections on grocery snack boxes.',
        explodeDirection: [0, 0, 1.8],
        restPosition: [0, 0, 0.95],
        geometryType: 'ring',
        baseColor: '#fef08a',
        metalness: 0.3,
        roughness: 0.1,
      },
      {
        id: 'chassis_tube',
        name: 'Aviation-Grade Anodized Titanium Barrel',
        code: 'BAR-TI-GR5',
        role: 'Lightweight aerospace titanium barrel protecting internal optics from physical shock.',
        status: 'info',
        diagnostic: 'Impact rating: Drop-tested to 2 meters. Sealed to IP68 water & dust resistance.',
        troubleshootingTip: 'Keep barrel threads clean from grit when attaching external macro filters.',
        explodeDirection: [0, 0, -1.2],
        restPosition: [0, 0, -0.3],
        geometryType: 'housing',
        baseColor: '#1e293b',
        metalness: 0.9,
        roughness: 0.3,
        isTransparentShell: true,
      },
    ],
  },
];

interface ThreeDSceneViewProps {
  onBackToScanner: () => void;
  onAskAboutPart?: (partName: string, diagnostic: string) => void;
}

export const ThreeDSceneView: React.FC<ThreeDSceneViewProps> = ({
  onBackToScanner,
  onAskAboutPart,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Active state
  const [activeApparatusId, setActiveApparatusId] = useState<ApparatusId>('espresso_pump');
  const [explodeFactor, setExplodeFactor] = useState<number>(0.35);
  const [visualMode, setVisualMode] = useState<'pbr' | 'xray' | 'thermal'>('pbr');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // References to keep Three.js scene instances out of React render churn
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const requestFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-1000, -1000));

  // Current apparatus config
  const currentApparatus = useMemo(() => {
    return APPARATUS_CONFIGS.find((a) => a.id === activeApparatusId) || APPARATUS_CONFIGS[0];
  }, [activeApparatusId]);

  // Active inspected part (either hovered or selected, fallback to first part)
  const activePart = useMemo(() => {
    const targetId = hoveredPartId || selectedPartId;
    if (targetId) {
      const found = currentApparatus.parts.find((p) => p.id === targetId);
      if (found) return found;
    }
    return currentApparatus.parts[0];
  }, [hoveredPartId, selectedPartId, currentApparatus]);

  // Create procedural geometry based on part type
  const createPartGeometry = useCallback((type: PartData['geometryType']): THREE.BufferGeometry => {
    switch (type) {
      case 'boiler': {
        // High-pressure thermal boiler: beveled cylinder with top flange
        const geom = new THREE.CylinderGeometry(0.55, 0.52, 0.9, 32);
        return geom;
      }
      case 'valve': {
        // Hexagonal valve body
        const geom = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 6);
        return geom;
      }
      case 'coil': {
        // Spiral heat exchanger torus or knot
        const geom = new THREE.TorusGeometry(0.35, 0.1, 16, 48);
        return geom;
      }
      case 'manifold': {
        // Machined manifold block: rounded box
        const geom = new THREE.BoxGeometry(0.85, 0.35, 0.65);
        return geom;
      }
      case 'board': {
        // Flat electronic PCB with thickness
        const geom = new THREE.BoxGeometry(1.1, 0.08, 0.85);
        return geom;
      }
      case 'relay': {
        // Power relay block
        const geom = new THREE.BoxGeometry(0.65, 0.5, 0.55);
        return geom;
      }
      case 'display': {
        // Screen bezel block
        const geom = new THREE.BoxGeometry(0.8, 0.45, 0.1);
        return geom;
      }
      case 'lens': {
        // Aspheric optical element
        const geom = new THREE.SphereGeometry(0.45, 32, 16);
        geom.scale(1, 1, 0.35);
        return geom;
      }
      case 'gimbal': {
        // Gimbal ring
        const geom = new THREE.TorusGeometry(0.5, 0.06, 16, 40);
        return geom;
      }
      case 'ring': {
        // Circular LED illuminator ring
        const geom = new THREE.TorusGeometry(0.55, 0.05, 16, 48);
        return geom;
      }
      case 'housing':
      default: {
        // Outer chassis
        const geom = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        return geom;
      }
    }
  }, []);

  // Procedural canvas bump texture for brushed metal
  const proceduralBumpTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);
      // Fine brushed lines
      for (let i = 0; i < 2000; i++) {
        const y = Math.floor(Math.random() * 256);
        const alpha = Math.random() * 0.12;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, y, 256, 1);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);

  // Update materials based on visualMode
  const updateMaterials = useCallback(() => {
    if (!meshMapRef.current) return;

    meshMapRef.current.forEach((mesh, partId) => {
      const part = currentApparatus.parts.find((p) => p.id === partId);
      if (!part) return;

      const isSelected = selectedPartId === partId || hoveredPartId === partId;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (visualMode === 'pbr') {
        if (part.isTransparentShell) {
          mat.color.set(part.baseColor);
          mat.transparent = true;
          mat.opacity = 0.28;
          mat.roughness = 0.15;
          mat.metalness = 0.1;
          mat.wireframe = false;
          mat.depthWrite = false;
        } else {
          mat.color.set(part.baseColor);
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.metalness = part.metalness;
          mat.roughness = part.roughness;
          mat.wireframe = false;
          mat.depthWrite = true;
          mat.bumpMap = proceduralBumpTexture;
          mat.bumpScale = 0.003;
        }

        // Highlight active part
        if (isSelected) {
          mat.emissive.set('#38bdf8');
          mat.emissiveIntensity = 0.35;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }
      } else if (visualMode === 'xray') {
        // High-tech Ghosted Wireframe & holographic diagnostics
        mat.transparent = true;
        mat.depthWrite = false;
        mat.bumpMap = null;

        if (part.isTransparentShell) {
          mat.color.set('#38bdf8');
          mat.opacity = 0.08;
          mat.wireframe = true;
          mat.emissive.set('#0284c7');
          mat.emissiveIntensity = 0.15;
        } else {
          mat.color.set('#06b6d4');
          mat.opacity = isSelected ? 0.9 : 0.65;
          mat.wireframe = false;
          mat.emissive.set(isSelected ? '#38bdf8' : '#0891b2');
          mat.emissiveIntensity = isSelected ? 0.75 : 0.3;
        }
      } else if (visualMode === 'thermal') {
        // Thermal / Pressure Heatmap mode
        mat.transparent = false;
        mat.wireframe = false;
        mat.bumpMap = null;
        mat.depthWrite = true;

        if (part.status === 'critical') {
          mat.color.set('#ef4444');
          mat.emissive.set('#dc2626');
          mat.emissiveIntensity = 0.6;
        } else if (part.status === 'warning') {
          mat.color.set('#f59e0b');
          mat.emissive.set('#d97706');
          mat.emissiveIntensity = 0.45;
        } else if (part.status === 'info') {
          mat.color.set('#64748b');
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        } else {
          // Optimal: Cyan to lime green
          mat.color.set('#10b981');
          mat.emissive.set('#059669');
          mat.emissiveIntensity = isSelected ? 0.5 : 0.2;
        }
      }
      mat.needsUpdate = true;
    });
  }, [currentApparatus, selectedPartId, hoveredPartId, visualMode, proceduralBumpTexture]);

  // Build the composite 3D apparatus in the scene
  const buildApparatusModel = useCallback((scene: THREE.Scene, config: ApparatusConfig) => {
    // Clear old model group if exists
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      modelGroupRef.current = null;
    }

    meshMapRef.current.clear();

    const group = new THREE.Group();
    group.name = config.id;

    // Contact shadow ground disk
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.25;
    group.add(shadowMesh);

    // Build each procedural component
    config.parts.forEach((part) => {
      const geo = createPartGeometry(part.geometryType);
      const mat = new THREE.MeshStandardMaterial({
        color: part.baseColor,
        metalness: part.metalness,
        roughness: part.roughness,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = part.id;
      mesh.castShadow = !part.isTransparentShell;
      mesh.receiveShadow = true;

      // Position at initial rest coordinates
      mesh.position.set(...part.restPosition);
      mesh.userData = {
        partId: part.id,
        restPosition: new THREE.Vector3(...part.restPosition),
        explodeDirection: new THREE.Vector3(...part.explodeDirection),
      };

      group.add(mesh);
      meshMapRef.current.set(part.id, mesh);
    });

    scene.add(group);
    modelGroupRef.current = group;

    // Trigger material update with current visual mode
    updateMaterials();
  }, [createPartGeometry, updateMaterials]);

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Scene with Horizon Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16');
    scene.fog = new THREE.FogExp2('#090d16', 0.12);
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.8, 2.2, 3.8);
    cameraRef.current = camera;

    // 4. Renderer with ACESFilmicToneMapping & PCFSoftShadowMap
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. Procedural RoomEnvironment via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;
    roomEnv.dispose();

    // 6. Studio PBR Lighting Key, Fill, and Rim
    const keyLight = new THREE.DirectionalLight('#fff4e6', 2.2);
    keyLight.position.set(4, 6, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -2.5;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 0.85);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#818cf8', 1.4);
    rimLight.position.set(-3.5, 2, -4);
    scene.add(rimLight);

    // 7. Damped OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 9;
    controls.minDistance = 1.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't flip below ground
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    let isUserInteracting = false;
    const onControlsStart = () => {
      isUserInteracting = true;
    };
    const onControlsEnd = () => {
      isUserInteracting = false;
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('end', onControlsEnd);

    // 8. Build initial model
    buildApparatusModel(scene, currentApparatus);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Pointer Movement for Raycast Hover
    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      if (!sceneRef.current || !cameraRef.current) return;
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = Array.from(meshMapRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const top = intersects[0].object as THREE.Mesh;
        const partId = top.userData?.partId;
        if (partId) {
          setSelectedPartId(partId);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // 11. 60fps Lossless Render Loop with Damped Exponential Interpolation
    const scratchTargetPos = new THREE.Vector3();
    const animate = (currentTime: number) => {
      requestFrameIdRef.current = requestAnimationFrame(animate);

      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // Update Controls
      controls.update();

      // Auto-rotation when enabled and user not actively dragging
      if (isAutoRotate && modelGroupRef.current && !isUserInteracting) {
        modelGroupRef.current.rotation.y += 0.35 * dt;
      }

      // Smoothly Damp Exploded Part Positions
      if (meshMapRef.current) {
        const factor = explodeFactor;
        const dampAlpha = 1 - Math.exp(-10 * dt);

        meshMapRef.current.forEach((mesh) => {
          const rest = mesh.userData.restPosition as THREE.Vector3;
          const dir = mesh.userData.explodeDirection as THREE.Vector3;
          if (rest && dir) {
            scratchTargetPos.copy(rest).addScaledVector(dir, factor);
            mesh.position.lerp(scratchTargetPos, dampAlpha);
          }
        });
      }

      // Raycast Hover Check
      if (cameraRef.current && sceneRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const meshes = Array.from(meshMapRef.current.values());
        const intersects = raycasterRef.current.intersectObjects(meshes, false);
        if (intersects.length > 0) {
          const hitPartId = (intersects[0].object as THREE.Mesh).userData?.partId;
          if (hitPartId && hitPartId !== hoveredPartId) {
            setHoveredPartId(hitPartId);
          }
        } else if (hoveredPartId !== null) {
          setHoveredPartId(null);
        }
      }

      renderer.render(scene, camera);
    };

    lastTimeRef.current = performance.now();
    requestFrameIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('end', onControlsEnd);

      if (requestFrameIdRef.current) {
        cancelAnimationFrame(requestFrameIdRef.current);
      }

      pmremGenerator.dispose();
      renderer.dispose();
      controls.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [buildApparatusModel, currentApparatus, isAutoRotate, explodeFactor, hoveredPartId]);

  // Handle apparatus model switch
  useEffect(() => {
    if (sceneRef.current) {
      buildApparatusModel(sceneRef.current, currentApparatus);
      setSelectedPartId(null);
      setHoveredPartId(null);
    }
  }, [activeApparatusId, buildApparatusModel, currentApparatus]);

  // Sync materials whenever visualMode, selectedPartId, or hoveredPartId changes
  useEffect(() => {
    updateMaterials();
  }, [updateMaterials, visualMode, selectedPartId, hoveredPartId]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(2.8, 2.2, 3.8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.set(0, 0, 0);
      }
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#090d16] overflow-hidden select-none font-sans text-slate-100">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Software Fallback if WebGL unavailable */}
      {!webGLSupported && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">WebGL Hardware Acceleration Needed</h3>
            <p className="text-sm text-slate-300 mb-6">
              Your browser or environment does not support WebGL 3D rendering. Please enable hardware acceleration in your browser settings to explore the interactive 3D appliance dissector.
            </p>
            <button
              onClick={onBackToScanner}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all"
            >
              Return to Camera Scanner
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onBackToScanner}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg text-xs font-semibold backdrop-blur-none transition-all active:scale-95 cursor-pointer"
            title="Exit 3D View back to 2D Document Scanner"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Back to Scanner</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg flex items-center gap-2.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              3D Spatial AI Dissector
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 font-mono">
              60 FPS PBR
            </span>
          </div>
        </div>

        {/* Right: Quick Apparatus Selector */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
          {APPARATUS_CONFIGS.map((app) => {
            const isActive = app.id === activeApparatusId;
            return (
              <button
                key={app.id}
                onClick={() => setActiveApparatusId(app.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {app.icon}
                <span className="hidden sm:inline">{app.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Active Part Diagnostic Card (Top Right / Center on mobile) */}
      <div className="absolute top-20 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200">
        <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {activePart.code}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    activePart.status === 'critical'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                      : activePart.status === 'warning'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {activePart.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 leading-snug">{activePart.name}</h4>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Function & Mechanics:</span>
              <p className="text-slate-200 leading-relaxed">{activePart.role}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-cyan-400 block text-[11px] font-bold flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Real-Time Telemetry:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{activePart.diagnostic}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <span className="text-amber-300 block text-[11px] font-bold flex items-center gap-1 mb-1">
                <Wrench className="w-3.5 h-3.5" />
                Troubleshooting Tip:
              </span>
              <p className="text-amber-200/90 text-[11px] leading-relaxed">
                {activePart.troubleshootingTip}
              </p>
            </div>
          </div>

          {/* Action button */}
          {onAskAboutPart && (
            <button
              onClick={() => onAskAboutPart(activePart.name, activePart.diagnostic)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Ask LifeLens AI About This Part</span>
              <ArrowRight className="w-3 h-3 text-cyan-200" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Instructions Pill (Bottom Left) */}
      <div className="absolute bottom-24 left-4 z-10 hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/85 border border-slate-800 text-[11px] text-slate-300 pointer-events-none">
        <span className="flex items-center gap-1">
          <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Drag to rotate
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1">
          <ZoomIn className="w-3.5 h-3.5 text-indigo-400" /> Scroll to zoom
        </span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Click part to inspect
        </span>
      </div>

      {/* Collapsible Ergonomic Bottom Dock (Viewport-First: <= 15% Viewport Height) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-auto">
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header Bar with Collapse Toggle */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Exploded Inspection Controls
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                ({currentApparatus.parts.length} composite components)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCamera}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all cursor-pointer"
                title="Reset Camera Angle"
              >
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>Reset View</span>
              </button>

              <button
                onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all cursor-pointer"
                title={isControlsCollapsed ? 'Expand Controls' : 'Collapse Controls'}
              >
                {isControlsCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Controls</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hide</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Panel Content */}
          {!isControlsCollapsed && (
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Exploded View Separation Slider */}
              <div className="sm:col-span-5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    Exploded Separation
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px]">
                    {Math.round(explodeFactor * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodeFactor}
                  onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Assembled</span>
                  <span>Dissected</span>
                </div>
              </div>

              {/* Rendering Mode Selector (PBR / X-Ray / Thermal) */}
              <div className="sm:col-span-4 space-y-1">
                <span className="text-slate-300 font-semibold text-xs block">Visual Shader Mode</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setVisualMode('pbr')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      visualMode === 'pbr'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>PBR</span>
                  </button>

                  <button
                    onClick={() => setVisualMode('xray')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      visualMode === 'xray'
                        ? 'bg-indigo-500 text-white font-bold shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>X-Ray</span>
                  </button>

                  <button
                    onClick={() => setVisualMode('thermal')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      visualMode === 'thermal'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>Stress</span>
                  </button>
                </div>
              </div>

              {/* Auto-Rotation Toggle */}
              <div className="sm:col-span-3 flex sm:flex-col items-center justify-between sm:justify-center gap-2">
                <span className="text-slate-300 font-semibold text-xs">Orbit Motion</span>
                <button
                  onClick={() => setIsAutoRotate(!isAutoRotate)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isAutoRotate
                      ? 'bg-slate-800 border border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
                  <span>{isAutoRotate ? 'Auto Orbiting' : 'Paused Orbit'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
