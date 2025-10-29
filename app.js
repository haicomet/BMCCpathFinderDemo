// BMCC Path Pointer - Main Application Logic

// Declare THREE variable as global
window.THREE = window.THREE || {}

// ============================================================================
// ACCURATE BMCC FLOOR LAYOUT
// ============================================================================

function generateFloorLayout(floorNum) {
  return [
    // Left wing (large open spaces)
    { name: `${floorNum}01`, x: -25, z: 15, type: "classroom", width: 15, depth: 20 },
    { name: `${floorNum}02`, x: -25, z: -10, type: "classroom", width: 15, depth: 15 },
    { name: `${floorNum}03`, x: -25, z: -30, type: "classroom", width: 15, depth: 15 },

    // Upper circular stairwell area
    { name: `${floorNum}NS`, x: -5, z: 20, type: "stairs", width: 8, depth: 8, isCircular: true },

    // Upper center rooms
    { name: `${floorNum}04`, x: 10, z: 25, type: "classroom", width: 12, depth: 8 },
    { name: `${floorNum}05`, x: 25, z: 25, type: "classroom", width: 10, depth: 8 },
    { name: `${floorNum}06`, x: 38, z: 25, type: "classroom", width: 10, depth: 8 },
    { name: `${floorNum}07`, x: 51, z: 25, type: "classroom", width: 10, depth: 8 },

    // Center corridor area
    { name: `${floorNum}H1`, x: 20, z: 5, type: "intersection" },
    { name: `${floorNum}T`, x: 20, z: 10, type: "tables", width: 8, depth: 6 },

    // Center rooms (classroom blocks)
    { name: `${floorNum}08`, x: 5, z: -5, type: "classroom", width: 18, depth: 10 },
    { name: `${floorNum}09`, x: 5, z: -18, type: "classroom", width: 18, depth: 10 },
    { name: `${floorNum}10`, x: 5, z: -31, type: "classroom", width: 18, depth: 10 },

    // Elevators (center) - Different colors based on low-rise vs high-rise
    { name: `${floorNum}E1`, x: 28, z: 8, type: "elevator", width: 4, depth: 4, elevatorType: getElevatorType(floorNum) },
    { name: `${floorNum}E2`, x: 28, z: 2, type: "elevator", width: 4, depth: 4, elevatorType: getElevatorType(floorNum) },

    // Right side rooms
    { name: `${floorNum}11`, x: 38, z: 8, type: "classroom", width: 10, depth: 8 },
    { name: `${floorNum}12`, x: 38, z: -2, type: "classroom", width: 10, depth: 8 },

    // Lower circular stairwell
    { name: `${floorNum}SS`, x: 35, z: -20, type: "stairs", width: 8, depth: 8, isCircular: true },
    { name: `${floorNum}13`, x: 20, z: -25, type: "classroom", width: 12, depth: 10 },

    // Right wing rooms
    { name: `${floorNum}14`, x: 55, z: 15, type: "classroom", width: 10, depth: 8 },
    { name: `${floorNum}15`, x: 55, z: 5, type: "classroom", width: 10, depth: 8 },
    { name: `${floorNum}16`, x: 55, z: -8, type: "classroom", width: 10, depth: 10 },
    { name: `${floorNum}17`, x: 55, z: -22, type: "classroom", width: 10, depth: 10 },

    // Bathroom and amenities
    { name: `${floorNum}B`, x: 32, z: -12, type: "bathroom", width: 5, depth: 5 },
    { name: `${floorNum}SR`, x: 68, z: -20, type: "staff_room", width: 8, depth: 12 },
    { name: `${floorNum}C`, x: 68, z: -5, type: "couches", width: 8, depth: 10 },
    { name: `${floorNum}02S`, x: 68, z: 10, type: "study_room", width: 8, depth: 8 },
  ]
}

// Determine elevator type based on floor
function getElevatorType(floorNum) {
  if (floorNum >= 1 && floorNum <= 8) {
    return "low-rise" // Floors 1-8
  } else if (floorNum >= 9 && floorNum <= 13) {
    return "high-rise" // Floors 9-13
  }
  return "low-rise" // Default
}

const ROOM_LAYOUT = {}
for (let floor = 1; floor <= 10; floor++) {
  ROOM_LAYOUT[floor] = generateFloorLayout(floor)
}

// Color mapping for different room types
const ROOM_COLORS = {
  classroom: 0x6366f1, // Indigo
  bathroom: 0xef4444, // Red
  tables: 0xf59e0b, // Amber
  staff_room: 0x8b5cf6, // Violet
  couches: 0xec4899, // Pink
  study_room: 0x10b981, // Emerald
  elevator: 0x3b82f6, // Blue
  stairs: 0xf97316, // Orange
  intersection: 0x6b7280, // Gray
  "elevator-low": 0x3b82f6, // Blue for low-rise
  "elevator-high": 0x8b5cf6, // Purple for high-rise
}

// ============================================================================

// State management
const state = {
  currentFloor: 1,
  highlightedRooms: [],
  is3DVisible: true,
  manualStartFloor: 1,
  manualEndFloor: 1,
  isManualMode: false
}

// Three.js scene variables
let scene, camera, renderer, floorMesh, pathLine
let controls, raycaster, mouse

const OLLAMA_API_URL = "http://localhost:11434/api/chat"
let isOllamaConnected = false
let chatHistory = []

// Function to check Ollama connection
async function checkOllamaConnection() {
  const connectionStatus = document.getElementById("connectionStatus")
  const sendBtn = document.getElementById("sendBtn")

  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
    })

    if (response.ok) {
      isOllamaConnected = true
      connectionStatus.className = "connection-status connected"
      connectionStatus.querySelector("span:last-child").textContent = "Connected to Ollama"
      sendBtn.disabled = false 
    } else {
      isOllamaConnected = false
      connectionStatus.className = "connection-status disconnected"
      connectionStatus.querySelector("span:last-child").textContent = "Disconnected from Ollama"
      sendBtn.disabled = true
    }
  } catch (error) {
    isOllamaConnected = false
    connectionStatus.className = "connection-status disconnected"
    connectionStatus.querySelector("span:last-child").textContent = "Disconnected - Check Ollama"
    sendBtn.disabled = true
    console.error("Connection error:", error)
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chatContainer")
  const chatInput = document.getElementById("chatInput")
  const sendBtn = document.getElementById("sendBtn")
  const toggle3DBtn = document.getElementById("toggle3DBtn")
  const sceneContainer = document.getElementById("sceneContainer")

  // Create manual floor selection UI
  createManualFloorSelector()

  function createManualFloorSelector() {
    const header = document.querySelector('.header')
    
    const manualSelector = document.createElement('div')
    manualSelector.className = 'manual-selector'
    manualSelector.innerHTML = `
      <div class="manual-controls">
        <button id="toggleManualBtn" class="manual-toggle-btn">📍 Manual Route</button>
        <div id="manualPanel" class="manual-panel hidden">
          <div class="floor-selectors">
            <div class="floor-selector">
              <label>Start Floor:</label>
              <select id="startFloorSelect">
                ${Array.from({length: 10}, (_, i) => i + 1).map(floor => 
                  `<option value="${floor}">Floor ${floor}</option>`
                ).join('')}
              </select>
            </div>
            <div class="floor-selector">
              <label>End Floor:</label>
              <select id="endFloorSelect">
                ${Array.from({length: 10}, (_, i) => i + 1).map(floor => 
                  `<option value="${floor}">Floor ${floor}</option>`
                ).join('')}
              </select>
            </div>
            <button id="showRouteBtn" class="show-route-btn">Show Route</button>
          </div>
        </div>
      </div>
    `
    
    header.appendChild(manualSelector)

    // Add styles for manual selector
    const style = document.createElement('style')
    style.textContent = `
      .manual-selector {
        margin-top: 12px;
      }
      .manual-toggle-btn {
        background: #334155;
        border: 1px solid #475569;
        border-radius: 8px;
        color: #f1f5f9;
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .manual-toggle-btn:hover {
        background: #475569;
      }
      .manual-panel {
        margin-top: 8px;
        padding: 12px;
        background: #334155;
        border-radius: 8px;
        border: 1px solid #475569;
      }
      .manual-panel.hidden {
        display: none;
      }
      .floor-selectors {
        display: flex;
        gap: 12px;
        align-items: end;
      }
      .floor-selector {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .floor-selector label {
        font-size: 11px;
        color: #94a3b8;
      }
      .floor-selector select {
        background: #1e293b;
        border: 1px solid #475569;
        border-radius: 4px;
        color: #f1f5f9;
        padding: 4px 8px;
        font-size: 12px;
      }
      .show-route-btn {
        background: #6366f1;
        border: none;
        border-radius: 6px;
        color: white;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .show-route-btn:hover {
        background: #4f46e5;
      }
    `
    document.head.appendChild(style)

    // Add event listeners for manual controls
    const toggleManualBtn = document.getElementById('toggleManualBtn')
    const manualPanel = document.getElementById('manualPanel')
    const startFloorSelect = document.getElementById('startFloorSelect')
    const endFloorSelect = document.getElementById('endFloorSelect')
    const showRouteBtn = document.getElementById('showRouteBtn')

    toggleManualBtn.addEventListener('click', () => {
      state.isManualMode = !state.isManualMode
      manualPanel.classList.toggle('hidden')
      if (state.isManualMode) {
        toggleManualBtn.style.background = '#6366f1'
        toggleManualBtn.textContent = '📍 Manual Route (On)'
      } else {
        toggleManualBtn.style.background = '#334155'
        toggleManualBtn.textContent = '📍 Manual Route'
      }
    })

    showRouteBtn.addEventListener('click', () => {
      const startFloor = parseInt(startFloorSelect.value)
      const endFloor = parseInt(endFloorSelect.value)
      
      state.manualStartFloor = startFloor
      state.manualEndFloor = endFloor
      
      // Show manual route
      showManualRoute(startFloor, endFloor)
    })

    // Set default values
    startFloorSelect.value = '1'
    endFloorSelect.value = '1'
  }

  function showManualRoute(startFloor, endFloor) {
    if (startFloor === endFloor) {
      // Same floor - just highlight the floor
      highlightFloor(startFloor)
      addMessage(`Showing Floor ${startFloor}`, 'assistant')
    } else {
      // Different floors - show path between representative rooms
      const startRoom = `${startFloor}01` // Use first room on start floor
      const endRoom = `${endFloor}01` // Use first room on end floor
      
      highlightFloor(startFloor)
      highlightFloor(endFloor)
      drawPath(startRoom, endRoom)
      
      addMessage(`Showing route from Floor ${startFloor} to Floor ${endFloor}`, 'assistant')
      
      // Add elevator information
      const elevatorInfo = getElevatorInfo(startFloor, endFloor)
      addMessage(elevatorInfo, 'assistant')
    }
  }

  function highlightFloor(floorNum) {
    // Clear previous highlights
    scene.traverse((child) => {
      if (child.userData && child.userData.floor === floorNum) {
        if (child.material && child.material.emissive) {
          child.material.emissive.set(0x22c55e)
          child.material.emissiveIntensity = 0.3
        }
      }
    })
  }

  function getElevatorInfo(startFloor, endFloor) {
    const lowRiseFloors = [1, 2, 3, 4, 5, 6, 7, 8]
    const highRiseFloors = [9, 10, 11, 12, 13]
    
    const startInLow = lowRiseFloors.includes(startFloor)
    const startInHigh = highRiseFloors.includes(startFloor)
    const endInLow = lowRiseFloors.includes(endFloor)
    const endInHigh = highRiseFloors.includes(endFloor)
    
    if ((startInLow && endInLow) || (startInHigh && endInHigh)) {
      // Same elevator bank
      return `Use the ${startInLow ? 'low-rise' : 'high-rise'} elevators (${startInLow ? '1-8' : '9-13'}) for direct access.`
    } else {
      // Different elevator banks - need to transfer
      return `You'll need to transfer elevators. Take ${startInLow ? 'low-rise' : 'high-rise'} to floor ${startInLow ? 8 : 9}, then switch to ${startInLow ? 'high-rise' : 'low-rise'} elevators.`
    }
  }

  // Send message to Ollama
  async function sendMessage(userMessage) {
    if (!userMessage.trim()) return

    // Add user message to chat
    addMessage(userMessage, "user")
    chatInput.value = ""
    chatInput.style.height = "auto"
    sendBtn.disabled = true

    // Show typing indicator
    const typingId = addTypingIndicator()

    try {
      const systemPrompt = `You are a helpful navigation assistant for BMCC (Borough of Manhattan Community College). 
You help students find their way to classrooms across 10 floors (floors 1-10).

IMPORTANT ELEVATOR INFORMATION:
- Low-rise elevators: Serve floors 1-8 (Blue elevators)
- High-rise elevators: Serve floors 9-13 (Purple elevators)
- If traveling between low-rise and high-rise floors, mention the need to transfer at floor 8 or 9

IMPORTANT: Remember that floor numbers go from 1 (lowest) to 10 (highest). 
- Going UP means increasing floor numbers (1→2→3...)
- Going DOWN means decreasing floor numbers (10→9→8...)

Each floor has the same layout with rooms numbered like: 101, 102, 103... for floor 1, 201, 202, 203... for floor 2, etc.

Key locations on each floor:
- Rooms 01-03: Left wing classrooms
- Rooms 04-07: Upper center classrooms  
- Rooms 08-10: Center classroom blocks
- Rooms 11-13: Center/lower classrooms
- Rooms 14-17: Right wing classrooms
- NS: North stairwell (circular, upper left)
- SS: South stairwell (circular, lower right)
- E1, E2: Elevators (center) - note which are low-rise vs high-rise
- B: Bathrooms
- SR: Staff room
- C: Couches/lounge area
- 02S: Study room
- T: Tables area
- H1: Main intersection

When giving directions:
1. Be conversational and friendly
2. Give clear step-by-step directions
3. Mention landmarks (stairwells, elevators, lounges)
4. If going between floors, tell them which stairwell or elevator to use
5. Specify whether to use low-rise or high-rise elevators
6. Keep responses concise but helpful
7. ALWAYS mention specific room numbers and landmarks in your response
8. Double-check your floor directions (up vs down)

Example correct directions: "From room 901 on floor 9, go DOWN 5 floors to reach floor 4. You'll need to take the high-rise elevator to floor 8, then transfer to low-rise elevators to reach floor 4."`

      const response = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          messages: [
            { role: "system", content: systemPrompt }, 
            ...chatHistory, 
            { role: "user", content: userMessage }
          ],
          stream: false,
        }),
      })

      removeTypingIndicator(typingId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage = data.message.content

      // Add assistant message to chat
      addMessage(assistantMessage, "assistant")

      // Update chat history
      chatHistory.push(
        { role: "user", content: userMessage }, 
        { role: "assistant", content: assistantMessage }
      )

      // Keep chat history manageable (last 10 messages)
      if (chatHistory.length > 10) {
        chatHistory = chatHistory.slice(-10)
      }

      // Try to extract room information and visualize
      extractAndVisualizeRoute(assistantMessage)

    } catch (error) {
      removeTypingIndicator(typingId)
      addMessage(
        "Sorry, I couldn't connect to the AI. Make sure Ollama is running with: 'ollama serve'",
        "assistant"
      )
      console.error("Chat error:", error)
    } finally {
      sendBtn.disabled = !isOllamaConnected
    }
  }

  // Add message to chat UI
  function addMessage(content, role) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${role}`

    const avatar = document.createElement("div")
    avatar.className = "message-avatar"
    avatar.textContent = role === "user" ? "👤" : "🤖"

    const messageContent = document.createElement("div")
    messageContent.className = "message-content"
    messageContent.textContent = content

    messageDiv.appendChild(avatar)
    messageDiv.appendChild(messageContent)
    chatContainer.appendChild(messageDiv)

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight
  }

  // Add typing indicator
  function addTypingIndicator() {
    const id = "typing-" + Date.now()
    const messageDiv = document.createElement("div")
    messageDiv.className = "message assistant"
    messageDiv.id = id

    const avatar = document.createElement("div")
    avatar.className = "message-avatar"
    avatar.textContent = "🤖"

    const messageContent = document.createElement("div")
    messageContent.className = "message-content"
    messageContent.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>'

    messageDiv.appendChild(avatar)
    messageDiv.appendChild(messageContent)
    chatContainer.appendChild(messageDiv)
    chatContainer.scrollTop = chatContainer.scrollHeight

    return id
  }

  // Remove typing indicator
  function removeTypingIndicator(id) {
    const element = document.getElementById(id)
    if (element) {
      element.remove()
    }
  }

  // Extract room numbers from AI response and visualize
  function extractAndVisualizeRoute(message) {
    // Enhanced regex to find room numbers including special rooms like NS, SS, E1, etc.
    const roomPattern = /\b(\d{2,4}[A-Z]*)\b|\b([A-Z]+\d*)\b/g
    const matches = message.match(roomPattern) || []

    console.log("Extracted rooms:", matches)

    if (matches && matches.length > 0) {
      const uniqueRooms = [...new Set(matches)]
      
      // Filter valid rooms and highlight them
      const validRooms = uniqueRooms.filter(room => {
        // Check if it's a numbered room or a special room code
        if (room.match(/^\d/)) {
          const floor = getFloorFromRoomName(room)
          return floor >= 1 && floor <= 10
        } else {
          // Special rooms like NS, SS, E1, etc.
          return ['NS', 'SS', 'E1', 'E2', 'B', 'SR', 'C', 'T', 'H1', '02S'].includes(room)
        }
      })

      console.log("Valid rooms:", validRooms)
      
      // Highlight rooms in 3D
      highlightRooms(validRooms)
      
      // If we have at least 2 valid rooms, draw a path between them
      if (validRooms.length >= 2) {
        const startRoom = validRooms[0]
        const endRoom = validRooms[validRooms.length - 1]
        console.log(`Drawing path from ${startRoom} to ${endRoom}`)
        drawPath(startRoom, endRoom)
        
        // Switch to the floor of the starting room
        const startFloor = getFloorFromRoomName(startRoom)
        if (startFloor && startFloor !== state.currentFloor) {
          switchFloor(startFloor)
        }
      }
    }
  }

  // Highlight rooms in the 3D view
  function highlightRooms(roomNames) {
    state.highlightedRooms = roomNames
    
    // Clear previous highlights
    scene.traverse((child) => {
      if (child.userData && child.userData.roomName) {
        if (child.material && child.material.emissive) {
          child.material.emissive.set(0x000000)
          child.material.emissiveIntensity = 0
        }
      }
    })
    
    // Apply new highlights
    roomNames.forEach(roomName => {
      scene.traverse((child) => {
        if (child.userData && child.userData.roomName === roomName) {
          if (child.material) {
            child.material.emissive.set(0xffff00)
            child.material.emissiveIntensity = 0.5
          }
        }
      })
    })
  }

  function switchFloor(floorNum) {
    state.currentFloor = floorNum
    console.log(`Switched to floor ${floorNum}`)
  }

  // Chat input handlers
  chatInput.addEventListener("input", (e) => {
    // Auto-resize textarea
    e.target.style.height = "auto"
    e.target.style.height = e.target.scrollHeight + "px"
    
    // Enable/disable send button based on input
    sendBtn.disabled = !e.target.value.trim() || !isOllamaConnected
  })

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (chatInput.value.trim() && !sendBtn.disabled) {
        sendMessage(chatInput.value.trim())
      }
    }
  })

  sendBtn.addEventListener("click", () => {
    if (chatInput.value.trim() && !sendBtn.disabled) {
      sendMessage(chatInput.value.trim())
    }
  })

  // Toggle 3D view
  toggle3DBtn.addEventListener("click", () => {
    state.is3DVisible = !state.is3DVisible
    if (state.is3DVisible) {
      sceneContainer.classList.remove("hidden")
      toggle3DBtn.textContent = "Hide 3D View"
      // Restart animation loop if it was stopped
      animate()
    } else {
      sceneContainer.classList.add("hidden")
      toggle3DBtn.textContent = "Show 3D View"
    }
  })

  function findRoomByName(roomName) {
    for (const floor in ROOM_LAYOUT) {
      const room = ROOM_LAYOUT[floor].find((r) => r.name === roomName)
      if (room) return room
    }
    return null
  }

  function getFloorFromRoomName(roomName) {
    // Handle special rooms first
    if (roomName.match(/^[A-Z]/)) {
      // For special rooms like NS, SS, etc., extract floor number if present
      const floorMatch = roomName.match(/(\d+)/)
      if (floorMatch) {
        return parseInt(floorMatch[1])
      }
      return state.currentFloor || 1
    }
    
    // Extract floor number from room name
    const match = roomName.match(/^(\d+)/)
    if (match) {
      const num = match[1]
      if (num.length === 4) return parseInt(num.substring(0, 2)) // 1001 -> 10
      if (num.length === 3) return parseInt(num.charAt(0)) // 901 -> 9
      if (num.length === 2) return parseInt(num.charAt(0)) // 01 -> 0 (edge case)
    }
    return 1 // Default to floor 1
  }

  // Initialize Three.js scene
  function initScene() {
    // Remove placeholder
    const placeholder = sceneContainer.querySelector(".scene-placeholder")
    if (placeholder) {
      placeholder.remove()
    }

    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)

    // Create camera - Better starting position for compact layout
    camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000)
    camera.position.set(0, 40, 60)
    camera.lookAt(0, 20, 0)

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    sceneContainer.appendChild(renderer.domElement)

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 20
    controls.maxDistance = 100
    controls.maxPolarAngle = Math.PI / 1.5

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 80, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Setup raycaster for mouse interactions
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // Add click event listener for room selection
    renderer.domElement.addEventListener('click', onCanvasClick, false)

    // Create the floor layout
    createFloor()

    // Start animation loop
    animate()

    // Handle window resize
    window.addEventListener('resize', onWindowResize)
  }

  function onCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera)

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object
      if (clickedObject.userData && clickedObject.userData.roomName) {
        const roomName = clickedObject.userData.roomName
        const roomType = clickedObject.userData.roomType
        console.log(`Clicked on room: ${roomName} (${roomType})`)
        
        // Add room info to chat
        addMessage(`I clicked on ${roomName} (${roomType.replace('_', ' ')})`, 'user')
        
        // Ask AI for directions to this room
        sendMessage(`How do I get to ${roomName}?`)
      }
    }
  }

  // Create 3D floor representation - COMPACT VERSION
  function createFloor() {
    // Remove existing floor if any
    if (floorMesh) {
      scene.remove(floorMesh)
    }

    const floors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const floorGroup = new THREE.Group()

    floors.forEach((floorNum, index) => {
      // COMPACT: Reduced from 8 units to 4 units between floors
      const yPosition = index * 4

      // COMPACT: Smaller floor size
      const floorGeometry = new THREE.PlaneGeometry(120, 120)
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.3
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.set(0, yPosition, 0)
      floor.receiveShadow = true
      floorGroup.add(floor)

      // COMPACT: Smaller grid
      const gridHelper = new THREE.GridHelper(120, 12, 0x475569, 0x334155)
      gridHelper.position.y = yPosition + 0.1
      floorGroup.add(gridHelper)

      // Create room markers for this floor
      createRoomMarkersForFloor(floorGroup, yPosition, floorNum)
    })

    floorMesh = floorGroup
    scene.add(floorMesh)
  }

  function createRoomMarkersForFloor(parent, yPosition, floorNum) {
    const rooms = ROOM_LAYOUT[floorNum] || []

    rooms.forEach((room) => {
      // Skip intersections
      if (room.type === "intersection") return

      let geometry
      // COMPACT: Smaller room markers
      const markerHeight = 2

      if (room.type === "stairs" && room.isCircular) {
        geometry = new THREE.CylinderGeometry(room.width / 3, room.width / 3, markerHeight, 16)
      } else if (room.type === "elevator") {
        geometry = new THREE.BoxGeometry(room.width || 2, 2.5, room.depth || 2)
      } else {
        // COMPACT: Smaller room sizes
        geometry = new THREE.BoxGeometry(
          (room.width || 6) * 0.7, 
          markerHeight, 
          (room.depth || 6) * 0.7
        )
      }

      // Use different colors for elevator types
      let color
      if (room.type === "elevator") {
        color = room.elevatorType === "high-rise" ? ROOM_COLORS["elevator-high"] : ROOM_COLORS["elevator-low"]
      } else {
        color = ROOM_COLORS[room.type] || 0x6366f1
      }

      const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.8,
      })

      const marker = new THREE.Mesh(geometry, material)
      marker.position.set(room.x * 0.8, yPosition + markerHeight / 2, room.z * 0.8) // COMPACT: Scale positions
      marker.castShadow = true
      marker.receiveShadow = true
      marker.userData = { 
        roomName: room.name, 
        roomType: room.type,
        floor: floorNum,
        elevatorType: room.elevatorType
      }
      parent.add(marker)

      // COMPACT: Smaller labels
      createRoomLabel(parent, room.x * 0.8, yPosition + markerHeight + 1, room.z * 0.8, room.name, room.type)
    })
  }

  function createRoomLabel(parent, x, y, z, name, type) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    // COMPACT: Smaller label
    canvas.width = 96
    canvas.height = 48
    
    // Background
    context.fillStyle = '#1e293b'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Border
    context.strokeStyle = '#475569'
    context.lineWidth = 2
    context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
    
    // Text
    context.fillStyle = '#ffffff'
    context.font = 'bold 12px Arial'
    context.textAlign = 'center'
    context.fillText(name, canvas.width / 2, 20)
    
    context.fillStyle = '#94a3b8'
    context.font = '9px Arial'
    context.fillText(type.replace('_', ' '), canvas.width / 2, 32)
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true 
    })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(x, y, z)
    // COMPACT: Smaller label scale
    sprite.scale.set(4, 2, 1)
    
    parent.add(sprite)
  }

  function drawPath(startRoomName, endRoomName) {
    // Remove existing path
    if (pathLine) {
      scene.remove(pathLine)
    }

    const startRoom = findRoomByName(startRoomName)
    const endRoom = findRoomByName(endRoomName)

    if (!startRoom || !endRoom) {
      console.log("Could not find rooms for path:", startRoomName, endRoomName)
      return
    }

    const startFloor = getFloorFromRoomName(startRoomName)
    const endFloor = getFloorFromRoomName(endRoomName)

    const points = []

    // COMPACT: Scale positions for path
    const scaleFactor = 0.8
    const floorSpacing = 4

    // Start point
    points.push(new THREE.Vector3(
      startRoom.x * scaleFactor, 
      (startFloor - 1) * floorSpacing + 1, 
      startRoom.z * scaleFactor
    ))

    if (startFloor !== endFloor) {
      // Multi-floor path - find appropriate elevators based on floors
      const startElevators = ROOM_LAYOUT[startFloor].filter((r) => r.type === "elevator")
      let appropriateElevator = startElevators[0]
      
      // Choose elevator based on destination floor
      const lowRiseFloors = [1, 2, 3, 4, 5, 6, 7, 8]
      const highRiseFloors = [9, 10, 11, 12, 13]
      
      const shouldUseHighRise = highRiseFloors.includes(startFloor) || highRiseFloors.includes(endFloor)
      
      // Find appropriate elevator
      startElevators.forEach(elevator => {
        if ((shouldUseHighRise && elevator.elevatorType === "high-rise") ||
            (!shouldUseHighRise && elevator.elevatorType === "low-rise")) {
          appropriateElevator = elevator
        }
      })
      
      // Move to elevator
      points.push(new THREE.Vector3(
        appropriateElevator.x * scaleFactor, 
        (startFloor - 1) * floorSpacing + 1, 
        appropriateElevator.z * scaleFactor
      ))
      
      // Vertical movement through floors
      const floorDiff = endFloor - startFloor
      for (let i = 1; i <= Math.abs(floorDiff); i++) {
        const floorY = (startFloor - 1) * floorSpacing + i * floorSpacing * Math.sign(floorDiff)
        points.push(new THREE.Vector3(
          appropriateElevator.x * scaleFactor, 
          floorY + 1, 
          appropriateElevator.z * scaleFactor
        ))
      }

      // Find elevator on destination floor
      const endElevatorName = appropriateElevator.name.replace(startFloor.toString(), endFloor.toString())
      const endElevator = findRoomByName(endElevatorName)

      if (endElevator) {
        // Move from elevator to end room
        points.push(new THREE.Vector3(
          endElevator.x * scaleFactor, 
          (endFloor - 1) * floorSpacing + 1, 
          endElevator.z * scaleFactor
        ))
        points.push(new THREE.Vector3(
          endRoom.x * scaleFactor, 
          (endFloor - 1) * floorSpacing + 1, 
          endRoom.z * scaleFactor
        ))
      }
    } else {
      // Same floor - curved path
      const midX = (startRoom.x + endRoom.x) / 2 * scaleFactor
      const midZ = (startRoom.z + endRoom.z) / 2 * scaleFactor
      points.push(new THREE.Vector3(midX, (startFloor - 1) * floorSpacing + 3, midZ))
      points.push(new THREE.Vector3(
        endRoom.x * scaleFactor, 
        (endFloor - 1) * floorSpacing + 1, 
        endRoom.z * scaleFactor
      ))
    }

    const curve = new THREE.CatmullRomCurve3(points)
    const pathPoints = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints)
    const material = new THREE.LineBasicMaterial({ 
      color: 0x22c55e,
      linewidth: 3
    })
    
    pathLine = new THREE.Line(geometry, material)
    scene.add(pathLine)
  }

  // Animation loop
  function animate() {
    if (!state.is3DVisible) return

    requestAnimationFrame(animate)
    
    if (controls) {
      controls.update()
    }
    
    renderer.render(scene, camera)
  }

  // Handle window resize
  function onWindowResize() {
    if (!camera || !renderer) return
    
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight)
  }

  // Initialize
  checkOllamaConnection()

  // Initialize 3D scene
  setTimeout(() => {
    if (typeof THREE !== 'undefined') {
      initScene()
    } else {
      console.error("THREE.js failed to load")
    }
  }, 100)
})