const fs = require('fs');
const path = require('path');

// Since we can't easily load GLB in Node.js without a complex setup,
// let's create a web-based script that can be run in the browser
const scriptContent = `
<!DOCTYPE html>
<html>
<head>
    <title>GLB Hierarchy Mapper</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
    <h1>GLB Hierarchy Analysis</h1>
    <div id="status">Loading...</div>
    <pre id="output"></pre>
    
    <script>
        // Function to recursively map the hierarchy
        function mapHierarchy(object, depth = 0) {
            const result = {
                name: object.name || 'unnamed',
                type: object.constructor.name,
                uuid: object.uuid,
                position: object.position ? [object.position.x, object.position.y, object.position.z] : null,
                rotation: object.rotation ? [object.rotation.x, object.rotation.y, object.rotation.z] : null,
                scale: object.scale ? [object.scale.x, object.scale.y, object.scale.z] : null,
                visible: object.visible,
                userData: Object.keys(object.userData).length > 0 ? object.userData : null,
                children: []
            };

            // Add mesh-specific properties
            if (object instanceof THREE.Mesh) {
                result.geometry = {
                    type: object.geometry.constructor.name,
                    attributes: Object.keys(object.geometry.attributes),
                    vertexCount: object.geometry.attributes.position ? object.geometry.attributes.position.count : 0
                };
                
                result.material = {
                    type: object.material.constructor.name,
                    name: object.material.name || 'unnamed',
                    color: object.material.color ? object.material.color.getHexString() : null
                };
            }

            // Add group-specific properties
            if (object instanceof THREE.Group) {
                result.childCount = object.children.length;
            }

            // Recursively map children
            object.children.forEach(child => {
                result.children.push(mapHierarchy(child, depth + 1));
            });

            return result;
        }

        // Function to find all nodes with specific names
        function findNodesByName(hierarchy, targetNames) {
            const found = [];
            
            function search(node, path = []) {
                const currentPath = [...path, node.name];
                
                if (targetNames.includes(node.name)) {
                    found.push({
                        name: node.name,
                        type: node.type,
                        path: currentPath.join(' > '),
                        depth: currentPath.length - 1,
                        node: node
                    });
                }
                
                node.children.forEach(child => {
                    search(child, currentPath);
                });
            }
            
            search(hierarchy);
            return found;
        }

        // Main function to load and analyze GLB
        async function analyzeGLB() {
            try {
                document.getElementById('status').textContent = 'Loading GLB file...';
                
                const loader = new THREE.GLTFLoader();
                
                // Load the GLB file
                const gltf = await new Promise((resolve, reject) => {
                    loader.load('./keyboard.glb', resolve, undefined, reject);
                });
                
                console.log('GLB loaded successfully!');
                console.log('Scene children count:', gltf.scene.children.length);
                
                // Map the entire hierarchy
                const hierarchy = mapHierarchy(gltf.scene);
                
                // Find specific nodes we're interested in
                const targetNames = ['Cube', 'Cube.001', 'LCase', 'RCase', 'LPlate', 'RPlate'];
                const foundNodes = findNodesByName(hierarchy, targetNames);
                
                // Create analysis report
                const analysis = {
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
                };
                
                // Count nodes and calculate stats
                function countNodes(node, depth = 0) {
                    analysis.summary.totalNodes++;
                    analysis.summary.maxDepth = Math.max(analysis.summary.maxDepth, depth);
                    
                    if (node.type === 'Mesh') analysis.summary.meshCount++;
                    if (node.type === 'Group') analysis.summary.groupCount++;
                    
                    node.children.forEach(child => countNodes(child, depth + 1));
                }
                
                countNodes(hierarchy);
                
                // Display results
                document.getElementById('status').textContent = 'Analysis complete!';
                
                const output = document.getElementById('output');
                output.textContent = JSON.stringify(analysis, null, 2);
                
                console.log('\\n=== GLB HIERARCHY ANALYSIS ===');
                console.log(\`Total nodes: \${analysis.summary.totalNodes}\`);
                console.log(\`Mesh count: \${analysis.summary.meshCount}\`);
                console.log(\`Group count: \${analysis.summary.groupCount}\`);
                console.log(\`Max depth: \${analysis.summary.maxDepth}\`);
                
                console.log('\\n=== TARGET NODES FOUND ===');
                foundNodes.forEach(node => {
                    console.log(\`\${node.name} (\${node.type}) - Path: \${node.path}\`);
                });
                
                // Create download link for the JSON
                const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'glb-hierarchy-analysis.json';
                a.textContent = 'Download Full Analysis JSON';
                a.style.display = 'block';
                a.style.marginTop = '20px';
                document.body.appendChild(a);
                
                // Also create a simplified version
                const simplifiedAnalysis = {
                    timestamp: analysis.timestamp,
                    summary: analysis.summary,
                    targetNodes: foundNodes.map(node => ({
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
                };
                
                const simplifiedBlob = new Blob([JSON.stringify(simplifiedAnalysis, null, 2)], { type: 'application/json' });
                const simplifiedUrl = URL.createObjectURL(simplifiedBlob);
                const simplifiedA = document.createElement('a');
                simplifiedA.href = simplifiedUrl;
                simplifiedA.download = 'glb-hierarchy-simplified.json';
                simplifiedA.textContent = 'Download Simplified Analysis JSON';
                simplifiedA.style.display = 'block';
                simplifiedA.style.marginTop = '10px';
                document.body.appendChild(simplifiedA);
                
            } catch (error) {
                console.error('Error analyzing GLB:', error);
                document.getElementById('status').textContent = 'Error: ' + error.message;
            }
        }

        // Run the analysis when page loads
        window.addEventListener('load', analyzeGLB);
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('./glb-hierarchy-mapper.html', scriptContent);
console.log('Created glb-hierarchy-mapper.html');
console.log('Open this file in your browser to analyze the GLB hierarchy.');
console.log('Make sure to serve it from a local server (like the Next.js dev server) to avoid CORS issues.');

// Function to recursively map the hierarchy
function mapHierarchy(object, depth = 0) {
    const result = {
        name: object.name || 'unnamed',
        type: object.constructor.name,
        uuid: object.uuid,
        position: object.position ? [object.position.x, object.position.y, object.position.z] : null,
        rotation: object.rotation ? [object.rotation.x, object.rotation.y, object.rotation.z] : null,
        scale: object.scale ? [object.scale.x, object.scale.y, object.scale.z] : null,
        visible: object.visible,
        userData: Object.keys(object.userData).length > 0 ? object.userData : null,
        children: []
    };

    // Add mesh-specific properties
    if (object instanceof THREE.Mesh) {
        result.geometry = {
            type: object.geometry.constructor.name,
            attributes: Object.keys(object.geometry.attributes),
            vertexCount: object.geometry.attributes.position ? object.geometry.attributes.position.count : 0
        };

        result.material = {
            type: object.material.constructor.name,
            name: object.material.name || 'unnamed',
            color: object.material.color ? object.material.color.getHexString() : null
        };
    }

    // Add group-specific properties
    if (object instanceof THREE.Group) {
        result.childCount = object.children.length;
    }

    // Recursively map children
    object.children.forEach(child => {
        result.children.push(mapHierarchy(child, depth + 1));
    });

    return result;
}

// Function to find all nodes with specific names
function findNodesByName(hierarchy, targetNames) {
    const found = [];

    function search(node, path = []) {
        const currentPath = [...path, node.name];

        if (targetNames.includes(node.name)) {
            found.push({
                name: node.name,
                type: node.type,
                path: currentPath.join(' > '),
                depth: currentPath.length - 1,
                node: node
            });
        }

        node.children.forEach(child => {
            search(child, currentPath);
        });
    }

    search(hierarchy);
    return found;
}

// Main function to load and analyze GLB
async function analyzeGLB() {
    try {
        console.log('Loading GLB file...');

        const loader = new GLTFLoader();
        const glbPath = path.resolve('./public/keyboard.glb');

        if (!fs.existsSync(glbPath)) {
            throw new Error(`GLB file not found at: ${glbPath}`);
        }

        // Load the GLB file
        const gltf = await new Promise((resolve, reject) => {
            loader.load(glbPath, resolve, undefined, reject);
        });

        console.log('GLB loaded successfully!');
        console.log('Scene children count:', gltf.scene.children.length);

        // Map the entire hierarchy
        const hierarchy = mapHierarchy(gltf.scene);

        // Find specific nodes we're interested in
        const targetNames = ['Cube', 'Cube.001', 'LCase', 'RCase', 'LPlate', 'RPlate'];
        const foundNodes = findNodesByName(hierarchy, targetNames);

        // Create analysis report
        const analysis = {
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
        };

        // Count nodes and calculate stats
        function countNodes(node, depth = 0) {
            analysis.summary.totalNodes++;
            analysis.summary.maxDepth = Math.max(analysis.summary.maxDepth, depth);

            if (node.type === 'Mesh') analysis.summary.meshCount++;
            if (node.type === 'Group') analysis.summary.groupCount++;

            node.children.forEach(child => countNodes(child, depth + 1));
        }

        countNodes(hierarchy);

        // Write the analysis to a JSON file
        const outputPath = './glb-hierarchy-analysis.json';
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

        console.log('\n=== GLB HIERARCHY ANALYSIS ===');
        console.log(`Total nodes: ${analysis.summary.totalNodes}`);
        console.log(`Mesh count: ${analysis.summary.meshCount}`);
        console.log(`Group count: ${analysis.summary.groupCount}`);
        console.log(`Max depth: ${analysis.summary.maxDepth}`);

        console.log('\n=== TARGET NODES FOUND ===');
        foundNodes.forEach(node => {
            console.log(`${node.name} (${node.type}) - Path: ${node.path}`);
        });

        console.log(`\nFull analysis saved to: ${outputPath}`);

        // Also create a simplified version focusing on our target nodes
        const simplifiedAnalysis = {
            timestamp: analysis.timestamp,
            summary: analysis.summary,
            targetNodes: foundNodes.map(node => ({
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
        };

        const simplifiedPath = './glb-hierarchy-simplified.json';
        fs.writeFileSync(simplifiedPath, JSON.stringify(simplifiedAnalysis, null, 2));
        console.log(`Simplified analysis saved to: ${simplifiedPath}`);

    } catch (error) {
        console.error('Error analyzing GLB:', error);
        process.exit(1);
    }
}

// Run the analysis
analyzeGLB();