'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import { KeyboardModel } from './keyboard/keyboard-model'
import { LoadingIndicator } from './keyboard/keyboard-fallbacks'

export default function KeyboardViewer({ keyboardColor = '#333333' }: { keyboardColor?: string }) {
    return (
        <div className="w-full min-h-screen bg-gray-900 flex flex-col">
            <div className="p-4 text-white max-w-xs sm:max-w-sm lg:max-w-md">
                <h1 className="text-lg sm:text-xl font-bold">Interactive 3D Keyboard</h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">Click any key or type on your keyboard to see it press down!</p>
                <p className="text-xs text-gray-400 mt-1 hidden sm:block">Features carbon fiber plates, plastic cases, and full interactivity</p>
            </div>

            <div className="flex-1 flex items-end">
                <div className="w-full aspect-video">
                    <Canvas
                        className="w-full h-full"
                        camera={{
                            position: [0, 15, 40],
                            fov: 50
                        }}
                        dpr={[1, 2]}
                    >
                        <Environment preset="sunset" />

                        {/* Contact shadows for ground plane effect */}
                        <ContactShadows
                            position={[0, -0.5, 0]}
                            opacity={0.4}
                            scale={200}
                            blur={1}
                            far={20}
                        />

                        <Suspense fallback={<LoadingIndicator />}>
                            <KeyboardModel keyboardColor={keyboardColor} />
                        </Suspense>

                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            enableRotate={true}
                            minDistance={10}
                            maxDistance={150}
                            target={[0, 0, 0]}
                        />
                    </Canvas>
                </div>
            </div>
        </div>
    )
}