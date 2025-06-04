// 3D Tetris Game
console.log('Game.js yükleniyor...');
class Tetris3D {
    constructor() {
        console.log('Tetris3D constructor çalışıyor...');
        this.init();
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupControls();
        this.setupBoard();
        this.setupPieces();
        this.setupEventListeners();
        this.gameLoop();
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.lines = 0;        this.gameOver = false;
        this.paused = false;        this.dropTime = 0;
        this.dropInterval = 1000; // 1 saniye        this.autoDropEnabled = true; // Otomatik düşme kontrolü
        this.shadowsEnabled = true; // Gölge projektör kontrolü
        this.shadowMesh = null; // Gölge mesh'i
        this.realShadowsEnabled = false; // Gerçek gölge kontrolü - başlangıçta kapalı
          // Snap to surface settings
        this.snapEnabled = true; // Yüzeye otomatik hizalama
        this.snapThreshold = 15; // Snap mesafe eşiği (derece)
        this.snapSmoothness = 0.1; // Snap geçiş yumuşaklığı
        this.snapFaces = [
            { name: 'front', theta: 0, phi: Math.PI / 3 },
            { name: 'right', theta: Math.PI / 2, phi: Math.PI / 3 },
            { name: 'back', theta: Math.PI, phi: Math.PI / 3 },
            { name: 'left', theta: -Math.PI / 2, phi: Math.PI / 3 },
            { name: 'top', theta: 0, phi: 0.1 }
        ];
        
        // Line clearing system
        this.completedLines = {
            '7x1': [],
            '7x2': [],
            '7x3': [],
            '7x4': [],
            '7x5': [],
            '7x6': [],
            '7x7': []
        };
        this.lineClearingInProgress = false;
        this.flashingBlocks = [];
        this.waitingForDecision = false;
        
        // Dialog gamepad navigation
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        this.updateUI();        
        
        // Set initial camera position
        this.updateCameraPosition();
        
        // Initialize compass
        this.updateCompass();
        
        // Initialize real shadows setting
        this.toggleRealShadows(this.realShadowsEnabled);
          // Initialize UI checkboxes to match game state
        this.initializeUI();
    }

    initializeUI() {
        // Set checkboxes to match game state
        const autoDropToggle = document.getElementById('auto-drop-toggle');
        if (autoDropToggle) {
            autoDropToggle.checked = this.autoDropEnabled;
        }
        
        const shadowToggle = document.getElementById('shadow-toggle');
        if (shadowToggle) {
            shadowToggle.checked = this.shadowsEnabled;
        }
        
        const realShadowToggle = document.getElementById('real-shadow-toggle');
        if (realShadowToggle) {
            realShadowToggle.checked = this.realShadowsEnabled;
        }
        
        const snapToggle = document.getElementById('snap-toggle');
        if (snapToggle) {
            snapToggle.checked = this.snapEnabled;
        };
    }

    init() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000011, 0.1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Board dimensions
        this.BOARD_WIDTH = 7;
        this.BOARD_HEIGHT = 7;
        this.BOARD_DEPTH = 14;
        
        // Board array - 3D array [x][y][z]
        this.board = [];
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            this.board[x] = [];
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                this.board[x][y] = [];
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    this.board[x][y][z] = null;
                }
            }
        }
          this.currentPiece = null;
        this.currentPosition = { x: 3, y: 13, z: 3 };
    }

    setupScene() {
        // Background
        const geometry = new THREE.SphereGeometry(100, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x001122,
            side: THREE.BackSide
        });
        const background = new THREE.Mesh(geometry, material);
        this.scene.add(background);
        
        // Particles
        this.addParticles();
    }

    addParticles() {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x4ecdc4,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights for atmosphere
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4];
        for (let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(colors[i], 0.3, 50);
            light.position.set(
                Math.cos(i * Math.PI / 2) * 15,
                5,
                Math.sin(i * Math.PI / 2) * 15
            );
            this.scene.add(light);
        }
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(12, 15, 12);
        this.camera.lookAt(3, 7, 3);
    }    setupControls() {
        this.keys = {};
        this.lastKeyTime = {};
        this.keyRepeatDelay = 150;
        
        // Mouse controls for camera
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            lastX: 0,
            lastY: 0
        };
        
        // Camera orbit settings
        this.cameraControls = {
            radius: 20,
            theta: Math.PI / 4, // horizontal angle
            phi: Math.PI / 3,   // vertical angle
            target: new THREE.Vector3(3, 7, 3)
        };        // Gamepad support
        this.gamepad = null;
        this.gamepadLastTime = {};
        this.gamepadRepeatDelay = 200;
        
        this.setupMouseControls();
        this.setupGamepadSupport();
    }

    setupBoard() {
        // Board boundaries
        this.boardGroup = new THREE.Group();
        this.scene.add(this.boardGroup);
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.BOARD_WIDTH, this.BOARD_HEIGHT);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(this.BOARD_WIDTH / 2 - 0.5, 0, this.BOARD_HEIGHT / 2 - 0.5);
        floor.receiveShadow = true;
        this.boardGroup.add(floor);
        
        // Walls
        this.createWalls();
        
        // Grid lines
        this.createGrid();
    }

    createWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });
        
        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(this.BOARD_WIDTH, this.BOARD_DEPTH);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(this.BOARD_WIDTH / 2 - 0.5, this.BOARD_DEPTH / 2, -0.5);
        this.boardGroup.add(backWall);
        
        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(this.BOARD_HEIGHT, this.BOARD_DEPTH);
        
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-0.5, this.BOARD_DEPTH / 2, this.BOARD_HEIGHT / 2 - 0.5);
        this.boardGroup.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(this.BOARD_WIDTH - 0.5, this.BOARD_DEPTH / 2, this.BOARD_HEIGHT / 2 - 0.5);
        this.boardGroup.add(rightWall);
    }    createGrid() {
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x666666, opacity: 0.5, transparent: true });
        
        // Floor grid
        for (let i = 0; i <= this.BOARD_WIDTH; i++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(i - 0.5, 0.01, -0.5),
                new THREE.Vector3(i - 0.5, 0.01, this.BOARD_HEIGHT - 0.5)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.boardGroup.add(line);
        }
        
        for (let i = 0; i <= this.BOARD_HEIGHT; i++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, 0.01, i - 0.5),
                new THREE.Vector3(this.BOARD_WIDTH - 0.5, 0.01, i - 0.5)
            ]);
            const line = new THREE.Line(geometry, gridMaterial);
            this.boardGroup.add(line);
        }        // Add wireframe grid lines around the entire play area for better visualization
        this.createWireframeGrid();
        
        // Add small cubes at grid intersections on the floor for precise alignment reference
        const dotGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                const dot = new THREE.Mesh(dotGeometry, dotMaterial);
                dot.position.set(x, 0.1, z);
                this.boardGroup.add(dot);
            }
        }
    }    createWireframeGrid() {
        const wireframeMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            opacity: 0.3, 
            transparent: true 
        });
        
        // Sadece kenar çizgileri - oyun alanının dış sınırları
        // Alt kenar çerçevesi (zemin seviyesi)
        const bottomFrame = [
            // Alt kenar dörtgeni
            [-0.5, 0, -0.5], [this.BOARD_WIDTH - 0.5, 0, -0.5], // Ön kenar
            [this.BOARD_WIDTH - 0.5, 0, -0.5], [this.BOARD_WIDTH - 0.5, 0, this.BOARD_HEIGHT - 0.5], // Sağ kenar
            [this.BOARD_WIDTH - 0.5, 0, this.BOARD_HEIGHT - 0.5], [-0.5, 0, this.BOARD_HEIGHT - 0.5], // Arka kenar
            [-0.5, 0, this.BOARD_HEIGHT - 0.5], [-0.5, 0, -0.5] // Sol kenar
        ];
        
        for (let i = 0; i < bottomFrame.length - 1; i += 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...bottomFrame[i]),
                new THREE.Vector3(...bottomFrame[i + 1])
            ]);
            const line = new THREE.Line(geometry, wireframeMaterial);
            this.boardGroup.add(line);
        }
        
        // Üst kenar çerçevesi (maksimum yükseklik)
        const topFrame = [
            [-0.5, this.BOARD_DEPTH, -0.5], [this.BOARD_WIDTH - 0.5, this.BOARD_DEPTH, -0.5],
            [this.BOARD_WIDTH - 0.5, this.BOARD_DEPTH, -0.5], [this.BOARD_WIDTH - 0.5, this.BOARD_DEPTH, this.BOARD_HEIGHT - 0.5],
            [this.BOARD_WIDTH - 0.5, this.BOARD_DEPTH, this.BOARD_HEIGHT - 0.5], [-0.5, this.BOARD_DEPTH, this.BOARD_HEIGHT - 0.5],
            [-0.5, this.BOARD_DEPTH, this.BOARD_HEIGHT - 0.5], [-0.5, this.BOARD_DEPTH, -0.5]
        ];
        
        for (let i = 0; i < topFrame.length - 1; i += 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...topFrame[i]),
                new THREE.Vector3(...topFrame[i + 1])
            ]);
            const line = new THREE.Line(geometry, wireframeMaterial);
            this.boardGroup.add(line);
        }
        
        // Dikey kenar çizgileri (köşelerde)
        const corners = [
            [-0.5, -0.5], // Sol ön
            [this.BOARD_WIDTH - 0.5, -0.5], // Sağ ön
            [this.BOARD_WIDTH - 0.5, this.BOARD_HEIGHT - 0.5], // Sağ arka
            [-0.5, this.BOARD_HEIGHT - 0.5] // Sol arka
        ];
        
        corners.forEach(([x, z]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, 0, z),
                new THREE.Vector3(x, this.BOARD_DEPTH, z)
            ]);
            const line = new THREE.Line(geometry, wireframeMaterial);
            this.boardGroup.add(line);
        });
    }

    setupPieces() {
        // Tetris piece definitions (3D)
        this.pieces = {
            I: [
                [
                    [[1], [1], [1], [1]]
                ]
            ],
            O: [
                [
                    [[1, 1], [1, 1]]
                ]
            ],
            T: [
                [
                    [[0, 1, 0], [1, 1, 1]]
                ]
            ],
            S: [
                [
                    [[0, 1, 1], [1, 1, 0]]
                ]
            ],
            Z: [
                [
                    [[1, 1, 0], [0, 1, 1]]
                ]
            ],
            J: [
                [
                    [[1, 0, 0], [1, 1, 1]]
                ]
            ],
            L: [
                [
                    [[0, 0, 1], [1, 1, 1]]
                ]
            ]
        };
        
        this.pieceColors = {
            I: 0x00f5ff,
            O: 0xffff00,
            T: 0xa000ff,
            S: 0x00ff00,
            Z: 0xff0000,
            J: 0x0000ff,
            L: 0xff8c00
        };
        
        this.spawnNewPiece();
    }    spawnNewPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        
        this.currentPiece = {
            type: randomType,
            shape: this.pieces[randomType][0],
            color: this.pieceColors[randomType],
            mesh: null
        };
        
        this.currentPosition = { x: 3, y: 13, z: 3 };
        
        this.createPieceMesh();
        
        // Check if game over
        if (this.checkCollision(this.currentPiece.shape, this.currentPosition)) {
            this.endGame();
        }
    }createPieceMesh() {
        if (this.currentPiece.mesh) {
            this.scene.remove(this.currentPiece.mesh);
        }
        
        this.currentPiece.mesh = new THREE.Group();
        
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);        const material = new THREE.MeshStandardMaterial({
            color: this.currentPiece.color,
            transparent: true,
            opacity: 0.9,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        
        const shape = this.currentPiece.shape;
        
        // Create blocks at their exact shape positions for perfect grid alignment
        for (let y = 0; y < shape.length; y++) {
            for (let z = 0; z < shape[y].length; z++) {
                for (let x = 0; x < shape[y][z].length; x++) {
                    if (shape[y][z][x]) {
                        const cube = new THREE.Mesh(geometry, material);
                        // Position blocks exactly as defined in the shape array
                        // This ensures perfect alignment with the grid system
                        cube.position.set(x, -y, z);
                        cube.castShadow = true;
                        cube.receiveShadow = true;
                        
                        // Add glow effect
                        const glowGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
                        const glowMaterial = new THREE.MeshBasicMaterial({
                            color: this.currentPiece.color,
                            transparent: true,
                            opacity: 0.2
                        });
                        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                        glow.position.copy(cube.position);
                        this.currentPiece.mesh.add(glow);
                        
                        this.currentPiece.mesh.add(cube);
                    }
                }
            }
        }
          this.updatePiecePosition();
        this.scene.add(this.currentPiece.mesh);
        
        // Create shadow projection if enabled
        this.updateShadowProjection();
    }    updatePiecePosition() {
        if (this.currentPiece.mesh) {
            // Convert grid coordinates to world coordinates
            // Grid coordinates are 0-6 for x,z and 0-13 for y
            // World coordinates need to align with the floor grid which goes from -0.5 to 6.5
            this.currentPiece.mesh.position.set(
                this.currentPosition.x,  // Grid coordinate aligns with world coordinate
                this.currentPosition.y,  // Y is height, so no conversion needed
                this.currentPosition.z   // Grid coordinate aligns with world coordinate
            );
        }
        
        // Update shadow projection when piece moves
        this.updateShadowProjection();
    }

    createShadowProjection() {
        // Remove existing shadow
        if (this.shadowMesh) {
            this.scene.remove(this.shadowMesh);
            this.shadowMesh = null;
        }

        if (!this.shadowsEnabled || !this.currentPiece) return;

        // Find landing position for the current piece
        const landingPosition = this.findLandingPosition();
        if (!landingPosition) return;

        // Create shadow mesh group
        this.shadowMesh = new THREE.Group();        const shadowGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const shadowMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ffff, // Daha parlak cyan renk
            transparent: true,
            opacity: 0.7, // Daha görünür opacity
            depthWrite: false,
            emissive: 0x004444 // Hafif parıltı efekti
        });

        const shape = this.currentPiece.shape;        // Create shadow blocks
        for (let y = 0; y < shape.length; y++) {
            for (let z = 0; z < shape[y].length; z++) {
                for (let x = 0; x < shape[y][z].length; x++) {
                    if (shape[y][z][x]) {
                        const worldX = landingPosition.x + x;
                        const worldY = landingPosition.y - y;
                        const worldZ = landingPosition.z + z;

                        // Find the surface this block will land on
                        const surfaceY = this.findSurfaceHeight(worldX, worldZ, worldY);
                        
                        if (surfaceY !== null) {
                            const shadowBlock = new THREE.Mesh(shadowGeometry, shadowMaterial);
                            shadowBlock.position.set(worldX, surfaceY + 0.05, worldZ);
                            this.shadowMesh.add(shadowBlock);
                            
                            // Add glow effect for better visibility
                            const glowGeometry = new THREE.BoxGeometry(1.0, 0.2, 1.0);
                            const glowMaterial = new THREE.MeshBasicMaterial({
                                color: 0x00ffff,
                                transparent: true,
                                opacity: 0.3,
                                depthWrite: false
                            });
                            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                            glow.position.set(worldX, surfaceY + 0.05, worldZ);
                            this.shadowMesh.add(glow);
                        }
                    }
                }
            }
        }

        this.scene.add(this.shadowMesh);
    }

    findLandingPosition() {
        // Start from current position and move down until collision
        let testPosition = { 
            x: this.currentPosition.x, 
            y: this.currentPosition.y, 
            z: this.currentPosition.z 
        };

        // Move down until we hit something
        while (testPosition.y > 0) {
            testPosition.y--;
            if (this.checkCollision(this.currentPiece.shape, testPosition)) {
                // Return the position just above the collision
                return { x: testPosition.x, y: testPosition.y + 1, z: testPosition.z };
            }
        }

        // If we reach the bottom without collision, land on the floor
        return { x: testPosition.x, y: 0, z: testPosition.z };
    }

    findSurfaceHeight(x, z, maxY) {
        // Check for existing blocks below the landing position
        for (let y = maxY - 1; y >= 0; y--) {
            if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                return y + 1; // Surface is one block above the existing block
            }
        }
        
        // If no blocks found, surface is the floor
        return 0;
    }    updateShadowProjection() {
        if (this.shadowsEnabled) {
            this.createShadowProjection();
        } else if (this.shadowMesh) {
            this.scene.remove(this.shadowMesh);
            this.shadowMesh = null;
        }
    }

    toggleRealShadows(enabled) {
        this.realShadowsEnabled = enabled;
        this.renderer.shadowMap.enabled = enabled;
        
        // Update all lights
        this.scene.traverse((object) => {
            if (object.isDirectionalLight || object.isPointLight || object.isSpotLight) {
                object.castShadow = enabled;
            }
        });
        
        // Update all meshes to cast/receive shadows
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                object.castShadow = enabled;
                object.receiveShadow = enabled;
            }
        });
        
        // Force renderer update
        this.renderer.shadowMap.needsUpdate = true;
    }

    checkCollision(shape, position, rotation = { x: 0, y: 0, z: 0 }) {
        // Simple collision detection (can be improved for rotations)
        for (let y = 0; y < shape.length; y++) {
            for (let z = 0; z < shape[y].length; z++) {
                for (let x = 0; x < shape[y][z].length; x++) {
                    if (shape[y][z][x]) {
                        const worldX = position.x + x;
                        const worldY = position.y - y;
                        const worldZ = position.z + z;
                        
                        // Check boundaries
                        if (worldX < 0 || worldX >= this.BOARD_WIDTH ||
                            worldY < 0 || worldY >= this.BOARD_DEPTH ||
                            worldZ < 0 || worldZ >= this.BOARD_HEIGHT) {
                            return true;
                        }
                        
                        // Check board collision
                        if (worldY < this.BOARD_DEPTH && this.board[worldX] && 
                            this.board[worldX][worldY] && this.board[worldX][worldY][worldZ]) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }    movePiece(dx, dy, dz) {
        const newPosition = {
            x: this.currentPosition.x + dx,
            y: this.currentPosition.y + dy,
            z: this.currentPosition.z + dz
        };
        
        if (!this.checkCollision(this.currentPiece.shape, newPosition)) {
            this.currentPosition = newPosition;
            this.updatePiecePosition();
            return true;
        }
        return false;
    }rotatePiece(axis) {
        // Create rotated shape
        let rotatedShape;
        
        switch (axis) {
            case 'y': // Yatay dönüş (en yaygın)
                rotatedShape = this.rotateShapeY(this.currentPiece.shape);
                break;
            case 'x': // X ekseni dönüş
                rotatedShape = this.rotateShapeX(this.currentPiece.shape);
                break;
            case 'z': // Z ekseni dönüş
                rotatedShape = this.rotateShapeZ(this.currentPiece.shape);
                break;
            default:
                return;
        }
          // Test if rotation is possible
        if (!this.checkCollision(rotatedShape, this.currentPosition)) {
            this.currentPiece.shape = rotatedShape;
            this.createPieceMesh();
        }
    }

    rotateShapeY(shape) {
        // 90 degree rotation around Y axis (most common in Tetris)
        const rotated = [];
        const height = shape.length;
        const depth = shape[0].length;
        const width = shape[0][0].length;
        
        for (let y = 0; y < height; y++) {
            rotated[y] = [];
            for (let z = 0; z < width; z++) {
                rotated[y][z] = [];
                for (let x = 0; x < depth; x++) {
                    rotated[y][z][x] = shape[y][depth - 1 - x][z];
                }
            }
        }
        
        return rotated;
    }

    rotateShapeX(shape) {
        // 90 degree rotation around X axis
        const rotated = [];
        const height = shape.length;
        const depth = shape[0].length;
        const width = shape[0][0].length;
        
        for (let y = 0; y < depth; y++) {
            rotated[y] = [];
            for (let z = 0; z < height; z++) {
                rotated[y][z] = [];
                for (let x = 0; x < width; x++) {
                    rotated[y][z][x] = shape[height - 1 - z][y] && shape[height - 1 - z][y][x] ? shape[height - 1 - z][y][x] : 0;
                }
            }
        }
        
        return rotated;
    }

    rotateShapeZ(shape) {
        // 90 degree rotation around Z axis
        const rotated = [];
        const height = shape.length;
        const depth = shape[0].length;
        const width = shape[0][0].length;
        
        for (let y = 0; y < width; y++) {
            rotated[y] = [];
            for (let z = 0; z < depth; z++) {
                rotated[y][z] = [];
                for (let x = 0; x < height; x++) {
                    rotated[y][z][x] = shape[x] && shape[x][z] && shape[x][z][width - 1 - y] ? shape[x][z][width - 1 - y] : 0;
                }
            }
        }
        
        return rotated;
    }    placePiece() {
        // Pause durumunda parça yerleştirme işlemini durdur
        if (this.paused) return;
        
        const shape = this.currentPiece.shape;
        console.log(`📦 Blok yerleştiriliyor: pozisyon (${this.currentPosition.x}, ${this.currentPosition.y}, ${this.currentPosition.z})`);
        
        for (let y = 0; y < shape.length; y++) {
            for (let z = 0; z < shape[y].length; z++) {
                for (let x = 0; x < shape[y][z].length; x++) {
                    if (shape[y][z][x]) {
                        const worldX = this.currentPosition.x + x;
                        const worldY = this.currentPosition.y - y;
                        const worldZ = this.currentPosition.z + z;
                        
                        console.log(`  🟦 Blok ekleniyor: board[${worldX}][${worldY}][${worldZ}]`);
                        
                        if (worldY >= 0 && worldY < this.BOARD_DEPTH) {
                            if (!this.board[worldX]) this.board[worldX] = [];
                            if (!this.board[worldX][worldY]) this.board[worldX][worldY] = [];
                            this.board[worldX][worldY][worldZ] = {
                                color: this.currentPiece.color,
                                mesh: null
                            };
                        }
                    }
                }
            }
        }
          this.scene.remove(this.currentPiece.mesh);
        
        // Remove shadow projection
        if (this.shadowMesh) {
            this.scene.remove(this.shadowMesh);
            this.shadowMesh = null;
        }
          this.createStaticBlocks();        console.log(`🔍 checkLines() çağrılıyor...`);
        
        // Board durumunu kontrol et
        console.log(`📊 BOARD DURUMU:`);
        for (let y = 0; y < Math.min(5, this.BOARD_DEPTH); y++) {
            let layerInfo = `Katman ${y}: `;
            let blockPositions = [];
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                        blockPositions.push(`(${x},${z})`);
                    }
                }
            }
            layerInfo += `${blockPositions.length} blok: ${blockPositions.join(', ')}`;
            console.log(layerInfo);
        }
        
        this.checkLines();
        this.spawnNewPiece();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Settings toggles
        document.getElementById('auto-drop-toggle').addEventListener('change', (e) => {
            this.autoDropEnabled = e.target.checked;
        });
        
        document.getElementById('shadow-toggle').addEventListener('change', (e) => {
            this.shadowsEnabled = e.target.checked;
            this.updateShadowProjection();
        });        document.getElementById('real-shadow-toggle').addEventListener('change', (e) => {
            this.toggleRealShadows(e.target.checked);
        });
        
        document.getElementById('snap-toggle').addEventListener('change', (e) => {
            this.snapEnabled = e.target.checked;
        });
        
        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
      setupMouseControls() {
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        });
          document.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.isDown) {
                const deltaX = e.clientX - this.mouse.lastX;
                const deltaY = e.clientY - this.mouse.lastY;
                
                this.cameraControls.theta -= deltaX * 0.01;
                this.cameraControls.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraControls.phi + deltaY * 0.01));
                
                this.updateCameraPosition();
                
                this.mouse.lastX = e.clientX;
                this.mouse.lastY = e.clientY;
            }
        });
        
        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraControls.radius = Math.max(5, Math.min(50, this.cameraControls.radius + e.deltaY * 0.01));
            this.updateCameraPosition();
        });
    }
    
    setupGamepadSupport() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad);
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
        });
    }
    
    handleKeyDown(e) {
        const now = Date.now();
        
        // Pause kontrolü - her zaman çalışır
        if (e.code === 'KeyP') {
            this.togglePause();
            return;
        }
        
        // Oyun bitmiş veya paused ise kontrolleri engelle (movement hariç)
        if (this.gameOver) return;        // Kamera snap - pause durumunda da çalışır
        if (e.code === 'Tab') {
            e.preventDefault();
            this.snapToNearestSurface();
            return;
        }
        
        // Snap toggle - pause durumunda da çalışır
        if (e.code === 'KeyX') {
            this.toggleSnapToSurface();
            return;
        }
        
        // Movement kontrolleri pause durumunda da çalışır
        if (!this.paused || this.isMovementKey(e.code)) {
            if (now - (this.lastKeyTime[e.code] || 0) < this.keyRepeatDelay) return;
            this.lastKeyTime[e.code] = now;
            
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveInCameraDirection('left');
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveInCameraDirection('right');
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    this.moveInCameraDirection('forward');
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (!this.autoDropEnabled) {
                        this.movePiece(0, -1, 0);
                    } else {
                        this.moveInCameraDirection('backward');
                    }
                    break;
                case 'KeyQ':
                    this.rotatePiece('y');
                    break;
                case 'KeyE':
                    this.rotatePiece('y');
                    break;
                case 'KeyZ':
                    this.rotatePiece('x');
                    break;
                case 'Space':
                    if (!this.paused) {
                        e.preventDefault();
                        this.dropPiece();
                    }
                    break;
            }
        }
    }
    
    isMovementKey(code) {
        const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyQ', 'KeyE', 'KeyZ'];
        return movementKeys.includes(code);
    }    updateCameraPosition() {
        const x = this.cameraControls.target.x + this.cameraControls.radius * Math.sin(this.cameraControls.phi) * Math.cos(this.cameraControls.theta);
        const y = this.cameraControls.target.y + this.cameraControls.radius * Math.cos(this.cameraControls.phi);
        const z = this.cameraControls.target.z + this.cameraControls.radius * Math.sin(this.cameraControls.phi) * Math.sin(this.cameraControls.theta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraControls.target);
        
        this.updateCompass();
    }
    
    updateCompass() {
        const compass = document.getElementById('compass-needle');
        if (compass) {
            const angle = this.cameraControls.theta * 180 / Math.PI;
            compass.style.transform = `rotate(${angle}deg)`;
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
      updateGamepad() {
        const gamepads = navigator.getGamepads();
        this.gamepad = null;
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepad = gamepads[i];
                break;
            }
        }
        
        if (!this.gamepad) return;
        
        const now = Date.now();
        
        // Pause button (LB) - always available
        if (this.gamepad.buttons[4] && this.gamepad.buttons[4].pressed) {
            if (now - (this.gamepadLastTime.pause || 0) > this.gamepadRepeatDelay) {
                this.togglePause();
                this.gamepadLastTime.pause = now;
            }
        }
        
        if (this.gameOver) return;
        
        // If dialog is visible, only handle dialog controls
        if (this.dialogVisible) {
            this.handleDialogGamepadInput(now);
            return;
        }
        
        // Game controls - only when no dialog is visible
        if (!this.paused || true) { // Movement her zaman aktif
            // D-pad and left stick movement
            const threshold = 0.3;
            
            // Left/Right
            if ((this.gamepad.buttons[14] && this.gamepad.buttons[14].pressed) || this.gamepad.axes[0] < -threshold) {
                if (now - (this.gamepadLastTime.left || 0) > this.gamepadRepeatDelay) {
                    this.moveInCameraDirection('left');
                    this.gamepadLastTime.left = now;
                }
            }
            
            if ((this.gamepad.buttons[15] && this.gamepad.buttons[15].pressed) || this.gamepad.axes[0] > threshold) {
                if (now - (this.gamepadLastTime.right || 0) > this.gamepadRepeatDelay) {
                    this.moveInCameraDirection('right');
                    this.gamepadLastTime.right = now;
                }
            }
            
            // Up/Down
            if ((this.gamepad.buttons[12] && this.gamepad.buttons[12].pressed) || this.gamepad.axes[1] < -threshold) {
                if (now - (this.gamepadLastTime.up || 0) > this.gamepadRepeatDelay) {
                    this.moveInCameraDirection('forward');
                    this.gamepadLastTime.up = now;
                }
            }
            
            if ((this.gamepad.buttons[13] && this.gamepad.buttons[13].pressed) || this.gamepad.axes[1] > threshold) {
                if (now - (this.gamepadLastTime.down || 0) > this.gamepadRepeatDelay) {
                    if (!this.autoDropEnabled) {
                        this.movePiece(0, -1, 0);
                    } else {
                        this.moveInCameraDirection('backward');
                    }
                    this.gamepadLastTime.down = now;
                }
            }
            
            // Rotation controls
            if (this.gamepad.buttons[1] && this.gamepad.buttons[1].pressed) {
                if (now - (this.gamepadLastTime.rotateY || 0) > this.gamepadRepeatDelay) {
                    this.rotatePiece('y');
                    this.gamepadLastTime.rotateY = now;
                }
            }
            
            if (this.gamepad.buttons[2] && this.gamepad.buttons[2].pressed) {
                if (now - (this.gamepadLastTime.rotateX || 0) > this.gamepadRepeatDelay) {
                    this.rotatePiece('x');
                    this.gamepadLastTime.rotateX = now;
                }
            }
            
            if (this.gamepad.buttons[3] && this.gamepad.buttons[3].pressed) {
                if (now - (this.gamepadLastTime.rotateZ || 0) > this.gamepadRepeatDelay) {
                    this.rotatePiece('z');
                    this.gamepadLastTime.rotateZ = now;
                }
            }
        }
        
        // Quick drop (A button) - sadece pause değilse
        if (!this.paused && this.gamepad.buttons[0] && this.gamepad.buttons[0].pressed) {
            if (now - (this.gamepadLastTime.drop || 0) > this.gamepadRepeatDelay) {
                this.dropPiece();
                this.gamepadLastTime.drop = now;
            }
        }
        
        // Camera snap to nearest surface (RB)
        if (this.gamepad.buttons[5] && this.gamepad.buttons[5].pressed) {
            if (now - (this.gamepadLastTime.snap || 0) > this.gamepadRepeatDelay) {
                this.snapToNearestSurface();
                this.gamepadLastTime.snap = now;
            }
        }
        
        // Snap toggle (Select/Back button)
        if (this.gamepad.buttons[8] && this.gamepad.buttons[8].pressed) {
            if (now - (this.gamepadLastTime.toggle || 0) > this.gamepadRepeatDelay) {
                this.toggleSnapToSurface();
                this.gamepadLastTime.toggle = now;
            }
        }
        
        // Camera control with right stick
        const rightStickX = this.gamepad.axes[2];
        const rightStickY = this.gamepad.axes[3];
        
        if (Math.abs(rightStickX) > 0.1 || Math.abs(rightStickY) > 0.1) {
            this.cameraControls.theta -= rightStickX * 0.03;
            this.cameraControls.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraControls.phi + rightStickY * 0.03));
            this.updateCameraPosition();
        }
        
        // Zoom with triggers
        const leftTrigger = this.gamepad.buttons[6] ? this.gamepad.buttons[6].value : 0;
        const rightTrigger = this.gamepad.buttons[7] ? this.gamepad.buttons[7].value : 0;
        
        if (leftTrigger > 0.1) {
            this.cameraControls.radius = Math.min(50, this.cameraControls.radius + leftTrigger * 0.5);
            this.updateCameraPosition();
        }
          if (rightTrigger > 0.1) {
            this.cameraControls.radius = Math.max(5, this.cameraControls.radius - rightTrigger * 0.5);
            this.updateCameraPosition();
        }
    }

    gameLoop() {
        const now = Date.now();
        
        // Auto drop - pause durumunda çalışmaz
        if (!this.paused && this.autoDropEnabled && this.currentPiece && now - this.dropTime > this.dropInterval) {
            this.dropTime = now;
            if (!this.movePiece(0, -1, 0)) {
                this.placePiece();
            }
        }
          // Update particles
        if (this.particles) {
            this.particles.rotation.x += 0.001;
            this.particles.rotation.y += 0.002;
        }
        
        // Update flash effect
        this.updateFlashEffect();
        
        // Update gamepad
        this.updateGamepad();
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    moveInCameraDirection(direction) {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        
        let dx = 0, dz = 0;
        
        switch (direction) {
            case 'forward':
                dx = Math.round(forward.x);
                dz = Math.round(forward.z);
                break;
            case 'backward':
                dx = -Math.round(forward.x);
                dz = -Math.round(forward.z);
                break;
            case 'left':
                dx = -Math.round(right.x);
                dz = -Math.round(right.z);
                break;
            case 'right':
                dx = Math.round(right.x);
                dz = Math.round(right.z);
                break;
        }
        
        this.movePiece(dx, 0, dz);
    }
    
    dropPiece() {
        while (this.movePiece(0, -1, 0)) {
            // Keep dropping until it can't move down
        }
        this.placePiece();
    }
    
    togglePause() {
        this.paused = !this.paused;
        this.showGamepadNotification(this.paused ? '⏸️ DURAKLATILDI' : '▶️ DEVAM EDİLİYOR');
        console.log(this.paused ? 'Oyun duraklatıldı' : 'Oyun devam ediyor');
    }
    
    alignCamera() {
        this.cameraControls.theta = Math.PI / 4;
        this.cameraControls.phi = Math.PI / 3;
        this.updateCameraPosition();
        this.showGamepadNotification('📐 Kamera hizalandı');
    }
    
    showGamepadNotification(message) {
        console.log(`🎮 ${message}`);
        // Could add visual notification here
    }
    
    handleDialogGamepadInput(now) {
        if (!this.dialogVisible || !this.gamepad) return;
        
        // Navigate between dialog options with D-pad left/right or left stick
        const threshold = 0.3;
        
        // Left navigation
        if ((this.gamepad.buttons[14] && this.gamepad.buttons[14].pressed) || this.gamepad.axes[0] < -threshold) {
            if (now - (this.gamepadLastTime.dialogLeft || 0) > this.gamepadRepeatDelay) {
                this.navigateDialog(-1);
                this.gamepadLastTime.dialogLeft = now;
            }
        }
        
        // Right navigation  
        if ((this.gamepad.buttons[15] && this.gamepad.buttons[15].pressed) || this.gamepad.axes[0] > threshold) {
            if (now - (this.gamepadLastTime.dialogRight || 0) > this.gamepadRepeatDelay) {
                this.navigateDialog(1);
                this.gamepadLastTime.dialogRight = now;
            }
        }
        
        // Select option with A button (button 0)
        if (this.gamepad.buttons[0] && this.gamepad.buttons[0].pressed) {
            if (now - (this.gamepadLastTime.dialogSelect || 0) > this.gamepadRepeatDelay) {
                this.selectDialogOption();
                this.gamepadLastTime.dialogSelect = now;
            }
        }
        
        // Cancel with B button (button 1) - select first option (safer choice)
        if (this.gamepad.buttons[1] && this.gamepad.buttons[1].pressed) {
            if (now - (this.gamepadLastTime.dialogCancel || 0) > this.gamepadRepeatDelay) {
                this.selectedDialogOption = 0;
                this.selectDialogOption();
                this.gamepadLastTime.dialogCancel = now;
            }
        }
    }
    
    navigateDialog(direction) {
        if (!this.dialogVisible || this.dialogOptions.length === 0) return;
        
        this.selectedDialogOption = (this.selectedDialogOption + direction + this.dialogOptions.length) % this.dialogOptions.length;
        this.updateDialogSelection();
        this.showGamepadNotification(`🎯 Option ${this.selectedDialogOption + 1} of ${this.dialogOptions.length}`);
    }
    
    updateDialogSelection() {
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach((btn, index) => {
            if (index === this.selectedDialogOption) {
                btn.classList.add('gamepad-selected');
                btn.style.border = '3px solid #ffd700';
                btn.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            } else {
                btn.classList.remove('gamepad-selected');
                btn.style.border = '2px solid transparent';
                btn.style.boxShadow = '';
            }
        });
    }
      selectDialogOption() {
        if (!this.dialogVisible || this.dialogOptions.length === 0) return;
        
        const selectedOption = this.dialogOptions[this.selectedDialogOption];
        if (selectedOption && selectedOption.action) {
            console.log(`🎮 Gamepad selected: ${selectedOption.text}`);
            selectedOption.action();
        }
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
        console.log('Oyun bitti! Skor:', this.score);
    }
    
    restartGame() {        // Reset game state
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        // Reset line clearing state
        this.resetLineClearingState();
        for (let key in this.completedLines) {
            this.completedLines[key] = [];
        }
        
        // Clear board
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y]) {
                        this.board[x][y][z] = null;
                    }
                }
            }
        }
        
        // Remove current piece
        if (this.currentPiece && this.currentPiece.mesh) {
            this.scene.remove(this.currentPiece.mesh);
        }
        
        // Remove static blocks
        if (this.staticBlocks) {
            this.scene.remove(this.staticBlocks);
        }
        
        // Remove shadow
        if (this.shadowMesh) {
            this.scene.remove(this.shadowMesh);
        }
        
        // Hide game over screen
        document.getElementById('game-over').classList.add('hidden');
        
        // Spawn new piece
        this.spawnNewPiece();
        
        // Update UI
        this.updateUI();
        
        console.log('Oyun yeniden başlatıldı');
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
      applyGravityToLayer(layerY) {
        // Make blocks fall down within this layer where lines were cleared
        for (let y = layerY; y < this.BOARD_DEPTH - 1; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && !this.board[x][y][z]) {
                        // Find block above to fall down
                        for (let searchY = y + 1; searchY < this.BOARD_DEPTH; searchY++) {
                            if (this.board[x][searchY] && this.board[x][searchY][z]) {
                                // Move this block down
                                this.board[x][y][z] = this.board[x][searchY][z];
                                this.board[x][searchY][z] = null;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }    // Snap to surface system
    applySnapToSurface() {
        const currentTheta = this.cameraControls.theta;
        const currentPhi = this.cameraControls.phi;
        
        // Find the closest snap face
        let closestFace = null;
        let minDistance = Infinity;
        
        for (const face of this.snapFaces) {
            // Calculate angular distance to this face
            let thetaDistance = Math.abs(this.normalizeAngle(currentTheta) - this.normalizeAngle(face.theta));
            let phiDistance = Math.abs(currentPhi - face.phi);
            
            // Handle wrap-around for theta (360 degrees)
            if (thetaDistance > Math.PI) {
                thetaDistance = 2 * Math.PI - thetaDistance;
            }
            
            const totalDistance = Math.sqrt(thetaDistance * thetaDistance + phiDistance * phiDistance);
            
            if (totalDistance < minDistance) {
                minDistance = totalDistance;
                closestFace = face;
            }
        }
        
        if (closestFace) {
            console.log(`📐 Snapping to ${closestFace.name} face`);
            this.cameraControls.theta = closestFace.theta;
            this.cameraControls.phi = closestFace.phi;
            this.updateCameraPosition();
        }
    }
    
    normalizeAngle(angle) {
        while (angle < -Math.PI) angle += 2 * Math.PI;
        while (angle > Math.PI) angle -= 2 * Math.PI;
        return angle;
    }
    
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }    snapToNearestSurface() {
        if (!this.snapEnabled) {
            this.showGamepadNotification('🧲 Snap kapalı - X ile aç');
            return;
        }
        
        this.applySnapToSurface();
        this.showGamepadNotification('📐 En yakın yüzeye snap yapıldı');
    }
      toggleSnapToSurface() {
        this.snapEnabled = !this.snapEnabled;
        this.showGamepadNotification(this.snapEnabled ? '🧲 Snap Aktif' : '🧲 Snap Kapalı');
        console.log(`🧲 Snap to surface: ${this.snapEnabled ? 'aktif' : 'kapalı'}`);
        
        // Update UI checkbox
        const snapToggle = document.getElementById('snap-toggle');
        if (snapToggle) {
            snapToggle.checked = this.snapEnabled;
        }
    }
    
    // Missing game methods
    createStaticBlocks() {
        // Remove existing static blocks
        if (this.staticBlocks) {
            this.scene.remove(this.staticBlocks);
        }
        
        this.staticBlocks = new THREE.Group();
        
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        
        // Create visual representation of placed blocks
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {                        const material = new THREE.MeshStandardMaterial({
                            color: this.board[x][y][z].color,
                            transparent: true,
                            opacity: 0.9,
                            emissive: 0x000000,
                            emissiveIntensity: 0
                        });
                        
                        const cube = new THREE.Mesh(geometry, material);
                        cube.position.set(x, y, z);
                        cube.castShadow = true;
                        cube.receiveShadow = true;
                        
                        // Add glow effect
                        const glowGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
                        const glowMaterial = new THREE.MeshBasicMaterial({
                            color: this.board[x][y][z].color,
                            transparent: true,
                            opacity: 0.2
                        });
                        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                        glow.position.copy(cube.position);
                        this.staticBlocks.add(glow);
                        
                        this.staticBlocks.add(cube);
                    }
                }
            }
        }
        
        this.scene.add(this.staticBlocks);
    }
      checkLines() {
        console.log('🔍 Comprehensive line checking...');
        
        if (this.waitingForDecision) {
            console.log('⏳ Already waiting for line clearing decision');
            return;
        }
        
        // Reset completed lines
        for (let key in this.completedLines) {
            this.completedLines[key] = [];
        }
        
        // Check all possible line combinations
        this.check7x1Lines();
        this.check7x2Lines();
        this.check7x3Lines();
        this.check7x4Lines();
        this.check7x5Lines();
        this.check7x6Lines();
        this.check7x7Lines();
        
        // Process the highest level completion found
        this.processLineCompletions();
    }
    
    check7x1Lines() {
        // Check horizontal lines (X-axis, 7 blocks long)
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                let lineComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    if (!this.board[x] || !this.board[x][y] || !this.board[x][y][z]) {
                        lineComplete = false;
                        break;
                    }
                }
                if (lineComplete) {
                    this.completedLines['7x1'].push({ type: 'horizontal-x', y, z });
                    console.log(`✅ 7x1 horizontal line found at y=${y}, z=${z}`);
                }
            }
        }
        
        // Check vertical lines (Z-axis, 7 blocks long)
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                let lineComplete = true;
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (!this.board[x] || !this.board[x][y] || !this.board[x][y][z]) {
                        lineComplete = false;
                        break;
                    }
                }
                if (lineComplete) {
                    this.completedLines['7x1'].push({ type: 'vertical-z', y, x });
                    console.log(`✅ 7x1 vertical line found at y=${y}, x=${x}`);
                }
            }
        }
    }
    
    check7x2Lines() {
        // Check 7x2 horizontal rectangles (X-Z plane)
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT - 1; z++) {
                let rectangleComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let zz = z; zz < z + 2; zz++) {
                        if (!this.board[x] || !this.board[x][y] || !this.board[x][y][zz]) {
                            rectangleComplete = false;
                            break;
                        }
                    }
                    if (!rectangleComplete) break;
                }
                if (rectangleComplete) {
                    this.completedLines['7x2'].push({ type: '7x2-xz', y, z });
                    console.log(`✅ 7x2 rectangle found at y=${y}, z=${z}-${z+1}`);
                }
            }
        }
    }
    
    check7x3Lines() {
        // Check 7x3 rectangles
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT - 2; z++) {
                let rectangleComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let zz = z; zz < z + 3; zz++) {
                        if (!this.board[x] || !this.board[x][y] || !this.board[x][y][zz]) {
                            rectangleComplete = false;
                            break;
                        }
                    }
                    if (!rectangleComplete) break;
                }
                if (rectangleComplete) {
                    this.completedLines['7x3'].push({ type: '7x3-xz', y, z });
                    console.log(`✅ 7x3 rectangle found at y=${y}, z=${z}-${z+2}`);
                }
            }
        }
    }
    
    check7x4Lines() {
        // Check 7x4 rectangles
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT - 3; z++) {
                let rectangleComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let zz = z; zz < z + 4; zz++) {
                        if (!this.board[x] || !this.board[x][y] || !this.board[x][y][zz]) {
                            rectangleComplete = false;
                            break;
                        }
                    }
                    if (!rectangleComplete) break;
                }
                if (rectangleComplete) {
                    this.completedLines['7x4'].push({ type: '7x4-xz', y, z });
                    console.log(`✅ 7x4 rectangle found at y=${y}, z=${z}-${z+3}`);
                }
            }
        }
    }
    
    check7x5Lines() {
        // Check 7x5 rectangles
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT - 4; z++) {
                let rectangleComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let zz = z; zz < z + 5; zz++) {
                        if (!this.board[x] || !this.board[x][y] || !this.board[x][y][zz]) {
                            rectangleComplete = false;
                            break;
                        }
                    }
                    if (!rectangleComplete) break;
                }
                if (rectangleComplete) {
                    this.completedLines['7x5'].push({ type: '7x5-xz', y, z });
                    console.log(`✅ 7x5 rectangle found at y=${y}, z=${z}-${z+4}`);
                }
            }
        }
    }
    
    check7x6Lines() {
        // Check 7x6 rectangles
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT - 5; z++) {
                let rectangleComplete = true;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let zz = z; zz < z + 6; zz++) {
                        if (!this.board[x] || !this.board[x][y] || !this.board[x][y][zz]) {
                            rectangleComplete = false;
                            break;
                        }
                    }
                    if (!rectangleComplete) break;
                }
                if (rectangleComplete) {
                    this.completedLines['7x6'].push({ type: '7x6-xz', y, z });
                    console.log(`✅ 7x6 rectangle found at y=${y}, z=${z}-${z+5}`);
                }
            }
        }
    }
    
    check7x7Lines() {
        // Check complete 7x7 layers
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            let layerComplete = true;
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (!this.board[x] || !this.board[x][y] || !this.board[x][y][z]) {
                        layerComplete = false;
                        break;
                    }
                }
                if (!layerComplete) break;
            }
            if (layerComplete) {
                this.completedLines['7x7'].push({ type: '7x7-layer', y });
                console.log(`✅ 7x7 COMPLETE LAYER found at y=${y}`);
            }
        }
    }
    
    processLineCompletions() {
        // Process from highest to lowest priority
        const priorities = ['7x7', '7x6', '7x5', '7x4', '7x3', '7x2', '7x1'];
        
        for (let priority of priorities) {
            if (this.completedLines[priority].length > 0) {
                console.log(`🎯 Processing ${priority} completions:`, this.completedLines[priority]);
                this.handleLineCompletion(priority, this.completedLines[priority]);
                return; // Process only the highest priority
            }
        }
    }
    
    handleLineCompletion(type, lines) {
        // Start flash effect
        this.startFlashEffect(type, lines);
        
        // Show appropriate warning/dialog based on type
        setTimeout(() => {
            switch (type) {
                case '7x1':
                    this.show7x1Dialog(lines);
                    break;
                case '7x2':
                    this.show7x2Warning(lines);
                    break;
                case '7x3':
                    this.show7x3Warning(lines);
                    break;
                case '7x4':
                    this.show7x4Warning(lines);
                    break;
                case '7x5':
                    this.show7x5Warning(lines);
                    break;
                case '7x6':
                    this.show7x6Warning(lines);
                    break;
                case '7x7':
                    this.show7x7MaxScore(lines);
                    break;
            }
        }, 1000); // Wait for flash effect to be visible
    }
    
    startFlashEffect(type, lines) {
        this.lineClearingInProgress = true;
        this.flashingBlocks = [];
        
        // Collect all blocks that should flash
        lines.forEach(line => {
            switch (line.type) {
                case 'horizontal-x':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        this.flashingBlocks.push({ x, y: line.y, z: line.z });
                    }
                    break;
                case 'vertical-z':
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        this.flashingBlocks.push({ x: line.x, y: line.y, z });
                    }
                    break;
                case '7x2-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 2; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
                case '7x3-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 3; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
                case '7x4-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 4; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
                case '7x5-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 5; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
                case '7x6-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 6; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
                case '7x7-layer':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                            this.flashingBlocks.push({ x, y: line.y, z });
                        }
                    }
                    break;
            }
        });
        
        console.log(`⚡ Starting flash effect for ${this.flashingBlocks.length} blocks`);
        this.flashStartTime = Date.now();
    }
    
    updateFlashEffect() {
        if (!this.lineClearingInProgress || this.flashingBlocks.length === 0) return;
        
        const elapsed = Date.now() - this.flashStartTime;
        const flashDuration = 500; // Flash for 500ms
        const flashFrequency = 100; // Flash every 100ms
        
        if (elapsed < flashDuration) {
            const shouldShow = Math.floor(elapsed / flashFrequency) % 2 === 0;
            
            // Update static blocks visual with flash effect
            this.updateFlashingBlocks(shouldShow);
        }
    }
      updateFlashingBlocks(visible) {
        if (!this.staticBlocks) return;
        
        this.staticBlocks.children.forEach(child => {
            if (child.isMesh) {
                const pos = child.position;
                const isFlashing = this.flashingBlocks.some(block => 
                    block.x === pos.x && block.y === pos.y && block.z === pos.z
                );
                
                if (isFlashing) {
                    child.visible = visible;
                    if (visible && child.material && child.material.emissive) {
                        // Add bright flash effect
                        child.material.emissive.setHex(0xffffff);
                        child.material.emissiveIntensity = 0.5;
                    } else if (child.material && child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                }
            }
        });    }
    
    // Dialog functions for line completion warnings
    show7x1Dialog(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x1';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>🎯 7x1 Line Completed!</h2>
                <p>${lines.length} line${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x1')">
                            <div class="choice-title">Clear Now</div>
                            <div class="choice-score">+${this.calculateScore('7x1', lines.length)} points</div>
                            <div class="choice-desc">Safe choice</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x1')">
                            <div class="choice-title">Wait for More</div>
                            <div class="choice-score">Potentially +${this.calculateScore('7x7', 1)} points</div>
                            <div class="choice-desc">Risk it for 7x2, 7x3... up to 7x7!</div>
                        </button>
                    </div>
                </div>
                  <div class="choice-warning">
                    ⚠️ Waiting is risky - more blocks will fall!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Clear Now",
                action: () => this.clearLinesImmediately('7x1')
            },
            {
                text: "Wait for More", 
                action: () => this.waitForMoreLines('7x1')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x2Warning(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x2';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>🔥 7x2 Rectangle Completed!</h2>
                <p>${lines.length} 7x2 rectangle${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x2')">
                            <div class="choice-title">Clear Now</div>
                            <div class="choice-score">+${this.calculateScore('7x2', lines.length)} points</div>
                            <div class="choice-desc">Good score</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x2')">
                            <div class="choice-title">Wait for 7x3+</div>
                            <div class="choice-score">Up to +${this.calculateScore('7x7', 1)} points</div>
                            <div class="choice-desc">High risk, high reward!</div>
                        </button>
                    </div>
                </div>
                  <div class="choice-warning">
                    ⚠️ Higher risk now - game speed increases!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Clear Now",
                action: () => this.clearLinesImmediately('7x2')
            },
            {
                text: "Wait for 7x3+", 
                action: () => this.waitForMoreLines('7x2')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x3Warning(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x3';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>🚀 7x3 Rectangle Completed!</h2>
                <p>${lines.length} 7x3 rectangle${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x3')">
                            <div class="choice-title">Clear Now</div>
                            <div class="choice-score">+${this.calculateScore('7x3', lines.length)} points</div>
                            <div class="choice-desc">Great score</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x3')">
                            <div class="choice-title">Push for 7x4+</div>
                            <div class="choice-score">Up to +${this.calculateScore('7x7', 1)} points</div>
                            <div class="choice-desc">Extreme risk!</div>
                        </button>
                    </div>
                </div>
                
                <div class="choice-warning">
                    ⚠️ DANGER ZONE - Speed boost activated!
                </div>
            </div>        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Clear Now",
                action: () => this.clearLinesImmediately('7x3')
            },
            {
                text: "Push for 7x4+", 
                action: () => this.waitForMoreLines('7x3')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x4Warning(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x4';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>⚡ 7x4 Rectangle Completed!</h2>
                <p>${lines.length} 7x4 rectangle${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x4')">
                            <div class="choice-title">Clear Now</div>
                            <div class="choice-score">+${this.calculateScore('7x4', lines.length)} points</div>
                            <div class="choice-desc">Excellent score</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x4')">
                            <div class="choice-title">Go for 7x5+</div>
                            <div class="choice-score">Up to +${this.calculateScore('7x7', 1)} points</div>
                            <div class="choice-desc">INSANE RISK!</div>
                        </button>
                    </div>
                </div>
                
                <div class="choice-warning">
                    ⚠️ CRITICAL ZONE - Maximum speed boost!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Clear Now",
                action: () => this.clearLinesImmediately('7x4')
            },
            {
                text: "Go for 7x5+", 
                action: () => this.waitForMoreLines('7x4')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x5Warning(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x5';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>💫 7x5 Rectangle Completed!</h2>
                <p>${lines.length} 7x5 rectangle${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x5')">
                            <div class="choice-title">Clear Now</div>
                            <div class="choice-score">+${this.calculateScore('7x5', lines.length)} points</div>
                            <div class="choice-desc">Incredible score</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x5')">
                            <div class="choice-title">Ultimate Risk</div>
                            <div class="choice-score">+${this.calculateScore('7x7', 1)} for 7x7!</div>
                            <div class="choice-desc">ALL OR NOTHING!</div>
                        </button>
                    </div>
                </div>
                
                <div class="choice-warning">
                    🔥 LEGENDARY ZONE - You're playing with fire!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Clear Now",
                action: () => this.clearLinesImmediately('7x5')
            },
            {
                text: "Ultimate Risk", 
                action: () => this.waitForMoreLines('7x5')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x6Warning(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x6';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>🌟 7x6 Rectangle Completed!</h2>
                <p>${lines.length} 7x6 rectangle${lines.length > 1 ? 's' : ''} completed!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x6')">
                            <div class="choice-title">Take the Victory</div>
                            <div class="choice-score">+${this.calculateScore('7x6', lines.length)} points</div>
                            <div class="choice-desc">LEGENDARY SCORE</div>
                        </button>
                    </div>
                    <div class="choice-option">
                        <button class="btn choice-btn choice-risk" onclick="window.game.waitForMoreLines('7x6')">
                            <div class="choice-title">GO FOR 7x7!</div>
                            <div class="choice-score">+${this.calculateScore('7x7', 1)} MAXIMUM!</div>
                            <div class="choice-desc">THE ULTIMATE GAMBLE!</div>
                        </button>
                    </div>
                </div>
                
                <div class="choice-warning">
                    💀 MAXIMUM DANGER - One line away from perfection!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options
        this.dialogOptions = [
            {
                text: "Take the Victory",
                action: () => this.clearLinesImmediately('7x6')
            },
            {
                text: "GO FOR 7x7!", 
                action: () => this.waitForMoreLines('7x6')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
      show7x7MaxScore(lines) {
        this.waitingForDecision = true;
        this.dialogVisible = true;
        this.dialogType = '7x7';
        this.selectedDialogOption = 0;
        
        const dialog = document.createElement('div');
        dialog.className = 'line-choice-dialog';
        dialog.innerHTML = `
            <div class="choice-content">
                <h2>👑 7x7 PERFECT LAYER!</h2>
                <p>MAXIMUM ACHIEVEMENT UNLOCKED!</p>
                
                <div class="choice-options">
                    <div class="choice-option">
                        <button class="btn choice-btn" onclick="window.game.clearLinesImmediately('7x7')" style="background: linear-gradient(45deg, #ffd700, #ffed4e) !important;">
                            <div class="choice-title">CLAIM MAXIMUM SCORE</div>
                            <div class="choice-score">+${this.calculateScore('7x7', lines.length)} POINTS!</div>
                            <div class="choice-desc">LEGENDARY ACHIEVEMENT!</div>
                        </button>
                    </div>
                </div>
                
                <div class="choice-warning" style="color: #ffd700;">
                    🏆 PERFECT TETRIS - You are a master!
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup gamepad options (only one option for 7x7)
        this.dialogOptions = [
            {
                text: "CLAIM MAXIMUM SCORE",
                action: () => this.clearLinesImmediately('7x7')
            }
        ];
        
        // Initialize gamepad selection
        setTimeout(() => this.updateDialogSelection(), 100);
    }
    
    calculateScore(type, count) {
        const baseScores = {
            '7x1': 100,
            '7x2': 300,
            '7x3': 800,
            '7x4': 1500,
            '7x5': 3000,
            '7x6': 6000,
            '7x7': 10000
        };
        
        return baseScores[type] * count * this.level;
    }
      clearLinesImmediately(type) {
        this.waitingForDecision = false;
        
        // Remove dialog and reset dialog state
        const dialog = document.querySelector('.line-choice-dialog');
        if (dialog) dialog.remove();
        
        // Reset dialog state
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        const lines = this.completedLines[type];
        if (!lines || lines.length === 0) return;
        
        console.log(`🧹 Clearing ${type} lines immediately:`, lines);
        
        // Clear the blocks
        this.clearBlocksByType(type, lines);
        
        // Calculate and add score
        const score = this.calculateScore(type, lines.length);
        this.score += score;
        this.lines += lines.length;
        
        console.log(`💰 Score +${score} (${type}: ${lines.length}, Level: ${this.level})`);
        
        // Create particle effects
        this.createLineParticles(lines[0].y, type);
        
        // Update level
        this.updateLevel();
        
        // Reset clearing state
        this.resetLineClearingState();
        
        this.updateUI();
        this.createStaticBlocks();
    }
      waitForMoreLines(type) {
        this.waitingForDecision = false;
        
        // Remove dialog and reset dialog state
        const dialog = document.querySelector('.line-choice-dialog');
        if (dialog) dialog.remove();
        
        // Reset dialog state
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        console.log(`⏳ Waiting for more lines beyond ${type}`);
        
        // Apply difficulty increase for waiting
        this.applyWaitingDifficultyIncrease(type);
        
        // Reset clearing state but keep the completed lines for potential combination
        this.resetLineClearingState();
        
        // Show notification
        this.showGamepadNotification(`💎 Waiting for bigger combo beyond ${type}!`);
    }
    
    applyWaitingDifficultyIncrease(type) {
        const difficultyMultipliers = {
            '7x1': 0.9,
            '7x2': 0.8,
            '7x3': 0.7,
            '7x4': 0.6,
            '7x5': 0.5,
            '7x6': 0.4
        };
        
        if (difficultyMultipliers[type]) {
            this.dropInterval = Math.max(50, this.dropInterval * difficultyMultipliers[type]);
            console.log(`📈 Difficulty increased! New drop interval: ${this.dropInterval}ms`);
        }
    }
    
    clearBlocksByType(type, lines) {
        lines.forEach(line => {
            switch (line.type) {
                case 'horizontal-x':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        if (this.board[x] && this.board[x][line.y]) {
                            this.board[x][line.y][line.z] = null;
                        }
                    }
                    break;
                case 'vertical-z':
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        if (this.board[line.x] && this.board[line.x][line.y]) {
                            this.board[line.x][line.y][z] = null;
                        }
                    }
                    break;
                case '7x2-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 2; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
                case '7x3-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 3; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
                case '7x4-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z, endZ = line.z + 4; z < endZ; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
                case '7x5-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z, endZ = line.z + 5; z < endZ; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
                case '7x6-xz':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z, endZ = line.z + 6; z < endZ; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
                case '7x7-layer':
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                            if (this.board[x] && this.board[x][line.y]) {
                                this.board[x][line.y][z] = null;
                            }
                        }
                    }
                    break;
            }
        });
        
        // Apply gravity to affected layers
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            this.applyGravityToLayer(y);
        }
    }
      resetLineClearingState() {
        this.lineClearingInProgress = false;
        this.flashingBlocks = [];
        this.waitingForDecision = false;
        
        // Reset dialog state as well
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        // Remove any remaining dialogs
        const dialog = document.querySelector('.line-choice-dialog');
        if (dialog) dialog.remove();
          // Reset all material emissive properties
        if (this.staticBlocks) {
            this.staticBlocks.children.forEach(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.visible = true;
                    child.material.emissive.setHex(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }
    }
    
    updateLevel() {
        if (this.lines >= this.level * 10) {
            this.level++;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            console.log(`🆙 Level up! New level: ${this.level}, Drop interval: ${this.dropInterval}ms`);
        }
    }
      // Removed old methods - replaced with comprehensive line clearing system
    
    createLineParticles(y, type) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.background = `radial-gradient(circle, ${this.getRandomColor()}, transparent)`;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }
    }
    
    createSuperParticles() {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle super-particle';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.background = `radial-gradient(circle, ${this.getRandomColor()}, transparent)`;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 4000);
        }
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // ...existing methods...
}

// Start the game when the page loads and Three.js is available
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, Three.js kontrol ediliyor...');
    
    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error('Three.js yüklenemedi!');
        return;
    }
    
    console.log('Three.js yüklendi, oyunu başlatıyoruz...');
    try {
        window.game = new Tetris3D();
        console.log('Oyun başarıyla başlatıldı!');
    } catch (error) {
        console.error('Oyun başlatılırken hata:', error);
    }
});
