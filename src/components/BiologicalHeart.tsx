"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  MeshTransmissionMaterial,
  Environment,
  ContactShadows,
  OrbitControls,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

// 1. THIS IS THE COMPONENT THAT LOADS YOUR CUSTOM 3D MODEL (.glb)
function CustomGLTFHeart({ onBurst }: { onBurst: () => void }) {
  // To use this:
  // Place your downloaded model inside the 'public' folder as 'realistic_human_heart.glb'
  const { scene } = useGLTF("/realistic_human_heart.glb");
  const meshRef = useRef<THREE.Group>(null);
  const [clicks, setClicks] = useState(0);

  const handleHeartClick = (e: any) => {
    e.stopPropagation();
    setClicks((c) => {
      const next = c >= 5 ? 0 : c + 1;
      if (next === 5) onBurst();
      return next;
    });
  };

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
      <group ref={meshRef}>
        <primitive object={scene} scale={2.8} position={[0, 0, 0]} />
        {/* Invisible collider makes click detection reliable across complex GLB meshes. */}
        <mesh onClick={handleHeartClick}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </Float>
  );
}

// 2. FALLBACK PROCEDURAL HEART (until you add the .glb file)
function ProceduralFallbackHeart({ onBurst }: { onBurst: () => void }) {
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
          setClicks((c) => {
            const next = c >= 5 ? 0 : c + 1;
            if (next === 5) onBurst();
            return next;
          });
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
  const [burstId, setBurstId] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparkleNodes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 13) % 84)}%`,
        top: `${10 + ((i * 17) % 78)}%`,
        size: 4 + (i % 4),
        delay: (i % 8) * 0.22,
        duration: 1.8 + (i % 5) * 0.35,
      })),
    [],
  );

  // We check if "realistic_human_heart.glb" is available online.
  // If not, we fall back to the procedural code.
  useMemo(() => {
    fetch("/realistic_human_heart.glb", { method: "HEAD" })
      .then((res) => setModelExists(res.ok))
      .catch(() => setModelExists(false));
  }, []);

  const triggerBurst = () => {
    if (burstTimerRef.current) {
      clearTimeout(burstTimerRef.current);
    }
    setBurstId((id) => id + 1);
    setShowBurst(true);
    burstTimerRef.current = setTimeout(() => {
      setShowBurst(false);
      burstTimerRef.current = null;
    }, 1100);
  };

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center xl:justify-end xl:pr-[10%] pt-20"
      style={{ transform: "translateX(4cm)" }}
    >
      <div className="w-[100vw] h-[70vh] xl:w-[900px] xl:h-[900px] pointer-events-auto">
        <div className="pointer-events-none absolute inset-0 z-[9] overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 55% 48%, rgba(239, 68, 68, 0.24) 0%, rgba(136, 19, 55, 0.18) 34%, rgba(76, 5, 25, 0) 70%)",
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.35, 0.62, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(153, 27, 27, 0.2) 0%, rgba(127, 29, 29, 0.12) 42%, rgba(0, 0, 0, 0) 75%)",
            }}
            animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.03, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {sparkleNodes.map((sparkle) => (
            <motion.span
              key={sparkle.id}
              className="absolute rounded-full"
              style={{
                left: sparkle.left,
                top: sparkle.top,
                width: sparkle.size,
                height: sparkle.size,
                background: "rgba(255, 99, 132, 0.8)",
                boxShadow: "0 0 10px rgba(244, 63, 94, 0.8)",
              }}
              animate={{
                y: [0, -18, 0],
                opacity: [0, 0.85, 0],
                scale: [0.6, 1.1, 0.6],
              }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <motion.div
            className="absolute h-28 w-28 rounded-full border-2 border-rose-500/55"
            animate={{ scale: [0.7, 2.8], opacity: [0.65, 0] }}
            transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity }}
          />
          <motion.div
            className="absolute h-24 w-24 rounded-full border border-red-400/60"
            animate={{ scale: [0.7, 3.5], opacity: [0.6, 0] }}
            transition={{
              duration: 1.6,
              ease: "easeOut",
              repeat: Infinity,
              delay: 0.35,
            }}
          />
        </div>

        <AnimatePresence>
          {showBurst ? (
            <motion.div
              key={`burst-${burstId}`}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(239, 68, 68, 0.35) 0%, rgba(127, 29, 29, 0.2) 30%, rgba(0, 0, 0, 0) 70%)",
                }}
                initial={{ opacity: 0.75 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: "16rem",
                  height: "16rem",
                  background:
                    "radial-gradient(circle, rgba(255, 56, 88, 0.55) 0%, rgba(220, 38, 38, 0.25) 45%, rgba(127, 29, 29, 0) 80%)",
                  filter: "blur(3px)",
                }}
                initial={{ scale: 0.3, opacity: 0.95 }}
                animate={{ scale: 2.8, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <motion.div
                className="absolute h-28 w-28 rounded-full border-4 border-rose-500/75"
                initial={{ scale: 0.35, opacity: 0.9 }}
                animate={{ scale: 3.6, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <motion.div
                className="absolute h-24 w-24 rounded-full border-2 border-red-400/70"
                initial={{ scale: 0.35, opacity: 0.85 }}
                animate={{ scale: 4.5, opacity: 0 }}
                transition={{ duration: 1.15, ease: "easeOut", delay: 0.08 }}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} shadows dpr={[1, 2]}>
          <fog attach="fog" args={["#4a0010", 7, 20]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
          <directionalLight
            position={[-10, 10, -10]}
            intensity={1}
            color="#ffb3c6"
          />
          <pointLight position={[0, 0, 5]} intensity={2} color="#ffebf0" />

          <Sparkles
            count={180}
            scale={[12, 9, 10]}
            size={4.2}
            speed={0.52}
            noise={1.4}
            color="#ff4d6d"
            opacity={0.9}
          />
          <Sparkles
            count={120}
            scale={[10, 7, 8]}
            size={3.1}
            speed={0.28}
            noise={1.8}
            color="#b91c1c"
            opacity={0.6}
          />

          {modelExists ? (
            <CustomGLTFHeart onBurst={triggerBurst} />
          ) : (
            <ProceduralFallbackHeart onBurst={triggerBurst} />
          )}

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
