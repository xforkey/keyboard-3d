'use client'

import { Text } from '@react-three/drei'
import { KEY_SYMBOL_MAP } from '@/lib/keyboard-config'

// Simple text component for keyboard labels
export function KeyText({
    position,
    text,
    rotation
}: {
    position: [number, number, number]
    text: string
    rotation: [number, number, number]
}) {
    if (!text) return null

    return (
        <Text
            position={position}
            fontSize={0.64}
            color="#374151"
            fontWeight="bold"
            rotation={rotation}
        >
            {KEY_SYMBOL_MAP[text] || text}
        </Text>
    )
}

// Legacy exports for backward compatibility (now handled in main component)
export const KeycapMesh = KeyText
export const SwitchMesh = KeyText