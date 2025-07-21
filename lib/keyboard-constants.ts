// Keyboard layout constants
export const LAYERS = 3;
export const ROWS = 4;
export const COLS = 12;
export const TOTAL_KEYS = 42;

// Layer definitions
export const LAYER_NAMES = {
    BASE: '0',
    LOWER: '1',
    RAISE: '2'
} as const;

// Row and column ranges
export const ROW_RANGE = [0, 1, 2, 3] as const;
export const COL_RANGE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

// Special row configurations (row 3 has only 6 keys)
export const ROW_KEY_COUNTS = {
    0: 12,
    1: 12,
    2: 12,
    3: 6
} as const;