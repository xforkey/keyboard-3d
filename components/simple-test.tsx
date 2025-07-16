'use client'

import { Canvas } from '@react-three/fiber'

function TestCube() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
        </mesh>
    )
}

export default function SimpleTest() {
    return (
        <div className="w-full h-screen bg-blue-500">
            <h1 className="text-white text-2xl p-4">Testing Three.js</h1>
            <div className="w-full h-96">
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <TestCube />
                </Canvas>
            </div>
        </div>
    )
}