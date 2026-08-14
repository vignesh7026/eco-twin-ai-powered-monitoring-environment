import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import { Suspense, useRef } from "react";

/* ---------------------------------------------------------- */
/* Optional `risk` prop ("Low" | "Moderate" | "High" | etc.)    */
/* lets a parent (e.g. Dashboard.jsx, sharing one live-data       */
/* fetch) recolor the sensor mesh and glow to match real          */
/* conditions instead of a fixed cyan. Falls back to cyan if       */
/* no risk is supplied.                                            */
/* ---------------------------------------------------------- */
const RISK_COLOR = {
  Low: "#34d399",
  Moderate: "#fbbf24",
  Warning: "#fb923c",
  High: "#fb7185",
  Critical: "#fb7185",
};

function Satellite({ color }) {
  const satelliteRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (satelliteRef.current) {
      satelliteRef.current.position.x = Math.sin(t) * 6.5;
      satelliteRef.current.position.z = Math.cos(t) * 6.5;
      satelliteRef.current.position.y = Math.sin(t * 2) * 0.5;
      satelliteRef.current.rotation.y += 0.05;
    }
  });

  return (
    <mesh ref={satelliteRef}>
      <boxGeometry args={[0.18, 0.18, 0.18]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
    </mesh>
  );
}

function SensorNodes({ color }) {
  const nodes = [
    [4, 2, 0],
    [-4, -2, 0],
    [3, 3, 0],
    [-3, 3, 0],
    [2.5, -3.5, 0],
  ];

  return (
    <>
      {nodes.map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
        </mesh>
      ))}
    </>
  );
}

function OrbitRing({ color }) {
  return (
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <torusGeometry args={[6.5, 0.01, 16, 200]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} />
    </mesh>
  );
}

function Earth() {
  const earthRef = useRef();

  // Loaded together so Suspense resolves once, instead of two
  // separate texture-load waterfalls.
  const [dayTexture, nightTexture] = useTexture([
    "/textures/earth.jpg",
    "/textures/earthnight.png",
  ]);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshStandardMaterial
          map={dayTexture}
          emissiveMap={nightTexture}
          emissive="#ffffff"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh scale={1.05}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.04} />
      </mesh>
    </>
  );
}

function SceneFallback() {
  // Renders inside the Canvas while textures load — a simple wireframe
  // placeholder so the hero isn't a blank black box during load.
  return (
    <mesh>
      <sphereGeometry args={[5, 32, 32]} />
      <meshBasicMaterial color="#0ea5b5" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

function Earth3D({ risk }) {
  const accent = RISK_COLOR[risk] || "#00e5ff";

  return (
    <div className="relative h-[900px] overflow-hidden rounded-[40px] border border-teal-400/10 bg-gradient-to-b from-[#020617] via-[#08111f] to-[#0B1120] shadow-[0_0_80px_-20px_rgba(45,212,191,0.25)]">
      {/* Earth */}
      <div className="absolute inset-0 flex items-center justify-center translate-y-8">
        <Canvas camera={{ position: [0, 0, 7] }}>
          <Stars radius={100} depth={50} count={7000} factor={4} fade />

          <ambientLight intensity={0.9} />
          <directionalLight position={[6, 5, 4]} intensity={3} />
          <pointLight position={[0, 0, 0]} intensity={4} color={accent} />

          <Suspense fallback={<SceneFallback />}>
            <Earth />
          </Suspense>

          <SensorNodes color={accent} />
          <OrbitRing color={accent} />
          <Satellite color={accent} />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.4}
          />
        </Canvas>
      </div>

      {/* Bottom Glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${accent}0d, transparent)`,
        }}
      />
    </div>
  );
}

export default Earth3D;
