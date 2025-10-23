// BMCC Path Pointer - Main Application Logic

// Declare THREE variable as global
window.THREE = window.THREE || {}

// ============================================================================
// ACCURATE BMCC FLOOR LAYOUT BASED ON DESMOS COORDINATES
// Coordinate system: X = left(-) to right(+), Z = back(-) to front(+)
// Converted from Desmos coordinates to 3D space
// ============================================================================

const ROOM_LAYOUT = {
  8: [
    // Floor 8 - Converted from Desmos coordinates
    { name: "801", x: 20, z: 20, type: "classroom" },
    { name: "802", x: 30, z: 20, type: "classroom" },
    { name: "803", x: 30, z: 25, type: "classroom" },
    { name: "804", x: 35, z: 30, type: "classroom" },
    { name: "805", x: 26, z: 9, type: "classroom" },
    { name: "806", x: 26, z: 0, type: "classroom" },
    { name: "807", x: 10, z: 0, type: "classroom" },
    { name: "808", x: 2, z: 20, type: "classroom" },
    { name: "809", x: 2, z: 25, type: "classroom" },
    { name: "810", x: 2, z: 30, type: "classroom" },
    { name: "811", x: 2, z: 40, type: "classroom" },
    { name: "812", x: 5, z: 35, type: "classroom" },
    { name: "8B", x: 30, z: 30, type: "bathroom" },
    { name: "8T", x: 26, z: 15, type: "tables" },
    { name: "8SR", x: 45, z: 40, type: "staff_room" },
    { name: "8C", x: 55, z: 40, type: "couches" },
    { name: "802S", x: 40, z: 10, type: "study_room" },
    { name: "8E1", x: 20, z: 15, type: "elevator" },
    { name: "8E2", x: 30, z: 15, type: "elevator" },
    { name: "8SS", x: 50, z: 25, type: "stairs" },
    { name: "8NS", x: 10, z: 20, type: "stairs" },
    { name: "8H1", x: 25, z: 25, type: "intersection" }
  ],
  9: [
    // Floor 9 - Same layout as Floor 8
    { name: "901", x: 20, z: 20, type: "classroom" },
    { name: "902", x: 30, z: 20, type: "classroom" },
    { name: "903", x: 30, z: 25, type: "classroom" },
    { name: "904", x: 35, z: 30, type: "classroom" },
    { name: "905", x: 26, z: 9, type: "classroom" },
    { name: "906", x: 26, z: 0, type: "classroom" },
    { name: "907", x: 10, z: 0, type: "classroom" },
    { name: "908", x: 2, z: 20, type: "classroom" },
    { name: "909", x: 2, z: 25, type: "classroom" },
    { name: "910", x: 2, z: 30, type: "classroom" },
    { name: "911", x: 2, z: 40, type: "classroom" },
    { name: "912", x: 5, z: 35, type: "classroom" },
    { name: "9B", x: 30, z: 30, type: "bathroom" },
    { name: "9T", x: 26, z: 15, type: "tables" },
    { name: "9SR", x: 45, z: 40, type: "staff_room" },
    { name: "9C", x: 55, z: 40, type: "couches" },
    { name: "902S", x: 40, z: 10, type: "study_room" },
    { name: "9E1", x: 20, z: 15, type: "elevator" },
    { name: "9E2", x: 30, z: 15, type: "elevator" },
    { name: "9SS", x: 50, z: 25, type: "stairs" },
    { name: "9NS", x: 10, z: 20, type: "stairs" },
    { name: "9H1", x: 25, z: 25, type: "intersection" }
  ],
  10: [
    // Floor 10 - Same layout as Floor 8
    { name: "1001", x: 20, z: 20, type: "classroom" },
    { name: "1002", x: 30, z: 20, type: "classroom" },
    { name: "1003", x: 30, z: 25, type: "classroom" },
    { name: "1004", x: 35, z: 30, type: "classroom" },
    { name: "1005", x: 26, z: 9, type: "classroom" },
    { name: "1006", x: 26, z: 0, type: "classroom" },
    { name: "1007", x: 10, z: 0, type: "classroom" },
    { name: "1008", x: 2, z: 20, type: "classroom" },
    { name: "1009", x: 2, z: 25, type: "classroom" },
    { name: "1010", x: 2, z: 30, type: "classroom" },
    { name: "1011", x: 2, z: 40, type: "classroom" },
    { name: "1012", x: 5, z: 35, type: "classroom" },
    { name: "10B", x: 30, z: 30, type: "bathroom" },
    { name: "10T", x: 26, z: 15, type: "tables" },
    { name: "10SR", x: 45, z: 40, type: "staff_room" },
    { name: "10C", x: 55, z: 40, type: "couches" },
    { name: "1002S", x: 40, z: 10, type: "study_room" },
    { name: "10E1", x: 20, z: 15, type: "elevator" },
    { name: "10E2", x: 30, z: 15, type: "elevator" },
    { name: "10SS", x: 50, z: 25, type: "stairs" },
    { name: "10NS", x: 10, z: 20, type: "stairs" },
    { name: "10H1", x: 25, z: 25, type: "intersection" }
  ]
}

// Color mapping for different room types
const ROOM_COLORS = {
  classroom: 0x6366f1,      // Indigo
  bathroom: 0xef4444,       // Red
  tables: 0xf59e0b,         // Amber
  staff_room: 0x8b5cf6,     // Violet
  couches: 0xec4899,        // Pink
  study_room: 0x10b981,     // Emerald
  elevator: 0x3b82f6,       // Blue
  stairs: 0xf97316,         // Orange
  intersection: 0x6b7280    // Gray
}

// ============================================================================

// State management
const state = {
  startLocation: "",
  endLocation: "",
  showRoute: false,
}

// Three.js scene variables
let scene, camera, renderer, floorMesh, pathLine
let controls

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const startInput = document.getElementById("start")
  const endInput = document.getElementById("end")
  const findRouteBtn = document.getElementById("findRouteBtn")
  const clearBtn = document.getElementById("clearBtn")
  const routeInfo = document.getElementById("routeInfo")
  const routeSteps = document.getElementById("routeSteps")
  const sceneContainer = document.querySelector(".scene")

  // Populate dropdowns with all available locations
  function populateDropdowns() {
    const allRooms = []
    for (const floor in ROOM_LAYOUT) {
      allRooms.push(...ROOM_LAYOUT[floor])
    }
    
    // Sort rooms by name for better organization
    allRooms.sort((a, b) => a.name.localeCompare(b.name))
    
    // Create datalist for autocomplete
    const datalist = document.createElement('datalist')
    datalist.id = 'roomList'
    
    allRooms.forEach(room => {
      const option = document.createElement('option')
      option.value = room.name
      option.textContent = `${room.name} (${room.type.replace('_', ' ')})`
      datalist.appendChild(option)
    })
    
    document.body.appendChild(datalist)
    
    // Set input attributes for autocomplete
    startInput.setAttribute('list', 'roomList')
    endInput.setAttribute('list', 'roomList')
  }

  // Update button states
  function updateButtonStates() {
    const hasLocations = state.startLocation && state.endLocation
    findRouteBtn.disabled = !hasLocations
    clearBtn.disabled = !state.showRoute
  }

  // Input handlers
  startInput.addEventListener("input", (e) => {
    state.startLocation = e.target.value
    updateButtonStates()
  })

  endInput.addEventListener("input", (e) => {
    state.endLocation = e.target.value
    updateButtonStates()
  })

  // Find route handler
  findRouteBtn.addEventListener("click", () => {
    if (state.startLocation && state.endLocation) {
      state.showRoute = true

      // Get actual room data
      const startRoom = findRoomByName(state.startLocation)
      const endRoom = findRoomByName(state.endLocation)

      if (startRoom && endRoom) {
        // Display route information
        const startFloor = getFloorFromRoomName(state.startLocation)
        const endFloor = getFloorFromRoomName(state.endLocation)
        
        let routeHTML = `
          <div class="route-step">
            <span class="step-badge">1</span>
            <span>Start at ${state.startLocation} (Floor ${startFloor})</span>
          </div>
        `

        if (startFloor !== endFloor) {
          // Use stairs for floor changes
          routeHTML += `
            <div class="route-step">
              <span class="step-badge">2</span>
              <span>Take stairs ${startFloor < endFloor ? 'up' : 'down'} to Floor ${endFloor}</span>
            </div>
          `
        }

        routeHTML += `
          <div class="route-step">
            <span class="step-badge">${startFloor === endFloor ? '2' : '3'}</span>
            <span>Arrive at ${state.endLocation} (Floor ${endFloor})</span>
          </div>
        `

        routeSteps.innerHTML = routeHTML

        // Draw path in 3D scene
        if (scene) {
          drawPath(state.startLocation, state.endLocation)
        }
      } else {
        routeSteps.innerHTML = `<div class="route-step"><span>Error: Could not find one or both locations</span></div>`
      }

      routeInfo.style.display = "block"
      updateButtonStates()
    }
  })

  // Clear route handler
  clearBtn.addEventListener("click", () => {
    state.startLocation = ""
    state.endLocation = ""
    state.showRoute = false

    startInput.value = ""
    endInput.value = ""
    routeInfo.style.display = "none"

    // Remove path from 3D scene
    if (pathLine) {
      scene.remove(pathLine)
      pathLine = null
    }

    updateButtonStates()
  })

  // Helper function to find room by name
  function findRoomByName(roomName) {
    for (const floor in ROOM_LAYOUT) {
      const room = ROOM_LAYOUT[floor].find(r => r.name === roomName)
      if (room) return room
    }
    return null
  }

  // Helper function to get floor number from room name
  function getFloorFromRoomName(roomName) {
    if (roomName.startsWith('10')) return 10
    if (roomName.startsWith('9')) return 9
    if (roomName.startsWith('8')) return 8
    return parseInt(roomName.charAt(0)) || 8
  }

  // Initialize Three.js scene
  function initScene() {
    // Remove placeholder
    const placeholder = document.querySelector(".scene-placeholder")
    if (placeholder) {
      placeholder.remove()
    }

    // Create scene
    scene = new window.THREE.Scene()
    scene.background = new window.THREE.Color(0x0f172a)

    // Create camera - Better starting position
    camera = new window.THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000)
    camera.position.set(25, 35, 45) // Better viewing angle
    camera.lookAt(25, 8, 25)

    // Create renderer
    renderer = new window.THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight)
    sceneContainer.appendChild(renderer.domElement)

    // Better orbit controls
    controls = new window.THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 15
    controls.maxDistance = 80
    controls.maxPolarAngle = Math.PI / 1.8 // Allow looking more from the top
    controls.target.set(25, 8, 25) // Center on the building

    // Add lights
    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(30, 50, 30)
    scene.add(directionalLight)

    // Create floor
    createFloor()

    // Handle window resize
    window.addEventListener("resize", onWindowResize)

    // Start animation loop
    animate()
  }

  // Create 3D floor representation
  function createFloor() {
    // Remove existing floor if any
    if (floorMesh) {
      scene.remove(floorMesh)
    }

    const floors = [8, 9, 10]
    const floorGroup = new window.THREE.Group()

    floors.forEach((floorNum, index) => {
      const yPosition = index * 8 // Stack floors 8 units apart vertically

      // Create floor geometry (adjusted to fit actual layout)
      const floorGeometry = new window.THREE.BoxGeometry(60, 0.5, 50)
      const floorMaterial = new window.THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.6,
      })
      const floor = new window.THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.set(25, yPosition, 20) // Center the floor
      floorGroup.add(floor)

      // Add grid for each floor
      const gridHelper = new window.THREE.GridHelper(60, 60, 0x475569, 0x334155)
      gridHelper.position.set(25, yPosition + 0.3, 20)
      gridHelper.material.transparent = true
      gridHelper.material.opacity = 0.4
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
      // Different geometry based on room type
      let markerGeometry
      let markerHeight = 1.5
      
      if (room.type === 'elevator') {
        markerGeometry = new window.THREE.BoxGeometry(2, 3, 2)
        markerHeight = 1.5
      } else if (room.type === 'stairs') {
        markerGeometry = new window.THREE.BoxGeometry(3, 2, 3)
        markerHeight = 1
      } else {
        markerGeometry = new window.THREE.CylinderGeometry(0.8, 0.8, markerHeight, 32)
      }

      const markerMaterial = new window.THREE.MeshStandardMaterial({
        color: ROOM_COLORS[room.type] || 0x6366f1,
        emissive: ROOM_COLORS[room.type] || 0x6366f1,
        emissiveIntensity: 0.3,
      })
      
      const marker = new window.THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(room.x, yPosition + markerHeight/2, room.z)
      marker.userData = { roomName: room.name, roomType: room.type }
      parent.add(marker)

      // Create label for important rooms
      if (room.type !== 'intersection') {
        createRoomLabel(parent, room.x, yPosition + markerHeight + 1.5, room.z, room.name, room.type)
      }
    })
  }

  function createRoomLabel(parent, x, y, z, name, type) {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    canvas.width = 128
    canvas.height = 64
    
    // Background
    context.fillStyle = "#1e293b"
    context.fillRect(0, 0, 128, 64)
    
    // Border
    context.strokeStyle = ROOM_COLORS[type] || "#6366f1"
    context.lineWidth = 2
    context.strokeRect(1, 1, 126, 62)
    
    // Text
    context.fillStyle = "#ffffff"
    context.font = "bold 16px Arial"
    context.textAlign = "center"
    context.fillText(name, 64, 30)
    
    context.font = "12px Arial"
    context.fillStyle = "#94a3b8"
    context.fillText(type.replace('_', ' '), 64, 50)

    const texture = new window.THREE.CanvasTexture(canvas)
    const labelMaterial = new window.THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    })
    
    const label = new window.THREE.Sprite(labelMaterial)
    label.position.set(x, y, z)
    label.scale.set(3, 1.5, 1)
    parent.add(label)
  }

  function drawPath(startRoomName, endRoomName) {
    // Remove existing path
    if (pathLine) {
      scene.remove(pathLine)
    }

    // Find room positions
    const startRoom = findRoomByName(startRoomName)
    const endRoom = findRoomByName(endRoomName)

    if (!startRoom || !endRoom) return

    // Parse room numbers to determine floors
    const startFloor = getFloorFromRoomName(startRoomName)
    const endFloor = getFloorFromRoomName(endRoomName)

    const points = []

    // Start at the starting room
    points.push(new window.THREE.Vector3(startRoom.x, (startFloor - 8) * 8 + 2, startRoom.z))

    // If different floors, navigate to nearest stairs
    if (startFloor !== endFloor) {
      // Find nearest stairs on start floor
      const startStairs = ROOM_LAYOUT[startFloor].filter(r => r.type === 'stairs')
      let nearestStairs = startStairs[0]
      let minDistance = Infinity

      startStairs.forEach(stair => {
        const distance = Math.sqrt(
          Math.pow(startRoom.x - stair.x, 2) + 
          Math.pow(startRoom.z - stair.z, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          nearestStairs = stair
        }
      })

      // Move to stairs on start floor
      points.push(new window.THREE.Vector3(nearestStairs.x, (startFloor - 8) * 8 + 2, nearestStairs.z))

      // Go up/down the stairs
      const floorDiff = endFloor - startFloor
      for (let i = 1; i <= Math.abs(floorDiff); i++) {
        const floorY = (startFloor - 8) * 8 + i * 8 * Math.sign(floorDiff)
        points.push(new window.THREE.Vector3(nearestStairs.x, floorY + 2, nearestStairs.z))
      }

      // Find corresponding stairs on destination floor
      const endStairsName = nearestStairs.name.replace(startFloor.toString(), endFloor.toString())
      const endStairs = findRoomByName(endStairsName)

      if (endStairs) {
        // Move from stairs to end room on destination floor
        points.push(new window.THREE.Vector3(endStairs.x, (endFloor - 8) * 8 + 2, endStairs.z))
        points.push(new window.THREE.Vector3(endRoom.x, (endFloor - 8) * 8 + 2, endRoom.z))
      }
    } else {
      // Same floor - direct path with a slight curve
      const midX = (startRoom.x + endRoom.x) / 2
      const midZ = (startRoom.z + endRoom.z) / 2
      points.push(new window.THREE.Vector3(midX, (startFloor - 8) * 8 + 4, midZ))
      points.push(new window.THREE.Vector3(endRoom.x, (endFloor - 8) * 8 + 2, endRoom.z))
    }

    const curve = new window.THREE.CatmullRomCurve3(points)
    const pathPoints = curve.getPoints(100)
    const pathGeometry = new window.THREE.BufferGeometry().setFromPoints(pathPoints)
    const pathMaterial = new window.THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 3,
    })

    pathLine = new window.THREE.Line(pathGeometry, pathMaterial)
    scene.add(pathLine)
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate)

    if (controls) {
      controls.update()
    }

    renderer.render(scene, camera)
  }

  // Handle window resize
  function onWindowResize() {
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight)
  }

  // Initialize
  populateDropdowns()
  updateButtonStates()

  // Initialize 3D scene after a short delay to ensure THREE is loaded
  setTimeout(() => {
    if (typeof window.THREE !== "undefined") {
      initScene()
    } else {
      console.error("THREE.js failed to load from CDN")
    }
  }, 100)
})