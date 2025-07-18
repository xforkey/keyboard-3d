'use client'

export function LoadingIndicator() {
    return (
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4f46e5" />
        </mesh>
    )
}

// Fallback geometric keyboard when GLTF model fails to load
export function KeyboardFallback() {
    return (
        <group>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4, 0.2, 1.5]} />
                <meshStandardMaterial color="#333333" />
            </mesh>

            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row1-${i}`} position={[-1.5 + (i * 0.2), 0.15, 0.3]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}

            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row2-${i}`} position={[-1.5 + (i * 0.2), 0.15, 0]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}

            {Array.from({ length: 15 }, (_, i) => (
                <mesh key={`row3-${i}`} position={[-1.5 + (i * 0.2), 0.15, -0.3]}>
                    <boxGeometry args={[0.15, 0.1, 0.15]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}
        </group>
    )
}