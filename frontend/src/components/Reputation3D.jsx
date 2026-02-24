import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, GradientTexture, Center, Text3D, Environment } from '@react-three/drei';
import * as THREE from 'three';

function ReputationOrb({ level = 1 }) {
    const mesh = useRef();

    // Rotate and pulse based on level
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        mesh.current.rotation.x = Math.cos(time / 4) * 0.2;
        mesh.current.rotation.y = Math.sin(time / 2) * 0.4;
        mesh.current.position.y = Math.sin(time / 1.5) * 0.1;
    });

    // Color depth increases with level
    const distortion = useMemo(() => 0.3 + (level * 0.05), [level]);
    const speed = useMemo(() => 2 + (level * 0.2), [level]);

    return (
        <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
            <Sphere ref={mesh} args={[1, 64, 64]}>
                <MeshDistortMaterial
                    color={"#2dd4bf"}
                    speed={speed}
                    distort={distortion}
                    radius={1}
                >
                    <GradientTexture
                        stops={[0, 1]}
                        colors={['#10b981', '#6366f1']}
                    />
                </MeshDistortMaterial>
            </Sphere>
        </Float>
    );
}

export default function Reputation3D({ level = 1 }) {
    return (
        <div style={{ width: '100%', height: '300px', cursor: 'grab' }}>
            <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4f46e5" />
                <spotLight position={[0, 5, 0]} intensity={0.8} />

                <Center>
                    <ReputationOrb level={level} />
                </Center>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
