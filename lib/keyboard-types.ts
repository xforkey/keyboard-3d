export type KeyData = {
    /** Unique key identifier — e.g., "L2_R3C1" or "key_31" */
    id: string;

    /** Layer this key belongs to (e.g., "0", "1", "2") */
    layer: string;

    /** Row and column position for layout logic */
    row: number;
    col: number;

    /** Binding for ZMK — e.g., "&kp A", "&mo 1", "&mt LSHIFT SPC" */
    binding: string;

    /** Optional label override for display (e.g., "⇪" for Caps Lock) */
    label?: string;

    /** 3D position vector in world/model space */
    position: [x: number, y: number, z: number];

    /** Quaternion rotation of the key (to account for angled columns etc.) */
    rotation: [x: number, y: number, z: number, w: number];

    /** Optional scale override (e.g., for ISO or wide keys) */
    scale?: [x: number, y: number, z: number];

    /** Mesh name or reference (if using named exports from Blender/GLTF) */
    meshName?: string;

    /** Whether the key is mirrored (for left/right split awareness) */
    side: 'left' | 'right';

    /** Optional metadata — tooltips, source file, legend overrides, etc. */
    meta?: Record<string, any>;
};

export type KeyboardLayoutData = {
    metadata: {
        name: string;
        description: string;
        version: string;
        created: string;
        layout: string;
        rows: number;
        columns: number;
        totalKeys: number;
    };
    keys: KeyData[];
};

export type KeyPosition = {
    position: [number, number, number];
    text: string;
    rotation: [number, number, number];
};

// Required Commit 1 types
export type Key = {
    id: string;
    row: number;
    col: number;
    position: [number, number, number];
    rotation: [number, number, number, number];
    side: 'left' | 'right';
    meshName?: string;
};

export type Layer = {
    id: string;
    name: string;
    keys: Record<string, Binding>;
};

export type Binding = {
    code: string;
    label?: string;
    type: 'keycode' | 'layer' | 'modifier' | 'combo';
};

export type KeymapConfig = {
    layers: Layer[];
    metadata: {
        name: string;
        version: string;
        layout: string;
        totalKeys: number;
    };
};