import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

const AVATAR_URL = '/custom_avatar.glb';

class AvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn("Failed to load 3D Avatar, falling back to geometric core.", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const AICore = ({ isSpeaking, userAudioLevel }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const outerRingRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
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
      const targetDistort = isSpeaking ? 0.6 : 0.3;
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort, 0.1);
      const targetSpeed = isSpeaking ? 4 : 2;
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, targetSpeed, 0.1);
      const targetColor = isSpeaking ? new THREE.Color('#a855f7') : new THREE.Color('#6366f1');
      materialRef.current.color.lerp(targetColor, 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
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
      <Sphere ref={outerRingRef} args={[1, 16, 16]}>
        <meshBasicMaterial color="#10b981" wireframe transparent opacity={0} />
      </Sphere>
    </Float>
  );
};

const HumanAvatar = ({ isSpeaking, userAudioLevel }) => {
  const { scene } = useGLTF(AVATAR_URL);
  const avatarRef = useRef();

  useFrame((state, delta) => {
    if (avatarRef.current) {
      avatarRef.current.position.y = THREE.MathUtils.lerp(
        avatarRef.current.position.y,
        -1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05,
        0.1
      );

      const targetScale = 1.2 + (userAudioLevel / 200);
      avatarRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      scene.traverse((child) => {
        if (child.isMesh && child.morphTargetDictionary) {
          const mouthOpenIdx = child.morphTargetDictionary['mouthOpen'] ?? child.morphTargetDictionary['viseme_O'];
          const jawOpenIdx = child.morphTargetDictionary['jawOpen'];
          
          if (mouthOpenIdx !== undefined) {
            if (isSpeaking) {
              const talkSpeed = 20;
              const openAmount = (Math.sin(state.clock.elapsedTime * talkSpeed) + 1) / 2;
              child.morphTargetInfluences[mouthOpenIdx] = openAmount * 0.7;
              if (jawOpenIdx !== undefined) {
                  child.morphTargetInfluences[jawOpenIdx] = openAmount * 0.3;
              }
            } else {
              child.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(child.morphTargetInfluences[mouthOpenIdx], 0, 0.2);
              if (jawOpenIdx !== undefined) {
                  child.morphTargetInfluences[jawOpenIdx] = THREE.MathUtils.lerp(child.morphTargetInfluences[jawOpenIdx], 0, 0.2);
              }
            }
          }
        }
      });
    }
  });

  return (
    <primitive 
      ref={avatarRef}
      object={scene} 
      position={[0, -1.5, 0]} 
      scale={1.2} 
    />
  );
};

export default function Avatar3D({ isSpeaking, userAudioLevel }) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500/20">
      <AvatarErrorBoundary fallback={
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
            <pointLight position={[0, 0, 0]} intensity={isSpeaking ? 2 : 0} color="#a855f7" />
            <AICore isSpeaking={isSpeaking} userAudioLevel={userAudioLevel} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
        </Canvas>
      }>
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[0, 5, 5]} intensity={2.5} />
          <directionalLight position={[-5, 5, -5]} intensity={1} color="#4f46e5" />
          <pointLight position={[0, 1.5, 2]} intensity={isSpeaking ? 5 : 0} color="#a855f7" distance={5} />
          
          <React.Suspense fallback={null}>
            <HumanAvatar isSpeaking={isSpeaking} userAudioLevel={userAudioLevel} />
          </React.Suspense>
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate 
            autoRotateSpeed={1} 
            minPolarAngle={Math.PI / 2.2} 
            maxPolarAngle={Math.PI / 1.8} 
          />
        </Canvas>
      </AvatarErrorBoundary>
    </div>
  );
}
