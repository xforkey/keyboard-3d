'use client';

import React from 'react';
import { Provider } from 'jotai';
import ZmkImport from '@/components/zmk-import';
import { useZmkState, useZmkLayers } from '@/lib/zmk-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ImportTestContent() {
    const state = useZmkState();
    const layers = useZmkLayers();

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">ZMK Keymap Import</h1>
                <p className="text-muted-foreground">
                    Import your ZMK keymap files and view the parsed results
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Import Component */}
                <div>
                    <ZmkImport
                        onImportSuccess={() => {
                            console.log('Import successful!');
                        }}
                        onImportError={(error) => {
                            console.error('Import error:', error);
                        }}
                    />
                </div>

                {/* Results Display */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Results</CardTitle>
                            <CardDescription>
                                View the parsed keymap data and current state
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {state.isLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <span className="ml-3">Loading...</span>
                                </div>
                            )}

                            {state.error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                    <p className="text-destructive font-medium">Error:</p>
                                    <p className="text-destructive/80 text-sm mt-1">{state.error}</p>
                                </div>
                            )}

                            {!state.isLoading && !state.error && layers.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No keymap loaded yet.</p>
                                    <p className="text-sm mt-1">Import a keymap file to see the results here.</p>
                                </div>
                            )}

                            {layers.length > 0 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Layers:</span> {layers.length}
                                        </div>
                                        <div>
                                            <span className="font-medium">Selected:</span>{' '}
                                            {state.selectedLayer || 'None'}
                                        </div>
                                    </div>

                                    {state.keymap && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Keymap Metadata:</h4>
                                            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                                                <div><strong>Name:</strong> {state.keymap.metadata.name}</div>
                                                <div><strong>Layout:</strong> {state.keymap.metadata.layout}</div>
                                                <div><strong>Version:</strong> {state.keymap.metadata.version}</div>
                                                <div><strong>Total Keys:</strong> {state.keymap.metadata.totalKeys}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="font-medium">Layers:</h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {layers.map((layer, index) => (
                                                <div
                                                    key={layer.id}
                                                    className={`border rounded-lg p-3 text-sm ${state.selectedLayer === layer.id
                                                            ? 'bg-primary/5 border-primary/20'
                                                            : 'bg-muted/50'
                                                        }`}
                                                >
                                                    <div className="font-medium">{layer.name}</div>
                                                    <div className="text-muted-foreground text-xs mt-1">
                                                        ID: {layer.id} | Keys: {Object.keys(layer.keys).length}
                                                    </div>

                                                    {/* Show first few key bindings as preview */}
                                                    <div className="mt-2 space-y-1">
                                                        {Object.entries(layer.keys)
                                                            .slice(0, 3)
                                                            .map(([keyId, binding]) => (
                                                                <div key={keyId} className="text-xs text-muted-foreground">
                                                                    {keyId}: {binding.label || binding.code} ({binding.type})
                                                                </div>
                                                            ))}
                                                        {Object.keys(layer.keys).length > 3 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ... and {Object.keys(layer.keys).length - 3} more keys
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Raw State Debug (for development) */}
                    {process.env.NODE_ENV === 'development' && layers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Debug: Raw State</CardTitle>
                                <CardDescription>Development view of the parsed state</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-48">
                                    {JSON.stringify(state, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ImportPage() {
    return (
        <Provider>
            <ImportTestContent />
        </Provider>
    );
}