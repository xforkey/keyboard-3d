'use client'

import { useGLTF } from '@react-three/drei'
import { useEffect, useState } from 'react'
import * as THREE from 'three'

interface HierarchyNode {
    name: string
    type: string
    uuid: string
    position: [number, number, number] | null
    rotation: [number, number, number] | null
    scale: [number, number, number] | null
    visible: boolean
    userData: any
    geometry?: {
        type: string
        attributes: string[]
        vertexCount: number
    }
    material?: {
        type: string
        name: string
        color: string | null
    }
    childCount?: number
    children: HierarchyNode[]
}

interface FoundNode {
    name: string
    type: string
    path: string
    depth: number
    node: HierarchyNode
}

interface Analysis {
    timestamp: string
    glbFile: string
    summary: {
        totalNodes: number
        meshCount: number
        groupCount: number
        maxDepth: number
    }
    targetNodes: FoundNode[]
    fullHierarchy: HierarchyNode
}

function GLBAnalyzer() {
    const [analysis, setAnalysis] = useState<Analysis | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const gltf = useGLTF('/keyboard.glb')

    // Function to recursively map the hierarchy
    function mapHierarchy(object: THREE.Object3D, depth = 0): HierarchyNode {
        const result: HierarchyNode = {
            name: object.name || 'unnamed',
            type: object.constructor.name,
            uuid: object.uuid,
            position: object.position ? [object.position.x, object.position.y, object.position.z] : null,
            rotation: object.rotation ? [object.rotation.x, object.rotation.y, object.rotation.z] : null,
            scale: object.scale ? [object.scale.x, object.scale.y, object.scale.z] : null,
            visible: object.visible,
            userData: Object.keys(object.userData).length > 0 ? object.userData : null,
            children: []
        }

        // Add mesh-specific properties
        if (object instanceof THREE.Mesh) {
            result.geometry = {
                type: object.geometry.constructor.name,
                attributes: Object.keys(object.geometry.attributes),
                vertexCount: object.geometry.attributes.position ? object.geometry.attributes.position.count : 0
            }

            result.material = {
                type: object.material.constructor.name,
                name: (object.material as any).name || 'unnamed',
                color: (object.material as any).color ? (object.material as any).color.getHexString() : null
            }
        }

        // Add group-specific properties
        if (object instanceof THREE.Group) {
            result.childCount = object.children.length
        }

        // Recursively map children
        object.children.forEach(child => {
            result.children.push(mapHierarchy(child, depth + 1))
        })

        return result
    }

    // Function to find all nodes with specific names
    function findNodesByName(hierarchy: HierarchyNode, targetNames: string[]): FoundNode[] {
        const found: FoundNode[] = []

        function search(node: HierarchyNode, path: string[] = []) {
            const currentPath = [...path, node.name]

            if (targetNames.includes(node.name)) {
                found.push({
                    name: node.name,
                    type: node.type,
                    path: currentPath.join(' > '),
                    depth: currentPath.length - 1,
                    node: node
                })
            }

            node.children.forEach(child => {
                search(child, currentPath)
            })
        }

        search(hierarchy)
        return found
    }

    useEffect(() => {
        if (!gltf?.scene) return

        try {
            setLoading(true)
            console.log('GLB loaded successfully!')
            console.log('Scene children count:', gltf.scene.children.length)

            // Map the entire hierarchy
            const hierarchy = mapHierarchy(gltf.scene)

            // Find specific nodes we're interested in
            const targetNames = ['Cube', 'Cube.001', 'LCase', 'RCase', 'LPlate', 'RPlate']
            const foundNodes = findNodesByName(hierarchy, targetNames)

            // Create analysis report
            const analysisResult: Analysis = {
                timestamp: new Date().toISOString(),
                glbFile: 'keyboard.glb',
                summary: {
                    totalNodes: 0,
                    meshCount: 0,
                    groupCount: 0,
                    maxDepth: 0
                },
                targetNodes: foundNodes,
                fullHierarchy: hierarchy
            }

            // Count nodes and calculate stats
            function countNodes(node: HierarchyNode, depth = 0) {
                analysisResult.summary.totalNodes++
                analysisResult.summary.maxDepth = Math.max(analysisResult.summary.maxDepth, depth)

                if (node.type === 'Mesh') analysisResult.summary.meshCount++
                if (node.type === 'Group') analysisResult.summary.groupCount++

                node.children.forEach(child => countNodes(child, depth + 1))
            }

            countNodes(hierarchy)

            setAnalysis(analysisResult)
            setLoading(false)

            console.log('\n=== GLB HIERARCHY ANALYSIS ===')
            console.log(`Total nodes: ${analysisResult.summary.totalNodes}`)
            console.log(`Mesh count: ${analysisResult.summary.meshCount}`)
            console.log(`Group count: ${analysisResult.summary.groupCount}`)
            console.log(`Max depth: ${analysisResult.summary.maxDepth}`)

            console.log('\n=== TARGET NODES FOUND ===')
            foundNodes.forEach(node => {
                console.log(`${node.name} (${node.type}) - Path: ${node.path}`)
            })

        } catch (err) {
            console.error('Error analyzing GLB:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
            setLoading(false)
        }
    }, [gltf])

    const downloadJSON = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">GLB Hierarchy Analysis</h1>
                <p>Loading GLB file...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">GLB Hierarchy Analysis</h1>
                <p className="text-red-500">Error: {error}</p>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">GLB Hierarchy Analysis</h1>
                <p>No analysis data available</p>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">GLB Hierarchy Analysis</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-3">Summary</h2>
                    <div className="space-y-2">
                        <p><strong>Total Nodes:</strong> {analysis.summary.totalNodes}</p>
                        <p><strong>Mesh Count:</strong> {analysis.summary.meshCount}</p>
                        <p><strong>Group Count:</strong> {analysis.summary.groupCount}</p>
                        <p><strong>Max Depth:</strong> {analysis.summary.maxDepth}</p>
                        <p><strong>Analyzed:</strong> {new Date(analysis.timestamp).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-3">Target Nodes Found</h2>
                    <div className="space-y-2">
                        {analysis.targetNodes.length > 0 ? (
                            analysis.targetNodes.map((node, index) => (
                                <div key={index} className="text-sm">
                                    <strong>{node.name}</strong> ({node.type})
                                    <br />
                                    <span className="text-gray-600">Path: {node.path}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No target nodes found</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Download Analysis</h2>
                <div className="space-x-4">
                    <button
                        onClick={() => downloadJSON(analysis, 'glb-hierarchy-analysis.json')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Download Full Analysis
                    </button>
                    <button
                        onClick={() => downloadJSON({
                            timestamp: analysis.timestamp,
                            summary: analysis.summary,
                            targetNodes: analysis.targetNodes.map(node => ({
                                name: node.name,
                                type: node.type,
                                path: node.path,
                                depth: node.depth,
                                position: node.node.position,
                                children: node.node.children.map(child => ({
                                    name: child.name,
                                    type: child.type
                                }))
                            }))
                        }, 'glb-hierarchy-simplified.json')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Download Simplified
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">Full Hierarchy (JSON)</h2>
                <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded border">
                    {JSON.stringify(analysis.fullHierarchy, null, 2)}
                </pre>
            </div>
        </div>
    )
}

export default function AnalyzePage() {
    return <GLBAnalyzer />
}