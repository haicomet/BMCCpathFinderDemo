// BMCC Path Pointer - Main Application Logic

// Declare THREE variable as global
window.THREE = window.THREE || {}

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

      // Generate random intermediate floor
      const intermediateFloor = Math.floor(Math.random() * 3) + 8

      // Display route
      routeSteps.innerHTML = `
        <div class="route-step">
          <span class="step-badge">1</span>
          <span>Start at ${state.startLocation}</span>
        </div>
        <div class="route-step">
          <span class="step-badge">2</span>
          <span>Take elevator to Floor ${intermediateFloor}</span>
        </div>
        <div class="route-step">
          <span class="step-badge">3</span>
          <span>Arrive at ${state.endLocation}</span>
        </div>
      `

      routeInfo.style.display = "block"

      // Draw path in 3D scene
      if (scene) {
        drawPath(state.startLocation, state.endLocation)
      }

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

    // Create camera
    camera = new window.THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000)
    camera.position.set(0, 25, 35)
    camera.lookAt(0, 8, 0) // Look at the middle floor (Y=8)

    // Create renderer
    renderer = new window.THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight)
    sceneContainer.appendChild(renderer.domElement)

    controls = new window.THREE.OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true // Smooth camera movement
    controls.dampingFactor = 0.05
    controls.minDistance = 20 // Minimum zoom distance
    controls.maxDistance = 100 // Maximum zoom distance
    controls.maxPolarAngle = Math.PI / 2 // Prevent camera from going below floor

    // Add lights
    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
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

      // Create floor geometry
      const floorGeometry = new window.THREE.BoxGeometry(30, 0.5, 20)
      const floorMaterial = new window.THREE.MeshStandardMaterial({
        color: 0x334155, // All floors same color
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.6, // All floors same opacity
      })
      const floor = new window.THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.y = yPosition
      floorGroup.add(floor)

      // Add grid for each floor
      const gridHelper = new window.THREE.GridHelper(30, 30, 0x475569, 0x334155)
      gridHelper.position.y = yPosition + 0.3
      gridHelper.material.transparent = true
      gridHelper.material.opacity = 0.4 // All grids same opacity
      floorGroup.add(gridHelper)

      createStaircases(floorGroup, yPosition)

      createRoomMarkersForFloor(floorGroup, yPosition, floorNum)
    })

    floorMesh = floorGroup
    scene.add(floorMesh)
  }

  function createStaircases(parent, yPosition) {
    const staircaseGeometry = new window.THREE.BoxGeometry(3, 8, 3)
    const staircaseMaterial = new window.THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.7,
      metalness: 0.3,
    })

    // Left staircase
    const leftStaircase = new window.THREE.Mesh(staircaseGeometry, staircaseMaterial)
    leftStaircase.position.set(-16, yPosition + 4, 0)
    parent.add(leftStaircase)

    // Right staircase
    const rightStaircase = new window.THREE.Mesh(staircaseGeometry, staircaseMaterial)
    rightStaircase.position.set(16, yPosition + 4, 0)
    parent.add(rightStaircase)

    // Add staircase labels
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    canvas.width = 128
    canvas.height = 64
    context.fillStyle = "#ffffff"
    context.font = "bold 24px Arial"
    context.textAlign = "center"
    context.fillText("STAIRS", 64, 40)

    const texture = new window.THREE.CanvasTexture(canvas)
    const labelMaterial = new window.THREE.SpriteMaterial({ map: texture })

    const leftLabel = new window.THREE.Sprite(labelMaterial)
    leftLabel.position.set(-16, yPosition + 8, 0)
    leftLabel.scale.set(2, 1, 1)
    parent.add(leftLabel)

    const rightLabel = new window.THREE.Sprite(labelMaterial)
    rightLabel.position.set(16, yPosition + 8, 0)
    rightLabel.scale.set(2, 1, 1)
    parent.add(rightLabel)
  }

  function createRoomMarkersForFloor(parent, yPosition, floorNum) {
    const rooms = [
      { name: `${floorNum}01`, x: -12, z: -8 },
      { name: `${floorNum}02`, x: -8, z: -8 },
      { name: `${floorNum}03`, x: -4, z: -8 },
      { name: `${floorNum}04`, x: 0, z: -8 },
      { name: `${floorNum}05`, x: 4, z: -8 },
      { name: `${floorNum}06`, x: 8, z: -8 },
      { name: `${floorNum}07`, x: 12, z: -8 },
      { name: `${floorNum}08`, x: -8, z: 8 },
      { name: `${floorNum}09`, x: 0, z: 8 },
      { name: `${floorNum}10`, x: 8, z: 8 },
    ]

    rooms.forEach((room) => {
      const markerGeometry = new window.THREE.CylinderGeometry(0.5, 0.5, 1, 32)
      const markerMaterial = new window.THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x6366f1,
        emissiveIntensity: 0.3,
      })
      const marker = new window.THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(room.x, yPosition + 1, room.z)
      parent.add(marker)

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      canvas.width = 128
      canvas.height = 64
      context.fillStyle = "#ffffff"
      context.font = "bold 20px Arial"
      context.textAlign = "center"
      context.fillText(room.name, 64, 40)

      const texture = new window.THREE.CanvasTexture(canvas)
      const labelMaterial = new window.THREE.SpriteMaterial({ map: texture })
      const label = new window.THREE.Sprite(labelMaterial)
      label.position.set(room.x, yPosition + 2.5, room.z)
      label.scale.set(1.5, 0.75, 1)
      parent.add(label)
    })
  }

  function drawPath(startRoom, endRoom) {
    // Remove existing path
    if (pathLine) {
      scene.remove(pathLine)
    }

    // Parse room numbers to determine floors
    const startFloor = Math.floor(Number.parseInt(startRoom) / 100)
    const endFloor = Math.floor(Number.parseInt(endRoom) / 100)

    // Get room positions (simplified - in real app would look up actual positions)
    const startPos = { x: -10, y: (startFloor - 8) * 8, z: -5 }
    const endPos = { x: 10, y: (endFloor - 8) * 8, z: 5 }

    const points = []

    // Start at the starting room
    points.push(new window.THREE.Vector3(startPos.x, startPos.y + 1, startPos.z))

    // If different floors, navigate to nearest staircase
    if (startFloor !== endFloor) {
      // Determine which staircase is closer (left at x=-16 or right at x=16)
      const useLeftStairs = Math.abs(startPos.x - -16) < Math.abs(startPos.x - 16)
      const stairX = useLeftStairs ? -16 : 16

      // Move to staircase on start floor
      points.push(new window.THREE.Vector3(stairX, startPos.y + 1, 0))

      // Go up/down the stairs
      const floorDiff = endFloor - startFloor
      for (let i = 1; i <= Math.abs(floorDiff); i++) {
        const floorY = startPos.y + i * 8 * Math.sign(floorDiff)
        points.push(new window.THREE.Vector3(stairX, floorY + 1, 0))
      }

      // Move from staircase to end room on destination floor
      points.push(new window.THREE.Vector3(endPos.x, endPos.y + 1, endPos.z))
    } else {
      // Same floor - direct path with a slight curve
      points.push(new window.THREE.Vector3((startPos.x + endPos.x) / 2, startPos.y + 2, (startPos.z + endPos.z) / 2))
      points.push(new window.THREE.Vector3(endPos.x, endPos.y + 1, endPos.z))
    }

    const curve = new window.THREE.CatmullRomCurve3(points)
    const pathPoints = curve.getPoints(100)
    const pathGeometry = new window.THREE.BufferGeometry().setFromPoints(pathPoints)
    const pathMaterial = new window.THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 5,
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

  // Initialize button states
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
