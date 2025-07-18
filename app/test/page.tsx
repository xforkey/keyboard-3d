'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Text } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
    SCALE_FACTOR,
    TEXT_OFFSET,
    extractKeyName,
    KEY_SYMBOL_MAP,
    KEYBOARD_KEY_MAP,
    KEY_PRESS_HEIGHT
} from '@/lib/keyboard-config'
import { createMaterial, createPlasticMaterial, generateSTLUVCoordinates } from '@/lib/materials'

// Types
interface KeyPositionData {
    position: [number, number, number]
    text: string
    rotation: [number, number, number]
}

interface MeshData {
    mesh: THREE.Mesh
    name: string
}

// Material Components
function CarbonFiberPlate({ mesh, name }: MeshData) {
    const material = createMaterial('/materials/carbon-fiber', 'carbon-fiber', 2)
    const worldPos = mesh.userData.worldPosition
    const worldQuat = mesh.userData.worldQuaternion

    useEffect(() => {
        if (mesh.geometry && !mesh.geometry.attributes.uv) {
            generateSTLUVCoordinates(mesh.geometry, 0.017)
        }
    }, [mesh])

    return (
        <mesh
            geometry={mesh.geometry}
            position={[worldPos.x, worldPos.y, worldPos.z]}
            quaternion={[worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w]}
        >
            <meshStandardMaterial {...material} />
        </mesh>
    )
}

function PlasticCase({ mesh, name }: MeshData) {
    const material = createPlasticMaterial(3)
    const worldPos = mesh.userData.worldPosition
    const worldQuat = mesh.userData.worldQuaternion

    useEffect(() => {
        if (mesh.geometry && !mesh.geometry.attributes.uv) {
            generateSTLUVCoordinates(mesh.geometry, 0.004)
        }
    }, [mesh])

    return (
        <mesh
            geometry={mesh.geometry}
            position={[worldPos.x, worldPos.y, worldPos.z]}
            quaternion={[worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w]}
        >
            <meshStandardMaterial {...material} />
        </mesh>
    )
}

// Utility Functions
function processKeycapNode(child: THREE.Object3D): KeyPositionData | null {
    const keyName = extractKeyName(child.name)
    if (!keyName || !(child instanceof THREE.Mesh)) return null

    const worldPosition = new THREE.Vector3()
    child.getWorldPosition(worldPosition)

    const worldQuaternion = new THREE.Quaternion()
    child.getWorldQuaternion(worldQuaternion)
    const worldEuler = new THREE.Euler()
    worldEuler.setFromQuaternion(worldQuaternion)

    return {
        position: [worldPosition.x, worldPosition.y, worldPosition.z],
        text: keyName,
        rotation: [-Math.PI / 2, 0, worldEuler.y]
    }
}

function findNodesByName(node: THREE.Object3D, names: string[]): THREE.Object3D[] {
    let found: THREE.Object3D[] = []
    if (names.includes(node.name)) {
        found.push(node)
    }
    node.children.forEach(child => {
        found = found.concat(findNodesByName(child, names))
    })
    return found
}

function createMeshWithWorldData(mesh: THREE.Mesh): THREE.Mesh {
    const worldPosition = new THREE.Vector3()
    mesh.getWorldPosition(worldPosition)

    const worldQuaternion = new THREE.Quaternion()
    mesh.getWorldQuaternion(worldQuaternion)

    const clonedMesh = mesh.clone()
    clonedMesh.userData.worldPosition = worldPosition
    clonedMesh.userData.worldQuaternion = worldQuaternion

    return clonedMesh
}

// Custom Hooks
function useKeyboardState() {
    const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({})

    const handleKeyPress = useCallback((key: string) => {
        console.log(`Key pressed: ${key}`)
        setPressedKeys(prev => ({ ...prev, [key]: true }))
    }, [])

    const handleKeyRelease = useCallback((key: string) => {
        console.log(`Key released: ${key}`)
        setPressedKeys(prev => ({ ...prev, [key]: false }))
    }, [])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const mappedKey = KEYBOARD_KEY_MAP[event.code] || KEYBOARD_KEY_MAP[event.key]
            if (mappedKey) {
                event.preventDefault()
                handleKeyPress(mappedKey)
            }
        }

        const handleKeyUp = (event: KeyboardEvent) => {
            const mappedKey = KEYBOARD_KEY_MAP[event.code] || KEYBOARD_KEY_MAP[event.key]
            if (mappedKey) {
                event.preventDefault()
                handleKeyRelease(mappedKey)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [handleKeyPress, handleKeyRelease])

    return { pressedKeys, handleKeyPress, handleKeyRelease }
}

// Main keyboard component with interactive features
function UnmodifiedKeyboard() {
    const gltf = useGLTF('/keyboard.glb')
    const { pressedKeys, handleKeyPress, handleKeyRelease } = useKeyboardState()

    if (!gltf?.scene) {
        return null
    }


    // Process keycap positions for text rendering
    const { processedKeyPositions } = useMemo(() => {
        if (!gltf?.scene) {
            return { processedKeyPositions: [] }
        }

        const positions: KeyPositionData[] = []

        gltf.scene.traverse((child) => {
            if (child.name?.includes('Keycap')) {
                const result = processKeycapNode(child)
                if (result) {
                    positions.push(result)
                }
            }
        })

        return { processedKeyPositions: positions }
    }, [gltf?.scene])

    // Extract keyboard components
    const keyboardComponents = useMemo(() => {
        if (!gltf?.scene) return { plateMeshes: [], caseCoverMeshes: [], coverMeshes: [] }

        const cases = findNodesByName(gltf.scene, ['LCase', 'RCase'])
        const coverGroups = findNodesByName(gltf.scene, ['LCover', 'RCover'])

        // Extract plate meshes from cases
        const plateMeshes: MeshData[] = []
        const lCases = cases.filter(c => c.name === 'LCase')
        const rCases = cases.filter(c => c.name === 'RCase')

        lCases.forEach(caseNode => {
            const plateChild = caseNode.children.find(child =>
                child instanceof THREE.Mesh && child.name === 'LPlate'
            ) as THREE.Mesh
            if (plateChild) {
                plateMeshes.push({ mesh: createMeshWithWorldData(plateChild), name: plateChild.name })
            }
        })

        rCases.forEach(caseNode => {
            const plateChild = caseNode.children.find(child =>
                child instanceof THREE.Mesh && child.name === 'RPlate'
            ) as THREE.Mesh
            if (plateChild) {
                plateMeshes.push({ mesh: createMeshWithWorldData(plateChild), name: plateChild.name })
            }
        })

        // Extract case meshes
        const caseCoverMeshes: MeshData[] = []
        cases.forEach(caseNode => {
            if (caseNode instanceof THREE.Mesh) {
                caseCoverMeshes.push({
                    mesh: createMeshWithWorldData(caseNode),
                    name: caseNode.name
                })
            }
        })

        // Extract cover meshes
        const coverMeshes: THREE.Mesh[] = []
        coverGroups.forEach(coverGroup => {
            const meshChildren = coverGroup.children.filter(child =>
                child instanceof THREE.Mesh && child.name === 'CoverMesh'
            ) as THREE.Mesh[]

            meshChildren.forEach(meshChild => {
                const clonedMesh = meshChild.clone()
                clonedMesh.applyMatrix4(meshChild.matrixWorld)
                coverMeshes.push(clonedMesh)
            })
        })

        return { plateMeshes, caseCoverMeshes, coverMeshes }
    }, [gltf?.scene])

    const { plateMeshes, caseCoverMeshes, coverMeshes } = keyboardComponents

    // Process key components for animation
    const keyComponents = useMemo(() => {
        if (!gltf?.scene) return { plateChildren: [], keyChildren: [] }

        const plateNodes = findNodesByName(gltf.scene, ['LPlate', 'RPlate'])
        const plateChildren: THREE.Object3D[] = []

        plateNodes.forEach(plate => {
            plate.updateWorldMatrix(true, false)
            plate.children.forEach(child => {
                // Skip plate mesh components
                if (child.name === "LPlateMesh" || child.name === "RPlateMesh") {
                    return
                }
                const clonedChild = child.clone(true)
                clonedChild.applyMatrix4(plate.matrixWorld)
                plateChildren.push(clonedChild)
            })
        })

        // Extract individual key components
        const keyChildren: THREE.Object3D[] = []
        plateChildren.forEach((keyObj) => {
            keyObj.updateWorldMatrix(true, false)
            const childrenToRemove: THREE.Object3D[] = []

            keyObj.children.forEach((child) => {
                const clonedChild = child.clone(true)
                clonedChild.applyMatrix4(keyObj.matrixWorld)
                keyChildren.push(clonedChild)
                childrenToRemove.push(child)
            })

            childrenToRemove.forEach(child => keyObj.remove(child))
        })

        return { plateChildren, keyChildren }
    }, [gltf?.scene])

    const { plateChildren, keyChildren } = keyComponents



    return (
        <group>
            {/* Keyboard components - scaled */}
            <group scale={[SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR]}>
                {plateChildren.map((obj: THREE.Object3D) => (
                    <primitive
                        key={obj.uuid}
                        object={obj}
                    />
                ))}
                <InteractiveKeys
                    keyChildren={keyChildren}
                    pressedKeys={pressedKeys}
                    onKeyPress={handleKeyPress}
                    onKeyRelease={handleKeyRelease}
                />
            </group>

            {/* Carbon fiber plates - scaled */}
            <group scale={[SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR]}>
                {plateMeshes.map((plate, index) => (
                    <CarbonFiberPlate
                        key={`${plate.name}-${index}`}
                        mesh={plate.mesh}
                        name={plate.name}
                    />
                ))}
            </group>

            {/* Plastic case covers - scaled */}
            <group scale={[SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR]}>
                {caseCoverMeshes.map((cover, index) => (
                    <PlasticCase
                        key={`${cover.name}-${index}`}
                        mesh={cover.mesh}
                        name={cover.name}
                    />
                ))}
            </group>

            {/* Cover meshes - scaled */}
            <group scale={[SCALE_FACTOR, SCALE_FACTOR, SCALE_FACTOR]}>
                {coverMeshes.map((mesh, index) => (
                    <primitive
                        key={`cover-${index}`}
                        object={mesh}
                    />
                ))}
            </group>

            {/* Text labels */}
            <KeyboardTextLabels
                keyPositions={processedKeyPositions}
                pressedKeys={pressedKeys}
            />
        </group>
    )
}

// Interactive keys component
function InteractiveKeys({
    keyChildren,
    pressedKeys,
    onKeyPress,
    onKeyRelease
}: {
    keyChildren: THREE.Object3D[]
    pressedKeys: Record<string, boolean>
    onKeyPress: (key: string) => void
    onKeyRelease: (key: string) => void
}) {
    return (
        <>
            {keyChildren.map((obj: THREE.Object3D) => {
                // Extract key name from the object or its children
                let keyName = obj.name

                if (!keyName || !pressedKeys[keyName]) {
                    obj.traverse((child: THREE.Object3D) => {
                        if (child.name?.includes('Keycap')) {
                            const extractedName = extractKeyName(child.name)
                            if (extractedName) {
                                keyName = extractedName
                            }
                        }
                    })
                }

                const isPressed = pressedKeys[keyName] || false
                const pressOffset = isPressed ? -KEY_PRESS_HEIGHT : 0

                if (isPressed) console.log(`Animating switch for key: ${keyName}`)

                // Clone and animate the object
                const animatedObj = obj.clone()

                // Only animate switch children - keycaps inherit movement from parent switches
                animatedObj.traverse((child: THREE.Object3D) => {
                    if (child.name?.includes('Switch')) {
                        if (isPressed) console.log(`Animating switch: ${child.name} for key: ${keyName}`)
                        child.position.y += pressOffset
                    }

                    // Add interaction data to keycaps
                    if (child.name?.includes('Keycap') && keyName) {
                        const keycapMesh = child as THREE.Mesh
                        keycapMesh.userData.keyName = keyName
                        keycapMesh.userData.onKeyPress = onKeyPress
                        keycapMesh.userData.onKeyRelease = onKeyRelease
                    }
                })

                return (
                    <primitive
                        key={obj.uuid}
                        object={animatedObj}
                        onPointerDown={(e: any) => {
                            const keyName = e.object.userData?.keyName
                            if (keyName) {
                                e.stopPropagation()
                                onKeyPress(keyName)
                            }
                        }}
                        onPointerUp={(e: any) => {
                            const keyName = e.object.userData?.keyName
                            if (keyName) {
                                e.stopPropagation()
                                onKeyRelease(keyName)
                            }
                        }}
                        onPointerOver={(e: any) => {
                            e.stopPropagation()
                            document.body.style.cursor = 'pointer'
                        }}
                        onPointerOut={(e: any) => {
                            const keyName = e.object.userData?.keyName
                            e.stopPropagation()
                            document.body.style.cursor = 'default'
                            if (keyName) {
                                onKeyRelease(keyName)
                            }
                        }}
                    />
                )
            })}
        </>
    )
}

// Text rendering component
function KeyboardTextLabels({
    keyPositions,
    pressedKeys
}: {
    keyPositions: KeyPositionData[]
    pressedKeys: Record<string, boolean>
}) {
    useEffect(() => {
        if (keyPositions.length > 0) {
            console.log(`Rendering ${keyPositions.length} text labels`)
        }
    }, [keyPositions.length])

    return (
        <>
            {keyPositions.map((key, index) => {
                const isPressed = pressedKeys[key.text] || false
                const pressOffset = isPressed ? -KEY_PRESS_HEIGHT * SCALE_FACTOR : 0

                const worldPosition: [number, number, number] = [
                    key.position[0] * SCALE_FACTOR,
                    (key.position[1] * SCALE_FACTOR) + TEXT_OFFSET + pressOffset,
                    key.position[2] * SCALE_FACTOR
                ]

                if (index === 0) {
                    console.log(`First text: "${key.text}" at position:`, worldPosition, 'rotation:', key.rotation)
                }

                return (
                    <group key={`${key.text}-text-${index}`}>
                        <Text
                            position={worldPosition}
                            fontSize={0.64}
                            color="#374151"
                            fontWeight="bold"
                            rotation={key.rotation}
                        >
                            {KEY_SYMBOL_MAP[key.text] || key.text}
                        </Text>
                    </group>
                )
            })}
        </>
    )
}

export default function TestPage() {
    return (
        <div className="w-full h-screen bg-gray-900 relative">
            <div className="absolute top-4 left-4 text-white z-10">
                <h1 className="text-xl font-bold">Enhanced Keyboard Test</h1>
                <p className="text-sm">Rendering keyboard with carbon fiber plates, plastic cases, and covers</p>
                <p className="text-xs mt-1 opacity-75">Includes original components plus material-enhanced plates, cases, and covers</p>
            </div>

            <Canvas
                camera={{
                    position: [0, 80, 400],
                    fov: 75
                }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />

                <Environment preset="sunset" />

                <Suspense fallback={null}>
                    <UnmodifiedKeyboard />
                </Suspense>

                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    target={[0, 0, 0]}
                />
            </Canvas>
        </div>
    )
}