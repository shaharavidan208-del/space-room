import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import SupernovaRemnant from './SupernovaRemnant.js'
import Particles from './Particles.js'
import GUI from 'lil-gui';
import Cube from './Cube/Cube.js'
import CubeInput from './Cube/CubeInput.js'
import gsap from 'gsap'
import TerminalCanvas from './Terminal/TerminalCanvas.js'; // /models/ReUpload23.glb

export default class Experience {
    constructor(canvas) {
        // Scene
        let sceneReady = false
        this.scene = new THREE.Scene()
        const overlayGeometry = new THREE.PlaneGeometry(2, 2)
        const overlayMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                uAlpha: { value: 1 }  // starts fully opaque
            },
            vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
            fragmentShader: `
        uniform float uAlpha;
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `
        })
        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
        this.scene.add(overlay)
        this.gu = new GUI()
        this.terminal = new TerminalCanvas();

        //         /**
        //  * Loaders
        //  */
        const loadingBarElement = document.querySelector('.loading-bar')
        const loadingManager = new THREE.LoadingManager(
            // Loaded
            () => {
                // Wait a little
                window.setTimeout(() => {
                    // Animate overlay
                    gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

                    // Update loadingBarElement
                    loadingBarElement.classList.add('ended')
                    loadingBarElement.style.transform = ''
                }, 500)
                window.setTimeout(() => {
                    sceneReady = true
                }, 3000)
            },

            // Progress
            (itemUrl, itemsLoaded, itemsTotal) => {
                // Calculate the progress and update the loadingBarElement
                const progressRatio = itemsLoaded / itemsTotal
                loadingBarElement.style.transform = `scaleX(${progressRatio})`
            }
        )
        const loader = new HDRLoader(loadingManager)
        const gltfLoader = new GLTFLoader(loadingManager);

        this.cube = new Cube(this.scene)

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // FPS counter 
        const stats = new Stats();
        document.body.appendChild(stats.dom);


        /**
         * Lights
         */

        // 1. Drop the global ambient wash
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        // 2. The Supernova Rim Light (Warm)
        const novaLight = new THREE.DirectionalLight(0xff4400, 20); // Deep orange/red, very intense
        novaLight.position.set(0.8, 11.8, -10.7); // Positioned back where the supernova is
        novaLight.castShadow = true;
        // (Keep your existing shadow frustum math here for the novaLight)
        this.scene.add(novaLight);

        // 3. The Monitor/Desk Spill (Cool)
        // const deskLight = new THREE.PointLight(0x00ffff, 2, 15); // Cyan, intensity 2, fades out after 15 units
        // deskLight.position.set(0, 4, 0); // Hovering right above the keyboard/monitor
        // deskLight.castShadow = true;
        // deskLight.shadow.bias = -0.001; // Prevents shadow acne on the desk surface
        // this.scene.add(deskLight);


        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        // this.scene.add(ambientLight)
        // // directionalLight.castShadow = true

        // // 1. The Light
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
        // directionalLight.position.set(0, 15, 0); // Positioned directly in the sky above the test
        // directionalLight.castShadow = true;

        // // 2. The Frustum (Massive box to guarantee no clipping)
        // directionalLight.shadow.camera.left = -20;
        // directionalLight.shadow.camera.right = 20;
        // directionalLight.shadow.camera.top = 20;
        // directionalLight.shadow.camera.bottom = -20;
        // directionalLight.shadow.camera.near = 0.5;
        // directionalLight.shadow.camera.far = 50;

        // // 3. The Math Reset (CRITICAL)
        // // If you change the camera boundaries, you MUST force Three.js to update the matrix.
        // directionalLight.shadow.camera.updateProjectionMatrix();

        // // 4. The Resolution

        // // 5. The Bias (Prevents glitchy artifacts on the surface of objects)
        // directionalLight.shadow.normalBias = 0.05;

        // this.scene.add(directionalLight);



        /**
         * Light GUI
         */
        // const lightFolder = this.gu.addFolder('Directional Lights');

        // Main Light (The one casting shadows)
        // const mainLightFolder = lightFolder.addFolder('Main Light');
        // mainLightFolder.add(novaLight.position, 'x', -20, 20, 0.1).name('Position X');
        // mainLightFolder.add(novaLight.position, 'y', -20, 20, 0.1).name('Position Y');
        // mainLightFolder.add(novaLight.position, 'z', -20, 20, 0.1).name('Position Z');
        // mainLightFolder.add(novaLight, 'intensity', 0, 10, 0.1).name('Intensity');
        // mainLightFolder.addColor(novaLight, 'color').name('Color')

        console.log(renderer.info)

        /**
         * Light & Shadow Helpers
         */
        // 1. Shows the physical position and direction of the light
        // const mainLightHelper = new THREE.DirectionalLightHelper(novaLight, 1);
        // this.scene.add(mainLightHelper);

        // 2. The Secret Weapon: Shows the exact box calculating your shadows
        // const shadowCameraHelper = new THREE.CameraHelper(novaLight.shadow.camera);
        // this.scene.add(shadowCameraHelper);


        // this.supernova = new SupernovaRemnant(this.scene, {
        //     position: new THREE.Vector3(-15, 5, 50),  // far away from room
        //     scale: 8,
        //     visible: true
        // })

        // Add the TextureLoader at the top of Experience.js if you haven't already
        const textureLoader = new THREE.TextureLoader(loadingManager);

        // Load the noise image
        const noiseTexture = textureLoader.load('/textures/noise.png');

        // CRITICAL for Shadertoy noise ports: Set it to repeat infinitely
        noiseTexture.wrapS = THREE.RepeatWrapping;
        noiseTexture.wrapT = THREE.RepeatWrapping;
        noiseTexture.minFilter = THREE.LinearMipmapLinearFilter;

        // Pass the texture into the shader through the options
        this.supernova = new SupernovaRemnant(this.scene, {
            position: new THREE.Vector3(-15, 5, 50),
            scale: 8,
            visible: true,
            noiseMap: noiseTexture // <--- Add this new option
        });

        this.supernova.mesh.position.x = -15
        this.supernova.mesh.position.y = 6
        this.supernova.mesh.position.z = -850
        this.supernova.mesh.scale.setScalar(200)
        // const novaFolder = gu.addFolder('Supernova')
        // (min, max, increments), change supernova position 
        // novaFolder.add(this.supernova.mesh.position, 'x', -1000, 1000, 1).name('Position X')
        // novaFolder.add(this.supernova.mesh.position, 'y', -1000, 1000, 1).name('Position Y')
        // novaFolder.add(this.supernova.mesh.position, 'z', -1000, 1000, 1).name('Position Z')
        // novaFolder.add(this.supernova.mesh.scale, 'x', 1, 100, 0.5).name('Scale').onChange((val) => {
        //     this.supernova.mesh.scale.setScalar(val)
        // })



        /**
        * Environment map
        */
        const environmentMap = loader.load('/environmentMaps/volcanic_planet._4k.hdr', (texture) => {
            environmentMap.mapping = THREE.EquirectangularReflectionMapping

            this.scene.background = environmentMap
        })

        document.addEventListener('contextmenu', (e) => e.preventDefault()) // prevent RMB click pop up


        // Camera
        this.camera = new THREE.PerspectiveCamera(65,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );

        const debugParams = {
            lookX: 0,
            lookY: 1, // Start slightly above the floor
            lookZ: 0
        };
        this.camera.position.set(-0.5, 5.5, 10.5);
        this.camera.lookAt(0, 2.71, 0.5)
        this.scene.add(this.camera);


        // 3. Create a helper function to update both systems safely
        const updateCameraTarget = () => {
            const newTarget = new THREE.Vector3(debugParams.lookX, debugParams.lookY, debugParams.lookZ);

            // Update the camera lens
            this.camera.lookAt(newTarget);

            // Update the center of the OrbitControls universe
            controls.target.copy(newTarget);
            controls.update();
        };

        // 4. Add the sliders to the screen
        const cameraFolder = this.gu.addFolder('Initial Look Target');

        // .add(object, property).min.max.step.name.onChange
        cameraFolder.add(debugParams, 'lookX').min(-10).max(10).step(0.01).name('Target X').onChange(updateCameraTarget);
        cameraFolder.add(debugParams, 'lookY').min(-10).max(10).step(0.01).name('Target Y').onChange(updateCameraTarget);
        cameraFolder.add(debugParams, 'lookZ').min(-10).max(10).step(0.01).name('Target Z').onChange(updateCameraTarget);

        cameraFolder.open(); // Keeps the folder open by default


        const cam = this.gu.addFolder('Camera')
        // (min, max, increments), change supernova position 
        cam.add(this.camera.position, 'x', -25, 25, 0.5).name('Position X')
        cam.add(this.camera.position, 'y', -25, 25, 0.5).name('Position Y')
        cam.add(this.camera.position, 'z', -25, 25, 0.5).name('Position Z')

        // Controls
        const trackballControls = new TrackballControls(this.camera, canvas)
        trackballControls.noRotate = true
        trackballControls.noZoom = false
        trackballControls.zoomSpeed = 2
        trackballControls.panSpeed = 0.5
        const controls = new OrbitControls(this.camera, canvas);
        // controls.zoomSpeed = 2.0 // Increase zoom speed
        controls.enableZoom = false
        // controls.target.set(0, 3, 3); // Set the initial target to match camera.lookAt
        controls.enableDamping = true;
        controls.dampingFactor = 0.12
        controls.minDistance = 0

        let isTransitioning = false;
        // Hot spot variables
        // Hot spot variables
        this.isFocused = false;
        const lookTarget = this.cube.cubeGroup.position.clone();

        // Increase the offset significantly so we don't end up inside the mesh when we lower the FOV
        const isometricDistance = 1.8;
        const cameraTarget = new THREE.Vector3(
            lookTarget.x + isometricDistance,
            lookTarget.y + isometricDistance,
            lookTarget.z + isometricDistance
        );

        const cameraHome = new THREE.Vector3(-0.5, 5.5, 10.5);
        const lookHome = new THREE.Vector3(0, 2.71, 0.5);

        // --- NEW FOV VARIABLES ---
        const homeFov = 65;
        let targetFov = homeFov; // We will lerp toward this value

        /**
         * focus mode on cube
         */
        const cubeHotspot = document.querySelector("#hotspot-cube")
        const enterFocusMode = (activePoint) => {
            this.isFocused = true;
            isTransitioning = true;
            controls.enabled = false;

            // Hide ALL UI hotspots so they don't float around while we are zoomed in
            this.points.forEach(p => {
                p.element.style.opacity = '0';
                p.element.style.pointerEvents = 'none';
            });
            // --- 1. RUBIK'S CUBE LOGIC ---
            if (activePoint.name === 'RubiksCube') {
                monitorGlass.visible = false;
                monitorFrame.visible = false;
                console.log("entered Rubiks cube focus mode")
                lookTarget.copy(activePoint.position.clone());
                targetFov = 13; // Isometric squeeze

                const currentWindowAspect = window.innerWidth / window.innerHeight;
                const BASE_ASPECT = 16 / 9;
                let scaleFactor = 1.0;
                if (currentWindowAspect < BASE_ASPECT) {
                    scaleFactor = BASE_ASPECT / currentWindowAspect;
                }

                const dynamicDistance = isometricDistance * (1 + ((scaleFactor - 1) * 0.3));

                cameraTarget.set(
                    lookTarget.x + dynamicDistance,
                    lookTarget.y + dynamicDistance,
                    lookTarget.z + dynamicDistance
                );

                for (let i = 0; i < 10; i++) {
                    this.cube.scrambler();
                }
            }

            // --- 2. TERMINAL LOGIC ---
            else if (activePoint.name === 'Terminal') {
                // Keep the monitor visible!
                lookTarget.copy(activePoint.position.clone()); // Aims exactly at the glass center

                targetFov = 70; // A natural, slightly focused human eye FOV

                // The Diegetic Camera Offset:
                // Move the camera slightly up (Y) and pull it back (Z) from the screen.
                // NOTE: Depending on how your room is rotated in Blender, you might need to adjust 
                // the Z or X offset to pull straight back from the monitor glass.
                cameraTarget.set(
                    lookTarget.x,
                    lookTarget.y + 0.15, // Eye level, looking slightly down
                    lookTarget.z + 1.2   // Pull back to sit in the chair
                );
            }
        };

        const exitFocusMode = () => {
            this.isFocused = true; // Prevents spam clicking during animation
            isTransitioning = true;

            // Bring all UI hotspots back
            this.points.forEach(p => {
                p.element.style.opacity = '1';
                p.element.style.pointerEvents = 'auto';
            });

            // Return to home values
            targetFov = homeFov;
            cameraTarget.copy(cameraHome);
            lookTarget.copy(lookHome);

            // Ensure monitor is visible again
            monitorFrame.visible = true;
            monitorGlass.visible = true;
        };



        // Escape key exits
        window.addEventListener('keydown', (input) => {
            if (input.key === 'Escape' && this.isFocused) {
                exitFocusMode();
                this.isFocused = false
            }
        });




        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');


        gltfLoader.setDRACOLoader(dracoLoader);
        const pcParams = {
            color: '#151515',   // Use a hex string for the GUI color picker
            roughness: 0.65,
            metalness: 0.40,
            clearcoat: 0.1,     // Bonus: Adds a premium glossy shell over the metal
            clearcoatRoughness: 0.2
        };

        console.log(renderer.info)
        // טעינת המודל
        let walls;
        let monitorGlass;
        let monitorFrame;
        let terminalPosition;
        const model = gltfLoader.load('/models/newPanels2.glb', (gltf) => {
            gltf.scene.traverse((obj) => {
                if (obj.isMesh) {
                    console.log("Mesh:", obj.name, "| Material:", obj.material.name);
                    if (obj.name === "Mesh016_2") {
                        obj.material.transparent = true
                        obj.material.opacity = 0.2; // Adjust from 0.0 (invisible) to 1.0 (solid)
                        obj.material.depthWrite = false; // This is the magic line that stops the glitching
                    }
                    // 3. If it's just a normal PC part, nuke the grey and make it pitch black
                    if (obj.name === "Cube002_1") {
                        obj.material = new THREE.MeshStandardMaterial({
                            color: 0x222222,
                            roughness: 0.45,
                            metalness: 0.85
                        });
                        obj.material.needsUpdate = true;
                        obj.castShadow = true
                        obj.receiveShadow = true
                    }


                    if (obj.name === "Cube001") {
                        obj.receiveShadow = true;
                    }
                    if (obj.name === "Cube027" || obj.name === "Cube026" || obj.name.includes("Cylinder") || obj.name === "Top_Tb_Tex_0" || obj.name === "mouse" || obj.name.includes("MSI")) {
                        // Bed, controller, 
                        obj.castShadow = true
                        obj.receiveShadow = true;
                    }
                    if (obj.name.includes("MSI")) {
                        monitorFrame = obj
                        console.log(obj.position)
                    }
                    if (obj.name === "Screen") {
                        monitorGlass = obj
                        terminalPosition = obj.position
                        // Completely overwrite whatever material Blender sent
                        obj.material = new THREE.MeshBasicMaterial({
                            map: this.terminal.texture,
                        });
                        // Slide the texture down slightly. 
                        // Positive numbers push it up, negative push it down.
                        this.terminal.texture.offset.y = 0.15;
                        this.terminal.texture.repeat.set(1.5, 1.5, 1.5)

                        // If the edges start tiling/repeating when you move it, lock them:
                        // 4. Apply and update
                        obj.material.map = this.terminal.texture;
                        obj.material.needsUpdate = true;
                    }


                }

                // console.log(obj.name, Math.round(tris))
            })
            this.initHotspots();
            this.scene.add(gltf.scene)
        })

        // --- THE SHADOW SANITY CHECK ---
        // 1. A basic floor
        // const testPlane = new THREE.Mesh(
        //     new THREE.PlaneGeometry(10, 10),
        //     new THREE.MeshStandardMaterial({ color: 0xffffff })
        // );
        // testPlane.rotation.x = -Math.PI / 2;
        // testPlane.position.set(0, 2, 0); // Floating slightly above your actual room floor
        // testPlane.receiveShadow = true;
        // this.scene.add(testPlane);

        // // 2. A floating sphere
        // const testSphere = new THREE.Mesh(
        //     new THREE.SphereGeometry(1, 32, 32),
        //     new THREE.MeshStandardMaterial({ color: 0xff0000 })
        // );
        // testSphere.position.set(0, 3, 0); // Hovering above the test plane
        // testSphere.castShadow = true;
        // this.scene.add(testSphere);
        // -------------------------------

        // console.log(this.cube.cubeGroup.getWorldPosition(new THREE.Vector3()))
        const cubePosition = this.cube.cubeGroup.position

        /**
         * Points of interest
         */


        this.initHotspots = () => {
            const glassBox = new THREE.Box3().setFromObject(monitorGlass);
            const trueGlassCenter = new THREE.Vector3();
            glassBox.getCenter(trueGlassCenter);

            this.points = [
                {
                    name: 'RubiksCube',
                    position: this.cube.cubeGroup.position,
                    element: document.querySelector('#hotspot-cube'),
                    ignoreMeshes: [this.cube.cubeGroup]
                },
                {
                    name: 'Terminal',
                    position: trueGlassCenter,
                    element: document.querySelector('#hotspot-terminal'),
                    ignoreMeshes: [monitorFrame, monitorGlass]
                }
            ];

            // NEW: Dynamically attach a click listener to every hotspot in the array
            this.points.forEach((point) => {
                point.element.addEventListener('click', () => {
                    if (!this.isFocused && !isTransitioning) {
                        // Pass the specific point we clicked into the focus function
                        enterFocusMode(point);
                        this.currPointName = point.name
                    }
                });
            });
        }
        //  // console.log(this.cube.cubeGroup.getWorldPosition(new THREE.Vector3()))





        console.log(renderer.info)

        // Raycaster
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        // ==========================================
        // 🚨 TEMP DEBUG TOOL: CLICK TO GET MESH NAME
        // ==========================================
        const debugRaycaster = new THREE.Raycaster();
        const debugMouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // 1. Convert mouse pixel coordinates to WebGL Normalized Device Coordinates (-1 to +1)
            debugMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            debugMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // 2. Shoot the laser from the camera through the mouse position
            debugRaycaster.setFromCamera(debugMouse, this.camera);

            // 3. Get an array of every object the laser hit (true = check all nested children)
            const intersects = debugRaycaster.intersectObjects(this.scene.children, true);

            // 4. If we hit something, print the very first object (the closest one) to the console
            if (intersects.length > 0) {
                const hitObject = intersects[0].object;

                console.log(
                    `🎯 TARGET ACQUIRED:`,
                    `\nName: "${hitObject.name}"`,
                    `\nType: ${hitObject.type}`,
                    `\nMaterial:`, hitObject.material
                );
            }
        });


        // ==========================================

        // Add text Geometry
        this.particles = new Particles(this.scene)

        // Instantiate CubeInput
        this.CubeInput = new CubeInput(this.cube, renderer, this)


        // ---------------------------------------------------------
        // VIEWPORT & ASPECT RATIO MANAGER
        // ---------------------------------------------------------
        // We lock the baseline to 21:9 (Ultra-wide cinematic). 
        // This physically shrinks the canvas on standard 16:9 or 16:10 monitors, 
        // acting as a massive fill-rate optimization by saving the GPU from 
        // rendering the empty space at the top and bottom of the screen.
        const TARGET_ASPECT = 23 / 9;


        window.addEventListener('resize', () => {
            const windowAspect = window.innerWidth / window.innerHeight;

            // [ MOBILE PORTRAIT DETECTION ]
            // If the window is taller than it is wide (< 1.0), the user is on a vertical screen.
            const isPortrait = windowAspect < 1.0;

            // [ RESPONSIVE ASPECT RATIO ]
            // If on mobile (portrait), we abandon the 21:9 crop (which would create a tiny slit)
            // and adapt to the phone's native aspect ratio, filling the screen.
            // If on desktop (landscape), we enforce the cinematic 21:9 crop.
            // [ RESPONSIVE ASPECT RATIO ]

            let DYNAMIC_TARGET_ASPECT = TARGET_ASPECT; // start by assuming we want the cinematic 23/9 crop (Default state). 

            if (isPortrait) {
                // Mobile: Abandon the crop and use the phone's native aspect ratio to fill the screen
                DYNAMIC_TARGET_ASPECT = windowAspect; // the aspect ratio just becomes the phone's native 
            }

            // create two mutable variables and initially set them to fill 100% of the screen
            let canvasWidth = window.innerWidth;
            let canvasHeight = window.innerHeight;

            // [ CANVAS BOUNDARY MATH ]
            // Calculate exact pixel dimensions to maintain the DYNAMIC_TARGET_ASPECT.
            if (windowAspect < DYNAMIC_TARGET_ASPECT) {
                // if the window is narrower than target (e.g., standard 16:9 monitor).
                // Keep max width, shrink height. Flexbox will auto-center it, creating Top/Bottom black bars.
                canvasHeight = window.innerWidth / DYNAMIC_TARGET_ASPECT;
            } else {
                // Window is wider than target (e.g., 32:9 ultra-wide monitor).
                // Keep max height, shrink width. Flexbox auto-centers it, creating Left/Right black bars (Pillarboxing).
                canvasWidth = window.innerHeight * DYNAMIC_TARGET_ASPECT;
            }

            // 1. Lock the Three.js Camera frustum to the new mathematical ratio
            this.camera.aspect = DYNAMIC_TARGET_ASPECT; // Update the camera to render at the new aspect ratio to match the canvas
            this.camera.updateProjectionMatrix(); // compile the new aspect ratio into the core webGL math so the GPU can use it
            // after any modification to a camera propety we need to update projection matrix
            // since three.js doesn't need to update things  like FOV/AR each frame we need to update it manually

            // 2. Physically resize the WebGL Canvas element in the DOM
            renderer.setSize(canvasWidth, canvasHeight);

            // 3. Sync the Heavy Shader (Supernova)
            // The shader requires the exact pixel count to calculate uv coordinates correctly.
            // We multiply by devicePixelRatio to ensure it stays sharp on high-density displays (like retina/phones).
            if (this.supernova) {
                const currentRatio = renderer.getPixelRatio();
                this.supernova.uniforms.iResolution.value.set(
                    canvasWidth * currentRatio,
                    canvasHeight * currentRatio
                );
            }

            // [ DOM MEASUREMENT CACHE ]
            // measure the physical footprint of the canvas
            // This is required for raycasting and UI hotspots. 
            this.canvasRect = renderer.domElement.getBoundingClientRect();
        });

        // Trigger once on load to establish the initial layout and cache the rect.
        window.dispatchEvent(new Event('resize'));



        // ---------------------------------------------------------
        // TICK FUNCTION & HOTSPOT TRACKING
        // ---------------------------------------------------------
        const clock = new THREE.Clock()
        const cubeWorldPos = new THREE.Vector3();

        // [ MEMORY PRE-ALLOCATION ]
        let hotspotX = 0;
        let hotspotY = 0;
        let canvasLocalX = 0;
        let canvasLocalY = 0;
        let targetX = 0;
        let targetY = 0;



        const tick = () => {
            controls.update(); // Moved update controls and renderer update to the top so the hotspot gets synced with them at the current frame
            renderer.render(this.scene, this.camera);

            const elapsedTime = clock.getElapsedTime();
            stats.begin();
            // ---- CAMERA LERP ----
            // ---- CAMERA LERP ----
            if (isTransitioning) {
                // 1. Lerp position and look target
                this.camera.position.lerp(cameraTarget, 0.08);
                controls.target.lerp(lookTarget, 0.08);

                // 2. Lerp the FOV
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.08);
                this.camera.updateProjectionMatrix(); // CRITICAL: Required when FOV changes

                // Check if we've arrived (close enough)
                if (this.camera.position.distanceTo(cameraTarget) < 0.01) { // Bumped to 0.01 to prevent micro-stutters at the end of the lerp
                    this.camera.position.copy(cameraTarget);
                    this.camera.fov = targetFov; // Snap exactly to target just in case
                    this.camera.updateProjectionMatrix(); //

                    isTransitioning = false;

                    // Re-enable orbit controls only when returning home
                    if (!this.isFocused) {
                        controls.update();
                        trackballControls.update();
                        controls.enabled = true;
                    }
                }
            }
            const target = controls.target
            if (sceneReady === true && this.points) {
                for (const point of this.points) {
                    // 1. Grab the dynamic target position
                    const screenPos = point.position.clone();
                    screenPos.project(this.camera);

                    // [ THE SHIELD ]
                    if (
                        Math.abs(screenPos.x) > 1 ||
                        Math.abs(screenPos.y) > 1 ||
                        screenPos.z > 1
                    ) {
                        point.element.classList.remove('visible');
                        continue;
                    }

                    // 3. Aim the raycaster exactly at that 2D spot
                    raycaster.setFromCamera(new THREE.Vector2(screenPos.x, screenPos.y), this.camera);

                    // THE DYNAMIC SHIELD: Checks if the hit object is inside THIS specific point's ignore array
                    const intersects = raycaster.intersectObjects(this.scene.children, true)
                        .filter(hit => !point.ignoreMeshes.some(ignoreObj => ignoreObj.getObjectById(hit.object.id)));
                    // 🚨 THE DETECTIVE LOG
                    if (intersects.length === 0) {
                        point.element.classList.add('visible');
                    } else {
                        const intersectionDistance = intersects[0].distance;
                        const pointDistance = point.position.distanceTo(this.camera.position);

                        if (intersectionDistance < pointDistance) {
                            point.element.classList.remove('visible');
                        } else {
                            point.element.classList.add('visible');
                        }
                    }

                    // [ REVERSE-RAYCASTING: 3D TO HTML DOM ]
                    canvasLocalX = (screenPos.x * 0.5 + 0.5) * this.canvasRect.width;
                    canvasLocalY = (screenPos.y * -0.5 + 0.5) * this.canvasRect.height;

                    targetX = Math.round(this.canvasRect.left + canvasLocalX);
                    targetY = Math.round(this.canvasRect.top + canvasLocalY);

                    // DYNAMIC DOM UPDATE: Applies the math to whatever HTML element this point owns
                    point.element.style.transform = `translate(${targetX}px, ${targetY}px)`;
                }
            }
            this.supernova.update(elapsedTime, this.camera);
            // Update helpers in real-time if you move sliders in the GUI
            // mainLightHelper.update();
            // shadowCameraHelper.update();
            controls.update();
            trackballControls.target.set(target.x, target.y, target.z)
            trackballControls.update()
            // Go through each points 
            stats.end();
            requestAnimationFrame(tick);
        };
        tick()



    }




}   