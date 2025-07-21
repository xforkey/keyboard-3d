'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useZmkActions } from '@/lib/zmk-hooks';
import { parseKeymapFile, validateKeymapFile } from '@/lib/zmk-parser';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ZmkImportProps {
    onImportSuccess?: () => void;
    onImportError?: (error: string) => void;
}

export default function ZmkImport({ onImportSuccess, onImportError }: ZmkImportProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [textContent, setTextContent] = useState('');
    const [importStatus, setImportStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const actions = useZmkActions();

    // File size limit (1MB)
    const MAX_FILE_SIZE = 1024 * 1024;

    const clearStatus = useCallback(() => {
        setImportStatus({ type: null, message: '' });
    }, []);

    const handleImportError = useCallback((error: string) => {
        setImportStatus({ type: 'error', message: error });
        setIsLoading(false);
        onImportError?.(error);
    }, [onImportError]);

    const handleImportSuccess = useCallback(() => {
        setImportStatus({
            type: 'success',
            message: 'ZMK keymap imported successfully!'
        });
        setIsLoading(false);
        setTextContent('');
        onImportSuccess?.();
    }, [onImportSuccess]);

    const processKeymapContent = useCallback(async (content: string) => {
        if (!content.trim()) {
            handleImportError('No content provided');
            return;
        }

        setIsLoading(true);
        clearStatus();

        try {
            // Validate the keymap content first
            const validation = validateKeymapFile(content);
            if (!validation.valid) {
                handleImportError(`Invalid keymap format: ${validation.errors.join(', ')}`);
                return;
            }

            // Parse the keymap content
            const keymapConfig = parseKeymapFile(content);

            // Load into the store
            actions.loadKeymap(keymapConfig);

            handleImportSuccess();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            handleImportError(`Failed to parse keymap: ${errorMessage}`);
        }
    }, [actions, handleImportError, handleImportSuccess, clearStatus]);

    const handleFileRead = useCallback((file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            handleImportError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            processKeymapContent(content);
        };
        reader.onerror = () => {
            handleImportError('Failed to read file');
        };
        reader.readAsText(file);
    }, [processKeymapContent, handleImportError]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file =>
            file.name.endsWith('.keymap') ||
            file.name.endsWith('.dtsi') ||
            file.type === 'text/plain'
        );

        if (validFiles.length === 0) {
            handleImportError('Please drop a .keymap or .dtsi file');
            return;
        }

        if (validFiles.length > 1) {
            handleImportError('Please drop only one file at a time');
            return;
        }

        handleFileRead(validFiles[0]);
    }, [handleFileRead, handleImportError]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileRead(file);
        }
        // Reset the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFileRead]);

    const handleTextImport = useCallback(() => {
        processKeymapContent(textContent);
    }, [textContent, processKeymapContent]);

    const handleBrowseFiles = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Import ZMK Keymap
                    </CardTitle>
                    <CardDescription>
                        Upload a .keymap or .dtsi file, or paste the raw keymap content below
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* File Upload Area */}
                    <div
                        className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }
              ${isLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">
                                    {isDragOver ? 'Drop your file here' : 'Drag and drop your keymap file'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Supports .keymap and .dtsi files (max {MAX_FILE_SIZE / 1024 / 1024}MB)
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleBrowseFiles}
                                disabled={isLoading}
                            >
                                Browse Files
                            </Button>
                        </div>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".keymap,.dtsi,.txt"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    {/* Text Area Input */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <label className="text-sm font-medium">Or paste raw keymap content:</label>
                        </div>
                        <Textarea
                            placeholder="Paste your ZMK keymap content here..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="min-h-32 font-mono text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleTextImport}
                            disabled={!textContent.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Importing...' : 'Import from Text'}
                        </Button>
                    </div>

                    {/* Status Messages */}
                    {importStatus.type && (
                        <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'}>
                            {importStatus.type === 'error' ? (
                                <AlertCircle className="h-4 w-4" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            <AlertTitle>
                                {importStatus.type === 'error' ? 'Import Failed' : 'Import Successful'}
                            </AlertTitle>
                            <AlertDescription>
                                {importStatus.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Processing keymap...</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Supported Formats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• <strong>.keymap files:</strong> Standard ZMK keymap files</p>
                        <p>• <strong>.dtsi files:</strong> Device tree source include files</p>
                        <p>• <strong>Raw text:</strong> Copy and paste keymap content directly</p>
                        <p className="mt-3 text-xs">
                            The keymap must contain a valid <code>keymap</code> block with layer definitions and bindings.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}