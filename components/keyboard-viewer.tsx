'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Text, Html } from '@react-three/drei'
import { Suspense, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { CircleArrowOutUpLeft, Delete, Option, ArrowBigUp, ArrowRightToLine } from 'lucide-react'

function extractKeyName(nodeName: string): string {
    // Handle specific problematic cases first
    if (nodeName === 'Keycap()') return '.'      // Period key
    if (nodeName === 'Keycap()_1') return '/'    // Slash key
    if (nodeName === 'Keycap(.)') return '.'
    if (nodeName === 'Keycap(/)') return '/'
    if (nodeName === 'Keycap(,)') return ','
    if (nodeName === 'Keycap(;)') return ';'
    if (nodeName === "Keycap(')") return "'"

    // Extract key name from patterns like "Keycap(W)"
    const keycapMatch = nodeName.match(/Keycap\(([^)]+)\)/)
    if (keycapMatch) {
        return keycapMatch[1]
    }

    // Handle keycaps that might be named differently (like "KeycapEnter", "KeycapSpace", etc.)
    if (nodeName.startsWith('Keycap')) {
        return nodeName.replace('Keycap', '')
    }

    return ''
}

function getKeyDisplayText(keyName: string): string {
    // Handle special key name mappings
    if (keyName === 'Layer1') return 'L1'
    if (keyName === 'Layer2') return 'L2'
    if (keyName === 'Enter') return '⏎'
    if (keyName === 'Space') return '␣'
    if (keyName === 'CMD') return '⌘'
    if (keyName === 'CTRL') return '⌃'
    if (keyName === 'Del') return '⌫'
    if (keyName === 'OPTION') return '⌥'
    if (keyName === 'SHIFT') return '⇧'
    if (keyName === 'TAB') return '⇥'
    if (keyName === 'ESC') return '⎋'
    if (keyName === 'LAYER1') return 'L1'
    if (keyName === 'LAYER2') return 'L2'
    return keyName
}

function KeyText({ position, text, scale = 1 }: { position: [number, number, number], text: string, scale?: number }) {
    if (!text) {
        return null
    }

    const displayText = getKeyDisplayText(text)
    const fontSize = (displayText.length > 4 ? 0.6 : 0.8) * 0.8

    return (
        <Text
            position={position}
            fontSize={fontSize}
            color="#374151"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
        >
            {displayText}
        </Text>
    )
}

function KeyboardModel() {
    const gltf = useGLTF('/keyboard.glb')

    const processedKeyPositions = useMemo(() => {
        if (!gltf || !gltf.scene) return []

        const positions: Array<{ position: [number, number, number], text: string }> = []

        // Traverse the scene to find keycap objects
        gltf.scene.traverse((child) => {
            // Only target actual keycaps, not switch housings
            if (child.name && child.name.includes('Keycap')) {
                const keyName = extractKeyName(child.name)

                if (keyName && child instanceof THREE.Mesh) {
                    // Get world position of the key
                    const worldPosition = new THREE.Vector3()
                    child.getWorldPosition(worldPosition)

                    // Filter out the problematic "Tab" key that's positioned way off
                    if (keyName === "Tab" && worldPosition.z < -50) {
                        return
                    }

                    positions.push({
                        position: [worldPosition.x, worldPosition.y, worldPosition.z],
                        text: keyName
                    })

                    // Log in the requested format: GLB name: display value
                    const displayText = getKeyDisplayText(keyName)
                    console.log(`${child.name}: ${displayText}`)
                }
            }
        })

        return positions
    }, [gltf?.scene])

    if (!gltf || !gltf.scene) {
        return <KeyboardFallback />
    }

    // Clone the scene to avoid issues with reusing the same object
    const clonedScene = gltf.scene.clone()
    return (
        <group>
            <primitive object={clonedScene} scale={[0.1, 0.1, 0.1]} position={[0, 0, 0]} />
            {processedKeyPositions.map((key, index) => {
                // Position text in world space to match the scaled keyboard (no scaling applied to text position)
                const worldPosition: [number, number, number] = [
                    key.position[0] * 0.1,
                    (key.position[1] * 0.1) + 0.2, // Higher offset for visibility
                    key.position[2] * 0.1
                ]

                return (
                    <KeyText
                        key={index}
                        position={worldPosition}
                        text={key.text}
                        scale={1}
                    />
                )
            })}
        </group>
    )
}

function LoadingIndicator() {
    return (
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4f46e5" />
        </mesh>
    )
}

function KeyboardFallback() {
    return (
        <group>
            {/* Keyboard base */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4, 0.2, 1.5]} />
                <meshStandardMaterial color="#333333" />
            </mesh>

            {/* Row 1 of keys */}
            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row1-${i}`} position={[-1.5 + (i * 0.2), 0.15, 0.3]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}

            {/* Row 2 of keys */}
            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row2-${i}`} position={[-1.5 + (i * 0.2), 0.15, 0]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}

            {/* Row 3 of keys */}
            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row3-${i}`} position={[-1.5 + (i * 0.2), 0.15, -0.3]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}
        </group>
    )
}

export default function KeyboardViewer() {
    return (
        <div className="w-full h-screen bg-gray-900 relative">
            <div className="absolute top-4 left-4 text-white z-10">
                <p>Keyboard 3D Viewer</p>
                <p className="text-sm text-gray-400">Check console for loading details</p>
            </div>

            <Canvas
                camera={{
                    position: [0, 5, 12],
                    fov: 45
                }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.3} />

                <Suspense fallback={<LoadingIndicator />}>
                    <KeyboardModel />
                </Suspense>

                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={25}
                    target={[0, 0, 0]}
                />
            </Canvas>
        </div>
    )
}