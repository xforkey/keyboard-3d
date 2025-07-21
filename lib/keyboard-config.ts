import * as THREE from 'three'

// Configuration constants
export const SCALE_FACTOR = 0.1
export const TEXT_OFFSET = 0.2
export const KEY_PRESS_HEIGHT = 2.0

// Maps key names to display symbols
export const KEY_SYMBOL_MAP: Record<string, string> = {
    'Layer1': 'L1',
    'Layer2': 'L2',
    'LAYER1': 'L1',
    'LAYER2': 'L2',
    'Enter': '⏎',
    'SPACE': '␣',
    'CMD': '⌘',
    'CTRL': '⌃',
    'Del': '⌫',
    'OPTION': '⌥',
    'SHIFT': '⇧',
    'TAB': '⇥',
    'ESC': '⎋',
    // Punctuation symbols
    'DOT': '.',
    'COMMA': ',',
    'FSLH': '/',
    'SEMI': ';',
    'SQT': "'",
    'GRAVE': '`',
    'BSLH': '\\',
    'LBKT': '[',
    'RBKT': ']',
    'MINUS': '-',
    'EQUAL': '=',
    'LSHIFT': '⇧',
    'RSHIFT': '⇧',
    'LCTRL': '⌃',
    'RCTRL': '⌃',
    'LALT': '⌥',
    'RALT': '⌥',
    'LGUI': '⌘',
    'RGUI': '⌘',
    'BSPC': '⌫',
    'RET': '⏎',
    'ENTER': '⏎'
}

// Maps physical keyboard keys to 3D model key names
export const KEYBOARD_KEY_MAP: Record<string, string> = {
    // Letters
    'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E', 'f': 'F', 'g': 'G',
    'h': 'H', 'i': 'I', 'j': 'J', 'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N',
    'o': 'O', 'p': 'P', 'q': 'Q', 'r': 'R', 's': 'S', 't': 'T', 'u': 'U',
    'v': 'V', 'w': 'W', 'x': 'X', 'y': 'Y', 'z': 'Z',

    // Special keys
    'Enter': 'Enter',
    'Escape': 'ESC',
    'Backspace': 'Del',
    'Tab': 'TAB',
    'Space': 'SPACE',
    'Shift': 'SHIFT',
    'Control': 'CTRL',
    'Meta': 'CMD',
    'Alt': 'OPTION',

    // Punctuation
    'Semicolon': ';',
    'Quote': "'",
    'Comma': ',',
    'Period': '.',
    'Slash': '/',

    // Layer keys (custom mapping)
    'CapsLock': 'LAYER1',
    'F13': 'LAYER2', // or another key you want to map to LAYER2
}

// Types
export interface KeyPosition {
    position: [number, number, number]
    text: string
    rotation: [number, number, number]
}

export interface KeyTextProps {
    position: [number, number, number]
    text: string
    rotation: [number, number, number]
}

export interface KeycapMeshProps {
    mesh: THREE.Mesh
    keyName: string
    isPressed: boolean
    onKeyPress: (key: string) => void
    onKeyRelease: (key: string) => void
}

export interface SwitchMeshProps {
    mesh: THREE.Mesh
    keyName: string
    isPressed: boolean
}

export interface KeycapData {
    mesh: THREE.Mesh
    keyName: string
}

export interface SwitchData {
    mesh: THREE.Mesh
    keyName: string
}

export interface ProcessedKeyboardData {
    processedKeyPositions: KeyPosition[]
    keycapMeshes: KeycapData[]
    switchMeshes: SwitchData[]
}

// Utility functions
export function extractKeyName(nodeName: string): string {
    if (nodeName === 'Keycap()') return '.'
    if (nodeName === 'Keycap()_1') return '/'

    const keycapMatch = nodeName.match(/Keycap\(([^)]+)\)/)
    if (keycapMatch) {
        return keycapMatch[1]
    }

    if (nodeName.startsWith('Keycap')) {
        return nodeName.replace('Keycap', '')
    }

    return ''
}