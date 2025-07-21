'use client';

import React, { useEffect } from 'react';
import { Provider } from 'jotai';
import { useZmkActions, useZmkState, useZmkLayers } from '@/lib/zmk-hooks';
import { KeymapConfig, Binding } from '@/lib/keyboard-types';

// Test component that uses the ZMK Jotai store
function ZmkTestContent() {
    const state = useZmkState();
    const layers = useZmkLayers();
    const actions = useZmkActions();

    // Initialize with test data
    useEffect(() => {
        const initialKeymap: KeymapConfig = {
            layers: [
                {
                    id: 'default',
                    name: 'Default',
                    keys: {
                        'key_0': {
                            code: '&kp Q',
                            label: 'Q',
                            type: 'keycode',
                        },
                        'key_1': {
                            code: '&kp W',
                            label: 'W',
                            type: 'keycode',
                        },
                    },
                },
            ],
            metadata: {
                name: 'Test Keymap',
                version: '1.0.0',
                layout: 'corne',
                totalKeys: 42,
            },
        };

        // Only load if no layers exist
        if (layers.length === 0) {
            actions.loadKeymap(initialKeymap);
        }
    }, [layers.length, actions]);

    const handleAddLayer = () => {
        actions.addLayer(`Layer ${layers.length + 1}`);
    };

    const handleSetBinding = () => {
        if (layers.length > 0) {
            const testBinding: Binding = {
                code: '&kp A',
                label: 'A',
                type: 'keycode',
            };
            actions.setBinding(layers[0].id, 'test_key', testBinding);
        }
    };

    const handleSelectKey = () => {
        actions.selectKey('test_key');
    };

    const handleRemoveLayer = () => {
        if (layers.length > 1) {
            actions.removeLayer(layers[layers.length - 1].id);
        }
    };

    const handleSelectLayer = () => {
        if (layers.length > 0) {
            const currentSelected = state.selectedLayer;
            const nextIndex = currentSelected
                ? (layers.findIndex(l => l.id === currentSelected) + 1) % layers.length
                : 0;
            actions.selectLayer(layers[nextIndex].id);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">ZMK Jotai Store Test</h2>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">State:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(state, null, 2)}
                </pre>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handleAddLayer}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Add Layer
                </button>

                <button
                    onClick={handleRemoveLayer}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    disabled={layers.length <= 1}
                >
                    Remove Last Layer
                </button>

                <button
                    onClick={handleSetBinding}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    disabled={layers.length === 0}
                >
                    Set Test Binding
                </button>

                <button
                    onClick={handleSelectKey}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Select Test Key
                </button>

                <button
                    onClick={handleSelectLayer}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                    disabled={layers.length === 0}
                >
                    Cycle Layer Selection
                </button>

                <button
                    onClick={actions.resetState}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Reset State
                </button>
            </div>

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                    Layers ({layers.length})
                    {state.selectedLayer && (
                        <span className="text-sm text-blue-600 ml-2">
                            (Selected: {layers.find(l => l.id === state.selectedLayer)?.name})
                        </span>
                    )}
                </h3>
                {layers.map((layer) => (
                    <div
                        key={layer.id}
                        className={`p-2 rounded border ${state.selectedLayer === layer.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className="font-medium">{layer.name}</div>
                        <div className="text-sm text-gray-600">
                            ID: {layer.id} | Keys: {Object.keys(layer.keys).length}
                        </div>
                        {Object.entries(layer.keys).map(([keyId, binding]) => (
                            <div
                                key={keyId}
                                className={`text-xs ml-2 ${state.selectedKey === keyId
                                    ? 'text-purple-600 font-medium'
                                    : 'text-gray-500'
                                    }`}
                            >
                                {keyId}: {binding.code} ({binding.type})
                                {binding.label && ` - "${binding.label}"`}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {state.selectedKey && (
                <div className="bg-yellow-100 p-2 rounded">
                    <strong>Selected Key:</strong> {state.selectedKey}
                </div>
            )}

            {state.error && (
                <div className="bg-red-100 p-2 rounded text-red-700">
                    <strong>Error:</strong> {state.error}
                </div>
            )}

            {state.isLoading && (
                <div className="bg-blue-100 p-2 rounded text-blue-700">
                    <strong>Loading...</strong>
                </div>
            )}
        </div>
    );
}

// Main test component with Jotai provider
export default function ZmkTest() {
    return (
        <Provider>
            <ZmkTestContent />
        </Provider>
    );
}