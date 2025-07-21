'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { KeyboardModel } from './keyboard/keyboard-model'
import { LoadingIndicator } from './keyboard/keyboard-fallbacks'
import { LAYER_NAMES } from '@/lib/keyboard-constants'

export default function KeyboardViewer({ keyboardColor = '#333333' }: { keyboardColor?: string }) {
    const [currentLayer, setCurrentLayer] = useState(LAYER_NAMES.BASE)

    return (
        <div className="keyboard-container">
            <div className="keyboard-header">
                <h1 className="keyboard-title">Interactive 3D Keyboard</h1>
                <p className="keyboard-description">Click any key or type on your keyboard to see it press down!</p>
                <p className="keyboard-features">Features carbon fiber plates, plastic cases, and full interactivity</p>

                {/* Layer Indicator */}
                <div className="mt-3 flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Active Layer:</span>
                    <div className={`layer-${currentLayer === LAYER_NAMES.BASE ? 'base' : currentLayer === LAYER_NAMES.LOWER ? 'lower' : 'raise'} layer-active flex items-center`}>
                        <div className="layer-indicator"></div>
                        <span className="key-binding-label">
                            {currentLayer === LAYER_NAMES.BASE ? 'Base' :
                                currentLayer === LAYER_NAMES.LOWER ? 'Lower' : 'Raise'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="keyboard-canvas-container">
                <div className="keyboard-canvas">
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