// --- PHASE 1: DATA MODELING (The Navigable Graph) ---

// 1. Define NODES (Locations and Coordinates)
const NODES = {};

// Helper function to create the nodes for a single floor
const createFloorNodes = (floorNum, zCoord) => {
    const p = String(floorNum);
    
    // Normalize Y-coordinate to fit the viewable area (350px container height)
    // Scale factor adjusted for a better floor layout within the 350px height
    const normalizeY = (desmosY) => 350 - (desmosY * 6.5); 

    return {
        // Classrooms (Spread across the X-axis for visualization)
        [`${p}01`]: { x: 500, y: normalizeY(20), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}03`]: { x: 500, y: normalizeY(5), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}04`]: { x: 450, y: normalizeY(5), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}05`]: { x: 300, y: normalizeY(5), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}06`]: { x: 200, y: normalizeY(5), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}07`]: { x: 0, y: normalizeY(5), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}08`]: { x: 20, y: normalizeY(20), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}09`]: { x: 50, y: normalizeY(30), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}10`]: { x: 20, y: normalizeY(40), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}11`]: { x: 0, y: normalizeY(50), z: zCoord, floor: floorNum, tags: ['classroom'] },
        [`${p}12`]: { x: 50, y: normalizeY(45), z: zCoord, floor: floorNum, tags: ['classroom'] },

        // Facilities & Utility Points
        [`${p}02`]: { x: 400, y: normalizeY(10), z: zCoord, floor: floorNum, tags: ['study_section', 'facility'] }, 
        [`${p}SR`]: { x: 450, y: normalizeY(40), z: zCoord, floor: floorNum, tags: ['staff_room', 'office'] },
        [`${p}C`]: { x: 600, y: normalizeY(40), z: zCoord, floor: floorNum, tags: ['couches', 'lounge'] },
        [`${p}B`]: { x: 350, y: normalizeY(30), z: zCoord, floor: floorNum, tags: ['bathroom', 'facility'] },
        [`${p}T`]: { x: 250, y: normalizeY(10), z: zCoord, floor: floorNum, tags: ['tables', 'lounge'] },

        // Vertical Transport & Intersections (These are connection points)
        [`${p}E1`]: { x: 200, y: normalizeY(20), z: zCoord, floor: floorNum, tags: ['elevator', 'accessible'] },
        [`${p}E2`]: { x: 300, y: normalizeY(20), z: zCoord, floor: floorNum, tags: ['elevator', 'accessible'] },
        [`${p}SS`]: { x: 500, y: normalizeY(30), z: zCoord, floor: floorNum, tags: ['stairs', 'south_stairwell'] },
        [`${p}NS`]: { x: 100, y: normalizeY(20), z: zCoord, floor: floorNum, tags: ['stairs', 'north_stairwell'] },
        [`${p}H1`]: { x: 250, y: normalizeY(25), z: zCoord, floor: floorNum, tags: ['intersection'] },
    };
};

// Populate NODES for all three floors
Object.assign(NODES, createFloorNodes(8, 0));
Object.assign(NODES, createFloorNodes(9, 1));
Object.assign(NODES, createFloorNodes(10, 2));

// 2. Define GRAPH (Adjacency List with Weights - weight = time in seconds)
const GRAPH = {};

// Helper to add bidirectional connections
function addConnection(nodeA, nodeB, weight, props = {}) {
    if (!GRAPH[nodeA]) GRAPH[nodeA] = [];
    if (!GRAPH[nodeB]) GRAPH[nodeB] = [];
    
    // Check if the connection already exists to prevent duplicates (optional but good practice)
    const existsA = GRAPH[nodeA].some(edge => edge.neighbor === nodeB);
    const existsB = GRAPH[nodeB].some(edge => edge.neighbor === nodeA);

    if (!existsA) GRAPH[nodeA].push({ neighbor: nodeB, weight, ...props });
    if (!existsB) GRAPH[nodeB].push({ neighbor: nodeA, weight, ...props });
}

// Create intra-floor connections for each floor
function createFloorConnections(prefix) {
    const center = `${prefix}H1`;
    
    // Group all non-transport nodes
    const destinations = [
        `${prefix}01`, `${prefix}03`, `${prefix}04`, `${prefix}05`, `${prefix}06`, 
        `${prefix}07`, `${prefix}08`, `${prefix}09`, `${prefix}10`, `${prefix}11`, 
        `${prefix}12`, `${prefix}02`, `${prefix}SR`, `${prefix}C`, `${prefix}B`, `${prefix}T`
    ].filter(id => NODES[id]); // Filter out non-existent nodes for safety
    
    // All destinations connect to the central intersection H1 (Hallway 1)
    destinations.forEach(room => {
        // Use a variable weight based on distance from intersection (represented by x/y distance in visualization)
        const node = NODES[room];
        const centerNode = NODES[center];
        const dist = Math.sqrt(Math.pow(node.x - centerNode.x, 2) + Math.pow(node.y - centerNode.y, 2));
        const weight = Math.ceil(dist / 10) + 5; // Base 5s + 1s per 10 visualization units
        addConnection(room, center, weight);
    });
    
    // Transport hubs connect to the central intersection
    const transports = [`${prefix}E1`, `${prefix}E2`, `${prefix}SS`, `${prefix}NS`].filter(id => NODES[id]);
    transports.forEach(trans => {
        if (NODES[trans]) addConnection(trans, center, 10); // Standard 10s walk to intersection
    });
}

// Create connections for all floors
createFloorConnections('8');
createFloorConnections('9');
createFloorConnections('10');

// INTER-FLOOR CONNECTIONS (Vertical Transport)
// Travel time between floors: Elevator (40s), Stairs (25s)

// Elevators (Accessible routes)
addConnection('8E1', '9E1', 40, { accessible: true, vertical: true });
addConnection('9E1', '10E1', 40, { accessible: true, vertical: true });
addConnection('8E2', '9E2', 40, { accessible: true, vertical: true });
addConnection('9E2', '10E2', 40, { accessible: true, vertical: true });

// Stairs (Not accessible)
addConnection('8SS', '9SS', 25, { vertical: true });
addConnection('9SS', '10SS', 25, { vertical: true });
addConnection('8NS', '9NS', 25, { vertical: true });
addConnection('9NS', '10NS', 25, { vertical: true });


// --- PHASE 2: PATHFINDING (Dijkstra's Algorithm) ---

/**
 * Finds the shortest path using Dijkstra's algorithm.
 * @param {string} startNode - The ID of the starting node.
 * @param {string} endNode - The ID of the destination node.
 * @param {boolean} isAccessible - If true, restricts travel to elevator-only between floors.
 * @returns {{path: string[], time: number}} The path array and total time.
 */
function dijkstra(startNode, endNode, isAccessible) {
    const distances = {};
    const previous = {};
    const priorityQueue = []; // Using array for simple implementation, min-heap needed for performance
    const visited = new Set();

    for (const node in NODES) {
        distances[node] = Infinity;
        previous[node] = null;
    }
    distances[startNode] = 0;
    priorityQueue.push(startNode);

    // Simple priority queue logic (linear search)
    const findMinDistanceNode = () => {
        let minTime = Infinity;
        let minNode = null;
        let minIndex = -1;

        for (let i = 0; i < priorityQueue.length; i++) {
            const node = priorityQueue[i];
            if (distances[node] < minTime) {
                minTime = distances[node];
                minNode = node;
                minIndex = i;
            }
        }
        if (minNode) priorityQueue.splice(minIndex, 1);
        return minNode;
    };

    while (priorityQueue.length > 0) {
        const currentNode = findMinDistanceNode();
        if (!currentNode) break;

        if (currentNode === endNode) break;

        const neighbors = GRAPH[currentNode] || [];
        for (const edge of neighbors) {
            const neighbor = edge.neighbor;
            
            // ACCESSIBILITY CONSTRAINT CHECK:
            // If accessible mode is on, skip connections that use stairs or are explicitly marked non-accessible
            const isStairNode = NODES[currentNode].tags.includes('stairs') || NODES[neighbor].tags.includes('stairs');
            
            if (isAccessible && isStairNode && edge.vertical) {
                continue; // Skip vertical stair connections in accessible mode
            }
            
            const weight = edge.weight;
            const newDistance = distances[currentNode] + weight;
            
            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance;
                previous[neighbor] = currentNode;
                if (!priorityQueue.includes(neighbor)) {
                    priorityQueue.push(neighbor);
                }
            }
        }
    }

    const path = [];
    let current = endNode;
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    return {
        path: path[0] === startNode ? path : [],
        time: distances[endNode] !== Infinity ? distances[endNode] : 0
    };
}

// --- PHASE 3: CONVERSATIONAL DELIVERY (Using Template for LLM-style output) ---

/**
 * Generates human-readable, contextual directions from the calculated path.
 * @param {string[]} path - The array of node IDs forming the optimal path.
 * @param {number} totalTime - The total travel time in seconds.
 * @param {boolean} isAccessible - If the route was calculated using accessible mode.
 * @returns {string} The formatted conversational output.
 */
function generateConversationalOutput(path, totalTime, isAccessible) {
    if (path.length <= 1) {
        return "I apologize, but a path between these locations could not be found under the given constraints, or you are already there.";
    }

    let directions = [];
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    
    directions.push(`**Optimal Route Found! Total Travel Time: ${minutes}m ${seconds}s**`);
    directions.push(isAccessible ? `*(♿ Using elevator-only route.)*` : `*(🚶 Using stairs and elevators.)*`);
    directions.push('---');

    for (let i = 0; i < path.length - 1; i++) {
        const currentId = path[i];
        const nextId = path[i + 1];
        const current = NODES[currentId];
        const next = NODES[nextId];
        const currentFloor = current.floor;
        const nextFloor = next.floor;

        if (currentFloor !== nextFloor) {
            const transportType = next.tags.includes('stairs') ? 'Stairwell' : 'Elevator';
            const verb = nextFloor > currentFloor ? 'ascend' : 'descend';
            directions.push(`• **Floor Change:** Proceed to the **${transportType} (${currentId})** and **${verb}** to Floor ${nextFloor}.`);
        } 
        else {
            let directionText = `• From **${currentId}** (Floor ${currentFloor}), move towards **${nextId}**.`;
            
            if (current.tags.includes('intersection')) {
                if (next.tags.includes('classroom') || next.tags.includes('staff_room')) {
                    directionText = `• At the main intersection (**${currentId}**), take the corridor directly to **${nextId}** (Your destination is nearby).`;
                } else if (next.tags.includes('elevator') || next.tags.includes('stairs')) {
                    const dir = next.tags.includes('north_stairwell') ? 'North' : next.tags.includes('south_stairwell') ? 'South' : '';
                    directionText = `• Follow the main hallway toward the ${dir} **${NODES[nextId].tags.includes('stairs') ? 'Stairwell' : 'Elevator'} bank (${nextId})**.`;
                }
            } else if (current.tags.includes('classroom')) {
                directionText = `• Head out of **${currentId}** toward the main hallway intersection (**${nextId}**).`;
            } else if (current.tags.includes('elevator') || current.tags.includes('stairs')) {
                 directionText = `• Exit the ${current.tags.includes('elevator') ? 'Elevator' : 'Stairwell'} area (${currentId}) and proceed to the central hall (**${nextId}**).`;
            }
            directions.push(directionText);
        }
    }
    
    // --- Contextual Tip Generation ---
    const lastNode = path[path.length-1];
    const destinationFloor = NODES[lastNode].floor;
    const studyNode = `${destinationFloor}02`; // Assuming 02 is a facility/lounge on every floor
    
    if (NODES[studyNode] && lastNode !== studyNode) {
        const studyPath = dijkstra(lastNode, studyNode, false); // Calculate shortest path to study section on destination floor
        const studyTime = Math.ceil(studyPath.time);
        
        if (studyPath.path.length > 1 && totalTime < (4 * 60)) { // Only suggest if total trip is short
            directions.push(`\n---`);
            directions.push(`\n**💡 Contextual Tip:** Need a break? The private study section (**${studyNode}**) is only **${studyTime}s** walk from your destination.`);
        }
    }
    
    directions.push(`\n---`);
    directions.push(`**✅ Final Destination:** You have arrived at **${lastNode}** (Floor ${destinationFloor}).`);

    return directions.join('\n');
}

// --- GLOBALS FOR INTERACTION ---
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
// ADJUSTED: More dramatic initial rotation to immediately show the Z separation
let rotateX = 55; // Initial pitch (shallow)
let rotateY = -45; // Initial yaw (side-view)

/**
 * Updates the CSS transform property of the 3D scene.
 */
function updateSceneTransform() {
    const scene = document.getElementById('scene-3d-layers');
    if (scene) {
        // Clamp rotation angles to prevent flipping or excessive rotations
        rotateX = Math.max(20, Math.min(90, rotateX)); // Keep X between 20 (shallow) and 90 (top-down)
        
        // ADJUSTED: Change overall scene transform to properly center the widely separated planes
        scene.style.transform = `translateY(180px) translateZ(-250px) rotateX(${rotateX}deg) rotateZ(${rotateY}deg)`;
    }
}

/**
 * Sets up mouse event listeners for rotating the 3D scene.
 */
function initSceneInteraction() {
    const scene = document.getElementById('scene-3d-layers');
    if (!scene) return;
    
    // Prevent default drag behaviors that conflict with rotation
    scene.addEventListener('dragstart', (e) => e.preventDefault());

    // MOUSE DOWN: Start dragging
    scene.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
        scene.style.cursor = 'grabbing';
    });

    // TOUCH START: Start dragging for touchscreens
    scene.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMouseX = e.touches[0].clientX;
            previousMouseY = e.touches[0].clientY;
        }
    }, { passive: true });

    // MOUSE MOVE: Update rotation
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;

        // Rotate Y (yaw) based on horizontal movement
        rotateY += deltaX * 0.2; 
        
        // Rotate X (pitch) based on vertical movement (inverted for intuitive drag)
        rotateX -= deltaY * 0.2;
        
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
        
        updateSceneTransform();
    });
    
    // TOUCH MOVE: Update rotation for touchscreens
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        const deltaX = clientX - previousMouseX;
        const deltaY = clientY - previousMouseY;

        // Rotate Y (yaw) based on horizontal movement
        rotateY += deltaX * 0.2; 
        
        // Rotate X (pitch) based on vertical movement (inverted for intuitive drag)
        rotateX -= deltaY * 0.2;
        
        previousMouseX = clientX;
        previousMouseY = clientY;
        
        updateSceneTransform();
    }, { passive: true });

    // MOUSE UP/TOUCH END: Stop dragging
    document.addEventListener('mouseup', () => {
        isDragging = false;
        scene.style.cursor = 'grab';
    });
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    document.addEventListener('touchcancel', () => {
        isDragging = false;
    });
    
    // Initial transform application
    updateSceneTransform();
}

/**
 * Main function triggered by the Calculate button.
 */
function calculateRoute() {
    const startNode = document.getElementById('start-node').value;
    const endNode = document.getElementById('end-node').value;
    const isAccessible = document.getElementById('accessible-mode').checked;

    const outputDiv = document.getElementById('llm-output');
    
    if (!startNode || !endNode || startNode === endNode) {
        outputDiv.innerHTML = '<p class="text-red-500 font-semibold p-4 bg-red-100 rounded-lg">Please select different starting and ending locations.</p>';
        // Re-initialize placeholder and interaction
        drawInitialMapPlaceholder();
        initSceneInteraction();
        return;
    }

    const { path, time } = dijkstra(startNode, endNode, isAccessible);
    
    // Display conversational output
    outputDiv.innerHTML = '<pre class="bg-gray-50 border border-gray-200 p-4 rounded-lg whitespace-pre-wrap font-mono text-gray-800">' + generateConversationalOutput(path, time, isAccessible) + '</pre>';

    // Draw visualization and initialize interaction
    drawMapVisualization(startNode, endNode, path);
    initSceneInteraction();
}

// --- CLEAN LAYERED VISUALIZATION ---

/**
 * Draws the layered, pseudo-3D map visualization.
 * @param {string} startNode - The starting node ID.
 * @param {string} endNode - The ending node ID.
 * @param {string[]} path - The calculated path of node IDs.
 */
function drawMapVisualization(startNode, endNode, path) {
    const container = document.getElementById('map-visualization');
    container.innerHTML = ''; 
    
    // Create main scene container
    const scene = document.createElement('div');
    scene.id = 'scene-3d-layers';
    // Add 'cursor-grab' class to indicate interactivity
    scene.className = 'w-full h-[600px] relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 cursor-grab'; 
    container.appendChild(scene);

    // Floor configurations - ordered for stacking visualization (10 on top)
    const floors = [
        { number: 10, color: 'bg-blue-50', border: 'border-blue-300', label: 'Floor 10' },
        { number: 9, color: 'bg-green-50', border: 'border-green-300', label: 'Floor 9' },
        { number: 8, color: 'bg-red-50', border: 'border-red-300', label: 'Floor 8' }
    ];

    const floorDOMContainers = {};
    const floorLeftOffset = 50;
    const floorTopFixedY = 50; // Fixed top margin for the whole stack
    // REMOVED ySeparation (120) from individual floor transform
    const zSeparation = 350; // INCREASED Depth separation significantly
    const nodeCenterOffset = 7; 

    // 1. Create each floor layer and draw all its nodes
    floors.forEach((floor, index) => {
        const floorContainer = document.createElement('div');
        // Z-stacking: Higher floor has higher z-index
        const zIndex = 30 + (floors.length - index) * 10; 
        
        // Calculate 3D transforms
        // REMOVED yTranslate, using only fixed top (50px) for layout consistency
        const zTranslate = index * -zSeparation; // Negative Z pulls closer to the camera/viewer in 3D space
        
        floorContainer.className = `floor-plane absolute ${floor.color} ${floor.border} border-2 rounded-lg shadow-xl`;
        floorContainer.style.width = '550px';
        floorContainer.style.height = '350px';
        
        // Set fixed position and use transform for stacking
        floorContainer.style.left = `${floorLeftOffset}px`;
        floorContainer.style.top = `${floorTopFixedY}px`; 
        
        // APPLY THE Z TRANSLATION ONLY for the floating effect
        // All planes start at the same (Y) vertical position, but are separated in depth (Z).
        floorContainer.style.transform = `translateZ(${zTranslate}px)`;
        
        floorContainer.style.zIndex = zIndex; 
        floorContainer.id = `floor-${floor.number}`;
        
        // Floor label
        const floorLabel = document.createElement('div');
        floorLabel.className = 'absolute -top-8 left-0 bg-white px-3 py-1 rounded-lg shadow-md font-bold text-gray-700 text-sm';
        floorLabel.textContent = floor.label;
        scene.appendChild(floorLabel);

        // Draw nodes for this floor
        const floorNodes = Object.keys(NODES).filter(id => NODES[id].floor === floor.number);
        floorNodes.forEach(nodeId => {
            const node = NODES[nodeId];
            const isStart = nodeId === startNode;
            const isEnd = nodeId === endNode;
            const isPath = path.includes(nodeId);

            const nodeDiv = document.createElement('div');
            let color = 'bg-gray-400';
            let size = 'w-3 h-3';
            let ring = '';
            
            if (isStart) { 
                color = 'bg-green-600'; 
                ring = 'ring-4 ring-green-300';
                size = 'w-5 h-5'; 
            } 
            else if (isEnd) { 
                color = 'bg-red-600'; 
                ring = 'ring-4 ring-red-300';
                size = 'w-5 h-5'; 
            } 
            else if (isPath) { 
                color = 'bg-indigo-500'; 
                ring = 'ring-2 ring-indigo-200';
                size = 'w-4 h-4'; 
            } 
            else if (node.tags.includes('elevator')) { 
                color = 'bg-blue-500'; 
            } 
            else if (node.tags.includes('stairs')) { 
                color = 'bg-orange-500'; 
            } 
            else if (node.tags.includes('facility') || node.tags.includes('lounge')) { 
                color = 'bg-yellow-500'; 
            }

            nodeDiv.className = `absolute rounded-full ${color} ${size} ${ring} cursor-pointer border-2 border-white shadow-md node-layer`;
            nodeDiv.style.left = `${node.x}px`;
            nodeDiv.style.top = `${node.y}px`;
            nodeDiv.title = `${nodeId} (${node.tags.join(', ')})`;
            
            // Add label for important nodes
            if (isStart || isEnd || node.tags.includes('elevator') || node.tags.includes('stairs') || nodeId === '8H1' || nodeId === '9H1' || nodeId === '10H1') {
                const label = document.createElement('div');
                label.className = 'absolute text-xs font-medium -top-5 -left-2 bg-white px-1 rounded text-gray-700 shadow-sm whitespace-nowrap';
                label.textContent = nodeId;
                nodeDiv.appendChild(label);
            }

            floorContainer.appendChild(nodeDiv);
        });

        scene.appendChild(floorContainer);
        floorDOMContainers[floor.number] = floorContainer;
    });

    // 2. Draw INTRA-FLOOR PATHS using SVG on each floor container
    for (let i = 0; i < path.length - 1; i++) {
        const currentId = path[i];
        const nextId = path[i + 1];
        const current = NODES[currentId];
        const next = NODES[nextId];

        if (current.floor === next.floor) {
            const floorContainer = floorDOMContainers[current.floor];

            let svg = floorContainer.querySelector('svg');
            if (!svg) {
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                floorContainer.prepend(svg); // Prepend so lines are behind nodes
            }

            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

            line.setAttribute('x1', current.x + nodeCenterOffset);
            line.setAttribute('y1', current.y + nodeCenterOffset);
            line.setAttribute('x2', next.x + nodeCenterOffset);
            line.setAttribute('y2', next.y + nodeCenterOffset);
            
            line.setAttribute('stroke', '#4f46e5'); // Indigo 600
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-linecap', 'round');
            
            svg.appendChild(line);
        }
    }

    // 3. Draw VERTICAL PATHS using a main canvas
    const canvas = document.createElement('canvas');
    canvas.width = 650; // Match the scene width
    canvas.height = 600; // Match the scene height
    canvas.className = 'absolute top-0 left-0 pointer-events-none';
    scene.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    if (path.length > 1) {
        ctx.strokeStyle = '#10b981'; // Emerald 500 for vertical path
        ctx.lineWidth = 4; 
        ctx.setLineDash([8, 6]);

        for (let i = 0; i < path.length - 1; i++) {
            const currentId = path[i];
            const nextId = path[i + 1];
            const current = NODES[currentId];
            const next = NODES[nextId];
            
            if (current.floor !== next.floor) {
                const currentFloorIndex = floors.findIndex(f => f.number === current.floor);
                const nextFloorIndex = floors.findIndex(f => f.number === next.floor);
                
                // --- COORDINATES MUST MATCH 3D TRANSFORMS ---
                // X = Floor Left Offset + Node X + Node Center Offset
                const startX = floorLeftOffset + current.x + nodeCenterOffset;
                
                // Y = Fixed Top (50) + Node Y on plane + Node Center Offset
                const startY = floorTopFixedY + current.y + nodeCenterOffset; 
                
                const endX = floorLeftOffset + next.x + nodeCenterOffset;
                const endY = floorTopFixedY + next.y + nodeCenterOffset; 
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
}

/**
 * Draws the initial placeholder text in the map area.
 */
function drawInitialMapPlaceholder() {
    const container = document.getElementById('map-visualization');
    container.className = 'rounded-xl shadow-inner border border-gray-200';
    container.innerHTML = `
        <div id="scene-3d-layers" class="w-full h-[600px] relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 cursor-grab" style="transform-style: preserve-3d; transition: transform 0.1s ease-out;">
            <div class="h-full flex items-center justify-center text-gray-500">
                <div class="text-center">
                    <div class="text-6xl mb-4">🗺️</div>
                    <p class="text-lg font-medium">Multi-Floor Map Ready</p>
                    <p class="text-sm mt-2 text-gray-400">Select start/end and click Calculate to visualize the route.</p>
                    <p class="text-xs mt-4 text-indigo-400">Click and drag to change perspective!</p>
                </div>
            </div>
        </div>
    `;
}

// --- INITIALIZATION ---

window.onload = function() {
    const startSelect = document.getElementById('start-node');
    const endSelect = document.getElementById('end-node');
    
    const floorRoomMap = {};
    for (const id in NODES) {
        // Only include classrooms, staff rooms, and key facilities in the dropdowns
        if (NODES[id].tags.includes('classroom') || NODES[id].tags.includes('staff_room') || NODES[id].tags.includes('lounge')) {
            const floor = NODES[id].floor;
            if (!floorRoomMap[floor]) {
                floorRoomMap[floor] = [];
            }
            floorRoomMap[floor].push(id);
        }
    }
    
    // Sort floors (8, 9, 10) and then sort rooms alphabetically within each floor
    const sortedFloors = Object.keys(floorRoomMap).sort((a, b) => a - b);
    
    sortedFloors.forEach(floor => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `Floor ${floor}`;
        floorRoomMap[floor].sort().forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            // Add a friendly name if available
            const name = NODES[id].tags.includes('staff_room') ? 'Staff Room' : NODES[id].tags.includes('lounge') ? 'Lounge' : 'Room';
            option.textContent = `${id} (${name})`;
            optgroup.appendChild(option);
        });
        startSelect.appendChild(optgroup.cloneNode(true));
        endSelect.appendChild(optgroup);
    });
    
    // Set initial values for demo convenience
    startSelect.value = '809';
    endSelect.value = '1001';

    // Draw initial placeholder content
    drawInitialMapPlaceholder();
    // Initialize interaction handlers even if no path is calculated yet
    initSceneInteraction(); 
};
