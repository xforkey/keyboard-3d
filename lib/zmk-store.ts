'use client';

import { atom } from 'jotai';
import { Layer, Binding, KeymapConfig } from './keyboard-types';

// Base atoms for state
export const layersAtom = atom<Layer[]>([]);
export const keymapAtom = atom<KeymapConfig | null>(null);
export const selectedKeyAtom = atom<string | null>(null);
export const selectedLayerAtom = atom<string | null>(null);
export const isLoadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// Derived atom for getting a specific layer by ID
export const getLayerAtom = (layerId: string) =>
    atom((get) => {
        const layers = get(layersAtom);
        return layers.find(layer => layer.id === layerId) || null;
    });

// Derived atom for getting current layer (selected or first)
export const currentLayerAtom = atom((get) => {
    const layers = get(layersAtom);
    const selectedLayerId = get(selectedLayerAtom);

    if (!selectedLayerId) {
        return layers[0] || null;
    }

    return layers.find(l => l.id === selectedLayerId) || null;
});

// Derived atom for getting binding for a specific key in a layer
export const getKeyBindingAtom = (layerId: string, keyId: string) =>
    atom((get) => {
        const layers = get(layersAtom);
        const layer = layers.find(l => l.id === layerId);
        return layer?.keys[keyId] || null;
    });

// Write-only atoms for actions
export const setBindingAtom = atom(
    null,
    (get, set, { layerId, keyId, binding }: { layerId: string; keyId: string; binding: Binding }) => {
        const layers = get(layersAtom);
        const updatedLayers = layers.map(layer => {
            if (layer.id === layerId) {
                return {
                    ...layer,
                    keys: {
                        ...layer.keys,
                        [keyId]: binding,
                    },
                };
            }
            return layer;
        });

        set(layersAtom, updatedLayers);

        // Update keymap if it exists
        const keymap = get(keymapAtom);
        if (keymap) {
            set(keymapAtom, {
                ...keymap,
                layers: updatedLayers,
            });
        }

        set(errorAtom, null);
    }
);

export const addLayerAtom = atom(
    null,
    (get, set, name: string) => {
        const layers = get(layersAtom);
        const newLayerId = `layer_${Date.now()}`;

        const newLayer: Layer = {
            id: newLayerId,
            name,
            keys: {},
        };

        const updatedLayers = [...layers, newLayer];
        set(layersAtom, updatedLayers);

        // Update keymap if it exists
        const keymap = get(keymapAtom);
        if (keymap) {
            set(keymapAtom, {
                ...keymap,
                layers: updatedLayers,
            });
        }

        set(errorAtom, null);
    }
);

export const removeLayerAtom = atom(
    null,
    (get, set, layerId: string) => {
        const layers = get(layersAtom);

        // Don't allow removing the last layer
        if (layers.length <= 1) {
            set(errorAtom, 'Cannot remove the last layer');
            return;
        }

        const updatedLayers = layers.filter(layer => layer.id !== layerId);
        set(layersAtom, updatedLayers);

        // Update keymap if it exists
        const keymap = get(keymapAtom);
        if (keymap) {
            set(keymapAtom, {
                ...keymap,
                layers: updatedLayers,
            });
        }

        // Clear selected layer if it was the one being removed
        const selectedLayerId = get(selectedLayerAtom);
        if (selectedLayerId === layerId) {
            set(selectedLayerAtom, null);
        }

        set(errorAtom, null);
    }
);

export const loadKeymapAtom = atom(
    null,
    (get, set, keymap: KeymapConfig) => {
        set(keymapAtom, keymap);
        set(layersAtom, keymap.layers);
        set(isLoadingAtom, false);
        set(errorAtom, null);
    }
);

export const resetStateAtom = atom(
    null,
    (get, set) => {
        set(layersAtom, []);
        set(keymapAtom, null);
        set(selectedKeyAtom, null);
        set(selectedLayerAtom, null);
        set(isLoadingAtom, false);
        set(errorAtom, null);
    }
);

// Utility atoms for common operations
export const selectKeyAtom = atom(
    null,
    (get, set, keyId: string | null) => {
        set(selectedKeyAtom, keyId);
        set(errorAtom, null);
    }
);

export const selectLayerAtom = atom(
    null,
    (get, set, layerId: string | null) => {
        set(selectedLayerAtom, layerId);
        set(errorAtom, null);
    }
);

export const setLoadingAtom = atom(
    null,
    (get, set, isLoading: boolean) => {
        set(isLoadingAtom, isLoading);
    }
);

export const setErrorAtom = atom(
    null,
    (get, set, error: string | null) => {
        set(errorAtom, error);
        set(isLoadingAtom, false);
    }
);

// Combined state atom for convenience
export const zmkStateAtom = atom((get) => ({
    layers: get(layersAtom),
    keymap: get(keymapAtom),
    selectedKey: get(selectedKeyAtom),
    selectedLayer: get(selectedLayerAtom),
    isLoading: get(isLoadingAtom),
    error: get(errorAtom),
}));

// Action creators for easier usage
export const zmkActions = {
    setBinding: (layerId: string, keyId: string, binding: Binding) => ({
        atom: setBindingAtom,
        payload: { layerId, keyId, binding },
    }),

    addLayer: (name: string) => ({
        atom: addLayerAtom,
        payload: name,
    }),

    removeLayer: (layerId: string) => ({
        atom: removeLayerAtom,
        payload: layerId,
    }),

    selectKey: (keyId: string | null) => ({
        atom: selectKeyAtom,
        payload: keyId,
    }),

    selectLayer: (layerId: string | null) => ({
        atom: selectLayerAtom,
        payload: layerId,
    }),

    loadKeymap: (keymap: KeymapConfig) => ({
        atom: loadKeymapAtom,
        payload: keymap,
    }),

    setLoading: (isLoading: boolean) => ({
        atom: setLoadingAtom,
        payload: isLoading,
    }),

    setError: (error: string | null) => ({
        atom: setErrorAtom,
        payload: error,
    }),

    resetState: () => ({
        atom: resetStateAtom,
        payload: undefined,
    }),
};