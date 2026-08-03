import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import SupernovaRemnant from './SupernovaRemnant.js'
import Particles from './Particles.js'
import GUI from 'lil-gui';
import Cube from './Cube/Cube.js'
import CubeInput from './Cube/CubeInput.js'
import gsap from 'gsap'
import TerminalCanvas from './Terminal/TerminalCanvas.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { Timer } from "three";
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import LoadingScreen from './LoadingScreen.js'

export default class Experience {
    constructor(canvas) {
        // Scene
        let sceneReady = false
        this.scene = new THREE.Scene()

        /**
 * Loading screen
 *
 * LoadingScreen owns the overlay, loading manager,
 * title animation and entry transition.
 */
        this.loadingScreen =
            new LoadingScreen({
                scene: this.scene,

                onSceneReady: () => {
                    sceneReady = true
                }
            })

        /**
         * Keep a local reference so the existing loaders do not
         * need to change beyond this extraction.
         */
        const loadingManager =
            this.loadingScreen.loadingManager
        // Initialize the math library BEFORE creating the light
        RectAreaLightUniformsLib.init();
        // (Color, Intensity, Width, Height) 
        // Make the width/height roughly the size of your window opening
        const windowBounceLight = new THREE.RectAreaLight(0xff4400, 1.0, 30, 10);

        // Position it exactly at the glass, facing inward
        windowBounceLight.position.set(0, 5, -18);
        windowBounceLight.lookAt(0, 5, 0);


        this.gu = new GUI()

        this.terminal = new TerminalCanvas(this);
        /**
        * Lights
        */
        // ---------------------------------------------------------
        // WARM FLOOR BOUNCE
        // currently disabled, but kept for GUI testing
        // ---------------------------------------------------------
        const floorBounceLight = new THREE.RectAreaLight(0xffffff, 0.0, 28.6, 4.0);

        floorBounceLight.position.set(1.2, -7.5, -11.8);
        floorBounceLight.lookAt(11.7, 0, 0);

        this.scene.add(floorBounceLight);



        // ---------------------------------------------------------
        // COOL FLOOR DETAIL LIGHT
        // final-ish favorite version
        // ---------------------------------------------------------
        const coolFloorDetailLight = new THREE.RectAreaLight(0x7eb5e2, 0.5, 22, 9);

        coolFloorDetailLight.position.set(3.8, -9.2, -4.9);
        coolFloorDetailLight.lookAt(3.8, 0, 2.1);

        this.scene.add(coolFloorDetailLight);

        const coolFloorDetailLight2 = new THREE.RectAreaLight(0x7eb5e2, 0.5, 22, 9);

        coolFloorDetailLight2.position.set(10, -9.2, -4.9);
        coolFloorDetailLight2.lookAt(3.8, 0, 2.1);


        const coolFloorDetailLight3 = new THREE.RectAreaLight(0x7eb5e2, 1, 22, 9);

        coolFloorDetailLight3.position.set(-5, -9.2, -4.9);
        coolFloorDetailLight3.lookAt(3.8, 0, 2.1);



        /**
         * Bed back fill light
         *
         * RectAreaLight does not use a target object like DirectionalLight.
         * We store our own Vector3 target and call lookAt() whenever it changes.
         */

        const bedBackLight = new THREE.RectAreaLight(
            0xda581c, // Slightly cool fill color
            1,        // Intensity
            4,        // Width
            2.5       // Height
        )

        bedBackLight.name = 'BedBackFillLight'

        bedBackLight.position.set(
            3.4,
            -0.6,
            6.6
        )

        const bedBackLightTarget = new THREE.Vector3(
            1.9,  // Moved your desired target coordinates here
            0.9,
            1.9
        )

        bedBackLight.lookAt(bedBackLightTarget)

        this.scene.add(bedBackLight)
        /**
         * Re-aim the light after changing either its position
         * or the target position through the GUI.
         */
        const updateBedBackLightDirection = () => {
            bedBackLight.lookAt(bedBackLightTarget)
        }

        updateBedBackLightDirection()

        const bedBackLightDebug = {
            color: `#${bedBackLight.color.getHexString()}`
        }

        const bedBackLightFolder =
            this.gu.addFolder('Bed Back Light')

        bedBackLightFolder
            .addColor(bedBackLightDebug, 'color')
            .name('Color')
            .onChange((value) => {
                bedBackLight.color.set(value)
            })

        bedBackLightFolder
            .add(bedBackLight, 'intensity', 0, 20, 0.1)
            .name('Intensity')

        bedBackLightFolder
            .add(bedBackLight, 'width', 0.1, 10, 0.1)
            .name('Width')

        bedBackLightFolder
            .add(bedBackLight, 'height', 0.1, 10, 0.1)
            .name('Height')

        bedBackLightFolder
            .add(bedBackLight, 'visible')
            .name('Visible')

        const bedBackLightPositionFolder =
            bedBackLightFolder.addFolder('Position')

        bedBackLightPositionFolder
            .add(bedBackLight.position, 'x', -20, 20, 0.1)
            .name('X')
            .onChange(updateBedBackLightDirection)

        bedBackLightPositionFolder
            .add(bedBackLight.position, 'y', -10, 10, 0.1)
            .name('Y')
            .onChange(updateBedBackLightDirection)

        bedBackLightPositionFolder
            .add(bedBackLight.position, 'z', -20, 20, 0.1)
            .name('Z')
            .onChange(updateBedBackLightDirection)

        const bedBackLightTargetFolder =
            bedBackLightFolder.addFolder('Target')

        bedBackLightTargetFolder
            .add(bedBackLightTarget, 'x', -20, 20, 0.1)
            .name('X')
            .onChange(updateBedBackLightDirection)

        bedBackLightTargetFolder
            .add(bedBackLightTarget, 'y', -10, 10, 0.1)
            .name('Y')
            .onChange(updateBedBackLightDirection)

        bedBackLightTargetFolder
            .add(bedBackLightTarget, 'z', -20, 20, 0.1)
            .name('Z')
            .onChange(updateBedBackLightDirection)

        bedBackLightFolder.open()


        const loader = new HDRLoader(loadingManager)

        this.cube = new Cube(this.scene)



        console.log({
            forcedColors:
                window.matchMedia('(forced-colors: active)').matches,

            background:
                getComputedStyle(
                    document.querySelector('.loading-screen')
                ).backgroundImage,

            letterColor:
                getComputedStyle(
                    document.querySelector('.loading-letter')
                ).color
        })



        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.1));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        renderer.toneMapping =
            THREE.ACESFilmicToneMapping

        renderer.toneMappingExposure = 0.95

        // FPS counter 
        const stats = new Stats();
        document.body.appendChild(stats.dom);


        const debugParams = {
            lookX: 1,
            lookY: 1.24, // Start slightly above the floor
            lookZ: 0
        };

        const novaLightMainParams = {
            color: "'#da581c'",
            intensity: 14
        };

        const novaLightMain = new THREE.DirectionalLight(0xda581c, 20);

        novaLightMain.position.set(0, 8.6, -11);
        novaLightMain.target.position.set(0, -3.2, -5.6);

        this.scene.add(novaLightMain);
        this.scene.add(novaLightMain.target);

        const mainLightFolder = this.gu.addFolder('Main Light');

        // mainLightFolder
        //     .addColor(novaLightMainParams, 'color')
        //     .name('Color')
        //     .onChange((value) => {
        //         novaLightMain.color.set(value);
        //     });

        // mainLightFolder
        //     .add(novaLightMain, 'intensity', 0, 40, 0.1)
        //     .name('Intensity');
        novaLightMain.castShadow = true;

        this.scene.add(novaLightMain);
        this.scene.add(novaLightMain.target);

        // const novaLightWideA = new THREE.DirectionalLight(0xff4400, 8);
        // novaLightWideA.position.set(-8, 8, -22);
        // novaLightWideA.target.position.set(0, 3, -10);
        // novaLightWideA.castShadow = false;

        // const novaLightWideB = new THREE.DirectionalLight(0xff4400, 1.5);
        // novaLightWideB.position.set(12, 6, -20);
        // novaLightWideB.target.position.set(0, 2, -5);
        // novaLightWideB.castShadow = false;

        // Tighter shadow box for higher resolution shadows
        novaLightMain.shadow.mapSize.width = 1024;
        novaLightMain.shadow.mapSize.height = 1024;

        novaLightMain.shadow.camera.left = -12
        novaLightMain.shadow.camera.right = 12
        novaLightMain.shadow.camera.top = 10
        novaLightMain.shadow.camera.bottom = -10

        novaLightMain.shadow.camera.near = 0.5;
        novaLightMain.shadow.camera.far = 100;

        novaLightMain.shadow.normalBias = 0.03;
        novaLightMain.shadow.bias = -0.0005;

        // Only need to update the projection matrix ONCE after setting all camera bounds
        novaLightMain.shadow.camera.updateProjectionMatrix();





        // ==========================================
        // SUPERNOVA LIGHTING GUI & HELPERS
        // ==========================================
        //         const lightFolder = this.gu.addFolder('Supernova Lights');

        //         // // 1. MAIN LIGHT (The Shadow Caster)
        //         const mainFolder = lightFolder.addFolder('Main Light (Shadow Caster)');
        //         const novaLightMainDebug = {
        //     color: `#${novaLightMain.color.getHexString()}`
        // }

        // const novaLightMainFolder = this.gu.addFolder('Nova Light Main')

        // // // Color
        // novaLightMainFolder
        //     .addColor(novaLightMainDebug, 'color')
        //     .name('Color')
        //     .onChange((value) => {
        //         novaLightMain.color.set(value)
        //     })

        // // // Intensity
        // novaLightMainFolder
        //     .add(novaLightMain, 'intensity', 0, 50, 0.1)
        //     .name('Intensity')

        // // Light position
        // const novaPositionFolder =
        //     novaLightMainFolder.addFolder('Position')

        // novaPositionFolder
        //     .add(novaLightMain.position, 'x', -50, 50, 0.1)
        //     .name('X')

        // novaPositionFolder
        //     .add(novaLightMain.position, 'y', -50, 50, 0.1)
        //     .name('Y')

        // novaPositionFolder
        //     .add(novaLightMain.position, 'z', -50, 50, 0.1)
        //     .name('Z')

        // // DirectionalLight aims toward its target object.
        // const novaTargetFolder =
        //     novaLightMainFolder.addFolder('Target')

        // novaTargetFolder
        //     .add(novaLightMain.target.position, 'x', -50, 50, 0.1)
        //     .name('X')

        // novaTargetFolder
        //     .add(novaLightMain.target.position, 'y', -50, 50, 0.1)
        //     .name('Y')

        // novaTargetFolder
        //     .add(novaLightMain.target.position, 'z', -50, 50, 0.1)
        //     .name('Z')

        // novaLightMainFolder.open()




        // // HELPERS & UPDATERS
        // const mainHelper = new THREE.DirectionalLightHelper(novaLightMain, 2);
        // // Force helpers to redraw when GUI sliders are moved
        // const updateMainHelpers = () => {
        //     mainHelper.update();
        //     novaLightMain.shadow.camera.updateProjectionMatrix();
        //     shadowCameraHelper.update();
        // };

        // mainFolder.onChange(updateMainHelpers);

        // ==========================================
        // DESK LIGHTS (Untouched)
        // ==========================================
        const deskLight =
            new THREE.PointLight(0x35d5e5, 5, 5)

        const deskLight2 =
            new THREE.PointLight(0x35d5e5, 5, 5)
        deskLight.decay = 2;
        deskLight2.decay = 2;
        deskLight.position.set(0, 2.5, 0); // up in the ceiling
        deskLight2.position.set(2.5, 1.2, -4.2); // near desk
        this.scene.add(deskLight, deskLight2);

        this.gu.hide()
        this.scene.add(deskLight, deskLight2)

        // Load the noise image
        const textureLoader = new THREE.TextureLoader()
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
            noiseMap: noiseTexture
        });

        this.supernova.mesh.position.x = -15
        this.supernova.mesh.position.y = 6
        this.supernova.mesh.position.z = -850 // very far away in the distance, so it looks like it's outside the window, but not too far so it doesn't get clipped by the far plane
        this.supernova.mesh.scale.setScalar(175) // huge scale to make it look like it's far away in the distance
        // const novaFolder = gu.addFolder('Supernova')
        // // (min, max, increments), change supernova position 
        // novaFolder.add(this.supernova.mesh.position, 'x', -1000, 1000, 1).name('Position X')
        // novaFolder.add(this.supernova.mesh.position, 'y', -1000, 1000, 1).name('Position Y')
        // novaFolder.add(this.supernova.mesh.position, 'z', -1000, 1000, 1).name('Position Z')
        // novaFolder.add(this.supernova.mesh.scale, 'x', 1, 100, 0.5).name('Scale').onChange((val) => {
        //     this.supernova.mesh.scale.setScalar(val)
        // })





        /**
        * Environment map
        */
        const environmentMap = loader.load(
            '/environmentMaps/volcanic_planet_compressed.hdr',
            (environmentMap) => {
                environmentMap.mapping =
                    THREE.EquirectangularReflectionMapping

                this.scene.background = environmentMap
                this.scene.environment = environmentMap

                /**
                 * Only changes the visible skybox.
                 */
                this.scene.backgroundIntensity = 8

                /**
                 * Changes how strongly the HDR lights and reflects
                 * on physical materials.
                 */
                this.scene.environmentIntensity = 0.8



            }
        )

        document.addEventListener('contextmenu', (e) => e.preventDefault()) // prevent RMB click pop up


        // Camera
        this.camera = new THREE.PerspectiveCamera(70,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );


        this.camera.position.set(1.5, 2.5, 10.5);
        this.camera.lookAt(0.9, 1.24, 0)
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
        // const cameraFolder = this.gu.addFolder('Initial Look Target');

        // .add(object, property).min.max.step.name.onChange
        // cameraFolder.add(debugParams, 'lookX').min(-10).max(10).step(0.01).name('Target X').onChange(updateCameraTarget);
        // cameraFolder.add(debugParams, 'lookY').min(-10).max(10).step(0.01).name('Target Y').onChange(updateCameraTarget);
        // cameraFolder.add(debugParams, 'lookZ').min(-10).max(10).step(0.01).name('Target Z').onChange(updateCameraTarget);

        // cameraFolder.open(); // Keeps the folder open by default


        const cam = this.gu.addFolder('Camera')
        // (min, max, increments), change supernova position 
        // cam.add(this.camera.position, 'x', -25, 25, 0.1).name('Position X')
        // cam.add(this.camera.position, 'y', -25, 25, 0.1).name('Position Y')
        // cam.add(this.camera.position, 'z', -25, 25, 0.1).name('Position Z')

        // Controls
        const trackballControls = new TrackballControls(this.camera, canvas)
        trackballControls.noRotate = true
        trackballControls.noZoom = false
        trackballControls.zoomSpeed = 2
        trackballControls.panSpeed = 0.5
        const controls = new OrbitControls(this.camera, canvas);
        // controls.zoomSpeed = 2.0 // Increase zoom speed
        controls.enableZoom = false
        controls.target.set(0.9, 1.24, 0); // Set the initial target to match camera.lookAt
        controls.enableDamping = true;
        controls.dampingFactor = 0.12
        controls.minDistance = 0
        let isTransitioning = false;

        // Hot spot variables
        this.isFocused = false;
        const lookTarget = this.cube.cubeGroup.position.clone(); // this is the point the camera will look at when focusing on a hotspot

        // Increase the offset significantly so we don't end up inside the mesh when we lower the FOV
        const isometricDistance = 1.8

/**
 * The old camera was offset by 1.8 on X, Y and Z.
 * This preserves approximately the same total camera distance
 * while switching to a straight-on view.
 */
const frontDistance =
    isometricDistance * Math.sqrt(3)

const cameraTarget = new THREE.Vector3(
    lookTarget.x,
    lookTarget.y,
    lookTarget.z + frontDistance
)

        const cameraHome = this.camera.position.clone()
        const lookHome = new THREE.Vector3(0.9, 1.24, 0);

        // --- NEW FOV VARIABLES ---
        const homeFov = this.camera.fov;
        let targetFov = homeFov; // We will lerp toward this value

        function showItems(visibility, meshArray) {
            meshArray.forEach((ceilingMesh) => {
                ceilingMesh.visible = visibility; // toggle visibility based on the parameter
            });
        }


        const setRendererPixelRatio = (ratio) => {
            renderer.setPixelRatio(ratio);

            const canvasWidth = renderer.domElement.clientWidth;
            const canvasHeight = renderer.domElement.clientHeight;

            renderer.setSize(canvasWidth, canvasHeight, false);

            if (this.supernova) {
                const currentRatio = renderer.getPixelRatio();

                this.supernova.uniforms.iResolution.value.set(
                    canvasWidth * currentRatio,
                    canvasHeight * currentRatio
                );
            }

            this.canvasRect = renderer.domElement.getBoundingClientRect();

            console.log("Renderer pixel ratio:", renderer.getPixelRatio());
        };
        /**
         * focus mode on cube
         */
        const cubeControlsHint = document.querySelector('#cube-controls-hint'); // UI for the cube controls 
        const cubeHotspot = document.querySelector("#hotspot-cube")
        const enterFocusMode = (activePoint) => {
            this.isFocused = true;
            trackballControls.enabled = false
            controls.enabled = false
            isTransitioning = true;

            // Hide ALL UI hotspots so they don't float around while we are zoomed in
            this.points.forEach(p => {
                p.element.style.opacity = '0';
                p.element.style.pointerEvents = 'none';
            });
            // --- 1. RUBIK'S CUBE LOGIC ---
            if (activePoint.name === 'RubiksCube') {
                showItems(false, ceilingMeshes)
                showItems(false, monitorMeshes)

                controls.enabled = true
                controls.enableZoom = true
                controls.enableRotate = false
                controls.enablePan = false

                cubeControlsHint.classList.add('visible')

                lookTarget.copy(activePoint.position)

                targetFov = 15

                const currentWindowAspect =
                    window.innerWidth / window.innerHeight

                const BASE_ASPECT = 16 / 9

                let scaleFactor = 0.8

                if (currentWindowAspect < BASE_ASPECT) {
                    scaleFactor =
                        BASE_ASPECT / currentWindowAspect
                }

                const dynamicDistance =
                    frontDistance *
                    (1 + ((scaleFactor - 1) * 0.2))

                /**
                 * Keep the camera horizontally and vertically aligned
                 * with the cube, and move it only along world Z.
                 *
                 * This creates a straight-on front view.
                 */
                cameraTarget.set(
                    lookTarget.x,
                    lookTarget.y,
                    lookTarget.z + dynamicDistance
                )
            }

            // --- 2. TERMINAL LOGIC ---
            else if (activePoint.name === 'Terminal') {
                lookTarget.copy(activePoint.position.clone());

                // Aim slightly below the screen center so the keyboard/base becomes part of the shot.
                lookTarget.y -= 0.12;

                // Slightly narrower than 70 so the terminal still feels focused,
                // but not so zoomed-in that the keyboard disappears.
                targetFov = 62;

                cameraTarget.set(
                    lookTarget.x,
                    lookTarget.y + 0.22,
                    lookTarget.z + 1.55
                );
            }
        };

        const exitFocusMode = () => {
            showItems(true, ceilingMeshes) // unhide ceiling
            showItems(true, monitorMeshes)
            cubeControlsHint.classList.remove('visible');
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

        };

        // Escape key exits
        window.addEventListener('keydown', (input) => {
            if (input.key === 'Escape' && this.isFocused) {
                exitFocusMode();
                this.isFocused = false
                this.currPointName = ""
            }
        });


        console.log(renderer.info)
        // טעינת המודל
        let walls;
        let monitorGlass;
        let monitorFrame;
        let terminalPosition;

        const objectsArr = []

        const hotspotOccluderNames = new Set([
            "Cylinder002",
            "Cylinder003",
            "Cube002",
            "Cube1",
            "Cylinder005",
            "Plane",
            "Screen",
            "Mesh009",
            "Mesh015",
            "Mesh011",
            "spaceship-window-side",
            "spaceship-window-side001",
            "Occluder_Floor",
            "Occluder_Ceiling",
            "Wall_mesh",
            "Wall_mesh2",
            "Circle013_1",
            "Occluder_Wall"

        ]);


        const shouldAddHotspotOccluder = (obj) => {
            if (hotspotOccluderNames.has(obj.name)) {
                return true;
            }

            return false;
        };
        const monitorMeshes = []
        const ceilingMeshes = [];
        const glbDebugMeshes = [];

        let monitorMesh

        const dracoLoader = new DRACOLoader(loadingManager)

        dracoLoader.setDecoderPath('/draco/')

        const gltfLoader = new GLTFLoader(loadingManager)

        gltfLoader.setDRACOLoader(dracoLoader)
        const model = gltfLoader.load('/models/Untitled.glb', (gltf) => {
            gltf.scene.traverse((obj) => {
                if (!obj.isMesh) {
                    return;
                }
                glbDebugMeshes.push(obj);


                // KILL THE DOUBLE-RENDER TRANSMISSION PASS 
                if (obj.material && obj.material.transmission > 0) {
                    // Force transmission to 0 to cancel the background render pass
                    obj.material.transmission = 0;
                    // Ensure it falls back to standard, cheap transparency
                    obj.material.transparent = true;
                    obj.material.needsUpdate = true;
                }
                if (obj.isMesh) {


                    if (shouldAddHotspotOccluder(obj)) {
                        objectsArr.push(obj);
                    }
                    if (obj.name.includes("ceil") || obj.name.includes("Mesh018") || obj.name.includes("Mesh019") || obj.name.includes("Mesh021") || obj.name === "Mesh001_1" || obj.name === "Mesh001" || obj.name.includes("Mesh001") || obj.name.includes("Mesh045") || obj.name.includes("Mesh047")) {
                        ceilingMeshes.push(obj); // it will catch all the ceiling meshes and hide them when the cube is focused on, but not when the terminal is focused on
                    }
                    console.log("Mesh:", obj.name, "| Material:", obj.material.name);
                    if (obj.name === "Occluder_Floor" || obj.name === "Occluder_Ceiling" || obj.name === "Wall_mesh" || obj.name === "Wall_mesh2") {
                        obj.material.side = THREE.DoubleSide;
                        obj.visible = false

                    }


                    if (obj.name === "Mesh043_2") { // windows
                        obj.material.transparent = true;
                        obj.material.opacity = 0.08;
                        obj.material.depthWrite = false;
                        obj.material.side = THREE.DoubleSide;
                    }

                    if (obj.name.includes("Mesh0")) { // floor 
                        obj.receiveShadow = true
                    }


                    if (obj.name.includes("Circle") || obj.name.includes("Plane") || obj.name.includes("Sci-fi_trash")) {
                        obj.castShadow = true
                    }

                    if (obj.name === "Sci-fi_Bed2") {
                        obj.receiveShadow = true
                        obj.castShadow = true
                    }

                    if (obj.name === "Box007") {
                        obj.castShadow = true
                        obj.receiveShadow = true
                    }

                    if (obj.name === "Cube_Screen_0") {
                        monitorMeshes.push(obj)
                        monitorGlass = obj
                        terminalPosition = obj.position
                        // Completely overwrite whatever material Blender sent
                        obj.material = new THREE.MeshBasicMaterial({
                            map: this.terminal.texture,
                        });

                        // If the edges start tiling/repeating when you move it, lock them:
                        // 4. Apply and update
                        obj.material.map = this.terminal.texture;
                        this.terminal.texture.repeat.set(1, 1); // No tiling
                        obj.material.needsUpdate = true;
                    }


                }

            })
            instanceRepeatedMeshes(gltf.scene, [
                'Mesh057_1',
                'Mesh057_2',
                'Mesh057_3',
                'Mesh048',
                'Mesh048_1'
            ]);
            this.initHotspots();
            this.scene.add(gltf.scene)
        })


        // Press 'i' on your keyboard to print the Draw Call Ledger
        window.addEventListener('keydown', (e) => {
            if (e.key === 'i') {
                let meshCount = 0;
                const drawCallLedger = {};

                this.scene.traverse((child) => {
                    if (child.isMesh && child.visible) {
                        meshCount++;

                        const parentName = child.parent
                            ? (child.parent.name || child.parent.type)
                            : 'Root';

                        if (!drawCallLedger[parentName]) {
                            drawCallLedger[parentName] = 0;
                        }

                        drawCallLedger[parentName]++;
                    }
                });

                console.log(`🔍 TOTAL VISIBLE MESHES: ${meshCount}`);
                console.table(drawCallLedger);
            }
        });
        /**
 * Replaces repeated meshes with THREE.InstancedMesh objects.
 *
 * Each mesh name becomes its own instanced batch because each one
 * has different geometry and/or material.
 */
        function instanceRepeatedMeshes(root, meshNames) {
            root.updateMatrixWorld(true);

            const inverseRootMatrix = new THREE.Matrix4()
                .copy(root.matrixWorld)
                .invert();

            for (const meshName of meshNames) {
                const matches = [];

                root.traverse((child) => {
                    if (!child.isMesh) {
                        return;
                    }

                    if (child.name !== meshName) {
                        return;
                    }

                    matches.push(child);
                });

                if (matches.length < 2) {
                    continue;
                }

                const sourceMesh = matches[0];

                const instancedMesh = new THREE.InstancedMesh(
                    sourceMesh.geometry,
                    sourceMesh.material,
                    matches.length
                );

                instancedMesh.name = `${meshName}_Instanced`;

                /*
                 * This controls whether the bed contributes to the
                 * directional light's shadow map.
                 */
                instancedMesh.castShadow = false
                instancedMesh.receiveShadow =
                    sourceMesh.receiveShadow


                const instanceMatrix = new THREE.Matrix4();

                for (
                    let index = 0;
                    index < matches.length;
                    index++
                ) {
                    instanceMatrix
                        .copy(inverseRootMatrix)
                        .multiply(matches[index].matrixWorld);

                    instancedMesh.setMatrixAt(
                        index,
                        instanceMatrix
                    );
                }

                instancedMesh.instanceMatrix.needsUpdate = true;

                /*
                 * Important after changing instance matrices.
                 * These bounds must include all 14 copies.
                 */
                instancedMesh.computeBoundingBox();
                instancedMesh.computeBoundingSphere();

                root.add(instancedMesh);

                for (const mesh of matches) {
                    mesh.removeFromParent();
                }

                console.log(
                    `Instanced ${matches.length} copies of ${meshName}`,
                    instancedMesh.boundingSphere
                );
            }

            root.updateMatrixWorld(true);
        }
        /**
         * Points of interest
         */

        const shadowCameraHelper =
            new THREE.CameraHelper(
                novaLightMain.shadow.camera
            )
        this.initHotspots = () => {
            const glassBox = new THREE.Box3().setFromObject(monitorGlass);
            const trueGlassCenter = new THREE.Vector3();
            glassBox.getCenter(trueGlassCenter);

            this.points = [
                {
                    name: 'RubiksCube',
                    position: this.cube.cubeGroup.position,
                    element: document.querySelector('#hotspot-cube'),
                    ignoreMeshes: [this.cube.cubeGroup, this.floorMesh, this.ceilingMesh]
                },
                {
                    name: 'Terminal',
                    position: trueGlassCenter,
                    element: document.querySelector('#hotspot-terminal'),
                    ignoreMeshes: [monitorFrame, monitorGlass, this.floorMesh, this.ceilingMesh]
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




        console.log(this)

        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()

        const isVisibleInHierarchy = (object) => {
            let current = object;

            while (current) {
                if (!current.visible) {
                    return false;
                }

                current = current.parent;
            }

            return true;
        };

        const getObjectPath = (object) => {
            const names = [];
            let current = object;

            while (current && current !== this.scene) {
                let label = current.name;

                if (!label || label.trim() === "") {
                    label = `[${current.type}]`;
                }

                names.unshift(label);
                current = current.parent;
            }

            return names.join(" > ");
        };

        const getMaterialDebugName = (material) => {
            if (!material) {
                return "No material";
            }

            if (Array.isArray(material)) {
                const materialNames = [];

                for (const singleMaterial of material) {
                    if (singleMaterial.name && singleMaterial.name.trim() !== "") {
                        materialNames.push(singleMaterial.name);
                    }
                    else {
                        materialNames.push(singleMaterial.type);
                    }
                }

                return materialNames.join(", ");
            }

            if (material.name && material.name.trim() !== "") {
                return material.name;
            }

            return material.type;
        };

        const inspectGlbObjectFromPointer = (event) => {
            // Hold Shift while clicking so this does not mess with normal interactions.
            if (!event.shiftKey) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }

            const rect = renderer.domElement.getBoundingClientRect();

            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, this.camera);

            const hits = raycaster.intersectObjects(glbDebugMeshes, true);

            if (hits.length === 0) {
                console.log("No GLB object hit.");
                return;
            }

            let selectedHit = null;

            for (const hit of hits) {
                if (isVisibleInHierarchy(hit.object)) {
                    selectedHit = hit;
                    break;
                }
            }

            if (!selectedHit) {
                console.log("Only hidden GLB objects were hit.");
                return;
            }

            const object = selectedHit.object;
            const worldPosition = new THREE.Vector3();

            object.getWorldPosition(worldPosition);

            console.group("🎯 GLB Object Inspector");
            console.log("Object name:", object.name);
            console.log("Object type:", object.type);
            console.log("Material:", getMaterialDebugName(object.material));
            console.log("Parent:", object.parent ? object.parent.name : "No parent");
            console.log("Full path:", getObjectPath(object));
            console.log("Distance from camera:", selectedHit.distance);
            console.log("Hit point:", selectedHit.point);
            console.log("Object world position:", worldPosition);
            console.log("Object:", object);

            if (selectedHit.uv) {
                console.log("UV:", selectedHit.uv);
            }

            console.groupEnd();

            const maxHitsToShow = Math.min(hits.length, 10);
            const hitTable = [];

            for (let i = 0; i < maxHitsToShow; i++) {
                const hit = hits[i];

                hitTable.push({
                    index: i,
                    name: hit.object.name,
                    material: getMaterialDebugName(hit.object.material),
                    distance: hit.distance,
                    visible: isVisibleInHierarchy(hit.object),
                    path: getObjectPath(hit.object)
                });
            }

            console.table(hitTable);
        };

        const getSignalTrace = () => {
            if (this.currPointName !== "Terminal") {
                return null
            }

            if (this.terminal.mode !== "signalTrace") {
                return null
            }

            if (!this.terminal.signalTrace) {
                return null
            }

            return this.terminal.signalTrace
        }



        /**
         * Returns the names of one material or multiple materials.
         */
        function getMaterialNames(material) {
            if (!material) {
                return 'No material';
            }
            if (Array.isArray(material)) {
                return material.map((currentMaterial) => {
                    return currentMaterial.name;
                });
            }
            return material.name;
        }

        /**
         * Logs the clicked object's full parent hierarchy.
         */
        function logParentChain(object) {
            const parentChain = [];
            let currentObject = object;

            while (currentObject) {
                parentChain.push({
                    name: currentObject.name || '(unnamed)',
                    type: currentObject.type
                });

                currentObject = currentObject.parent;
            }

            console.log('Parent chain:', parentChain);
        }
        /**
         * Given a pointer event, this function calculates the corresponding position on the terminal's canvas.
         * It uses raycasting to determine where the pointer intersects with the monitor glass and then maps that intersection to the terminal's canvas coordinates. 
         * @param {*} event the pointer event (e.g., mouse click or touch) from which to derive the position.
         * @returns an object with x and y properties representing the position on the terminal's canvas, or null if the pointer does not intersect with the monitor glass.
         */
        const getTerminalCanvasPositionFromPointerEvent = (event) => {
            if (!monitorGlass) {
                return null
            }

            const rect = renderer.domElement.getBoundingClientRect()

            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(pointer, this.camera)

            const hits = raycaster.intersectObject(monitorGlass)

            if (hits.length === 0) {
                return null
            }

            const hit = hits[0]

            if (!hit.uv) {
                return null
            }

            const rawU = hit.uv.x
            const rawV = hit.uv.y


            const canvasX = rawU * this.terminal.canvas.width // Map the transformed U to the canvas width
            const canvasY = (1 - rawV) * this.terminal.canvas.height // Invert Y because canvas coordinates start from the top-left

            return {
                x: canvasX,
                y: canvasY
            }
        }
        /**
         * Handles pointer events on the monitor.
         * @param {*} event the pointer event (e.g., mouse click or touch) that occurred on the monitor.
         * @param {*} type the type of pointer event: "down", "move", or "up".
         * @returns the position on the terminal's canvas, or null if the pointer does not intersect with the monitor glass.
         */
        const handleMonitorPointerEvent = (event, type) => {
            const signalTrace = getSignalTrace()

            if (!signalTrace) {
                return
            }

            const canvasPosition = getTerminalCanvasPositionFromPointerEvent(event)

            if (!canvasPosition) {
                if (type === "up") {
                    signalTrace.handlePointerCancel()
                }

                return
            }

            if (type === "down") {
                renderer.domElement.setPointerCapture(event.pointerId) // set pointer capture is critical for touch events, otherwise the pointerup event won't fire if the user drags outside the canvas
                signalTrace.handlePointerDown(canvasPosition.x, canvasPosition.y)
            }
            else if (type === "move") {
                signalTrace.handlePointerMove(canvasPosition.x, canvasPosition.y)
            }
            else if (type === "up") {
                signalTrace.handlePointerUp(canvasPosition.x, canvasPosition.y)

                if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                    renderer.domElement.releasePointerCapture(event.pointerId)
                }
            }
        }

        renderer.domElement.addEventListener("pointercancel", (event) => {
            const signalTrace = getSignalTrace()

            if (!signalTrace) {
                return
            }

            signalTrace.handlePointerCancel()

            if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                renderer.domElement.releasePointerCapture(event.pointerId)
            }
        })


        renderer.domElement.addEventListener("pointerdown", (event) => inspectGlbObjectFromPointer(event, "down"))
        renderer.domElement.addEventListener("pointerdown", (event) => handleMonitorPointerEvent(event, "down"))
        renderer.domElement.addEventListener("pointermove", (event) => handleMonitorPointerEvent(event, "move"))
        renderer.domElement.addEventListener("pointerup", (event) => handleMonitorPointerEvent(event, "up"))

        // Instantiate CubeInput
        this.CubeInput = new CubeInput(this.cube, renderer, this)



        // ---------------------------------------------------------
        // VIEWPORT & ASPECT RATIO MANAGER
        // ---------------------------------------------------------
        // We lock the baseline to 21:9 (Ultra-wide cinematic). 
        // This physically shrinks the canvas on standard 16:9 or 16:10 monitors, 
        // acting as a massive fill-rate optimization by saving the GPU from 
        // rendering the empty space at the top and bottom of the screen.
        const TARGET_ASPECT = 20 / 9;

        /**
 * Export the procedural hologram platform.
 *
 * Press Shift + H to download it as a GLB.
 */
        window.addEventListener('keydown', async (event) => {
            if (event.code !== 'KeyH' || !event.shiftKey) {
                return
            }

            const exporter = new GLTFExporter()

            /**
             * Clone it so exporting does not move or modify
             * the version currently inside the station.
             */
            const hologramToExport =
                this.cubeHologram.clone(true)

            /**
             * Center it in Blender.
             *
             * Keep its current scale so Blender receives the size
             * you established through the GUI.
             */
            hologramToExport.position.set(0, 0, 0)
            hologramToExport.rotation.set(0, 0, 0)

            hologramToExport.updateMatrixWorld(true)

            /**
             * Wrap it in a temporary scene for the exporter.
             */
            const exportScene = new THREE.Scene()

            exportScene.name = 'HologramExportScene'
            exportScene.add(hologramToExport)

            try {
                const glb = await exporter.parseAsync(
                    exportScene,
                    {
                        binary: true,
                        onlyVisible: true,
                    }
                )

                const blob = new Blob(
                    [glb],
                    {
                        type: 'model/gltf-binary',
                    }
                )

                const downloadUrl =
                    URL.createObjectURL(blob)

                const downloadLink =
                    document.createElement('a')

                downloadLink.href = downloadUrl
                downloadLink.download =
                    'cube-hologram-platform.glb'

                document.body.appendChild(downloadLink)

                downloadLink.click()
                downloadLink.remove()

                URL.revokeObjectURL(downloadUrl)

                console.log(
                    'Cube hologram exported successfully.'
                )
            }
            catch (error) {
                console.error(
                    'Failed to export cube hologram:',
                    error
                )
            }
        })
        let hotspotNeedUpdate = false
        window.addEventListener('resize', () => {
            hotspotNeedUpdate = true
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

            if (isPortrait || windowAspect >= DYNAMIC_TARGET_ASPECT) {
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
        const timer = new THREE.Timer()
        const cubeWorldPos = new THREE.Vector3();

        // [ MEMORY PRE-ALLOCATION ]
        let hotspotX = 0;
        let hotspotY = 0;
        let canvasLocalX = 0;
        let canvasLocalY = 0;
        let targetX = 0;
        let targetY = 0;
        const tempScreenVector = new THREE.Vector2();
        const tempHitPoint = new THREE.Vector3();

        controls.addEventListener('change', () => {
            hotspotNeedUpdate = true;
        });

        trackballControls.addEventListener('change', () => {
            hotspotNeedUpdate = true
        });

        const tick = (timestamp) => {
            controls.update(); // Moved update controls and renderer update to the top so the hotspot gets synced with them at the current frame
            renderer.render(this.scene, this.camera);

            timer.update(timestamp)
            const elapsedTime = timer.getElapsed();
            const delta = timer.getDelta()

            this.loadingScreen.update(delta)

            stats.begin()
            // ---- CAMERA LERP ----
            if (isTransitioning) {
                hotspotNeedUpdate = true
                // 1. Lerp position and look target
                this.camera.position.lerp(cameraTarget, delta * 12);
                controls.target.lerp(lookTarget, delta * 12);

                // 2. Lerp the FOV
                this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 12);
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
                        trackballControls.enabled = true
                        controls.enabled = true
                        controls.enableRotate = true
                        controls.enablePan = true
                    }
                }
            }
            const target = controls.target
            if (sceneReady === true && this.points && hotspotNeedUpdate) {
                for (const point of this.points) {
                    // Convert the hotspot's 3D world position into normalized screen coordinates.
                    // After projection:
                    // x and y are between -1 and 1 when visible on screen.
                    // z tells us whether the point is in front of or behind the camera.
                    const screenPos = point.position.clone();
                    screenPos.project(this.camera);

                    // [ SCREEN VISIBILITY CHECK ]
                    // If the hotspot is outside the camera view, hide it immediately and do an early exit.
                    // This prevents DOM labels from appearing when their 3D target is off-screen.
                    if (
                        // if the x or y isn't between -1 and 1, the hotspot isn't in the camera view 
                        Math.abs(screenPos.x) > 1 ||
                        Math.abs(screenPos.y) > 1 ||
                        screenPos.z > 1 // If z is greater than 1, the projected point is outside the camera's visible depth range.
                    ) {
                        point.element.classList.remove('visible');
                        continue;
                    }

                    // Reuse a pre-allocated Vector2 instead of creating a new one every frame.
                    // This avoids unnecessary garbage collection during the render loop.
                    tempScreenVector.set(screenPos.x, screenPos.y);

                    // Create a ray from the camera through the hotspot's projected screen position.
                    // This ray represents the line of sight between the camera and the hotspot.
                    raycaster.setFromCamera(tempScreenVector, this.camera);
                    const intersects = raycaster.intersectObjects(objectsArr, true)
                    // .filter(hit => !point.ignoreMeshes.some(ignoreObj => ignoreObj.getObjectById(hit.object.id)));
                    // 🚨 THE DETECTIVE LOG
                    if (intersects.length === 0) {
                        point.element.classList.add('visible');
                    } else {
                        const intersectionDistance = intersects[0].distance;
                        const pointDistance = point.position.distanceTo(this.camera.position);

                        if (intersectionDistance < pointDistance) {
                            point.element.classList.remove('visible');
                            continue;
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
                hotspotNeedUpdate = false;
            }
            this.supernova.update(elapsedTime, this.camera);

            // Update helpers in real-time if you move sliders in the GUI
            // mainLightHelper.update();
            // shadowCameraHelper.update();
            trackballControls.target.set(target.x, target.y, target.z)
            trackballControls.update()
            // Go through each points 
            stats.end();
            requestAnimationFrame(tick);
        };
        tick()



    }




}   