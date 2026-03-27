"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function SquishyHeart() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [clicks, setClicks] = useState(0);

  // Generate a procedural 3D heart shape
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    
    // Smooth heart vector paths
    shape.moveTo(x + 2.5, y + 2.5);
    shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2.0, y, x, y);
    shape.bezierCurveTo(x - 3.0, y, x - 3.0, y + 3.5, x - 3.0, y + 3.5);
    shape.bezierCurveTo(x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5);
    shape.bezierCurveTo(x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5);
    shape.bezierCurveTo(x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y);
    shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

    const extrudeSettings = {
      depth: 1.8,
      bevelEnabled: true,
      bevelSegments: 25,
      steps: 2,
      bevelSize: 1,
      bevelThickness: 1.5,
      curveSegments: 50,
    };
    
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.scale(0.25, 0.25, 0.25);
    geo.rotateX(Math.PI); // Keep it upright
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Heartbeat logic - increases with clicks
    const bpmModifier = clicks > 0 ? 1 + (clicks * 0.4) : 0.8;
    const pulse = Math.sin(t * Math.PI * 2 * bpmModifier) * 0.08 + Math.sin(t * Math.PI * bpmModifier) * 0.04;
    const scale = 1 + pulse;
    
    meshRef.current.scale.set(scale, scale, scale);
    
    // Give it a subtle biological wobble/rotation
    meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    meshRef.current.rotation.z = Math.cos(t * 0.3) * 0.1;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh
        ref={meshRef}
        geometry={heartGeometry}
        onClick={(e) => {
          e.stopPropagation();
          setClicks((c) => (c >= 5 ? 0 : c + 1));
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
        receiveShadow
      >
        <MeshDistortMaterial
          color={hovered || clicks > 0 ? "#ff1a3d" : "#900c3f"}
          emissive={clicks > 0 ? "#ff0000" : "#4a0000"}
          emissiveIntensity={clicks * 0.1}
          envMapIntensity={1}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          roughness={0.3}
          metalness={0.1}
          distort={0.3} // Makes it squishy and biological
          speed={clicks > 0 ? 6 : 2}
        />
      </mesh>
    </Float>
  );
}

export default function BiologicalHeart() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center xl:justify-end xl:pr-[10%] pt-20">
      {/* Container holding the 3D context. Pointer-events are re-enabled here so it captures clicks properly */}
      <div className="w-[100vw] h-[60vh] xl:w-[800px] xl:h-[800px] pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} shadows dpr={[1, 2]}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#ffb3c6" />
          <pointLight position={[0, -10, 0]} intensity={0.5} color="#900c3f" />
          
          <SquishyHeart />
          
          <ContactShadows position={[0, -3.5, 0]} opacity={0.6} scale={15} blur={2.5} far={4} color="#500000" />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.5} 
            minPolarAngle={Math.PI / 3} 
          />
          <Environment preset="studio" />
        </Canvas>
      </div>
    </div>
  );
}
