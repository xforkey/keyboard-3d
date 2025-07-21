import { useTexture } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import React from 'react'

// General hook to create PBR material from a texture directory
export function useMaterial(textureDirectory: string, materialName: string, scale: number = 1, options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        displacementScale = 0.1
    } = options

    // Try to load standard PBR texture maps
    const textures = useTexture([
        `${textureDirectory}/${materialName}_Color.jpg`,
        `${textureDirectory}/${materialName}_NormalGL.jpg`,
        `${textureDirectory}/${materialName}_Roughness.jpg`,
        `${textureDirectory}/${materialName}_Metalness.jpg`,
        `${textureDirectory}/${materialName}_Displacement.jpg`
    ])

    const [colorTexture, normalTexture, roughnessTexture, metalnessTexture, displacementTexture] = textures

    // Configure texture repeat for all loaded textures
    textures.forEach(texture => {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(scale, scale)
        }
    })

    // Build material properties object
    const materialProps: Record<string, unknown> = {}

    if (colorTexture) materialProps.map = colorTexture
    if (normalTexture) materialProps.normalMap = normalTexture
    if (roughnessTexture) materialProps.roughnessMap = roughnessTexture
    if (metalnessTexture) materialProps.metalnessMap = metalnessTexture
    if (displacementTexture) {
        materialProps.displacementMap = displacementTexture
        materialProps.displacementScale = displacementScale
    }

    return materialProps
}

// Legacy function for backward compatibility - creates material without hooks
export function createMaterial(textureDirectory: string, materialName: string, _scale: number = 1, options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        displacementScale = 0.1
    } = options

    // Build material properties object without textures for non-hook usage
    const materialProps: Record<string, unknown> = {
        roughness: options.roughness || 0.8,
        metalness: options.metalness || 0.2,
        displacementScale
    }

    return materialProps
}

// Specialized hook for plastic material with mixed file extensions
export function usePlasticMaterial(scale: number = 1, options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        roughness = 0.8,
        metalness = 0.1, // Plastic is typically less metallic
    } = options

    // Load plastic textures with their specific file extensions (excluding TIFF displacement)
    const textures = useTexture([
        '/materials/plastic/plastic_Color.jpg',
        '/materials/plastic/plastic_Normal.png',
        '/materials/plastic/plastic_Roughness.jpg',
        '/materials/plastic/plastic_Metallic.jpg',
        '/materials/plastic/plastic_AmbientOcclusion.jpg'
    ])

    const [colorMap, normalMap, roughnessMap, metallicMap, aoMap] = textures

    // Configure texture repeat for all loaded textures
    textures.forEach(texture => {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(scale, scale)
        }
    })

    // Build material properties object
    const materialProps: Record<string, unknown> = {
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        metalnessMap: metallicMap,
        aoMap: aoMap,
        roughness: roughness,
        metalness: metalness,
        color: new THREE.Color(0xffffff),
    }

    // Note: Displacement map excluded due to TIFF format not being supported by Three.js texture loader

    return materialProps
}

// Legacy function for backward compatibility
export function createPlasticMaterial(_scale: number = 1, options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        roughness = 0.8,
        metalness = 0.1,
    } = options

    // Build material properties object without textures for non-hook usage
    const materialProps: Record<string, unknown> = {
        roughness: roughness,
        metalness: metalness,
        color: new THREE.Color(0xffffff),
    }

    return materialProps
}

// Specialized hook for colored plastic material (without color texture)
export function useColoredPlasticMaterial(color: string, scale: number = 1, options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        roughness = 0.8,
        metalness = 0.1, // Plastic is typically less metallic
    } = options

    // Load plastic textures excluding the color map so our custom color shows through
    const textures = useTexture([
        '/materials/plastic/plastic_Normal.png',
        '/materials/plastic/plastic_Roughness.jpg',
        '/materials/plastic/plastic_Metallic.jpg',
        '/materials/plastic/plastic_AmbientOcclusion.jpg'
    ])

    const [normalMap, roughnessMap, metallicMap, aoMap] = textures

    // Configure texture repeat for all loaded textures
    textures.forEach(texture => {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(scale, scale)
        }
    })

    // Build material properties object with custom color
    const materialProps: Record<string, unknown> = {
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        metalnessMap: metallicMap,
        aoMap: aoMap,
        roughness: roughness,
        metalness: metalness,
        color: new THREE.Color(color), // Use the custom color instead of texture
    }

    return materialProps
}

// Legacy function for backward compatibility
export function createColoredPlasticMaterial(color: string, _scale: number = 1, _options: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
} = {}) {
    const {
        roughness = 0.8,
        metalness = 0.1,
    } = _options

    // Build material properties object without textures for non-hook usage
    const materialProps: Record<string, unknown> = {
        roughness: roughness,
        metalness: metalness,
        color: new THREE.Color(color),
    }

    return materialProps
}

// Function to apply material to any mesh node (React version)
export function applyMaterial(node: THREE.Mesh, textureDirectory: string, materialName: string, scale: number = 1, options?: {
    roughness?: number,
    metalness?: number,
    displacementScale?: number
}) {
    const materialProps = createMaterial(textureDirectory, materialName, scale)

    if (node.material) {
        // Apply the material properties
        Object.assign(node.material, materialProps)
    }

    return node
}

// Custom hook version of applyMaterial for dynamic material application
export function useApplyMaterial(
    meshRef: React.RefObject<THREE.Mesh | null>,
    textureDirectory: string,
    materialName: string,
    scale: number = 1,
    _options?: {
        roughness?: number,
        metalness?: number,
        displacementScale?: number
    }
) {
    const {
        roughness = 0.8,
        metalness = 0.2,
        displacementScale = 0.1
    } = _options || {}

    // Load textures directly using useLoader
    const colorTexture = useLoader(THREE.TextureLoader, `${textureDirectory}/${materialName}_Color.jpg`)
    const normalTexture = useLoader(THREE.TextureLoader, `${textureDirectory}/${materialName}_NormalGL.jpg`)
    const roughnessTexture = useLoader(THREE.TextureLoader, `${textureDirectory}/${materialName}_Roughness.jpg`)
    const metalnessTexture = useLoader(THREE.TextureLoader, `${textureDirectory}/${materialName}_Metalness.jpg`)
    const displacementTexture = useLoader(THREE.TextureLoader, `${textureDirectory}/${materialName}_Displacement.jpg`)

    React.useEffect(() => {
        // Configure texture repeat
        const textures = [colorTexture, normalTexture, roughnessTexture, metalnessTexture, displacementTexture]
        textures.forEach(texture => {
            if (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
                texture.repeat.set(scale, scale)
            }
        })

        // Apply material properties
        if (meshRef.current && meshRef.current.material) {
            const material = meshRef.current.material as THREE.MeshStandardMaterial

            if (colorTexture) {
                material.map = colorTexture
                material.color.setHex(0xffffff) // Reset color to white so texture shows properly
            }

            if (normalTexture) material.normalMap = normalTexture
            if (roughnessTexture) material.roughnessMap = roughnessTexture
            if (metalnessTexture) material.metalnessMap = metalnessTexture
            if (displacementTexture) {
                material.displacementMap = displacementTexture
                material.displacementScale = displacementScale
            }

            material.roughness = roughness
            material.metalness = metalness
            material.needsUpdate = true
        }
    }, [colorTexture, normalTexture, roughnessTexture, metalnessTexture, displacementTexture, scale, roughness, metalness, displacementScale, meshRef])

    return {
        colorTexture,
        normalTexture,
        roughnessTexture,
        metalnessTexture,
        displacementTexture
    }
}

// Utility function to generate UV coordinates for geometries with proper face orientation detection
export function generateSTLUVCoordinates(geometry: THREE.BufferGeometry, textureScale: number = 0.1) {
    if (!geometry.attributes.uv) {
        geometry.computeBoundingBox()
        geometry.computeVertexNormals()

        const uvs = []
        const positions = geometry.attributes.position.array
        const normals = geometry.attributes.normal.array

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]
            const y = positions[i + 1]
            const z = positions[i + 2]

            const nx = normals[i]
            const ny = normals[i + 1]
            const nz = normals[i + 2]

            let u, v

            // Determine which plane the face is most aligned with
            const absNx = Math.abs(nx)
            const absNy = Math.abs(ny)
            const absNz = Math.abs(nz)

            if (absNy > absNx && absNy > absNz) {
                // Face is mostly aligned with Y axis (top/bottom face)
                u = x * textureScale
                v = z * textureScale
            } else if (absNx > absNz) {
                // Face is mostly aligned with X axis (left/right face)
                u = z * textureScale
                v = y * textureScale
            } else {
                // Face is mostly aligned with Z axis (front/back face)
                u = x * textureScale
                v = y * textureScale
            }

            uvs.push(u, v)
        }

        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }
}
