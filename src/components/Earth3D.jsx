import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import { useRef } from "react";

function Satellite() {
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
      <meshStandardMaterial
        color="#00e5ff"
        emissive="#00e5ff"
        emissiveIntensity={3}
      />
    </mesh>
  );
}

function SensorNodes() {
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
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00e5ff"
            emissiveIntensity={5}
          />
        </mesh>
      ))}
    </>
  );
}

function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
      <torusGeometry args={[6.5, 0.01, 16, 200]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.18}
      />
    </mesh>
  );
}

function Earth() {
  const earthRef = useRef();

  const dayTexture = useTexture("/textures/earth.jpg");
  const nightTexture = useTexture("/textures/earthnight.png");

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
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.04}
        />
      </mesh>
    </>
  );
}

function Earth3D() {
  return (
    <div className="relative h-[900px] overflow-hidden rounded-[40px] border border-cyan-500/10 bg-gradient-to-b from-[#020617] via-[#08111f] to-[#0B1120]">

      {/* Earth Only */}
      <div className="absolute inset-0 flex items-center justify-center translate-y-8">

        <Canvas camera={{ position: [0, 0, 7] }}>

          <Stars
            radius={100}
            depth={50}
            count={7000}
            factor={4}
            fade
          />

          <ambientLight intensity={0.9} />

          <directionalLight
            position={[6, 5, 4]}
            intensity={3}
          />

          <pointLight
            position={[0, 0, 0]}
            intensity={4}
            color="#00e5ff"
          />

          <Earth />

          <SensorNodes />

          <OrbitRing />

          <Satellite />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />

        </Canvas>

      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />

    </div>
  );
}

export default Earth3D;