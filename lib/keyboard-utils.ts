import { KeyData, KeyboardLayoutData, Key, KeymapConfig, Layer, Binding } from './keyboard-types';
import keyboardLayoutData from './keyboard-layout-data.json';

// Type assertion for the imported JSON data with proper casting
const typedKeyboardData = keyboardLayoutData as unknown as KeyboardLayoutData;

/**
 * Get all keyboard layout data
 */
export function getKeyboardLayoutData(): KeyboardLayoutData {
    return typedKeyboardData;
}

/**
 * Get a specific key by its ID
 */
export function getKeyById(id: string): KeyData | undefined {
    return typedKeyboardData.keys.find(key => key.id === id);
}

/**
 * Get keys by row
 */
export function getKeysByRow(row: number): KeyData[] {
    return typedKeyboardData.keys.filter(key => key.row === row);
}

/**
 * Get keys by column
 */
export function getKeysByColumn(col: number): KeyData[] {
    return typedKeyboardData.keys.filter(key => key.col === col);
}

/**
 * Get keys by side (left/right)
 */
export function getKeysBySide(side: 'left' | 'right'): KeyData[] {
    return typedKeyboardData.keys.filter(key => key.side === side);
}

/**
 * Get keys by layer
 */
export function getKeysByLayer(layer: string): KeyData[] {
    return typedKeyboardData.keys.filter(key => key.layer === layer);
}

/**
 * Get key by row and column position
 */
export function getKeyByPosition(row: number, col: number): KeyData | undefined {
    return typedKeyboardData.keys.find(key => key.row === row && key.col === col);
}

/**
 * Get key by mesh name
 */
export function getKeyByMeshName(meshName: string): KeyData | undefined {
    return typedKeyboardData.keys.find(key => key.meshName === meshName);
}

/**
 * Convert key position from model space to world space (applying scale factor)
 */
export function getWorldPosition(key: KeyData, scaleFactor: number = 0.1): [number, number, number] {
    return [
        key.position[0] * scaleFactor,
        key.position[1] * scaleFactor,
        key.position[2] * scaleFactor
    ];
}

/**
 * Get all keys in a specific layout pattern (useful for rendering)
 */
export function getKeysInLayoutOrder(): KeyData[][] {
    const layout: KeyData[][] = [];

    for (let row = 0; row < typedKeyboardData.metadata.rows; row++) {
        const rowKeys: KeyData[] = [];
        const maxCols = row === 3 ? 6 : typedKeyboardData.metadata.columns; // Row 3 only has 6 keys

        for (let col = 0; col < maxCols; col++) {
            const key = getKeyByPosition(row, col);
            if (key) {
                rowKeys.push(key);
            }
        }
        layout.push(rowKeys);
    }

    return layout;
}

/**
 * Get keyboard statistics
 */
export function getKeyboardStats() {
    const keys = typedKeyboardData.keys;
    const leftKeys = getKeysBySide('left');
    const rightKeys = getKeysBySide('right');

    return {
        totalKeys: keys.length,
        leftKeys: leftKeys.length,
        rightKeys: rightKeys.length,
        rows: typedKeyboardData.metadata.rows,
        columns: typedKeyboardData.metadata.columns,
        layout: typedKeyboardData.metadata.layout,
        version: typedKeyboardData.metadata.version
    };
}

/**
 * Validate keyboard layout data
 */
export function validateKeyboardLayout(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const keys = typedKeyboardData.keys;

    // Check for duplicate IDs
    const ids = keys.map(key => key.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
        errors.push(`Duplicate key IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for duplicate positions
    const positions = keys.map(key => `${key.row},${key.col}`);
    const duplicatePositions = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    if (duplicatePositions.length > 0) {
        errors.push(`Duplicate key positions found: ${duplicatePositions.join(', ')}`);
    }

    // Check row/column bounds
    keys.forEach(key => {
        if (key.row < 0 || key.row >= typedKeyboardData.metadata.rows) {
            errors.push(`Key ${key.id} has invalid row: ${key.row}`);
        }

        const maxCols = key.row === 3 ? 6 : typedKeyboardData.metadata.columns;
        if (key.col < 0 || key.col >= maxCols) {
            errors.push(`Key ${key.id} has invalid column: ${key.col}`);
        }
    });

    // Check required fields
    keys.forEach(key => {
        if (!key.id || !key.binding || !key.position || !key.rotation) {
            errors.push(`Key ${key.id || 'unknown'} is missing required fields`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Required Commit 1 utility functions

/**
 * Generate a unique key ID based on layer, row, and column
 */
export function getKeyId(layer: number | string, row: number, col: number): string {
    return `L${layer}_R${row}C${col}`;
}

/**
 * Get key position data by row and column
 */
export function getKeyPosition(row: number, col: number): Key | undefined {
    const keyData = getKeyByPosition(row, col);
    if (!keyData) return undefined;

    return {
        id: keyData.id,
        row: keyData.row,
        col: keyData.col,
        position: keyData.position,
        rotation: keyData.rotation,
        side: keyData.side,
        meshName: keyData.meshName
    };
}

/**
 * Get default keymap configuration
 */
export function getDefaultKeymap(): KeymapConfig {
    const baseLayer: Layer = {
        id: '0',
        name: 'Base',
        keys: {}
    };

    // Populate base layer with default bindings from layout data
    typedKeyboardData.keys.forEach(key => {
        if (key.layer === '0') {
            baseLayer.keys[key.id] = {
                code: key.binding,
                label: key.label,
                type: getBindingType(key.binding)
            };
        }
    });

    return {
        layers: [baseLayer],
        metadata: {
            name: typedKeyboardData.metadata.name,
            version: typedKeyboardData.metadata.version,
            layout: typedKeyboardData.metadata.layout,
            totalKeys: typedKeyboardData.metadata.totalKeys
        }
    };
}

/**
 * Helper function to determine binding type
 */
function getBindingType(binding: string): Binding['type'] {
    if (binding.startsWith('&kp ')) return 'keycode';
    if (binding.startsWith('&mo ') || binding.startsWith('&lt ')) return 'layer';
    if (binding.startsWith('&mt ')) return 'modifier';
    return 'combo';
}