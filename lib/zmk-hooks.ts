'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    layersAtom,
    keymapAtom,
    selectedKeyAtom,
    selectedLayerAtom,
    isLoadingAtom,
    errorAtom,
    zmkStateAtom,
    currentLayerAtom,
    getKeyBindingAtom,
    setBindingAtom,
    addLayerAtom,
    removeLayerAtom,
    selectKeyAtom,
    selectLayerAtom,
    loadKeymapAtom,
    setLoadingAtom,
    setErrorAtom,
    resetStateAtom,
} from './zmk-store';
import { Layer, Binding, KeymapConfig } from './keyboard-types';

// Read-only hooks for state
export function useZmkState() {
    return useAtomValue(zmkStateAtom);
}

export function useZmkLayers() {
    return useAtomValue(layersAtom);
}

export function useZmkKeymap() {
    return useAtomValue(keymapAtom);
}

export function useZmkSelectedKey() {
    return useAtomValue(selectedKeyAtom);
}

export function useZmkSelectedLayer() {
    return useAtomValue(selectedLayerAtom);
}

export function useZmkLoading() {
    return useAtomValue(isLoadingAtom);
}

export function useZmkError() {
    return useAtomValue(errorAtom);
}

export function useCurrentLayer() {
    return useAtomValue(currentLayerAtom);
}

// Hook for getting a specific key binding
export function useKeyBinding(layerId: string, keyId: string): Binding | null {
    return useAtomValue(getKeyBindingAtom(layerId, keyId));
}

// Action hooks
export function useZmkActions() {
    const setBinding = useSetAtom(setBindingAtom);
    const addLayer = useSetAtom(addLayerAtom);
    const removeLayer = useSetAtom(removeLayerAtom);
    const selectKey = useSetAtom(selectKeyAtom);
    const selectLayer = useSetAtom(selectLayerAtom);
    const loadKeymap = useSetAtom(loadKeymapAtom);
    const setLoading = useSetAtom(setLoadingAtom);
    const setError = useSetAtom(setErrorAtom);
    const resetState = useSetAtom(resetStateAtom);

    return {
        setBinding: (layerId: string, keyId: string, binding: Binding) => {
            setBinding({ layerId, keyId, binding });
        },
        addLayer: (name: string) => {
            addLayer(name);
        },
        removeLayer: (layerId: string) => {
            removeLayer(layerId);
        },
        selectKey: (keyId: string | null) => {
            selectKey(keyId);
        },
        selectLayer: (layerId: string | null) => {
            selectLayer(layerId);
        },
        loadKeymap: (keymap: KeymapConfig) => {
            loadKeymap(keymap);
        },
        setLoading: (isLoading: boolean) => {
            setLoading(isLoading);
        },
        setError: (error: string | null) => {
            setError(error);
        },
        resetState: () => {
            resetState();
        },
    };
}

// Individual action hooks for more granular usage
export function useSetBinding() {
    const setBinding = useSetAtom(setBindingAtom);
    return (layerId: string, keyId: string, binding: Binding) => {
        setBinding({ layerId, keyId, binding });
    };
}

export function useAddLayer() {
    const addLayer = useSetAtom(addLayerAtom);
    return (name: string) => {
        addLayer(name);
    };
}

export function useRemoveLayer() {
    const removeLayer = useSetAtom(removeLayerAtom);
    return (layerId: string) => {
        removeLayer(layerId);
    };
}

export function useSelectKey() {
    const selectKey = useSetAtom(selectKeyAtom);
    return (keyId: string | null) => {
        selectKey(keyId);
    };
}

export function useSelectLayer() {
    const selectLayer = useSetAtom(selectLayerAtom);
    return (layerId: string | null) => {
        selectLayer(layerId);
    };
}

export function useLoadKeymap() {
    const loadKeymap = useSetAtom(loadKeymapAtom);
    return (keymap: KeymapConfig) => {
        loadKeymap(keymap);
    };
}

export function useSetLoading() {
    const setLoading = useSetAtom(setLoadingAtom);
    return (isLoading: boolean) => {
        setLoading(isLoading);
    };
}

export function useSetError() {
    const setError = useSetAtom(setErrorAtom);
    return (error: string | null) => {
        setError(error);
    };
}

export function useResetState() {
    const resetState = useSetAtom(resetStateAtom);
    return () => {
        resetState();
    };
}

// Utility hooks for common patterns
export function useLayerById(layerId: string): Layer | null {
    const layers = useZmkLayers();
    return layers.find(layer => layer.id === layerId) || null;
}

export function useLayerKeys(layerId: string): Record<string, Binding> {
    const layer = useLayerById(layerId);
    return layer?.keys || {};
}

// Hook for managing layer selection with automatic fallback
export function useLayerSelection() {
    const [selectedLayer, setSelectedLayer] = useAtom(selectedLayerAtom);
    const layers = useZmkLayers();

    // Auto-select first layer if none selected and layers exist
    const effectiveSelectedLayer = selectedLayer || (layers.length > 0 ? layers[0].id : null);

    return {
        selectedLayer: effectiveSelectedLayer,
        setSelectedLayer,
        availableLayers: layers,
    };
}

// Hook for key selection with layer context
export function useKeySelection() {
    const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom);
    const { selectedLayer } = useLayerSelection();
    const layerKeys = useLayerKeys(selectedLayer || '');

    return {
        selectedKey,
        setSelectedKey,
        selectedLayer,
        availableKeys: Object.keys(layerKeys),
        selectedKeyBinding: selectedKey && selectedLayer ? layerKeys[selectedKey] : null,
    };
}