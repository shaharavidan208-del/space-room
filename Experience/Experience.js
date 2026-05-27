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
import TerminalCanvas from './Terminal/TerminalCanvas.js';


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
        const gu = new GUI()
         this.terminal = new TerminalCanvas();

        const terminalTemporaryBoxGeometry = new THREE.BoxGeometry()

        const terminalTemporaryBoxMaterial = new THREE.MeshBasicMaterial({map: this.terminal.texture})

        const terminalTemporaryMesh = new THREE.Mesh(terminalTemporaryBoxGeometry, terminalTemporaryBoxMaterial)

        terminalTemporaryMesh.position.set(0, 7, 10)

        this.scene.add(terminalTemporaryMesh)


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
        // console.log(this.cube)

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;


        // FPS counter 
        const stats = new Stats();
        document.body.appendChild(stats.dom);


        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
        directionalLight.castShadow = true

        directionalLight.shadow.camera.far = 10
        directionalLight.shadow.camera.left = - 6
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        const _directionalLight = new THREE.DirectionalLight(0xffffff, 3)
        directionalLight.position.x = 3
        _directionalLight.position.x = -3
        this.scene.add(directionalLight, _directionalLight)

        // this.supernova = new SupernovaRemnant(this.scene, {
        //     position: new THREE.Vector3(-15, 5, 50),  // far away from room
        //     scale: 8,
        //     visible: true
        // })

        /**
         * Shader
         */

        // Tell the shader to expect the image texture
        // Add the TextureLoader at the top of Experience.js if you haven't already
        const textureLoader = new THREE.TextureLoader(loadingManager);

        // Load the noise image you downloaded
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
        const novaFolder = gu.addFolder('Supernova')
        // (min, max, increments), change supernova position 
        novaFolder.add(this.supernova.mesh.position, 'x', -1000, 1000, 1).name('Position X')
        novaFolder.add(this.supernova.mesh.position, 'y', -1000, 1000, 1).name('Position Y')
        novaFolder.add(this.supernova.mesh.position, 'z', -1000, 1000, 1).name('Position Z')
        novaFolder.add(this.supernova.mesh.scale, 'x', 1, 100, 0.5).name('Scale').onChange((val) => {
            this.supernova.mesh.scale.setScalar(val)
        })



        /**
        * Environment map
        */
        const environmentMap = loader.load('/environmentMaps/volcanic_planet._4k.hdr', (texture) => {
            environmentMap.mapping = THREE.EquirectangularReflectionMapping

            this.scene.background = environmentMap
        })

        document.addEventListener('contextmenu', (e) => e.preventDefault())


        // Camera
        this.camera = new THREE.PerspectiveCamera(65,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );
        this.camera.position.set(0, 7, 12);
        this.camera.lookAt(0, 3, 3)
        this.scene.add(this.camera);

        const cam = gu.addFolder('Camera')
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
        controls.target.set(0, 3, 3); // Set the initial target to match camera.lookAt
        controls.enableDamping = true;
        controls.dampingFactor = 0.12
        controls.minDistance = 0


        // Hot spot variables
        this.isFocused = false;
        const cameraTarget = new THREE.Vector3(); // where the camera moves toward (either cube or home position)
        const lookTarget = new THREE.Vector3();   // what camera is looking toward
        let isTransitioning = false; // 

        // Store the "home" position so you can return to it
        const cameraHome = new THREE.Vector3(0, 7, 14.5); // existing camera.position values
        const lookHome = new THREE.Vector3(0, 5, 6); // your existing camera.lookAt values

        /**
         * focus mode on cube
         */
        const cubeHotspot = document.querySelector(".cube")
        const enterFocusMode = () => {
            this.isFocused = true;
            isTransitioning = true;
            controls.enabled = false; // freeze OrbitControls
            cubeHotspot.style.opacity = '0';
            cubeHotspot.style.pointerEvents = 'none';  // ← ADD — don't intercept clicks while hidden

            // Get the cube's current world position as the look target
            this.cube.cubeGroup.getWorldPosition(lookTarget);

            // Position camera a fixed distance in front of the cube
            // Offset on Z so we're looking at it straight on
            cameraTarget.copy(lookTarget).add(new THREE.Vector3(0, 0.1, 0.8));
            for (let i = 0; i < 10; i++) {
                this.cube.scrambler()
                console.log("enteredLoop")
            }

        };
        const exitFocusMode = () => {
            this.isFocused = false;
            isTransitioning = true; // start lerping back to home position
            cubeHotspot.style.opacity = '1'; // Show hotspot again
            cubeHotspot.style.pointerEvents = 'auto';  // Re-enable clicks on hotspot

            // Return to home
            cameraTarget.copy(cameraHome); // where camera moves to
            lookTarget.copy(lookHome); // where camera looks at
        };

        // Escape key exits
        window.addEventListener('keydown', (input) => {
            if (input.key === 'Escape' && this.isFocused) {
                exitFocusMode();
            }
        });

        cubeHotspot.addEventListener('click', () => {
            if (!this.isFocused && !isTransitioning) {
                enterFocusMode();
            }
        });


        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');


        gltfLoader.setDRACOLoader(dracoLoader);

        // טעינת המודל
        let walls;
        const model = gltfLoader.load('/models/monitor_glass_seperated.glb', (gltf) => {
            gltf.scene.traverse((obj) => {
                if (obj.isMesh) {
                    const tris = obj.geometry.index
                        ? obj.geometry.index.count / 3
                        : obj.geometry.attributes.position.count / 3
                    // console.log(obj.name, Math.round(tris))
                }
            })
            this.scene.add(gltf.scene)
        })

        // console.log(this.cube.cubeGroup.getWorldPosition(new THREE.Vector3()))
        const cubePosition = this.cube.cubeGroup.position

        /**
         * Points of interest
         */
        const points = [
            {
                position: cubePosition,
                element: cubeHotspot
            }
        ]

        // Raycaster
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

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
            const DYNAMIC_TARGET_ASPECT = isPortrait ? windowAspect : TARGET_ASPECT;

            let canvasWidth = window.innerWidth;
            let canvasHeight = window.innerHeight;

            // [ CANVAS BOUNDARY MATH ]
            // Calculate exact pixel dimensions to maintain the DYNAMIC_TARGET_ASPECT.
            if (windowAspect < DYNAMIC_TARGET_ASPECT) {
                // Window is narrower than target (e.g., standard 16:9 monitor).
                // Keep max width, shrink height. Flexbox will auto-center it, creating Top/Bottom black bars.
                canvasHeight = window.innerWidth / DYNAMIC_TARGET_ASPECT;
            } else {
                // Window is wider than target (e.g., 32:9 ultra-wide monitor).
                // Keep max height, shrink width. Flexbox auto-centers it, creating Left/Right black bars (Pillarboxing).
                canvasWidth = window.innerHeight * DYNAMIC_TARGET_ASPECT;
            }

            // 1. Lock the Three.js Camera frustum to the new mathematical ratio
            this.camera.aspect = DYNAMIC_TARGET_ASPECT;
            this.camera.updateProjectionMatrix();

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
            const elapsedTime = clock.getElapsedTime();
            stats.begin();
            // ---- CAMERA LERP ----
            if (isTransitioning) {
                this.camera.position.lerp(cameraTarget, 0.08);
                controls.target.lerp(lookTarget, 0.08);

                // Check if we've arrived (close enough)
                if (this.camera.position.distanceTo(cameraTarget) < 0.001) {
                    this.camera.position.copy(cameraTarget);
                    isTransitioning = false;

                    // Re-enable orbit controls only when returning home
                    if (!this.isFocused) {
                        controls.update(); // Ensure orbitControls know about the new camera position
                        trackballControls.update()
                        controls.enabled = true;
                    }
                }
            }
            const target = controls.target
            if (sceneReady === true) {

                for (const point of points) {
                    const screenPos = point.position.clone()

                    // Convert 3D world coordinates into Normalized Device Coordinates (NDC).
                    // This maps the 3D space to a 2D grid ranging from -1 to +1.
                    screenPos.project(this.camera)

                    raycaster.setFromCamera(new THREE.Vector2(screenPos.x, screenPos.y), this.camera)
                    const intersects = raycaster.intersectObjects(this.scene.children, true)
                        .filter(hit => !this.cube.cubeGroup.getObjectById(hit.object.id))

                    if (intersects.length === 0) {
                        point.element.classList.add('visible')
                    }
                    else {
                        const intersectionDistance = intersects[0].distance
                        const pointDistance = point.position.distanceTo(this.camera.position)

                        if (intersectionDistance < pointDistance) {
                            point.element.classList.remove('visible')
                        }
                        else {
                            point.element.classList.add('visible')
                        }

                    }


                    // [ REVERSE-RAYCASTING: 3D TO HTML DOM ]

                    // Step 1: Map the -1 to +1 NDC coordinate to the *physical* pixel size of the canvas.
                    // (screenPos.x * 0.5 + 0.5) converts the -1 to +1 range into a 0.0 to 1.0 percentage.
                    canvasLocalX = (screenPos.x * 0.5 + 0.5) * this.canvasRect.width;

                    // Y in NDC is inverted (bottom is -1, top is +1), so we multiply by -0.5 to flip it for the DOM (where top is 0).
                    canvasLocalY = (screenPos.y * -0.5 + 0.5) * this.canvasRect.height;

                    // Step 2: Account for the Black Bars (The CSS Flexbox Offset)
                    // If the canvas is letterboxed, it doesn't start at the top-left of the monitor.
                    // We add canvasRect.left and canvasRect.top to perfectly align the HTML overlay with the shifted canvas.
                    targetX = this.canvasRect.left + canvasLocalX;
                    targetY = this.canvasRect.top + canvasLocalY;

                    // Step 3: Hardware-Accelerated DOM Update
                    hotspotX = targetX;
                    hotspotY = targetY;

                    // Using `transform: translate` pushes the math to the GPU compositor. 
                    // (Unlike `style.top` / `style.left`, which forces the CPU to recalculate the page layout every frame).
                    cubeHotspot.style.transform = `translate(${targetX}px, ${targetY}px)`;

                }
            }
            this.supernova.update(elapsedTime, this.camera);
            controls.update();
            trackballControls.target.set(target.x, target.y, target.z)
            trackballControls.update()
            // Go through each points 
            renderer.render(this.scene, this.camera);
            stats.end();

            requestAnimationFrame(tick);
        };
        tick()



    }




}   