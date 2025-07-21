'use client';

import React, { useState, useRef } from 'react';
import { Provider } from 'jotai';
import KeyboardViewer from '@/components/keyboard-viewer';
import { useZmkState, useZmkLayers, useZmkActions } from '@/lib/zmk-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseKeymapFile, validateKeymapFile } from '@/lib/zmk-parser';
import { Upload, FileText, AlertCircle, CheckCircle2, Settings } from 'lucide-react';

const KEYBOARD_COLOR = '#fdc700';

function ConfigCard() {
  const state = useZmkState();
  const layers = useZmkLayers();
  const actions = useZmkActions();
  const [showImport, setShowImport] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadDefault = () => {
    // Load a basic default keymap for testing
    const defaultKeymap = {
      layers: [
        {
          id: '0',
          name: 'Default',
          keys: {
            'L0_R0C0': { code: '&kp TAB', label: '⇥', type: 'keycode' as const },
            'L0_R0C1': { code: '&kp Q', label: 'Q', type: 'keycode' as const },
            'L0_R0C2': { code: '&kp W', label: 'W', type: 'keycode' as const },
            'L0_R0C3': { code: '&kp E', label: 'E', type: 'keycode' as const },
            'L0_R0C4': { code: '&kp R', label: 'R', type: 'keycode' as const },
            'L0_R0C5': { code: '&kp T', label: 'T', type: 'keycode' as const },
          }
        }
      ],
      metadata: {
        name: 'Default Keymap',
        version: '1.0.0',
        layout: 'corne',
        totalKeys: 42
      }
    };
    actions.loadKeymap(defaultKeymap);
    setImportStatus({ type: 'success', message: 'Default keymap loaded!' });
  };

  const processKeymapContent = async (content: string) => {
    if (!content.trim()) {
      setImportStatus({ type: 'error', message: 'No content provided' });
      return;
    }

    setIsLoading(true);
    setImportStatus({ type: null, message: '' });

    try {
      const validation = validateKeymapFile(content);
      if (!validation.valid) {
        setImportStatus({ type: 'error', message: `Invalid keymap: ${validation.errors.join(', ')}` });
        setIsLoading(false);
        return;
      }

      const keymapConfig = parseKeymapFile(content);
      actions.loadKeymap(keymapConfig);
      setImportStatus({ type: 'success', message: 'Keymap imported successfully!' });
      setTextContent('');
      setShowImport(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportStatus({ type: 'error', message: `Parse error: ${errorMessage}` });
    }
    setIsLoading(false);
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processKeymapContent(content);
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Failed to read file' });
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // No keymap loaded state
  if (layers.length === 0 && !state.isLoading) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Get Started
          </CardTitle>
          <CardDescription>
            Load a keymap to begin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showImport ? (
            <div className="space-y-3">
              <Button onClick={handleLoadDefault} className="w-full">
                Use Default Layout
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
                className="w-full"
              >
                Import ZMK Config
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".keymap,.dtsi,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Or paste content:
                </label>
                <Textarea
                  placeholder="Paste ZMK keymap content..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-20 text-xs font-mono"
                  disabled={isLoading}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => processKeymapContent(textContent)}
                    disabled={!textContent.trim() || isLoading}
                    size="sm"
                    className="flex-1"
                  >
                    {isLoading ? 'Importing...' : 'Import'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImport(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {importStatus.type && (
            <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
              {importStatus.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription className="text-sm">
                {importStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Keymap loaded state
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration
        </CardTitle>
        <CardDescription>
          {state.keymap?.metadata.name || 'Loaded Keymap'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Layers:</span>
            <div className="font-medium">{layers.length}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Keys:</span>
            <div className="font-medium">{state.keymap?.metadata.totalKeys || 0}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Layers:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`text-xs p-2 rounded border ${state.selectedLayer === layer.id
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted/50'
                  }`}
              >
                <div className="font-medium">{layer.name}</div>
                <div className="text-muted-foreground">
                  {Object.keys(layer.keys).length} keys
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
            size="sm"
            className="w-full"
          >
            Import New Config
          </Button>
          <Button
            variant="outline"
            onClick={actions.resetState}
            size="sm"
            className="w-full"
          >
            Reset
          </Button>
        </div>

        {showImport && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="w-full"
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".keymap,.dtsi,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Or paste content..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="min-h-16 text-xs font-mono"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => processKeymapContent(textContent)}
                  disabled={!textContent.trim() || isLoading}
                  size="sm"
                  className="flex-1"
                >
                  {isLoading ? 'Importing...' : 'Import'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImport(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {importStatus.type && (
          <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
            {importStatus.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription className="text-sm">
              {importStatus.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function HomeContent() {
  return (
    <div className="relative min-h-screen">
      {/* Config Card - positioned in upper left */}
      <div className="absolute top-4 left-4 z-10">
        <ConfigCard />
      </div>

      {/* 3D Keyboard Viewer - full screen */}
      <KeyboardViewer keyboardColor={KEYBOARD_COLOR} />
    </div>
  );
}

export default function Home() {
  return (
    <Provider>
      <HomeContent />
    </Provider>
  );
}
