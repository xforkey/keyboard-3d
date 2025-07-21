'use client'

import { useGLTF, Text } from '@react-three/drei'
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
import { createMaterial, createPlasticMaterial, createColoredPlasticMaterial, generateSTLUVCoordinates } from '@/lib/materials'
import { KeyboardFallback } from './keyboard-fallbacks'
import { getKeyboardLayoutData } from '@/lib/keyboard-utils'
import { KeyData } from '@/lib/keyboard-types'
import { LAYER_NAMES } from '@/lib/keyboard-constants'

// Types
interface KeyPositionData {
    position: [number, number, number]
    text: string
    rotation: [number, number, number]
    binding?: string
    layer?: string
    keyData?: KeyData
}

interface MeshData {
    mesh: THREE.Mesh
    name: string
}

interface KeyState {
    isPressed: boolean
    isHovered: boolean
    isSelected: boolean
    hasBinding: boolean
    layer: string
}

// Layer color mapping for 3D styling
const LAYER_COLORS = {
    [LAYER_NAMES.BASE]: {
        text: '#374151',
        hover: '#4B5563',
        selected: '#6B7280',
        accent: '#9CA3AF'
    },
    [LAYER_NAMES.LOWER]: {
        text: '#1E40AF',
        hover: '#2563EB',
        selected: '#3B82F6',
        accent: '#60A5FA'
    },
    [LAYER_NAMES.RAISE]: {
        text: '#7C3AED',
        hover: '#8B5CF6',
        selected: '#A78BFA',
        accent: '#C4B5FD'
    }
} as const

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

function PlasticCase({ mesh, name, color = '#333333' }: MeshData & { color?: string }) {
    const material = createColoredPlasticMaterial(color, 3)
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
    const [hoveredKeys, setHoveredKeys] = useState<Record<string, boolean>>({})
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [currentLayer, setCurrentLayer] = useState<string>(LAYER_NAMES.BASE)
    const [keyStates, setKeyStates] = useState<Record<string, KeyState>>({})

    const handleKeyPress = useCallback((key: string) => {
        console.log(`Key pressed: ${key}`)
        setPressedKeys(prev => ({ ...prev, [key]: true }))

        // Handle layer switching
        if (key === 'LAYER1') {
            setCurrentLayer(LAYER_NAMES.LOWER)
        } else if (key === 'LAYER2') {
            setCurrentLayer(LAYER_NAMES.RAISE)
        }
    }, [])

    const handleKeyRelease = useCallback((key: string) => {
        console.log(`Key released: ${key}`)
        setPressedKeys(prev => ({ ...prev, [key]: false }))

        // Reset to base layer when layer keys are released
        if (key === 'LAYER1' || key === 'LAYER2') {
            setCurrentLayer(LAYER_NAMES.BASE)
        }
    }, [])

    const handleKeyHover = useCallback((key: string, isHovering: boolean) => {
        setHoveredKeys(prev => ({ ...prev, [key]: isHovering }))
    }, [])

    const handleKeySelect = useCallback((key: string | null) => {
        setSelectedKey(key)
    }, [])

    // Update key states based on current layer and interactions
    useEffect(() => {
        const keyboardData = getKeyboardLayoutData()
        const newKeyStates: Record<string, KeyState> = {}

        keyboardData.keys.forEach((keyData: KeyData) => {
            const keyName = keyData.meta?.keyName || keyData.id.split('_').pop() || keyData.id
            const hasBinding = Boolean(keyData.binding && keyData.binding.trim() !== '')

            newKeyStates[keyName] = {
                isPressed: pressedKeys[keyName] || false,
                isHovered: hoveredKeys[keyName] || false,
                isSelected: selectedKey === keyName,
                hasBinding,
                layer: keyData.layer
            }
        })

        setKeyStates(newKeyStates)
    }, [pressedKeys, hoveredKeys, selectedKey, currentLayer])

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

    return {
        pressedKeys,
        hoveredKeys,
        selectedKey,
        currentLayer,
        keyStates,
        handleKeyPress,
        handleKeyRelease,
        handleKeyHover,
        handleKeySelect
    }
}

// Main keyboard component with interactive features
function KeyboardModelCore({ keyboardColor = '#333333' }: { keyboardColor?: string }) {
    const gltf = useGLTF('/keyboard.glb')
    const {
        pressedKeys,
        hoveredKeys,
        selectedKey,
        currentLayer,
        keyStates,
        handleKeyPress,
        handleKeyRelease,
        handleKeyHover,
        handleKeySelect
    } = useKeyboardState()

    if (!gltf?.scene) {
        return null
    }

    // Get key positions from our JSON data instead of extracting from 3D model
    const { processedKeyPositions } = useMemo(() => {
        const keyboardData = getKeyboardLayoutData()

        // Convert our KeyData to the format expected by KeyboardTextLabels
        const positions: KeyPositionData[] = keyboardData.keys.map((keyData: KeyData) => {
            // Extract the key name from meta data or use a fallback
            const keyName = keyData.meta?.keyName || keyData.id.split('_').pop() || keyData.id

            return {
                position: keyData.position as [number, number, number],
                text: keyName,
                rotation: [keyData.rotation[0], keyData.rotation[1], keyData.rotation[2]] as [number, number, number],
                binding: keyData.binding,
                layer: keyData.layer,
                keyData
            }
        })

        console.log(`Using ${positions.length} key positions from JSON data`)

        return { processedKeyPositions: positions }
    }, []) // No dependency on gltf?.scene since we're using static JSON data

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
                    keyStates={keyStates}
                    onKeyPress={handleKeyPress}
                    onKeyRelease={handleKeyRelease}
                    onKeyHover={handleKeyHover}
                    onKeySelect={handleKeySelect}
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
                        color={keyboardColor}
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
                keyStates={keyStates}
                currentLayer={currentLayer}
            />
        </group>
    )
}

// Interactive keys component
function InteractiveKeys({
    keyChildren,
    pressedKeys,
    keyStates,
    onKeyPress,
    onKeyRelease,
    onKeyHover,
    onKeySelect
}: {
    keyChildren: THREE.Object3D[]
    pressedKeys: Record<string, boolean>
    keyStates: Record<string, KeyState>
    onKeyPress: (key: string) => void
    onKeyRelease: (key: string) => void
    onKeyHover: (key: string, isHovering: boolean) => void
    onKeySelect: (key: string | null) => void
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
                            const keyName = e.object.userData?.keyName
                            e.stopPropagation()
                            document.body.style.cursor = 'pointer'
                            if (keyName) {
                                onKeyHover(keyName, true)
                            }
                        }}
                        onPointerOut={(e: any) => {
                            const keyName = e.object.userData?.keyName
                            e.stopPropagation()
                            document.body.style.cursor = 'default'
                            if (keyName) {
                                onKeyHover(keyName, false)
                                onKeyRelease(keyName)
                            }
                        }}
                        onClick={(e: any) => {
                            const keyName = e.object.userData?.keyName
                            if (keyName) {
                                e.stopPropagation()
                                onKeySelect(keyName)
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
    pressedKeys,
    keyStates,
    currentLayer
}: {
    keyPositions: KeyPositionData[]
    pressedKeys: Record<string, boolean>
    keyStates: Record<string, KeyState>
    currentLayer: string
}) {
    useEffect(() => {
        if (keyPositions.length > 0) {
            console.log(`Rendering ${keyPositions.length} text labels`)
        }
    }, [keyPositions.length])

    return (
        <>
            {keyPositions.map((key, index) => {
                const keyState = keyStates[key.text]
                const isPressed = pressedKeys[key.text] || false
                const pressOffset = isPressed ? -KEY_PRESS_HEIGHT * SCALE_FACTOR : 0

                const worldPosition: [number, number, number] = [
                    key.position[0] * SCALE_FACTOR,
                    (key.position[1] * SCALE_FACTOR) + TEXT_OFFSET + pressOffset,
                    key.position[2] * SCALE_FACTOR
                ]

                // Determine text color based on key state and layer
                let textColor: string = '#374151' // Always default to #374151

                if (keyState) {
                    const layerColors = LAYER_COLORS[currentLayer as keyof typeof LAYER_COLORS] || LAYER_COLORS[LAYER_NAMES.BASE]

                    if (keyState.isSelected) {
                        textColor = layerColors.selected
                    } else if (keyState.isHovered) {
                        textColor = layerColors.hover
                    } else if (!keyState.hasBinding) {
                        textColor = '#9CA3AF' // gray for blank keys
                    } else if (keyState.layer === currentLayer && currentLayer !== LAYER_NAMES.BASE) {
                        textColor = layerColors.accent
                    } else {
                        textColor = '#374151' // Always use #374151 for base layer and default state
                    }
                }

                // Determine display text - show binding label if available and on current layer
                let displayText = KEY_SYMBOL_MAP[key.text] || key.text
                if (key.keyData?.label && key.layer === currentLayer) {
                    displayText = key.keyData.label
                }

                if (index === 0) {
                    console.log(`First text: "${key.text}" at position:`, worldPosition, 'rotation:', key.rotation, 'color:', textColor)
                }

                return (
                    <group key={`${key.text}-text-${index}`}>
                        <Text
                            position={worldPosition}
                            fontSize={0.64}
                            color={textColor}
                            fontWeight="bold"
                            rotation={key.rotation}
                        >
                            {displayText}
                        </Text>
                    </group>
                )
            })}
        </>
    )
}

// Main export component with fallback
export function KeyboardModel({ keyboardColor = '#333333' }: { keyboardColor?: string }) {
    return (
        <Suspense fallback={<KeyboardFallback />}>
            <KeyboardModelCore keyboardColor={keyboardColor} />
        </Suspense>
    )
}