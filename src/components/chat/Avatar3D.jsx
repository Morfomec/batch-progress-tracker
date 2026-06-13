import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const AICore = ({ isSpeaking, userAudioLevel }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const outerRingRef = useRef();

  useFrame((state, delta) => {
    // Core rotation
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
      
      // Pulse scale when user speaks
      const targetScale = 1 + (userAudioLevel / 100);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.x -= delta * 0.5;
      outerRingRef.current.rotation.y += delta * 0.5;
      const ringScale = 1.2 + (userAudioLevel / 80);
      outerRingRef.current.scale.lerp(new THREE.Vector3(ringScale, ringScale, ringScale), 0.15);
      outerRingRef.current.material.opacity = THREE.MathUtils.lerp(
        outerRingRef.current.material.opacity, 
        Math.min((userAudioLevel / 50), 0.8), 
        0.15
      );
    }

    if (materialRef.current) {
      // If AI is speaking, increase distortion and change color to purple
      const targetDistort = isSpeaking ? 0.6 : 0.3;
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort, 0.1);
      
      const targetSpeed = isSpeaking ? 4 : 2;
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed, 0.1);
      
      const targetColor = isSpeaking ? new THREE.Color('#a855f7') : new THREE.Color('#6366f1'); // Purple when speaking, Indigo when idle
      materialRef.current.color.lerp(targetColor, 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      {/* Main Core */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.5}
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      {/* Outer energy ring when user speaks */}
      <Sphere ref={outerRingRef} args={[1, 16, 16]}>
        <meshBasicMaterial 
          color="#10b981" 
          wireframe 
          transparent 
          opacity={0} 
        />
      </Sphere>
    </Float>
  );
};

export default function Avatar3D({ isSpeaking, userAudioLevel }) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500/20">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
        <pointLight position={[0, 0, 0]} intensity={isSpeaking ? 2 : 0} color="#a855f7" />
        
        <AICore isSpeaking={isSpeaking} userAudioLevel={userAudioLevel} />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}
