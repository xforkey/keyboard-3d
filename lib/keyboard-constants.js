"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROW_KEY_COUNTS = exports.COL_RANGE = exports.ROW_RANGE = exports.LAYER_NAMES = exports.TOTAL_KEYS = exports.COLS = exports.ROWS = exports.LAYERS = void 0;
// Keyboard layout constants
exports.LAYERS = 3;
exports.ROWS = 4;
exports.COLS = 12;
exports.TOTAL_KEYS = 42;
// Layer definitions
exports.LAYER_NAMES = {
    BASE: '0',
    LOWER: '1',
    RAISE: '2'
};
// Row and column ranges
exports.ROW_RANGE = [0, 1, 2, 3];
exports.COL_RANGE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// Special row configurations (row 3 has only 6 keys)
exports.ROW_KEY_COUNTS = {
    0: 12,
    1: 12,
    2: 12,
    3: 6
};
