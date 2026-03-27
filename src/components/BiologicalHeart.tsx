"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshTransmissionMaterial,
  Environment,
  ContactShadows,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";

// 1. THIS IS THE COMPONENT THAT LOADS YOUR CUSTOM 3D MODEL (.glb)
function CustomGLTFHeart() {
  // To use this:
  // Place your downloaded model inside the 'public' folder as 'realistic_human_heart.glb'
  const { scene } = useGLTF("/realistic_human_heart.glb");
  const meshRef = useRef<THREE.Group>(null);
  const [clicks, setClicks] = useState(0);

  // Still want it to beat? We animate the scale of the entire loaded scene
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const bpmModifier = clicks > 0 ? 1 + clicks * 0.4 : 0.8;
    const pulse =
      Math.sin(t * Math.PI * 2 * bpmModifier) * 0.05 +
      Math.sin(t * Math.PI * bpmModifier) * 0.02;
    const scale = 1 + pulse;
    const cursorX = state.mouse.x;
    const cursorY = state.mouse.y;
    const targetRotY = Math.sin(t * 0.5) * 0.15 + cursorX * 0.35;
    const targetRotX = -cursorY * 0.2;
    const targetPosX = cursorX * 0.35;
    const targetPosY = cursorY * 0.2;

    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotY,
      0.08,
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetRotX,
      0.08,
    );
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPosX,
      0.08,
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetPosY,
      0.08,
    );
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setClicks((c) => (c >= 5 ? 0 : c + 1));
        }}
      >
        <primitive object={scene} scale={2.8} position={[0, 0, 0]} />
      </group>
    </Float>
  );
}

// 2. FALLBACK PROCEDURAL HEART (until you add the .glb file)
function ProceduralFallbackHeart() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [clicks, setClicks] = useState(0);

  // Generate a procedural 3D heart shape
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0,
      y = 0;

    shape.moveTo(x + 2.5, y + 2.5);
    shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2.0, y, x, y);
    shape.bezierCurveTo(x - 3.0, y, x - 3.0, y + 3.5, x - 3.0, y + 3.5);
    shape.bezierCurveTo(x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5);
    shape.bezierCurveTo(x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5);
    shape.bezierCurveTo(x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y);
    shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

    const extrudeSettings = {
      depth: 2.0,
      bevelEnabled: true,
      bevelSegments: 30,
      steps: 3,
      bevelSize: 1.5,
      bevelThickness: 1.8,
      curveSegments: 60,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.scale(0.25, 0.25, 0.25);
    geo.rotateX(Math.PI);
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const bpmModifier = clicks > 0 ? 1 + clicks * 0.4 : 0.8;
    const pulse =
      Math.sin(t * Math.PI * 2 * bpmModifier) * 0.05 +
      Math.sin(t * Math.PI * bpmModifier) * 0.02;
    const scale = 1 + pulse;
    const cursorX = state.mouse.x;
    const cursorY = state.mouse.y;
    const targetRotY = Math.sin(t * 0.5) * 0.15 + cursorX * 0.35;
    const targetRotX = -cursorY * 0.2;
    const targetPosX = cursorX * 0.35;
    const targetPosY = cursorY * 0.2;

    meshRef.current.scale.set(scale, scale, scale);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotY,
      0.08,
    );
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetRotX,
      0.08,
    );
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPosX,
      0.08,
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetPosY,
      0.08,
    );
    meshRef.current.rotation.z = Math.cos(t * 0.3) * 0.08;
  });

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
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
        <MeshTransmissionMaterial
          color={hovered || clicks > 0 ? "#ff2a4b" : "#ff0f39"}
          emissive={clicks > 0 ? "#800018" : "#4a0010"}
          emissiveIntensity={clicks * 0.2 + 0.1}
          roughness={0.05}
          metalness={0.1}
          transmission={0.95}
          thickness={2.5}
          ior={1.5}
          chromaticAberration={0.08}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>

      <mesh geometry={heartGeometry} scale={0.85}>
        <meshStandardMaterial
          color="#900c3f"
          roughness={0.8}
          emissive="#500000"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

export default function BiologicalHeart() {
  const [modelExists, setModelExists] = useState(false);

  // We check if "realistic_human_heart.glb" is available online.
  // If not, we fall back to the procedural code.
  useMemo(() => {
    fetch("/realistic_human_heart.glb", { method: "HEAD" })
      .then((res) => setModelExists(res.ok))
      .catch(() => setModelExists(false));
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center xl:justify-end xl:pr-[10%] pt-20"
      style={{ transform: "translateX(4cm)" }}
    >
      <div className="w-[100vw] h-[70vh] xl:w-[900px] xl:h-[900px] pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} shadows dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
          <directionalLight
            position={[-10, 10, -10]}
            intensity={1}
            color="#ffb3c6"
          />
          <pointLight position={[0, 0, 5]} intensity={2} color="#ffebf0" />

          {modelExists ? <CustomGLTFHeart /> : <ProceduralFallbackHeart />}

          <ContactShadows
            position={[0, -3.5, 0]}
            opacity={0.4}
            scale={15}
            blur={2.5}
            far={4}
            color="#500000"
          />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
          <Environment preset="city" />
        </Canvas>
      </div>
    </div>
  );
}
