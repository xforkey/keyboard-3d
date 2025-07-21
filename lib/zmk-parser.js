"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBinding = parseBinding;
exports.normalizeLayout = normalizeLayout;
exports.parseKeymapFile = parseKeymapFile;
exports.validateKeymapFile = validateKeymapFile;
exports.getSupportedBindings = getSupportedBindings;
import { TOTAL_KEYS, ROWS, ROW_KEY_COUNTS } from "./keyboard-constants.js";
/**
 * ZMK Parser for loading and normalizing keymap.dtsi files
 * Handles parsing of ZMK keymap syntax and conversion to internal format
 */
// Common ZMK binding patterns
const ZMK_BINDING_PATTERNS = {
    keypress: /^&kp\s+([A-Z0-9_]+)$/i,
    momentary: /^&mo\s+(\d+)$/i,
    modTap: /^&mt\s+([A-Z0-9_]+)\s+([A-Z0-9_]+)$/i,
    layerTap: /^&lt\s+(\d+)\s+([A-Z0-9_]+)$/i,
    transparent: /^&trans$/i,
    none: /^&none$/i,
    toggle: /^&tog\s+(\d+)$/i,
    sticky: /^&sk\s+([A-Z0-9_]+)$/i,
    combo: /^&combo_([a-zA-Z0-9_]+)$/i,
};
// ZMK key code mappings to display labels
const ZMK_KEY_LABELS = {
    'TAB': '⇥',
    'BSPC': '⌫',
    'DEL': '⌦',
    'ESC': '⎋',
    'RET': '⏎',
    'ENTER': '⏎',
    'SPACE': '␣',
    'LSHIFT': '⇧',
    'RSHIFT': '⇧',
    'LCTRL': '⌃',
    'RCTRL': '⌃',
    'LALT': '⌥',
    'RALT': '⌥',
    'LGUI': '⌘',
    'RGUI': '⌘',
    'CAPS': '⇪',
    'CAPSLOCK': '⇪',
    'UP': '↑',
    'DOWN': '↓',
    'LEFT': '←',
    'RIGHT': '→',
    'HOME': '⇱',
    'END': '⇲',
    'PGUP': '⇞',
    'PGDN': '⇟',
    'SEMI': ';',
    'SQT': "'",
    'GRAVE': '`',
    'COMMA': ',',
    'DOT': '.',
    'FSLH': '/',
    'BSLH': '\\',
    'LBKT': '[',
    'RBKT': ']',
    'LBRC': '{',
    'RBRC': '}',
    'LPAR': '(',
    'RPAR': ')',
    'MINUS': '-',
    'EQUAL': '=',
    'PLUS': '+',
    'UNDER': '_',
    'EXCL': '!',
    'AT': '@',
    'HASH': '#',
    'DLLR': '$',
    'PRCNT': '%',
    'CARET': '^',
    'AMPS': '&',
    'STAR': '*',
    'KP_MULTIPLY': '*',
    'PIPE': '|',
    'TILDE': '~',
};
/**
 * Parse a ZMK binding string into internal Binding format
 */
function parseBinding(zmkBinding) {
    const binding = zmkBinding.trim();
    // Handle transparent keys
    if (ZMK_BINDING_PATTERNS.transparent.test(binding)) {
        return {
            code: 'TRANS',
            label: '▽',
            type: 'keycode'
        };
    }
    // Handle none/empty keys
    if (ZMK_BINDING_PATTERNS.none.test(binding)) {
        return {
            code: 'NONE',
            label: '',
            type: 'keycode'
        };
    }
    // Handle keypress bindings (&kp KEY)
    const keypressMatch = binding.match(ZMK_BINDING_PATTERNS.keypress);
    if (keypressMatch) {
        const keyCode = keypressMatch[1].toUpperCase();
        return {
            code: keyCode,
            label: ZMK_KEY_LABELS[keyCode] || keyCode,
            type: 'keycode'
        };
    }
    // Handle momentary layer bindings (&mo LAYER)
    const momentaryMatch = binding.match(ZMK_BINDING_PATTERNS.momentary);
    if (momentaryMatch) {
        const layerNum = momentaryMatch[1];
        return {
            code: `MO(${layerNum})`,
            label: `L${layerNum}`,
            type: 'layer'
        };
    }
    // Handle mod-tap bindings (&mt MOD KEY)
    const modTapMatch = binding.match(ZMK_BINDING_PATTERNS.modTap);
    if (modTapMatch) {
        const modifier = modTapMatch[1].toUpperCase();
        const key = modTapMatch[2].toUpperCase();
        const modLabel = ZMK_KEY_LABELS[modifier] || modifier;
        const keyLabel = ZMK_KEY_LABELS[key] || key;
        return {
            code: `MT(${modifier}, ${key})`,
            label: `${modLabel}/${keyLabel}`,
            type: 'modifier'
        };
    }
    // Handle layer-tap bindings (&lt LAYER KEY)
    const layerTapMatch = binding.match(ZMK_BINDING_PATTERNS.layerTap);
    if (layerTapMatch) {
        const layerNum = layerTapMatch[1];
        const key = layerTapMatch[2].toUpperCase();
        const keyLabel = ZMK_KEY_LABELS[key] || key;
        return {
            code: `LT(${layerNum}, ${key})`,
            label: `L${layerNum}/${keyLabel}`,
            type: 'layer'
        };
    }
    // Handle toggle layer bindings (&tog LAYER)
    const toggleMatch = binding.match(ZMK_BINDING_PATTERNS.toggle);
    if (toggleMatch) {
        const layerNum = toggleMatch[1];
        return {
            code: `TG(${layerNum})`,
            label: `TG${layerNum}`,
            type: 'layer'
        };
    }
    // Handle sticky key bindings (&sk MOD)
    const stickyMatch = binding.match(ZMK_BINDING_PATTERNS.sticky);
    if (stickyMatch) {
        const modifier = stickyMatch[1].toUpperCase();
        const modLabel = ZMK_KEY_LABELS[modifier] || modifier;
        return {
            code: `SK(${modifier})`,
            label: `SK(${modLabel})`,
            type: 'modifier'
        };
    }
    // Handle combo bindings
    const comboMatch = binding.match(ZMK_BINDING_PATTERNS.combo);
    if (comboMatch) {
        const comboName = comboMatch[1];
        return {
            code: `COMBO_${comboName.toUpperCase()}`,
            label: comboName,
            type: 'combo'
        };
    }
    // Fallback for unknown bindings
    return {
        code: binding,
        label: binding,
        type: 'keycode'
    };
}
/**
 * Extract layer definitions from ZMK keymap content
 */
function extractLayers(content) {
    const layers = [];
    // Remove comments and normalize whitespace
    const cleanContent = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    // Find keymap block
    const keymapMatch = cleanContent.match(/keymap\s*\{([^}]+)\}/);
    if (!keymapMatch) {
        throw new Error('No keymap block found in file');
    }
    const keymapContent = keymapMatch[1];
    // Extract individual layers
    const layerRegex = /(\w+)\s*\{[^}]*bindings\s*=\s*<([^>]+)>/g;
    let layerMatch;
    while ((layerMatch = layerRegex.exec(keymapContent)) !== null) {
        const layerName = layerMatch[1];
        const bindingsContent = layerMatch[2];
        // Parse bindings - match complete binding patterns like "&kp TAB", "&mo 1", etc.
        const bindingRegex = /&[a-zA-Z_]+(?:\s+[A-Z0-9_]+)*(?:\s+[A-Z0-9_]+)*/g;
        const bindings = bindingsContent.match(bindingRegex) || [];
        layers.push({
            name: layerName,
            bindings
        });
    }
    return layers;
}
/**
 * Normalize split keyboard layout into flat 42-key structure
 * Converts from ZMK's row-based layout to our column-major format
 */
function normalizeLayout(layers) {
    const normalizedLayers = [];
    layers.forEach((layer, layerIndex) => {
        const keys = {};
        // Validate binding count
        if (layer.bindings.length !== TOTAL_KEYS) {
            throw new Error(`Layer "${layer.name}" has ${layer.bindings.length} bindings, expected ${TOTAL_KEYS}`);
        }
        // Map bindings to key positions
        // ZMK uses row-major order: [row0_col0, row0_col1, ..., row0_col11, row1_col0, ...]
        let bindingIndex = 0;
        for (let row = 0; row < ROWS; row++) {
            const keysInRow = ROW_KEY_COUNTS[row];
            for (let col = 0; col < keysInRow; col++) {
                // Skip middle columns for bottom row (thumb keys are at specific positions)
                if (row === 3) {
                    // Bottom row has 6 keys: 3 left thumb keys (cols 0-2) and 3 right thumb keys (cols 3-5)
                    // But we map them to cols 0,1,2 and 9,10,11 in our 12-column layout
                    let actualCol = col;
                    if (col >= 3) {
                        actualCol = col + 6; // Map right thumb keys to cols 9,10,11
                    }
                    const keyId = `L${layerIndex}_R${row}C${actualCol}`;
                    const binding = parseBinding(layer.bindings[bindingIndex]);
                    keys[keyId] = binding;
                }
                else {
                    // Regular rows use all 12 columns
                    const keyId = `L${layerIndex}_R${row}C${col}`;
                    const binding = parseBinding(layer.bindings[bindingIndex]);
                    keys[keyId] = binding;
                }
                bindingIndex++;
            }
        }
        normalizedLayers.push({
            id: layerIndex.toString(),
            name: layer.name,
            keys
        });
    });
    return normalizedLayers;
}
/**
 * Parse ZMK keymap file content and return KeymapConfig
 */
function parseKeymapFile(content) {
    try {
        // Extract layers from the keymap content
        const rawLayers = extractLayers(content);
        if (rawLayers.length === 0) {
            throw new Error('No layers found in keymap file');
        }
        // Normalize the layout
        const layers = normalizeLayout(rawLayers);
        // Create metadata
        const metadata = {
            name: 'Parsed ZMK Keymap',
            version: '1.0.0',
            layout: 'ZMK',
            totalKeys: TOTAL_KEYS
        };
        return {
            layers,
            metadata
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to parse keymap file: ${error.message}`);
        }
        throw new Error('Failed to parse keymap file: Unknown error');
    }
}
/**
 * Validate keymap file format
 */
function validateKeymapFile(content) {
    const errors = [];
    try {
        // Check for basic ZMK structure
        if (!content.includes('keymap')) {
            errors.push('Missing keymap block');
        }
        if (!content.includes('bindings')) {
            errors.push('Missing bindings definition');
        }
        // Try to extract layers
        const layers = extractLayers(content);
        if (layers.length === 0) {
            errors.push('No layers found');
        }
        // Validate each layer
        layers.forEach((layer, index) => {
            if (layer.bindings.length !== TOTAL_KEYS) {
                errors.push(`Layer ${index} ("${layer.name}") has ${layer.bindings.length} bindings, expected ${TOTAL_KEYS}`);
            }
            // Check for invalid bindings
            layer.bindings.forEach((binding, bindingIndex) => {
                if (!binding || binding.trim().length === 0) {
                    errors.push(`Layer ${index} has empty binding at position ${bindingIndex}`);
                }
            });
        });
    }
    catch (error) {
        if (error instanceof Error) {
            errors.push(error.message);
        }
        else {
            errors.push('Unknown validation error');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Get supported ZMK binding types
 */
function getSupportedBindings() {
    return [
        '&kp KEY - Keypress',
        '&mo LAYER - Momentary layer',
        '&mt MOD KEY - Mod-tap',
        '&lt LAYER KEY - Layer-tap',
        '&tog LAYER - Toggle layer',
        '&sk MOD - Sticky key',
        '&trans - Transparent',
        '&none - No operation'
    ];
}
