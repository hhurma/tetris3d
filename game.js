// 3D Tetris Game
console.log('Game.js yükleniyor...');
class Tetris3D {    constructor() {
        console.log('Tetris3D constructor çalışıyor...');
        this.init();
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupControls();
        this.setupBoard();
        this.setupPieces();
        this.setupEventListeners();
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.lines = 0;this.gameOver = false;
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
        
        // Track lines that are being waited on to prevent re-detection
        this.waitingLines = {
            '7x1': [],
            '7x2': [],
            '7x3': [],
            '7x4': [],
            '7x5': [],
            '7x6': [],
            '7x7': []
        };
        
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
          // Initialize visual settings
        this.initializeVisualSettings();
        
        // Start the game loop after all initialization is complete
        this.gameLoop();
    }
      initializeVisualSettings() {
        // Default visual settings
        const defaultSettings = {
            backgroundColor: '#667eea',
            backgroundColor2: '#764ba2',
            brightness: 1,
            contrast: 1,
            bloom: false,
            vignette: false,
            blur: 0,
            saturation: 1,
            hue: 0,
            // Lighting settings
            ambientLight: 1.2,
            directionalLight: 2.0,
            fillLight: 0.3,
            rimLight: 0.2
        };
        
        // Load settings from localStorage or use defaults
        const savedSettings = localStorage.getItem('tetris3d-visual-settings');
        if (savedSettings) {
            try {
                this.visualSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
                console.log('🎨 Visual settings loaded from localStorage');
            } catch (e) {
                console.warn('⚠️ Failed to load visual settings, using defaults');
                this.visualSettings = { ...defaultSettings };
            }
        } else {
            this.visualSettings = { ...defaultSettings };
        }
        
        // Set up visual settings event listeners
        this.setupVisualSettingsListeners();
        
        // Apply loaded settings to UI controls
        this.loadVisualSettingsToUI();
        
        // Apply initial visual settings
        this.applyVisualSettings();
    }
      setupVisualSettingsListeners() {
        // Background color controls
        const backgroundColorInput = document.getElementById('background-color');
        const backgroundColor2Input = document.getElementById('background-color-2');
        
        if (backgroundColorInput) {
            backgroundColorInput.addEventListener('change', (e) => {
                this.visualSettings.backgroundColor = e.target.value;
                this.updateBackgroundGradient();
                this.saveVisualSettings();
            });
        }
        
        if (backgroundColor2Input) {
            backgroundColor2Input.addEventListener('change', (e) => {
                this.visualSettings.backgroundColor2 = e.target.value;
                this.updateBackgroundGradient();
                this.saveVisualSettings();
            });
        }
        
        // Lighting controls
        const ambientLightInput = document.getElementById('ambient-light');
        const ambientLightValue = document.getElementById('ambient-light-value');
        
        if (ambientLightInput) {
            ambientLightInput.addEventListener('input', (e) => {
                this.visualSettings.ambientLight = parseFloat(e.target.value);
                if (ambientLightValue) {
                    ambientLightValue.textContent = Math.round(this.visualSettings.ambientLight * 100) + '%';
                }
                this.applyLightingEffects();
                this.saveVisualSettings();
            });
        }
        
        const directionalLightInput = document.getElementById('directional-light');
        const directionalLightValue = document.getElementById('directional-light-value');
        
        if (directionalLightInput) {
            directionalLightInput.addEventListener('input', (e) => {
                this.visualSettings.directionalLight = parseFloat(e.target.value);
                if (directionalLightValue) {
                    directionalLightValue.textContent = Math.round(this.visualSettings.directionalLight * 100) + '%';
                }
                this.applyLightingEffects();
                this.saveVisualSettings();
            });
        }
        
        const fillLightInput = document.getElementById('fill-light');
        const fillLightValue = document.getElementById('fill-light-value');
        
        if (fillLightInput) {
            fillLightInput.addEventListener('input', (e) => {
                this.visualSettings.fillLight = parseFloat(e.target.value);
                if (fillLightValue) {
                    fillLightValue.textContent = Math.round(this.visualSettings.fillLight * 100) + '%';
                }
                this.applyLightingEffects();
                this.saveVisualSettings();
            });
        }
        
        const rimLightInput = document.getElementById('rim-light');
        const rimLightValue = document.getElementById('rim-light-value');
        
        if (rimLightInput) {
            rimLightInput.addEventListener('input', (e) => {
                this.visualSettings.rimLight = parseFloat(e.target.value);
                if (rimLightValue) {
                    rimLightValue.textContent = Math.round(this.visualSettings.rimLight * 100) + '%';
                }
                this.applyLightingEffects();
                this.saveVisualSettings();
            });
        }

        // Brightness control
        const brightnessInput = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightness-value');
        
        if (brightnessInput) {
            brightnessInput.addEventListener('input', (e) => {
                this.visualSettings.brightness = parseFloat(e.target.value);
                if (brightnessValue) {
                    brightnessValue.textContent = Math.round(this.visualSettings.brightness * 100) + '%';
                }
                this.applyLightingEffects();
                this.applyPostProcessingEffects();
                this.saveVisualSettings();
            });
        }
        
        // Contrast control
        const contrastInput = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrast-value');
        
        if (contrastInput) {
            contrastInput.addEventListener('input', (e) => {
                this.visualSettings.contrast = parseFloat(e.target.value);
                if (contrastValue) {
                    contrastValue.textContent = Math.round(this.visualSettings.contrast * 100) + '%';
                }
                this.applyLightingEffects();
                this.applyPostProcessingEffects();
                this.saveVisualSettings();
            });
        }
        
        // Bloom effect toggle
        const bloomToggle = document.getElementById('bloom-toggle');
        if (bloomToggle) {
            bloomToggle.addEventListener('change', (e) => {
                this.visualSettings.bloom = e.target.checked;
                this.applyPostProcessingEffects();
                this.saveVisualSettings();
            });
        }
        
        // Vignette effect toggle
        const vignetteToggle = document.getElementById('vignette-toggle');
        if (vignetteToggle) {
            vignetteToggle.addEventListener('change', (e) => {
                this.visualSettings.vignette = e.target.checked;
                this.applyPostProcessingEffects();
                this.saveVisualSettings();
            });
        }
        
        // Blur control
        const blurInput = document.getElementById('blur');
        const blurValue = document.getElementById('blur-value');
        
        if (blurInput) {
            blurInput.addEventListener('input', (e) => {
                this.visualSettings.blur = parseFloat(e.target.value);
                if (blurValue) {
                    blurValue.textContent = this.visualSettings.blur + 'px';
                }
                this.applyPostProcessingEffects();
                this.saveVisualSettings();
            });
        }
        
        // Saturation control
        const saturationInput = document.getElementById('saturation');
        const saturationValue = document.getElementById('saturation-value');
        
        if (saturationInput) {
            saturationInput.addEventListener('input', (e) => {
                this.visualSettings.saturation = parseFloat(e.target.value);
                if (saturationValue) {
                    saturationValue.textContent = Math.round(this.visualSettings.saturation * 100) + '%';
                }
                this.applyColorAdjustments();
                this.saveVisualSettings();
            });
        }
        
        // Hue control
        const hueInput = document.getElementById('hue');
        const hueValue = document.getElementById('hue-value');
        
        if (hueInput) {
            hueInput.addEventListener('input', (e) => {
                this.visualSettings.hue = parseInt(e.target.value);
                if (hueValue) {
                    hueValue.textContent = this.visualSettings.hue + '°';
                }
                this.applyColorAdjustments();
                this.saveVisualSettings();
            });
        }
        
        // Reset button
        const resetBtn = document.getElementById('reset-visual-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetVisualSettings();
            });
        }
    }
      loadVisualSettingsToUI() {
        // Load visual settings to UI controls
        const backgroundColorInput = document.getElementById('background-color');
        const backgroundColor2Input = document.getElementById('background-color-2');
        const ambientLightInput = document.getElementById('ambient-light');
        const directionalLightInput = document.getElementById('directional-light');
        const fillLightInput = document.getElementById('fill-light');
        const rimLightInput = document.getElementById('rim-light');
        const brightnessInput = document.getElementById('brightness');
        const contrastInput = document.getElementById('contrast');
        const bloomToggle = document.getElementById('bloom-toggle');
        const vignetteToggle = document.getElementById('vignette-toggle');
        const blurInput = document.getElementById('blur');
        const saturationInput = document.getElementById('saturation');
        const hueInput = document.getElementById('hue');
        
        // Load values to inputs
        if (backgroundColorInput) backgroundColorInput.value = this.visualSettings.backgroundColor;
        if (backgroundColor2Input) backgroundColor2Input.value = this.visualSettings.backgroundColor2;
        if (ambientLightInput) ambientLightInput.value = this.visualSettings.ambientLight;
        if (directionalLightInput) directionalLightInput.value = this.visualSettings.directionalLight;
        if (fillLightInput) fillLightInput.value = this.visualSettings.fillLight;
        if (rimLightInput) rimLightInput.value = this.visualSettings.rimLight;
        if (brightnessInput) brightnessInput.value = this.visualSettings.brightness;
        if (contrastInput) contrastInput.value = this.visualSettings.contrast;
        if (bloomToggle) bloomToggle.checked = this.visualSettings.bloom;
        if (vignetteToggle) vignetteToggle.checked = this.visualSettings.vignette;
        if (blurInput) blurInput.value = this.visualSettings.blur;
        if (saturationInput) saturationInput.value = this.visualSettings.saturation;
        if (hueInput) hueInput.value = this.visualSettings.hue;
        
        // Update value displays
        const ambientLightValue = document.getElementById('ambient-light-value');
        const directionalLightValue = document.getElementById('directional-light-value');
        const fillLightValue = document.getElementById('fill-light-value');
        const rimLightValue = document.getElementById('rim-light-value');
        const brightnessValue = document.getElementById('brightness-value');
        const contrastValue = document.getElementById('contrast-value');
        const blurValue = document.getElementById('blur-value');
        const saturationValue = document.getElementById('saturation-value');
        const hueValue = document.getElementById('hue-value');
        
        if (ambientLightValue) ambientLightValue.textContent = Math.round(this.visualSettings.ambientLight * 100) + '%';
        if (directionalLightValue) directionalLightValue.textContent = Math.round(this.visualSettings.directionalLight * 100) + '%';
        if (fillLightValue) fillLightValue.textContent = Math.round(this.visualSettings.fillLight * 100) + '%';
        if (rimLightValue) rimLightValue.textContent = Math.round(this.visualSettings.rimLight * 100) + '%';
        if (brightnessValue) brightnessValue.textContent = Math.round(this.visualSettings.brightness * 100) + '%';
        if (contrastValue) contrastValue.textContent = Math.round(this.visualSettings.contrast * 100) + '%';
        if (blurValue) blurValue.textContent = this.visualSettings.blur + 'px';
        if (saturationValue) saturationValue.textContent = Math.round(this.visualSettings.saturation * 100) + '%';
        if (hueValue) hueValue.textContent = this.visualSettings.hue + '°';
    }
    
    saveVisualSettings() {
        try {
            localStorage.setItem('tetris3d-visual-settings', JSON.stringify(this.visualSettings));
        } catch (e) {
            console.warn('⚠️ Failed to save visual settings to localStorage');
        }
    }

    updateBackgroundGradient() {
        const body = document.body;
        const color1 = this.visualSettings.backgroundColor;
        const color2 = this.visualSettings.backgroundColor2;
        
        body.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
    }
    
    applyLightingEffects() {
        // Apply ambient light settings
        if (this.ambientLight) {
            this.ambientLight.intensity = this.visualSettings.ambientLight * this.visualSettings.brightness;
        }
        
        // Apply directional light settings
        if (this.directionalLight) {
            this.directionalLight.intensity = this.visualSettings.directionalLight * this.visualSettings.brightness * this.visualSettings.contrast;
        }
        
        // Apply fill light settings
        if (this.fillLight) {
            this.fillLight.intensity = this.visualSettings.fillLight * this.visualSettings.brightness;
        }
        
        // Apply rim light settings
        if (this.rimLight) {
            this.rimLight.intensity = this.visualSettings.rimLight * this.visualSettings.brightness;
        }
    }
    
    applyPostProcessingEffects() {
        // Apply blur effect to the game container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            let filterString = '';
            
            if (this.visualSettings.blur > 0) {
                filterString += `blur(${this.visualSettings.blur}px) `;
            }
            
            if (this.visualSettings.brightness !== 1) {
                filterString += `brightness(${this.visualSettings.brightness}) `;
            }
            
            if (this.visualSettings.contrast !== 1) {
                filterString += `contrast(${this.visualSettings.contrast}) `;
            }
            
            gameContainer.style.filter = filterString.trim();
            
            // Apply vignette effect
            if (this.visualSettings.vignette) {
                gameContainer.style.boxShadow = 'inset 0 0 200px rgba(0, 0, 0, 0.5)';
            } else {
                gameContainer.style.boxShadow = '';
            }
        }
    }
    
    applyColorAdjustments() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            let filterString = gameContainer.style.filter || '';
            
            // Remove existing hue and saturation filters
            filterString = filterString.replace(/hue-rotate\([^)]*\)/g, '');
            filterString = filterString.replace(/saturate\([^)]*\)/g, '');
            
            // Add new hue and saturation filters
            if (this.visualSettings.hue !== 0) {
                filterString += ` hue-rotate(${this.visualSettings.hue}deg)`;
            }
            
            if (this.visualSettings.saturation !== 1) {
                filterString += ` saturate(${this.visualSettings.saturation})`;
            }
            
            gameContainer.style.filter = filterString.trim();
        }
    }
    
    applyVisualSettings() {
        this.updateBackgroundGradient();
        this.applyLightingEffects();
        this.applyPostProcessingEffects();
        this.applyColorAdjustments();
    }
      resetVisualSettings() {
        // Reset all visual settings to defaults
        this.visualSettings = {
            backgroundColor: '#667eea',
            backgroundColor2: '#764ba2',
            brightness: 1,
            contrast: 1,
            bloom: false,
            vignette: false,
            blur: 0,
            saturation: 1,
            hue: 0,
            // Lighting settings
            ambientLight: 1.2,
            directionalLight: 2.0,
            fillLight: 0.3,
            rimLight: 0.2
        };
        
        // Load settings to UI controls
        this.loadVisualSettingsToUI();
        
        // Apply the reset settings
        this.applyVisualSettings();
        
        // Save to localStorage
        this.saveVisualSettings();
        
        console.log('🎨 Visual settings reset to defaults');
    }
    init() {
        this.container = document.getElementById('game-container');
        this.scene = new THREE.Scene();        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a2e, 1.0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Environment mapping için cube camera kurulumu
        this.setupEnvironmentMapping();
        
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
    }    setupScene() {
        // Gradient background sphere - çok daha parlak ve renkli
        const geometry = new THREE.SphereGeometry(100, 64, 64);
        
        // Gradient shader material
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + 100.0).y;
                vec3 topColor = vec3(0.4, 0.6, 1.0);
                vec3 bottomColor = vec3(0.1, 0.1, 0.3);
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.6), 0.0)), 1.0);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
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
            transparent: false
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }    setupLighting() {
        // Ana ambient light - daha güçlü
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(this.ambientLight);
        
        // Ana directional light - güneş ışığı gibi
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.directionalLight.position.set(15, 20, 10);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 100;
        this.directionalLight.shadow.camera.left = -20;
        this.directionalLight.shadow.camera.right = 20;
        this.directionalLight.shadow.camera.top = 20;
        this.directionalLight.shadow.camera.bottom = -20;
        this.scene.add(this.directionalLight);

        // Yumuşak dolgu ışığı - point light'ların yerine
        this.fillLight = new THREE.DirectionalLight(0x4ecdc4, 0.3);
        this.fillLight.position.set(-10, 10, -10);
        this.scene.add(this.fillLight);
        
        // Rim light - kontür aydınlatması
        this.rimLight = new THREE.DirectionalLight(0xff6b6b, 0.2);
        this.rimLight.position.set(0, 5, -15);
        this.scene.add(this.rimLight);
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
          // Floor - Yansıtıcı zemin
        const floorGeometry = new THREE.PlaneGeometry(this.BOARD_WIDTH, this.BOARD_HEIGHT);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            transparent: false,
            roughness: 0.1,
            metalness: 0.8,
            envMap: this.environmentMap,
            envMapIntensity: 0.5
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

    createWalls() {        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.6
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
    }    createPieceMesh() {
        if (this.currentPiece.mesh) {
            this.scene.remove(this.currentPiece.mesh);
        }
          this.currentPiece.mesh = new THREE.Group();        
        // Tam boyutlu küpler - boşluk yok
        const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);        
        const material = new THREE.MeshStandardMaterial({
            color: this.currentPiece.color,
            transparent: false,            roughness: 0.05,  // Çok düşük roughness = ayna gibi parlak
            metalness: 0.9,  // Çok yüksek metalness = güçlü yansımalar
            envMap: this.environmentMap,  // Yansıma haritası
            envMapIntensity: 1.5,  // Daha güçlü yansıma
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
                        cube.position.set(x, -y, z);                        cube.castShadow = true;
                        cube.receiveShadow = true;
                        
                        // Kalın gümüş metal kenarlar - boşlukları kapatır
                        const edgesGeometry = new THREE.EdgesGeometry(geometry);
                        const edgesMesh = new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({
                            color: 0xc0c0c0,  // Silver color
                            linewidth: 4,     // Daha kalın çizgiler
                            transparent: false,
                            opacity: 1.0      // Tam opak
                        }));
                        edgesMesh.position.copy(cube.position);
                        
                        this.currentPiece.mesh.add(cube);
                        this.currentPiece.mesh.add(edgesMesh);
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
        if (!landingPosition) return;        // Create shadow mesh group
        this.shadowMesh = new THREE.Group();        
        // Gölge boyutu da tam boyutlu bloklar için ayarlandı
        const shadowGeometry = new THREE.BoxGeometry(1.0, 0.1, 1.0);
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
        
        // Spawn a new piece only if no line clearing operation is active or pending a decision
        // The line clearing operations (clearLinesImmediately, waitForMoreLines) will handle spawning.
        if (!this.waitingForDecision && !this.lineClearingInProgress) {
            if (!this.gameOver) { // Check if game is over before spawning
                this.spawnNewPiece();
            }
        } else {
            console.log("🐢 Delaying spawnNewPiece: line operation active or decision pending.");
        }
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
          // Update environment map for reflections (daha seyrek update - performans için)
        if (!this.environmentMapLastUpdate) this.environmentMapLastUpdate = 0;
        if (now - this.environmentMapLastUpdate > 200) { // Update every 200ms
            this.updateEnvironmentMap();
            this.environmentMapLastUpdate = now;
        }
        
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
        
        // Clear completed lines
        for (let key in this.completedLines) {
            this.completedLines[key] = [];
        }
        
        // Clear waiting lines (only on restart)
        for (let key in this.waitingLines) {
            this.waitingLines[key] = [];
        }
        console.log('🔄 Cleared all waiting lines on game restart');
        
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
        
        // Update UI checkbox        const snapToggle = document.getElementById('snap-toggle');
        if (snapToggle) {
            snapToggle.checked = this.snapEnabled;
        }
    }

    // Missing game methods
    createStaticBlocks() {
        console.log('🔨 Creating static blocks representation...');
        
        // Remove existing static blocks
        if (this.staticBlocks) {
            this.scene.remove(this.staticBlocks);
        }
          this.staticBlocks = new THREE.Group();
        
        // Tam boyutlu küpler - boşluk yok
        const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        
        let totalBlocksCreated = 0;
        let totalBoardBlocks = 0;
        let layerCounts = [];
        
        // First, count total blocks on board
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                        totalBoardBlocks++;
                    }
                }
            }
        }
        
        console.log(`📊 Board state: ${totalBoardBlocks} total blocks to visualize`);
        
        // Create visual representation of placed blocks
        // Board coordinates: board[x][y][z] where y is depth (back to front) and z is height (bottom to top)
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                let layerBlocksCreated = 0;
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                        console.log(`  ✅ Creating block at board[${x}][${y}][${z}] -> visual(${x}, ${y}, ${z})`);
                        
                        const material = new THREE.MeshStandardMaterial({
                            color: this.board[x][y][z].color,
                            transparent: false,
                            roughness: 0.05,  // Çok düşük roughness = ayna gibi parlak
                            metalness: 0.9,  // Çok yüksek metalness = güçlü yansımalar
                            envMap: this.environmentMap,  // Yansıma haritası                            envMapIntensity: 1.5,  // Daha güçlü yansıma
                            emissive: 0x000000,
                            emissiveIntensity: 0
                        });
                        
                        const cube = new THREE.Mesh(geometry, material);
                        // CRITICAL: Position mapping - board[x][y][z] maps to visual position (x, y, z)
                        // where x=x, y=depth, z=height in the visual scene
                        cube.position.set(x, y, z);
                        cube.castShadow = true;
                        cube.receiveShadow = true;
                        
                        // Kalın gümüş metal kenarlar - boşlukları kapatır
                        const edgesGeometry = new THREE.EdgesGeometry(geometry);
                        const edgesMesh = new THREE.LineSegments(edgesGeometry, new THREE.LineBasicMaterial({
                            color: 0xc0c0c0,  // Silver color
                            linewidth: 4,     // Daha kalın çizgiler
                            transparent: false,
                            opacity: 1.0      // Tam opak
                        }));
                        edgesMesh.position.copy(cube.position);
                        
                        this.staticBlocks.add(cube);
                        this.staticBlocks.add(edgesMesh);
                        totalBlocksCreated++;
                        layerBlocksCreated++;
                    }
                }
                if (layerBlocksCreated > 0) {
                    layerCounts.push(`Y${y}:${layerBlocksCreated}`);
                }
            }
        }
        
        console.log(`🎯 Created ${totalBlocksCreated} static block visuals (Expected: ${totalBoardBlocks})`);
        console.log(`📈 Layer breakdown: ${layerCounts.join(', ')}`);
        
        // Verification: Check for mismatch
        if (totalBlocksCreated !== totalBoardBlocks) {
            console.error(`❌ CRITICAL MISMATCH: Board has ${totalBoardBlocks} blocks but only created ${totalBlocksCreated} visuals!`);
            
            // Detailed layer-by-layer verification
            for (let y = 0; y < this.BOARD_DEPTH; y++) {
                let layerBlocks = 0;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                            layerBlocks++;
                        }
                    }
                }
                if (layerBlocks > 0) {
                    console.log(`🔍 Layer ${y}: ${layerBlocks} blocks`);
                }
            }
        } else {
            console.log(`✅ Visual-Board synchronization verified: ${totalBlocksCreated} blocks`);
        }
        
        this.scene.add(this.staticBlocks);
    }    checkLines() {
        console.log('🔍 Comprehensive line checking...');
        
        if (this.waitingForDecision) {
            console.log('⏳ Already waiting for line clearing decision, skipping checkLines');
            return;
        }
        
        // SAFETY CHECK: If line clearing has been in progress for too long, force reset
        if (this.lineClearingInProgress) {
            console.log('🔄 Line clearing already in progress, checking if stuck...');
            
            // Check if flash effect has been running for too long (over 2 seconds is suspicious)
            if (this.flashStartTime && (Date.now() - this.flashStartTime) > 2000) {
                console.warn('⚠️ SAFETY RESET: Line clearing seems stuck, forcing reset');
                this.resetLineClearingState();
            } else {
                console.log('🔄 Line clearing in progress, skipping checkLines');
                return;
            }
        }
        
        // Reset current completed lines (not waiting lines)
        const currentCompleted = {};
        for (let key in this.completedLines) {
            currentCompleted[key] = [];
        }
        
        // Store old completedLines reference
        const oldCompletedLines = this.completedLines;
        this.completedLines = currentCompleted;
        
        // Check all possible line combinations for current state
        this.check7x1Lines();
        this.check7x2Lines();
        this.check7x3Lines();
        this.check7x4Lines();
        this.check7x5Lines();
        this.check7x6Lines();
        this.check7x7Lines();
        
        // Merge with waiting lines to get total combinations
        this.mergeWithWaitingLines();
        
        // Process the highest level completion found
        this.processLineCompletions();
    }    mergeWithWaitingLines() {
        console.log('🔄 Merging current completed lines with waiting lines...');
        
        // Don't merge if we're already waiting for a decision - this prevents infinite loops
        if (this.waitingForDecision) {
            console.log('⏸️ Already waiting for decision, skipping merge to prevent loop');
            return;
        }
        
        // Store current lines before merging for upgrade logic only
        const currentLinesForUpgrade = {};
        for (let type in this.completedLines) {
            currentLinesForUpgrade[type] = [...(this.completedLines[type] || [])];
        }
        
        // For upgrade combinations, we need to temporarily include waiting lines
        // But we DON'T want to re-trigger dialogs for waiting lines
        for (let type in this.completedLines) {
            const currentLines = this.completedLines[type] || [];
            const waitingLines = this.waitingLines[type] || [];
            
            console.log(`📊 ${type}: Current=${currentLines.length}, Waiting=${waitingLines.length}`);
            
            // For upgrade logic only, combine all lines temporarily
            if (waitingLines.length > 0) {
                const allLinesForUpgrade = [...currentLines];
                waitingLines.forEach(waitingLine => {
                    const isDuplicate = allLinesForUpgrade.some(line => 
                        line.y === waitingLine.y && line.z === waitingLine.z && line.type === waitingLine.type &&
                        (line.x === waitingLine.x || (!line.x && !waitingLine.x))
                    );
                    if (!isDuplicate) {
                        allLinesForUpgrade.push(waitingLine);
                    }
                });
                
                // Store temporarily for upgrade calculations
                currentLinesForUpgrade[type] = allLinesForUpgrade;
            }
            
            console.log(`✅ ${type}: Current lines for dialog = ${currentLines.length}, Total for upgrade = ${currentLinesForUpgrade[type].length}`);
        }
        
        // Use the combined lines for upgrade logic, but keep original completedLines for dialog triggering
        this.upgradeLineCombinations(currentLinesForUpgrade);
    }
      upgradeLineCombinations(linesForUpgrade = null) {
        console.log('🧮 Checking for line upgrades...');
        
        // Use provided lines for upgrade calculations, or fall back to current completed lines
        const linesToCheck = linesForUpgrade || this.completedLines;
        
        const total7x1 = linesToCheck['7x1'].length;
        console.log(`📏 Total 7x1 lines for upgrade: ${total7x1}`);
        
        // Simple upgrade logic: 2 or more 7x1 lines = 7x2 level
        if (total7x1 >= 2 && this.completedLines['7x2'].length === 0) {
            console.log('🔄 Upgrading to 7x2 level due to multiple 7x1 lines');
            
            // Create a virtual 7x2 entry using first 7x1 line position
            const firstLine = linesToCheck['7x1'][0];
            this.completedLines['7x2'] = [{
                type: 'virtual-7x2',
                y: firstLine.y,
                z: firstLine.z || firstLine.x, // Handle both horizontal and vertical lines
                sourceLines: linesToCheck['7x1'].slice(0, 2)
            }];
            
            // Remove the used 7x1 lines from both current completed and waiting
            this.removeUsedWaitingLines('7x1', 2);
            
            // Keep the remaining current 7x1 lines (if any)
            if (this.completedLines['7x1'].length >= 2) {
                this.completedLines['7x1'] = this.completedLines['7x1'].slice(2);
            } else {
                this.completedLines['7x1'] = [];
            }
            console.log(`✅ Created virtual 7x2. Remaining current 7x1: ${this.completedLines['7x1'].length}`);
        }
        
        // Similar logic for higher levels
        if (total7x1 >= 3 && this.completedLines['7x3'].length === 0 && this.completedLines['7x2'].length === 0) {
            console.log('🔄 Upgrading to 7x3 level due to 3+ 7x1 lines');
            
            const firstLine = linesToCheck['7x1'][0];
            this.completedLines['7x3'] = [{
                type: 'virtual-7x3',
                y: firstLine.y,
                z: firstLine.z || firstLine.x,
                sourceLines: linesToCheck['7x1'].slice(0, 3)
            }];
            
            // Remove the used 7x1 lines from both current completed and waiting
            this.removeUsedWaitingLines('7x1', 3);
            
            if (this.completedLines['7x1'].length >= 3) {
                this.completedLines['7x1'] = this.completedLines['7x1'].slice(3);
            } else {
                this.completedLines['7x1'] = [];
            }
        }
        
        console.log('🎯 Final line counts:', {
            '7x1': this.completedLines['7x1'].length,
            '7x2': this.completedLines['7x2'].length,
            '7x3': this.completedLines['7x3'].length,
            '7x4': this.completedLines['7x4'].length,
            '7x5': this.completedLines['7x5'].length,
            '7x6': this.completedLines['7x6'].length,
            '7x7': this.completedLines['7x7'].length        });
    }
    
    removeUsedWaitingLines(type, count) {
        console.log(`🔄 Removing ${count} used waiting lines of type ${type}`);
        if (this.waitingLines[type] && this.waitingLines[type].length >= count) {
            this.waitingLines[type] = this.waitingLines[type].slice(count);
            console.log(`✅ Removed ${count} waiting lines. Remaining: ${this.waitingLines[type].length}`);
        } else {
            console.log(`⚠️ Not enough waiting lines to remove: ${this.waitingLines[type]?.length || 0} < ${count}`);
        }
    }      check7x1Lines() {
        console.log(`🔍 Checking 7x1 lines...`);
        
        // Check horizontal lines (X-axis, 7 blocks long)
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                let lineComplete = true;
                let blockCount = 0;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    if (!this.board[x] || !this.board[x][y] || !this.board[x][y][z]) {
                        lineComplete = false;
                        break;
                    } else {
                        blockCount++;
                    }
                }
                if (lineComplete) {
                    console.log(`🎯 Found complete horizontal line at y=${y}, z=${z} with ${blockCount} blocks`);
                    
                    // Check if this line is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x1'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === 'horizontal-x'
                    );
                    
                    if (!isAlreadyWaiting) {
                        const newLine = { type: 'horizontal-x', y, z };
                        this.completedLines['7x1'].push(newLine);
                        console.log(`✅ 7x1 horizontal line found at y=${y}, z=${z}`);
                    } else {
                        console.log(`⏳ 7x1 horizontal line at y=${y}, z=${z} already waiting`);
                    }
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
                    // Check if this line is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x1'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.x === x && waitingLine.type === 'vertical-z'
                    );
                    
                    if (!isAlreadyWaiting) {
                        const newLine = { type: 'vertical-z', y, x };
                        this.completedLines['7x1'].push(newLine);
                        console.log(`✅ 7x1 vertical line found at y=${y}, x=${x}`);
                    } else {
                        console.log(`⏳ 7x1 vertical line at y=${y}, x=${x} already waiting`);
                    }
                }
            }
        }
    }    check7x2Lines() {
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
                    // Check if this rectangle is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x2'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === '7x2-xz'
                    );
                    
                    if (!isAlreadyWaiting) {
                        const newLine = { type: '7x2-xz', y, z };
                        this.completedLines['7x2'].push(newLine);
                        console.log(`✅ 7x2 rectangle found at y=${y}, z=${z}-${z+1}`);
                    } else {
                        console.log(`⏳ 7x2 rectangle at y=${y}, z=${z}-${z+1} already waiting`);
                    }
                }
            }
        }
    }      check7x3Lines() {
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
                    // Check if this rectangle is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x3'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === '7x3-xz'
                    );
                    
                    if (!isAlreadyWaiting) {
                        this.completedLines['7x3'].push({ type: '7x3-xz', y, z });
                        console.log(`✅ 7x3 rectangle found at y=${y}, z=${z}-${z+2}`);
                    } else {
                        console.log(`⏳ 7x3 rectangle at y=${y}, z=${z}-${z+2} already waiting`);
                    }
                }
            }
        }
    }      check7x4Lines() {
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
                    // Check if this rectangle is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x4'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === '7x4-xz'
                    );
                    
                    if (!isAlreadyWaiting) {
                        this.completedLines['7x4'].push({ type: '7x4-xz', y, z });
                        console.log(`✅ 7x4 rectangle found at y=${y}, z=${z}-${z+3}`);
                    } else {
                        console.log(`⏳ 7x4 rectangle at y=${y}, z=${z}-${z+3} already waiting`);
                    }
                }
            }
        }
    }      check7x5Lines() {
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
                    // Check if this rectangle is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x5'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === '7x5-xz'
                    );
                    
                    if (!isAlreadyWaiting) {
                        this.completedLines['7x5'].push({ type: '7x5-xz', y, z });
                        console.log(`✅ 7x5 rectangle found at y=${y}, z=${z}-${z+4}`);
                    } else {
                        console.log(`⏳ 7x5 rectangle at y=${y}, z=${z}-${z+4} already waiting`);
                    }
                }
            }
        }
    }      check7x6Lines() {
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
                    // Check if this rectangle is already in waiting lines to avoid duplicates
                    const isAlreadyWaiting = this.waitingLines['7x6'].some(waitingLine => 
                        waitingLine.y === y && waitingLine.z === z && waitingLine.type === '7x6-xz'
                    );
                    
                    if (!isAlreadyWaiting) {
                        this.completedLines['7x6'].push({ type: '7x6-xz', y, z });
                        console.log(`✅ 7x6 rectangle found at y=${y}, z=${z}-${z+5}`);
                    } else {
                        console.log(`⏳ 7x6 rectangle at y=${y}, z=${z}-${z+5} already waiting`);
                    }
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
    }      processLineCompletions() {
        // Don't process if we're already waiting for a decision
        if (this.waitingForDecision) {
            console.log('⏸️ Already waiting for decision, skipping line completion processing');
            return;
        }
        
        // Debug: Log all current completed lines
        console.log('🔍 Debug - Current completed lines state:');
        for (let type in this.completedLines) {
            if (this.completedLines[type].length > 0) {
                console.log(`  ${type}: ${this.completedLines[type].length} lines`, this.completedLines[type]);
            }
        }
        
        // Debug: Log all waiting lines
        console.log('🔍 Debug - Current waiting lines state:');
        for (let type in this.waitingLines) {
            if (this.waitingLines[type].length > 0) {
                console.log(`  waiting ${type}: ${this.waitingLines[type].length} lines`, this.waitingLines[type]);
            }
        }
        
        // Process from highest to lowest priority
        const priorities = ['7x7', '7x6', '7x5', '7x4', '7x3', '7x2', '7x1'];
        
        for (let priority of priorities) {
            if (this.completedLines[priority].length > 0) {
                console.log(`🎯 Processing ${priority} completions:`, this.completedLines[priority]);
                this.handleLineCompletion(priority, this.completedLines[priority]);
                return; // Process only the highest priority
            }
        }
        
        console.log('✅ No line completions to process');
    }
      handleLineCompletion(type, lines) {
        // Start flash effect only for the traditional flow (when showing dialog with wait option)
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
        }, 500); // Reduced from 1000ms to 500ms for faster dialog appearance
    }
      startFlashEffect(type, lines) {
        // Safety check: prevent overlapping flash effects
        if (this.lineClearingInProgress) {
            console.warn('⚠️ Flash effect already in progress, forcing reset before starting new effect');
            this.resetLineClearingState();
        }
          console.log(`⚡ Starting flash effect for ${type} with ${lines.length} lines`);
        console.log(`🔧 Setting lineClearingInProgress = true`);
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
                    break;                case '7x6-xz':
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
    }      updateFlashEffect() {
        // Safety check - ensure flashingBlocks is initialized
        if (!this.flashingBlocks || this.flashingBlocks.length === 0 || !this.flashStartTime) return;
        
        const elapsed = Date.now() - this.flashStartTime;
        const flashDuration = 500; // Flash for 500ms
        const flashFrequency = 100; // Flash every 100ms
        
        if (elapsed < flashDuration) {
            const shouldShow = Math.floor(elapsed / flashFrequency) % 2 === 0;
            
            // Update static blocks visual with flash effect
            this.updateFlashingBlocks(shouldShow);
        } else if (this.lineClearingInProgress) {
            // Flash duration ended, but still clearing - ensure blocks are visible
            this.updateFlashingBlocks(true);
        }
    }    updateFlashingBlocks(visible) {
        // Safety checks - ensure critical objects are initialized
        if (!this.staticBlocks || !this.flashingBlocks) return;
        
        console.log(`🔦 Updating flash visibility: ${visible}, flashing blocks: ${this.flashingBlocks.length}`);
        
        let flashingCount = 0;
        let totalMeshes = 0;
        
        this.staticBlocks.children.forEach(child => {
            if (child.isMesh) {
                totalMeshes++;
                const pos = child.position;
                const isFlashing = this.flashingBlocks.some(block => 
                    block.x === pos.x && block.y === pos.y && block.z === pos.z
                );
                
                if (isFlashing) {
                    flashingCount++;
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
        });
        
        console.log(`💡 Updated ${flashingCount} flashing blocks out of ${totalMeshes} total meshes`);
    }
    
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
                
                <div class="choice-warning" style="color: #ffd700;">
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
    }    clearLinesImmediately(type) {
        console.log(`=== CLEARING LINES IMMEDIATELY START ===`);
        console.log(`🧹 Clearing ${type} lines immediately`);
        
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
        if (!lines || lines.length === 0) {
            console.log(`⚠️ No lines to clear for type ${type}`);
            this.resetLineClearingState();
            if (!this.gameOver) {
                this.spawnNewPiece();
            }
            return;
        }
        
        console.log(`🧹 Lines to clear:`, lines);
        
        // IMMEDIATE CLEARING WITHOUT FLASH - Debug mode
        console.log(`🚀 DEBUG MODE: Immediate clearing without flash for debugging`);
          // Clear the blocks from board state IMMEDIATELY
        const totalCleared = this.clearBlocksByType(type, lines);
        console.log(`📊 Total blocks cleared from board: ${totalCleared}`);
          // Verify that the specific lines are actually cleared
        console.log(`🔍 POST-CLEARING VERIFICATION:`);
        lines.forEach((line, index) => {
            if (line.type === 'horizontal-x') {
                let remainingBlocks = 0;
                let positions = [];
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][line.z]) {
                        remainingBlocks++;
                        positions.push(`(${x},${line.z})`);
                    }
                }
                console.log(`  Line ${index} at y=${line.y}, z=${line.z}: ${remainingBlocks} blocks remaining`, positions);
                if (remainingBlocks > 0) {
                    console.error(`❌ ERROR: Line should be completely cleared but ${remainingBlocks} blocks remain!`);
                    // Emergency fix - force clear any remaining blocks in this line
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        if (this.board[x] && this.board[x][line.y]) {
                            this.board[x][line.y][line.z] = null;
                            console.log(`  🚨 EMERGENCY CLEARING: Forced null at (${x}, ${line.y}, ${line.z})`);
                        }
                    }
                }
            } else if (line.type === 'vertical-z') {
                let remainingBlocks = 0;
                let positions = [];
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[line.x] && this.board[line.x][line.y] && this.board[line.x][line.y][z]) {
                        remainingBlocks++;
                        positions.push(`(${line.x},${z})`);
                    }
                }
                console.log(`  Line ${index} at x=${line.x}, y=${line.y}: ${remainingBlocks} blocks remaining`, positions);
                if (remainingBlocks > 0) {
                    console.error(`❌ ERROR: Vertical line should be completely cleared but ${remainingBlocks} blocks remain!`);
                    // Emergency fix for vertical lines
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        if (this.board[line.x] && this.board[line.x][line.y]) {
                            this.board[line.x][line.y][z] = null;
                            console.log(`  🚨 EMERGENCY CLEARING: Forced null at (${line.x}, ${line.y}, ${z})`);
                        }
                    }
                }
            }
        });

        // Detailed board state check
        this.debugBoardState("AFTER_CLEARING");
          
        // Apply gravity to make blocks fall immediately
        const uniqueYLevels = new Set(lines.map(line => line.y));
        console.log(`🌍 Applying gravity to Y levels: ${Array.from(uniqueYLevels).join(', ')}`);
        for (let clearY of uniqueYLevels) {
            this.applyGravityToLayer(clearY);
        }
        
        // Detailed board state check after gravity
        this.debugBoardState("AFTER_GRAVITY");
        
        // Clear any waiting lines that were just cleared
        this.waitingLines[type] = [];
        console.log(`🗑️ Cleared waiting lines for type ${type}`);
        
        // Calculate and add score
        const score = this.calculateScore(type, lines.length);
        this.score += score;
        this.lines += lines.length;
        
        console.log(`💰 Score +${score} (${type}: ${lines.length}, Level: ${this.level})`);
        
        // Create particle effects
        this.createLineParticles(lines[0].y, type);
        
        // Update level
        this.updateLevel();
        
        // CRITICAL: Reset clearing state BEFORE recreating visuals
        this.resetLineClearingState();
          // Force update visuals - this should reflect the cleared blocks
        console.log(`🎨 Recreating visual representation after clearing...`);
        
        // Ensure the scene is properly updated before updating visuals
        if (this.staticBlocks) {
            console.log("🧹 Removing existing static blocks from scene");
            // Remove old meshes from scene to avoid duplicates
            this.scene.remove(this.staticBlocks);
            this.staticBlocks = null;
        }
        
        // Update UI first, then recreate all static blocks
        this.updateUI();
        this.createStaticBlocks();
        
        // Final verification after visual recreation
        this.debugBoardState("AFTER_VISUAL_RECREATION");
        
        // Verify no orphan blocks remain
        console.log("🔍 Running additional verification of visual state...");
        
        console.log(`✅ Line clearing complete for ${type}. Spawning new piece...`);
        
        // Spawn a new piece after clearing is complete
        if (!this.gameOver) {
            this.spawnNewPiece();
        }
          console.log(`=== CLEARING LINES IMMEDIATELY END ===`);
    }

    waitForMoreLines(type) {
        console.log(`⏳ Waiting for more lines beyond ${type}`);
        
        // Important: Set this FIRST to prevent any re-processing
        this.waitingForDecision = false;
        
        // Remove dialog and reset dialog state
        const dialog = document.querySelector('.line-choice-dialog');
        if (dialog) dialog.remove();
        
        // Reset dialog state
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        // Store the current completed lines as waiting lines to prevent re-detection
        const currentLines = this.completedLines[type] || [];
        console.log(`🔍 DEBUG - Moving ${currentLines.length} completed lines to waiting:`, currentLines);
        
        this.waitingLines[type] = [...this.waitingLines[type], ...currentLines];
        console.log(`💾 Added ${currentLines.length} waiting lines of type ${type}. Total waiting: ${this.waitingLines[type].length}`);
        console.log(`🔍 DEBUG - Full waiting lines for ${type}:`, this.waitingLines[type]);
        
        // CRITICAL: Clear the completed lines so they don't trigger again
        this.completedLines[type] = [];
        console.log(`🗑️ Cleared completed lines for ${type} to prevent re-detection`);
        
        // Apply difficulty increase for waiting
        this.applyWaitingDifficultyIncrease(type);
        
        // Reset clearing state but DON'T reset completed lines yet
        this.lineClearingInProgress = false;
        this.flashingBlocks = [];
        
        // Reset material emissive properties
        if (this.staticBlocks) {
            this.staticBlocks.children.forEach(child => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.visible = true;
                    child.material.emissive.setHex(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }
        
        // Show notification
        this.showGamepadNotification(`💎 Waiting for bigger combo beyond ${type}!`);
        
        console.log(`✅ Wait state set up successfully. Game can continue normally.`);

        // Spawn a new piece as the game continues
        if (!this.gameOver) {
            this.spawnNewPiece();
        }
    }

    applyWaitingDifficultyIncrease(type) {
        // Increase difficulty when waiting for bigger combinations
        console.log(`⚡ Applying difficulty increase for waiting beyond ${type}`);
        
        // Increase drop speed slightly
        this.dropInterval = Math.max(200, this.dropInterval * 0.95);
        console.log(`⏱️ Drop interval reduced to ${this.dropInterval}ms`);
    }    resetLineClearingState() {
        console.log('🔄 Resetting line clearing state...');
        
        // Reset all completed lines
        for (let key in this.completedLines) {
            this.completedLines[key] = [];
        }
        
        this.lineClearingInProgress = false;
        this.flashingBlocks = [];
        this.flashStartTime = null; // Clear flash start time to prevent stuck detection
        this.waitingForDecision = false;
        
        // Reset dialog state as well
        this.dialogVisible = false;
        this.dialogOptions = [];
        this.selectedDialogOption = 0;
        this.dialogType = null;
        
        // DO NOT clear waiting lines - they should persist!
        // Waiting lines are cleared only when:
        // 1. Lines are actually used/consumed (in clearLinesImmediately)
        // 2. Game is restarted
        // 3. Explicitly cleared in upgrade logic
        console.log('💾 Preserving waiting lines across clear operations');
        
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
        
        console.log('✅ Line clearing state reset complete');
    }    clearBlocksByType(type, lines) {
        console.log(`🧹 Clearing blocks for ${type}:`, lines);
        
        let totalBlocksCleared = 0;
        
        // DEBUG: Log initial board state before clearing
        console.log(`🔍 BEFORE CLEARING - Board state check:`);
        lines.forEach((line, index) => {
            console.log(`  Line ${index}: ${line.type} at y=${line.y}`, line);
            if (line.type === 'horizontal-x') {
                let blockCount = 0;
                for (let x = 0; x < this.BOARD_WIDTH; x++) {
                    if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][line.z]) {
                        blockCount++;
                    }
                }
                console.log(`    📊 Horizontal line at y=${line.y}, z=${line.z} has ${blockCount} blocks`);
            }
        });
        
        lines.forEach(line => {
            console.log(`🎯 Processing line of type: ${line.type}`, line);
            
            switch (line.type) {                case 'horizontal-x':
                    // Clear entire horizontal line (X-axis)
                    console.log(`🎯 Clearing horizontal line at y=${line.y}, z=${line.z}`);
                    let lineBlockCount = 0;
                    
                    // First pass: Count how many blocks should be in this line
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][line.z]) {
                            lineBlockCount++;
                        }
                    }
                    
                    console.log(`  📊 Expected to clear ${lineBlockCount} blocks in this line`);
                    
                    // Second pass: Make sure ALL positions in the line are nulled
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        // Initialize board structure if needed
                        if (!this.board[x]) this.board[x] = [];
                        if (!this.board[x][line.y]) this.board[x][line.y] = [];
                        
                        // Force clear the position regardless of current state
                        if (this.board[x][line.y][line.z]) {
                            console.log(`  🗑️ Clearing block at (${x}, ${line.y}, ${line.z}) - Block exists: YES`);
                            this.board[x][line.y][line.z] = null;
                            totalBlocksCleared++;
                        } else {
                            console.log(`  🗑️ Clearing position at (${x}, ${line.y}, ${line.z}) - No block present`);
                            // Still set to null to ensure consistency
                            this.board[x][line.y][line.z] = null;
                        }
                    }
                    console.log(`  ✅ Cleared ${totalBlocksCleared} blocks from horizontal line at y=${line.y}, z=${line.z}`);
                    break;
                    
                case 'vertical-z':
                    // Clear entire vertical line (Z-axis)
                    console.log(`🎯 Clearing vertical line at x=${line.x}, y=${line.y}`);
                    let vertLineBlockCount = 0;
                    
                    // First pass: Count existing blocks
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        if (this.board[line.x] && this.board[line.x][line.y] && this.board[line.x][line.y][z]) {
                            vertLineBlockCount++;
                        }
                    }
                    
                    console.log(`  📊 Expected to clear ${vertLineBlockCount} blocks in this vertical line`);
                    
                    // Second pass: Clear all positions
                    for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                        // Initialize board structure if needed
                        if (!this.board[line.x]) this.board[line.x] = [];
                        if (!this.board[line.x][line.y]) this.board[line.x][line.y] = [];
                        
                        if (this.board[line.x][line.y][z]) {
                            console.log(`  🗑️ Clearing block at (${line.x}, ${line.y}, ${z}) - Block exists: YES`);
                            this.board[line.x][line.y][z] = null;
                            totalBlocksCleared++;
                        } else {
                            console.log(`  🗑️ Clearing position at (${line.x}, ${line.y}, ${z}) - No block present`);
                            this.board[line.x][line.y][z] = null;
                        }
                    }
                    console.log(`  ✅ Cleared ${totalBlocksCleared} blocks from vertical line at x=${line.x}, y=${line.y}`);
                    break;
                    
                case '7x2-xz':
                case 'virtual-7x2':
                    // Clear 7x2 rectangle
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 2; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x2 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    
                    // If it's a virtual line, also clear the source 7x1 lines
                    if (line.type === 'virtual-7x2' && line.sourceLines) {
                        console.log(`  🔄 Clearing source lines for virtual 7x2:`, line.sourceLines);
                        totalBlocksCleared += this.clearBlocksByType('7x1', line.sourceLines);
                    }
                    break;
                    
                case '7x3-xz':
                case 'virtual-7x3':
                    // Clear 7x3 rectangle
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 3; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x3 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    
                    if (line.type === 'virtual-7x3' && line.sourceLines) {
                        totalBlocksCleared += this.clearBlocksByType('7x1', line.sourceLines);
                    }
                    break;
                    
                case '7x4-xz':
                    // Clear 7x4 rectangle
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 4; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x4 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    break;
                    
                case '7x5-xz':
                    // Clear 7x5 rectangle
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 5; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x5 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    break;
                    
                case '7x6-xz':
                    // Clear 7x6 rectangle
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = line.z; z < line.z + 6; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x6 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    break;
                    
                case '7x7-layer':
                    // Clear entire 7x7 layer
                    for (let x = 0; x < this.BOARD_WIDTH; x++) {
                        for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                            if (this.board[x] && this.board[x][line.y] && this.board[x][line.y][z]) {
                                console.log(`  🗑️ Clearing 7x7 block at (${x}, ${line.y}, ${z})`);
                                this.board[x][line.y][z] = null;
                                totalBlocksCleared++;
                            }
                        }
                    }
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown line type: ${line.type}`);
            }
        });
        
        console.log(`✅ Finished clearing ${lines.length} ${type} patterns. Total blocks cleared: ${totalBlocksCleared}`);
        return totalBlocksCleared;
    }    debugBoardState(stage) {
        console.log(`📊 === BOARD STATE DEBUG (${stage}) ===`);
        
        let totalBlocks = 0;
        let layerDetails = {};
        
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            let layerBlocks = 0;
            let layerPositions = [];
            
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                        totalBlocks++;
                        layerBlocks++;
                        layerPositions.push(`(${x},${z})`);
                    }
                }
            }
            
            if (layerBlocks > 0) {
                layerDetails[y] = {
                    count: layerBlocks,
                    positions: layerPositions.slice(0, 10) // Limit output
                };
            }
        }
        
        console.log(`📈 Total blocks on board: ${totalBlocks}`);
        console.log(`🏗️ Layer details:`, layerDetails);
        
        // Check for visual-board mismatch
        if (this.staticBlocks) {
            let visualBlocks = 0;
            this.staticBlocks.children.forEach(child => {
                if (child.isMesh) {
                    visualBlocks++;
                }
            });
            console.log(`🎨 Visual blocks count: ${visualBlocks}`);
            
            if (visualBlocks !== totalBlocks) {
                console.warn(`⚠️ MISMATCH: Board has ${totalBlocks} blocks but visuals show ${visualBlocks}`);
            }
        }
        
        console.log(`📊 === END BOARD STATE DEBUG (${stage}) ===`);
    }

    debugBoardState(stage) {
        console.log(`📊 === BOARD STATE DEBUG (${stage}) ===`);
        
        let totalBlocks = 0;
        let layerDetails = {};
        
        for (let y = 0; y < this.BOARD_DEPTH; y++) {
            let layerBlocks = 0;
            let layerPositions = [];
            
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                for (let z = 0; z < this.BOARD_HEIGHT; z++) {
                    if (this.board[x] && this.board[x][y] && this.board[x][y][z]) {
                        totalBlocks++;
                        layerBlocks++;
                        layerPositions.push(`(${x},${z})`);
                    }
                }
            }
            
            if (layerBlocks > 0) {
                layerDetails[y] = {
                    count: layerBlocks,
                    positions: layerPositions.slice(0, 10) // Limit output
                };
            }
        }
        
        console.log(`📈 Total blocks on board: ${totalBlocks}`);
        console.log(`🏗️ Layer details:`, layerDetails);
        
        // Check for visual-board mismatch
        if (this.staticBlocks) {
            let visualBlocks = 0;
            this.staticBlocks.children.forEach(child => {
                if (child.isMesh) {
                    visualBlocks++;
                }
            });
            console.log(`🎨 Visual blocks count: ${visualBlocks}`);
            
            if (visualBlocks !== totalBlocks) {
                console.warn(`⚠️ MISMATCH: Board has ${totalBlocks} blocks but visuals show ${visualBlocks}`);
            }
        }
        
        console.log(`📊 === END BOARD STATE DEBUG (${stage}) ===`);
    }

    setupEnvironmentMapping() {
        // Yüksek kaliteli cube render target oluştur
        this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding
        });

        // Cube camera oluştur - oyun alanının merkezinde
        this.cubeCamera = new THREE.CubeCamera(0.1, 1000, this.cubeRenderTarget);
        this.cubeCamera.position.set(3, 7, 3); // Oyun alanının merkezi
        this.scene.add(this.cubeCamera);

        // Environment map'i saklayalım
        this.environmentMap = this.cubeRenderTarget.texture;
        
        console.log('🔮 Yüksek kaliteli environment mapping kuruldu - yansıma efektleri aktif');
    }

    updateEnvironmentMap() {
        if (this.cubeCamera && this.renderer) {
            // Mevcut nesneleri geçici olarak gizle
            const currentPieceMesh = this.currentPiece ? this.currentPiece.mesh : null;
            if (currentPieceMesh) currentPieceMesh.visible = false;
            
            // Environment map'i güncelle
            this.cubeCamera.update(this.renderer, this.scene);
            
            // Nesneleri tekrar göster
            if (currentPieceMesh) currentPieceMesh.visible = true;
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Tetris3D...');
    window.game = new Tetris3D();
    console.log('✅ Tetris3D initialized and assigned to window.game');
});
