import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import SupernovaRemnant from "./SupernovaRemnant.js";
import Cube from "./Cube/Cube.js";
import CubeInput from "./Cube/CubeInput.js";
import TerminalCanvas from "./Terminal/TerminalCanvas.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import LoadingScreen from "./LoadingScreen.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { FXAAPass } from "three/addons/postprocessing/FXAAPass.js";
import TerminalFullscreen from "./TerminalFullscreen.js";

export default class Experience {
    loadAssets() {
        this.loadModel();
        this.loadEnvironmentMap();
    }

    setupLighting(renderer) {
        RectAreaLightUniformsLib.init();

        renderer.toneMappingExposure = 1.35;

        /**
         * STATION BASE FILL
         *
         * Provides broad visibility and prevents unlit geometry from
         * disappearing into complete darkness.
         */
        const stationBaseFillLight = new THREE.HemisphereLight(
            0xec5555,
            0x164574,
            1.61,
        );

        stationBaseFillLight.name = "StationBaseFillLight";

        /**
         * STATION MAIN LIGHT
         *
         * This used to be called novaLightMain. It now provides the
         * station's dominant cool directional illumination.
         */
        const stationMainLight = new THREE.DirectionalLight(0x8a7575, 16.15);

        stationMainLight.name = "StationMainLight";

        stationMainLight.position.set(0, 9.2, -6.7);

        stationMainLight.target.position.set(0, -3.2, -5.6);

        stationMainLight.castShadow = true;

        stationMainLight.shadow.mapSize.set(512, 512);

        stationMainLight.shadow.camera.left = -12;
        stationMainLight.shadow.camera.right = 12;
        stationMainLight.shadow.camera.top = 10;
        stationMainLight.shadow.camera.bottom = -10;
        stationMainLight.shadow.camera.near = 0.1;
        stationMainLight.shadow.camera.far = 500;

        stationMainLight.shadow.normalBias = 0.01;
        stationMainLight.shadow.bias = 0;

        stationMainLight.shadow.radius = 1;
        stationMainLight.shadow.camera.updateProjectionMatrix();

        /**
         * NOVA FLOOR SPILL
         *
         * This used to be called windowBounceLight. It now creates the
         * subtle orange illumination visible across the floor.
         */
        const novaFloorSpillLight = new THREE.RectAreaLight(
            0xff4400,
            1.6,
            7.1,
            3,
        );

        novaFloorSpillLight.name = "NovaFloorSpillLight";

        novaFloorSpillLight.position.set(0, -4.9, -19);

        const novaFloorSpillTarget = new THREE.Vector3(0, 5, 0);

        novaFloorSpillLight.lookAt(novaFloorSpillTarget);

        /**
         * TERMINAL SIDE LIGHT
         */
        const terminalSideLight = new THREE.PointLight(
            0x186a72,
            15.15,
            26.7,
            0.8,
        );

        terminalSideLight.name = "TerminalSideLight";

        terminalSideLight.decay = 1.15;

        terminalSideLight.position.set(2.9, 1.2, -3.9);

        /**
         * Add every active light and the directional-light target.
         */
        this.scene.add(
            stationBaseFillLight,
            stationMainLight,
            stationMainLight.target,
            novaFloorSpillLight,
            terminalSideLight,
        );

        /**
         * Keep references available for other systems if needed later.
         */
        this.lights = {
            stationBaseFillLight,
            stationMainLight,
            novaFloorSpillLight,
            terminalSideLight,
        };
    }
    instanceRepeatedMeshes(root, meshNames) {
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
                matches.length,
            );

            instancedMesh.name = `${meshName}_Instanced`;

            /*
             * This controls whether the bed contributes to the
             * directional light's shadow map.
             */
            instancedMesh.visible = sourceMesh.visible;
            instancedMesh.castShadow = false;
            instancedMesh.receiveShadow = sourceMesh.receiveShadow;

            const instanceMatrix = new THREE.Matrix4();

            for (let index = 0; index < matches.length; index++) {
                instanceMatrix
                    .copy(inverseRootMatrix)
                    .multiply(matches[index].matrixWorld);

                instancedMesh.setMatrixAt(index, instanceMatrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true;

            /*
             * Important after changing instance matrices.
             * These bounds must include all 14 copies.
             */
            instancedMesh.computeBoundingBox();
            instancedMesh.computeBoundingSphere();

            root.add(instancedMesh);
            this.floorMeshes.push(instancedMesh);

            for (const mesh of matches) {
                mesh.removeFromParent();
            }
        }

        root.updateMatrixWorld(true);
    }

    loadModel() {
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
            "Occluder_Wall",
        ]); // set of names for meshes that should be used as occluders for hotspots

        const shouldAddHotspotOccluder = (obj) => {
            if (hotspotOccluderNames.has(obj.name)) {
                return true;
            }

            return false;
        };

        this.monitorMeshes = [];
        this.ceilingMeshes = [];
        this.floorMeshes = [];
        this.monitorGlass;
        this.terminalPosition;

        this.objectsArr = [];

        const dracoLoader = new DRACOLoader(this.loadingManager);
        dracoLoader.setDecoderPath("/draco/"); // Set the path to the Draco decoder files
        const gltfLoader = new GLTFLoader(this.loadingManager);
        gltfLoader.setDRACOLoader(dracoLoader);

        this.objsToHide = []; // Store meshes that should be hidden when the terminal is focused on

        gltfLoader.load("/models/sceneOptimized3.glb", (gltf) => {
            gltf.scene.traverse((obj) => {
                if (!obj.isMesh) {
                    return;
                }

                if (
                    !obj.name.includes("Mesh043") &&
                    !obj.name.includes("Box00") &&
                    !obj.name.includes("Auto") &&
                    !obj.name.includes("Cube_Screen") &&
                    !obj.name.includes("Cube007") &&
                    !obj.name.includes("spaceship-window") &&
                    !obj.name.includes("Occluder") &&
                    !obj.name.includes("Mesh009_1") &&
                    !obj.material.name.includes("IsolatedGlass")
                )
                    this.objsToHide.push(obj);

                // KILL THE DOUBLE-RENDER TRANSMISSION PASS
                if (obj.material.transmission > 0) {
                    obj.material.transmission = 0;
                    obj.material.needsUpdate = true;
                }

                if (obj.name === "glass") {
                    obj.material.transparent = true;
                    obj.material.opacity = 0.08;
                    obj.material.depthWrite = false;
                    obj.material.side = THREE.DoubleSide;
                }
                if (obj.isMesh) {
                    if (shouldAddHotspotOccluder(obj)) {
                        this.objectsArr.push(obj);
                    }
                    if (
                        obj.name.includes("ceil") ||
                        obj.name.includes("Mesh018") ||
                        obj.name.includes("Mesh019") ||
                        obj.name.includes("Mesh021") ||
                        obj.name === "Mesh001_1" ||
                        obj.name === "Mesh001" ||
                        obj.name.includes("Mesh001") ||
                        obj.name.includes("Mesh045") ||
                        obj.name.includes("Mesh047")
                    ) {
                        this.ceilingMeshes.push(obj); // it will catch all the ceiling meshes and hide them when the cube is focused on, but not when the terminal is focused on
                    }
                    if (
                        obj.name === "Occluder_Floor" ||
                        obj.name === "Occluder_Ceiling" ||
                        obj.name === "Wall_mesh" ||
                        obj.name === "Wall_mesh2" ||
                        obj.name === "Occluder_Wall"
                    ) {
                        obj.material.side = THREE.DoubleSide;
                        obj.visible = false;
                    }

                    if (obj.name === "Mesh009_3") {
                        // windows
                        obj.visible = false;
                        obj.material.transparent = true;
                        obj.material.opacity = 0.08;
                        obj.material.depthWrite = false;
                        obj.material.side = THREE.DoubleSide;
                    }

                    if (obj.name.includes("Mesh0")) {
                        // floor
                        obj.receiveShadow = true;
                    }

                    if (
                        obj.name.includes("Circle") ||
                        obj.name.includes("Plane") ||
                        obj.name.includes("Machine") ||
                        obj.name.includes("Shelf") ||
                        obj.name.includes("Cube007")
                    ) {
                        obj.castShadow = true;
                    }

                    if (obj.name === "Sci-fi_Bed2") {
                        obj.receiveShadow = true;
                        obj.castShadow = true;
                    }

                    if (obj.name === "Box007") {
                        obj.castShadow = true;
                        obj.receiveShadow = true;
                    }

                    if (obj.name === "Cube_Screen_0") {
                        this.monitorMeshes.push(obj);
                        this.monitorGlass = obj;
                        this.terminalPosition = obj.position;
                        // Completely overwrite whatever material Blender sent
                        obj.material = new THREE.MeshBasicMaterial({
                            map: this.terminal.texture,
                        });

                        /**
                         * Terminal-only shader controls.
                         *
                         * These objects are shared with the compiled shader,
                         * so changing .value later immediately affects the GPU.
                         */
                        this.terminalGlitchUniforms = {
                            strength: {
                                value: 0,
                            },

                            time: {
                                value: 0,
                            },
                        };

                        obj.material.onBeforeCompile = (shader) => {
                            shader.uniforms.terminalGlitchStrength =
                                this.terminalGlitchUniforms.strength;

                            shader.uniforms.terminalGlitchTime =
                                this.terminalGlitchUniforms.time;

                            shader.fragmentShader =
                                shader.fragmentShader.replace(
                                    "#include <common>",
                                    `
            #include <common>

            uniform float terminalGlitchStrength;
            uniform float terminalGlitchTime;


            /**
             * Simple deterministic pseudo-random value.
             */
            float terminalRandom(vec2 value) {

                return fract(
                    sin(
                        dot(
                            value,
                            vec2(12.9898, 78.233)
                        )
                    ) * 43758.5453
                );
            }
            `,
                                );

                            shader.fragmentShader =
                                shader.fragmentShader.replace(
                                    "#include <map_fragment>",
                                    `
            #ifdef USE_MAP

                vec2 terminalUv = vMapUv;


                /**
                 * Divide the terminal into horizontal strips.
                 *
                 * Higher number = thinner strips.
                 */
                float band =
                    floor(terminalUv.y * 26.0);


                /**
                 * Change the random pattern several times per second,
                 * rather than every single rendered frame.
                 */
                float glitchFrame =
                    floor(terminalGlitchTime * 18.0);


                /**
                 * Random value unique to this strip and this
                 * particular glitch frame.
                 */
                float bandRandom =
                    terminalRandom(
                        vec2(
                            band,
                            glitchFrame
                        )
                    );


                /**
                 * Only some strips should move.
                 *
                 * Otherwise the whole image just becomes noisy.
                 */
                float activeBand =
                    step(
                        0.68,
                        terminalRandom(
                            vec2(
                                band + 37.0,
                                glitchFrame
                            )
                        )
                    );


                /**
                 * Convert 0 -> 1 into -1 -> 1.
                 */
                float direction =
                    (bandRandom * 2.0) - 1.0;


                /**
                 * Maximum horizontal tear.
                 */
                float xShift =
                    direction *
                    0.11 *
                    terminalGlitchStrength *
                    activeBand;


                /**
                 * Wrap instead of smearing the edge pixels.
                 */
                terminalUv.x =
                    fract(
                        terminalUv.x + xShift
                    );


                /**
 * RGB separation.
 *
 * Only glitched bands get channel separation because
 * activeBand is 0 for untouched strips.
 */
float rgbSplit =
    (
        0.004 +
        bandRandom * 0.008
    ) *
    terminalGlitchStrength *
    activeBand;


/**
 * Each color channel samples the terminal texture
 * from a slightly different horizontal position.
 */
vec2 redUv = terminalUv;
vec2 blueUv = terminalUv;

redUv.x =
    fract(
        redUv.x + rgbSplit
    );

blueUv.x =
    fract(
        blueUv.x - rgbSplit
    );


/**
 * Green stays at the normal torn position.
 * Red shifts right.
 * Blue shifts left.
 */
vec4 centerSample =
    texture2D(
        map,
        terminalUv
    );

vec4 redSample =
    texture2D(
        map,
        redUv
    );

vec4 blueSample =
    texture2D(
        map,
        blueUv
    );


vec4 sampledDiffuseColor =
    vec4(
        redSample.r,
        centerSample.g,
        blueSample.b,
        centerSample.a
    );

diffuseColor *=
    sampledDiffuseColor;

            #endif
            `,
                                );
                        };

                        obj.material.needsUpdate = true;
                    }

                    this.terminal.texture.repeat.set(1, 1); // No tiling
                    obj.material.needsUpdate = true;
                }
            });
            this.instanceRepeatedMeshes(gltf.scene, [
                "Mesh057_1",
                "Mesh057_2",
                "Mesh057_3",
                "Mesh048",
                "Mesh048_1",
            ]);
            this.initHotspots();
            this.scene.add(gltf.scene);
            this.setupSecurityCameraTracking(gltf.scene);
        });

        this.assetsLoaded = true;
    }

    loadEnvironmentMap() {
        /**
         * Environment map
         */
        this.exrLoader = new EXRLoader(); // Set the path to the EXR loader files
        this.exrLoader.load(
            "/environmentMaps/abstract-sci-fi-space_2K_2d6e1402-da4e-4b19-b175-931eceb2ceda.exr",
            (environmentMap) => {
                environmentMap.mapping = THREE.EquirectangularReflectionMapping;

                this.scene.background = environmentMap;
                this.scene.environment = environmentMap;

                /**
                 * Only changes the visible skybox.
                 */
                this.scene.backgroundIntensity = 0.7;

                /**
                 * Changes how strongly the HDR lights and reflects
                 * on physical materials.
                 */
                this.scene.environmentIntensity = 1.8;
            },
        );
    }
    constructor(canvas) {
        // Scene
        let sceneReady = false;
        this.scene = new THREE.Scene();

        this.terminalFullscreen = null;

        const preventLoadingScreenPinch = (event) => {
            const loadingScreen = document.querySelector(".loading-screen");

            if (
                loadingScreen?.contains(event.target) &&
                event.touches.length > 1
            ) {
                event.preventDefault();
            }
        };

        document.addEventListener("touchmove", preventLoadingScreenPinch, {
            passive: false,
            capture: true,
        });

        const isTouchDevice =
            navigator.maxTouchPoints > 0 ||
            window.matchMedia("(any-pointer: coarse)").matches;

        const usesMobileTerminalFullscreen = isTouchDevice;

        document.documentElement.classList.toggle(
            "touch-device",
            isTouchDevice,
        );

        /**
         * Loading screen
         *
         * LoadingScreen owns the overlay, loading manager,
         * title animation and entry transition.
         */
        this.loadingScreen = new LoadingScreen({
            scene: this.scene,

            onAnimationFinished: () => {
                this.loadAssets(renderer);
            },

            onSceneReady: () => {
                sceneReady = true;
                if (usesMobileTerminalFullscreen) {
                    this.terminalFullscreen = new TerminalFullscreen({
                        terminalCanvas: this.terminal.canvas,
                        dialogueCanvas: this.terminal.mobileCanvas,
                        onDialogueResize: (displayedWidth, displayedHeight) => {
                            this.terminal.resizeMobileCanvas(
                                displayedWidth,
                                displayedHeight,
                            );
                        },
                    });

                    this.terminal.setFullscreenController(
                        this.terminalFullscreen,
                    );
                }

                renderer.shadowMap.autoUpdate = false;
                trackballControls.enabled = true;
                controls.enabled = true;
                renderer.info.autoReset = false;
            },
        });

        /**
         * Keep a local reference so the existing loaders do not
         * need to change beyond this extraction.
         */
        this.loadingManager = this.loadingScreen.loadingManager;
        // Initialize the math library BEFORE creating the light
        RectAreaLightUniformsLib.init();
        // (Color, Intensity, Width, Height)
        // Make the width/height roughly the size of your window opening
        const windowBounceLight = new THREE.RectAreaLight(
            0xff4400,
            1.0,
            30,
            10,
        );

        // Position it exactly at the glass, facing inward
        windowBounceLight.position.set(0, 5, -18);
        windowBounceLight.lookAt(0, 5, 0);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );

        this.camera.position.set(1.5, 2.5, 10.5);
        this.camera.lookAt(0.9, 1.24, 0);
        this.scene.add(this.camera);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: window.devicePixelRatio <= 1.25,
            powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        renderer.toneMappingExposure = 1; // tone mapping intensity

        let hotspotNeedUpdate = false;

        const heightShrink = 0.75;

        const resizeExperience = () => {
            hotspotNeedUpdate = true;

            // Start with the regular layout viewport as fallback.
            let viewportWidth = window.innerWidth;
            let viewportHeight = window.innerHeight;

            // Read the CURRENT visual viewport dimensions on every resize.
            if (window.visualViewport) {
                viewportWidth = window.visualViewport.width;
                viewportHeight = window.visualViewport.height;
            }

            const viewportAspect = viewportWidth / viewportHeight;
            const isPortrait = viewportAspect < 1.0;

            const isShortLandscape = !isPortrait && viewportHeight <= 500;

            document.documentElement.classList.toggle(
                "short-landscape",
                isShortLandscape,
            );

            this.canvasWidth = viewportWidth;
            this.canvasHeight = viewportHeight;

            if (!isPortrait && !isTouchDevice) {
                this.canvasHeight *= heightShrink;
            }

            this.camera.aspect = this.canvasWidth / this.canvasHeight;
            this.camera.updateProjectionMatrix();

            renderer.setSize(this.canvasWidth, this.canvasHeight);
            effectComposer.setSize(this.canvasWidth, this.canvasHeight);

            if (this.supernova) {
                const currentRatio = renderer.getPixelRatio();

                this.supernova.uniforms.iResolution.value.set(
                    this.canvasWidth * currentRatio,
                    this.canvasHeight * currentRatio,
                );
            }

            document.documentElement.style.setProperty(
                "--viewport-width",
                `${viewportWidth}px`,
            );

            document.documentElement.style.setProperty(
                "--viewport-height",
                `${viewportHeight}px`,
            );

            this.canvasRect = renderer.domElement.getBoundingClientRect();
        };

        window.addEventListener("resize", resizeExperience);

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", resizeExperience);
        }

        // [ DOM MEASUREMENT CACHE ]
        // measure the physical footprint of the canvas
        // This is required for raycasting and UI hotspots.
        this.canvasRect = renderer.domElement.getBoundingClientRect();

        const composerRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
            type: THREE.HalfFloatType,
        });

        composerRenderTarget.samples =
            window.devicePixelRatio <= 1.25
                ? Math.min(4, renderer.capabilities.maxSamples)
                : 0;

        const effectComposer = new EffectComposer(
            renderer,
            composerRenderTarget,
        );
        effectComposer.setSize(this.canvasWidth, this.canvasHeight);
        effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        resizeExperience();
        /**
         * Post processing
         */

        const renderPass = new RenderPass(this.scene, this.camera);
        effectComposer.addPass(renderPass);

        const outputPass = new OutputPass();
        effectComposer.addPass(outputPass);

        const fxaaPass = new FXAAPass();
        fxaaPass.enabled = false;

        effectComposer.addPass(fxaaPass);

        this.terminal = new TerminalCanvas(this);
        /**
         * Lights
         */
        // ==========================================
        // DESK LIGHTS (Untouched)
        // ==========================================
        const deskLight = new THREE.PointLight(0x35d5e5, 5, 5);

        const deskLight2 = new THREE.PointLight(0x35d5e5, 5, 5);
        deskLight.decay = 2;
        deskLight2.decay = 2;
        deskLight.position.set(0, 2.5, 0); // up in the ceiling
        deskLight2.position.set(2.5, 1.2, -4.2); // near desk
        this.scene.add(deskLight, deskLight2);

        // ---------------------------------------------------------
        // COOL FLOOR DETAIL LIGHT
        // final-ish favorite version
        // ---------------------------------------------------------
        const coolFloorDetailLight = new THREE.RectAreaLight(
            0x7eb5e2,
            1.5,
            22,
            9,
        );

        coolFloorDetailLight.position.set(3.8, -9.2, -4.9);
        coolFloorDetailLight.lookAt(3.8, 0, 2.1);

        this.scene.add(coolFloorDetailLight);

        const coolFloorDetailLight2 = new THREE.RectAreaLight(
            0x7eb5e2,
            1.5,
            22,
            9,
        );

        coolFloorDetailLight2.position.set(10, -9.2, -4.9);
        coolFloorDetailLight2.lookAt(3.8, 0, 2.1);

        const coolFloorDetailLight3 = new THREE.RectAreaLight(
            0x7eb5e2,
            1.5,
            22,
            9,
        );

        coolFloorDetailLight3.position.set(-5, -9.2, -4.9);
        coolFloorDetailLight3.lookAt(3.8, 0, 2.1);

        /**
         * Bed back fill light
         *
         * RectAreaLight does not use a target object like DirectionalLight.
         * We store our own Vector3 target and call lookAt() whenever it changes.
         */

        const bedBackLight = new THREE.RectAreaLight(0x5f9fc7, 3, 4, 2.5);

        this.scene.add(coolFloorDetailLight2, coolFloorDetailLight3);
        coolFloorDetailLight.intensity = 0.9;
        coolFloorDetailLight2.intensity = 0.9;
        coolFloorDetailLight3.intensity = 0.9;
        this.scene.environmentIntensity = 0.55;

        const stationAmbientLight = new THREE.HemisphereLight(
            0x9ab3c4, // Pale blue-grey, not saturated cyan
            0x101820, // Dark blue-grey underneath
            0.65,
        );

        this.scene.add(stationAmbientLight);

        bedBackLight.name = "BedBackFillLight";

        bedBackLight.position.set(3.4, -0.6, 6.6);

        const bedBackLightTarget = new THREE.Vector3(
            1.9, // Moved your desired target coordinates here
            0.9,
            1.9,
        );

        bedBackLight.lookAt(bedBackLightTarget);
        this.scene.add(bedBackLight);
        /**
         * RECT AREA LIGHTS
         *
         * Each RectAreaLight needs a stored Vector3 target.
         */

        const windowBounceTarget = new THREE.Vector3(0, 5, 0);

        const coolFloorTarget1 = new THREE.Vector3(3.8, 0, 2.1);

        const coolFloorTarget2 = new THREE.Vector3(10, 0, 2.1);

        const coolFloorTarget3 = new THREE.Vector3(-5, 0, 2.1);

        windowBounceLight.lookAt(windowBounceTarget);
        coolFloorDetailLight.lookAt(coolFloorTarget1);
        coolFloorDetailLight2.lookAt(coolFloorTarget2);
        coolFloorDetailLight3.lookAt(coolFloorTarget3);

        /**
         * Lights must be inside the scene for their Visible toggles
         * to have any effect.
         */
        this.scene.add(
            windowBounceLight,
            coolFloorDetailLight2,
            coolFloorDetailLight3,
        );

        /**
         * Start the problematic accent lights disabled.
         */
        windowBounceLight.visible = false;
        coolFloorDetailLight.visible = false;
        coolFloorDetailLight2.visible = false;
        coolFloorDetailLight3.visible = false;

        this.cube = new Cube(this.scene);

        this.setupLighting(renderer);

        // Load the noise image
        const textureLoader = new THREE.TextureLoader();
        const noiseTexture = textureLoader.load("/textures/noise.png");

        // CRITICAL for Shadertoy noise ports: Set it to repeat infinitely
        noiseTexture.wrapS = THREE.RepeatWrapping;
        noiseTexture.wrapT = THREE.RepeatWrapping;
        noiseTexture.minFilter = THREE.LinearMipmapLinearFilter;

        // Pass the texture into the shader through the options
        this.supernova = new SupernovaRemnant(this.scene, {
            position: new THREE.Vector3(-15, 5, 50),
            scale: 8,
            visible: true,
            noiseMap: noiseTexture,
        });

        this.supernova.mesh.position.x = -15;
        this.supernova.mesh.position.y = 6;
        this.supernova.mesh.position.z = -850; // very far away in the distance, so it looks like it's outside the window, but not too far so it doesn't get clipped by the far plane
        this.supernova.mesh.scale.setScalar(175); // huge scale to make it look like it's far away in the distance
        document.addEventListener("contextmenu", (e) => e.preventDefault()); // prevent RMB click pop up

        // Controls
        const trackballControls = new TrackballControls(this.camera, canvas);
        trackballControls.noRotate = true;
        trackballControls.noZoom = false;
        trackballControls.zoomSpeed = 2;
        trackballControls.panSpeed = 0.5;
        const controls = new OrbitControls(this.camera, canvas);
        controls.enableZoom = false;
        controls.target.set(0.9, 1.24, 0); // Set the initial target to match camera.lookAt
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.minDistance = 0;
        let isTransitioning = false;

        trackballControls.enabled = true;
        controls.enabled = false;

        // Hot spot variables
        this.isFocused = false;
        const lookTarget = this.cube.cubeGroup.position.clone(); // this is the point the camera will look at when focusing on a hotspot

        // Increase the offset significantly so we don't end up inside the mesh when we lower the FOV
        const isometricDistance = 1.8;

        const cameraTarget = new THREE.Vector3(
            lookTarget.x + isometricDistance,
            lookTarget.y + isometricDistance,
            lookTarget.z + isometricDistance,
        );

        const cameraHome = this.camera.position.clone();
        const lookHome = new THREE.Vector3(0.9, 1.24, 0);

        // FOV transition values
        const homeFov = this.camera.fov;
        let targetFov = homeFov; // We will lerp toward this value

        function showItems(visibility, meshArray) {
            meshArray.forEach((ceilingMesh) => {
                ceilingMesh.visible = visibility; // toggle visibility based on the parameter
            });
        }
        /**
         * focus mode on cube
         */
        const cubeControlsHint = document.querySelector("#cube-controls-hint");

        const cubeControlsHintMobile = document.querySelector(
            "#cube-controls-hint-mobile",
        );

        const cubeFocusExitButtons = [
            document.querySelector("#cube-focus-exit-button"),

            document.querySelector("#cube-focus-exit-button-mobile"),
        ].filter(Boolean);

        const cubeScrambleButtons = [
            document.querySelector("#cube-scramble-button"),

            document.querySelector("#cube-scramble-button-mobile"),
        ].filter(Boolean);

        const terminalFocusControls = document.querySelector(
            "#terminal-focus-controls",
        );

        const terminalBackButtons = [
            document.querySelector("#terminal-fullscreen-back"),
            document.querySelector("#terminal-focus-back"),
        ].filter(Boolean);

        const terminalShaderGlitchTimeouts = [];

        /**
         * Keeps the scramble button's label, disabled state and visual
         * feedback synchronized with the cube's automatic animation.
         *
         * @param {boolean} isRunning
         * @param {boolean} isEnabled
         */
        const setCubeScrambleButtonState = (isRunning, isEnabled) => {
            for (const button of cubeScrambleButtons) {
                button.classList.toggle("is-running", isRunning);

                const label = button.querySelector(".scramble-button-label");

                if (isRunning) {
                    label.textContent = "SCRAMBLING";
                } else {
                    label.textContent = "SCRAMBLE";
                }

                button.disabled = !isEnabled;

                button.setAttribute("aria-busy", String(isRunning));
            }
        };

        const requestCubeScramble = async () => {
            if (!this.isFocused) {
                return;
            }

            if (this.currPointName !== "RubiksCube") {
                return;
            }

            if (
                this.cube.rotator.isAnimating ||
                this.cube.rotator.isLayerActive
            ) {
                return;
            }

            setCubeScrambleButtonState(true, false);

            try {
                await this.cube.scramble();
            } finally {
                const cubeFocusIsStillActive =
                    this.isFocused && this.currPointName === "RubiksCube";

                setCubeScrambleButtonState(false, cubeFocusIsStillActive);
            }
        };

        for (const button of cubeScrambleButtons) {
            button.addEventListener("click", requestCubeScramble);
        }

        /**
         * Immediately stops the terminal glitch and cancels
         * every scheduled burst that has not happened yet.
         */
        const stopTerminalShaderGlitch = () => {
            for (const timeout of terminalShaderGlitchTimeouts) {
                clearTimeout(timeout);
            }

            terminalShaderGlitchTimeouts.length = 0;

            if (!this.terminalGlitchUniforms) {
                return;
            }

            this.terminalGlitchUniforms.strength.value = 0;
        };

        /**
         * Plays a violent terminal connection sequence.
         *
         * Strong corruption at first, followed by progressively
         * smaller signal hiccups until the display stabilizes.
         */
        const playTerminalShaderGlitch = () => {
            if (!this.terminalGlitchUniforms) {
                return;
            }

            /**
             * Important if the transition somehow gets triggered
             * again before the previous sequence has finished.
             */
            stopTerminalShaderGlitch();

            const strength = this.terminalGlitchUniforms.strength;

            /**
             * Schedule one instantaneous strength change.
             */
            const setStrength = (delay, value) => {
                const timeout = setTimeout(() => {
                    strength.value = value;
                }, delay);

                terminalShaderGlitchTimeouts.push(timeout);
            };

            /**
             * First hit happens immediately.
             *
             * This is intentionally above 1.
             */
            strength.value = 1.35;

            // Initial violent connection failure
            setStrength(220, 0.75);
            setStrength(420, 1.2);
            setStrength(620, 0.3);

            // Another hard signal tear
            setStrength(740, 1.05);
            setStrength(980, 0);

            // Short secondary burst
            setStrength(1130, 0.85);
            setStrength(1340, 0.15);

            // Signal is beginning to recover
            setStrength(1480, 0.65);
            setStrength(1690, 0);

            // Final tiny hiccup
            setStrength(1870, 0.35);

            // Connection stable
            setStrength(2050, 0);
        };
        const enterFocusMode = (activePoint) => {
            showItems(false, this.objsToHide);
            showItems(false, this.floorMeshes);
            this.isFocused = true;
            isTransitioning = true;
            controls.enabled = false;
            trackballControls.enabled = false;

            // Hide ALL UI hotspots so they don't float around while we are zoomed in
            this.points.forEach((p) => {
                p.element.style.opacity = "0";
                p.element.style.pointerEvents = "none";
            });
            // --- 1. RUBIK'S CUBE LOGIC ---
            if (activePoint.name === "RubiksCube") {
                showItems(false, this.ceilingMeshes);
                showItems(false, this.monitorMeshes);
                for (let i = 0; i < this.floorMeshes.length; i++) {
                    this.floorMeshes[i].receiveShadow = false;
                }

                const cubeIsBusy =
                    this.cube.rotator.isAnimating ||
                    this.cube.rotator.isLayerActive;

                setCubeScrambleButtonState(cubeIsBusy, !cubeIsBusy);

                controls.enabled = true;
                controls.enableZoom = true;
                controls.enableRotate = false;
                controls.enablePan = false;
                if (isTouchDevice) {
                    cubeControlsHintMobile.classList.add("visible");
                } else {
                    cubeControlsHint.classList.add("visible");
                }

                lookTarget.copy(activePoint.position);

                targetFov = 15;

                const currentWindowAspect =
                    window.innerWidth / window.innerHeight;

                const BASE_ASPECT = 16 / 9;

                let scaleFactor = 0.8;

                if (currentWindowAspect < BASE_ASPECT) {
                    scaleFactor = BASE_ASPECT / currentWindowAspect;
                }

                const dynamicDistance =
                    isometricDistance * (1 + (scaleFactor - 1) * 0.2);

                /**
                 * Keep the camera horizontally and vertically aligned
                 * with the cube, and move it only along world Z.
                 *
                 * This creates a straight-on front view.
                 */
                cameraTarget.set(
                    lookTarget.x - dynamicDistance,
                    lookTarget.y + dynamicDistance,
                    lookTarget.z + dynamicDistance,
                );
            }

            // --- 2. TERMINAL LOGIC ---
            else if (activePoint.name === "Terminal") {
                this.terminalGlitchUniforms.strength.value = 1;
                showItems(false, this.ceilingMeshes);
                playTerminalShaderGlitch();

                if (!isTouchDevice) {
                    terminalFocusControls?.classList.add("visible");
                    this.terminal.syncBackButtons();
                }

                lookTarget.copy(activePoint.position.clone());

                // Aim slightly below the screen center so the keyboard/base becomes part of the shot.
                lookTarget.y -= 0.12;

                // Slightly narrower than 70 so the terminal still feels focused,
                // but not so zoomed-in that the keyboard disappears.
                targetFov = 62;

                cameraTarget.set(
                    lookTarget.x,
                    lookTarget.y + 0.22,
                    lookTarget.z + 1.55,
                );
            }
        };

        const exitFocusMode = () => {
            showItems(true, this.ceilingMeshes); // unhide ceiling
            showItems(true, this.monitorMeshes);
            showItems(true, this.floorMeshes);
            showItems(true, this.objsToHide);

            fxaaPass.enabled = false;

            cubeControlsHint.classList.remove("visible");
            cubeControlsHintMobile.classList.remove("visible");
            terminalFocusControls?.classList.remove("visible");
            setCubeScrambleButtonState(false, false);
            isTransitioning = true;

            // Bring all UI hotspots back
            this.points.forEach((p) => {
                p.element.style.opacity = "1";
                p.element.style.pointerEvents = "auto";
            });

            // Return to home values
            targetFov = homeFov;
            cameraTarget.copy(cameraHome);
            lookTarget.copy(lookHome);
        };

        const closeCubeFocus = () => {
            if (!this.isFocused || this.currPointName !== "RubiksCube") {
                return;
            }

            exitFocusMode();

            this.isFocused = false;
            this.currPointName = "";
        };

        for (const button of cubeFocusExitButtons) {
            button.addEventListener("click", closeCubeFocus);
        }

        const closeDesktopTerminalFocus = () => {
            if (
                !this.isFocused ||
                this.currPointName !== "Terminal" ||
                this.terminalFullscreen?.isOpen
            ) {
                return;
            }

            exitFocusMode();

            this.isFocused = false;
            this.currPointName = "";
        };

        document
            .querySelector("#terminal-focus-exit")
            ?.addEventListener("click", closeDesktopTerminalFocus);

        const closeTerminalFullscreen = async () => {
            if (
                !this.terminalFullscreen?.isOpen ||
                this.terminalFullscreen.isTransitioning
            ) {
                return;
            }

            await this.terminalFullscreen.close();
            this.terminal.restoreAfterMobileSignalTraceExit();

            if (this.currPointName === "Terminal") {
                exitFocusMode();

                this.isFocused = false;
                this.currPointName = "";
            }
        };

        document
            .querySelector("#terminal-fullscreen-close")
            ?.addEventListener("click", closeTerminalFullscreen);

        for (const button of terminalBackButtons) {
            button.addEventListener("click", () => {
                this.terminal.goBack();
            });
        }

        // Escape key exits
        window.addEventListener("keydown", async (input) => {
            if (input.key !== "Escape") {
                return;
            }

            if (this.terminalFullscreen?.isOpen) {
                await closeTerminalFullscreen();
                return;
            }

            if (this.isFocused) {
                exitFocusMode();
                this.isFocused = false;
                this.currPointName = "";
            }
        });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        const getActiveTerminal = () => {
            if (this.currPointName !== "Terminal") {
                return null;
            }

            if (!this.terminal) {
                return null;
            }

            return this.terminal;
        };

        /**
         * Given a pointer event, this function calculates the corresponding position on the terminal's canvas.
         * It uses raycasting to determine where the pointer intersects with the monitor glass and then maps that intersection to the terminal's canvas coordinates.
         * @param {*} event the pointer event (e.g., mouse click or touch) from which to derive the position.
         * @returns an object with x and y properties representing the position on the terminal's canvas, or null if the pointer does not intersect with the monitor glass.
         */
        const getTerminalCanvasPositionFromPointerEvent = (event) => {
            if (!this.monitorGlass) {
                return null;
            }

            if (this.terminalFullscreen?.isOpen) {
                return null;
            }

            const rect = renderer.domElement.getBoundingClientRect();

            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, this.camera);

            const hits = raycaster.intersectObject(this.monitorGlass);

            if (hits.length === 0) {
                return null;
            }

            const hit = hits[0];

            if (!hit.uv) {
                return null;
            }

            const rawU = hit.uv.x;
            const rawV = hit.uv.y;

            const canvasX = rawU * this.terminal.canvas.width; // Map the transformed U to the canvas width
            const canvasY = (1 - rawV) * this.terminal.canvas.height; // Invert Y because canvas coordinates start from the top-left

            return {
                x: canvasX,
                y: canvasY,
            };
        };

        /**
         * Handles pointer events on the monitor.
         * @param {*} event the pointer event (e.g., mouse click or touch) that occurred on the monitor.
         * @param {*} type the type of pointer event: "down", "move", or "up".
         * @returns the position on the terminal's canvas, or null if the pointer does not intersect with the monitor glass.
         */
        const handleMonitorPointerEvent = (event, type) => {
            const terminal = getActiveTerminal();

            if (!terminal) {
                return;
            }

            const canvasPosition =
                getTerminalCanvasPositionFromPointerEvent(event);

            if (!canvasPosition) {
                if (type === "up") {
                    terminal.handlePointerCancel();

                    if (
                        event.currentTarget.hasPointerCapture?.(event.pointerId)
                    ) {
                        event.currentTarget.releasePointerCapture(
                            event.pointerId,
                        );
                    }
                }

                return;
            }

            if (type === "down") {
                const handled = terminal.handlePointerDown(
                    canvasPosition.x,
                    canvasPosition.y,
                );

                if (handled) {
                    event.currentTarget.setPointerCapture(event.pointerId);
                }
            } else if (type === "move") {
                terminal.handlePointerMove(canvasPosition.x, canvasPosition.y);
            } else if (type === "up") {
                terminal.handlePointerUp(canvasPosition.x, canvasPosition.y);

                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
            }
        };

        const handlePointerDown = (event) => {
            handleMonitorPointerEvent(event, "down");
        };

        const handlePointerMove = (event) => {
            handleMonitorPointerEvent(event, "move");
        };

        const handlePointerUp = (event) => {
            handleMonitorPointerEvent(event, "up");
        };

        const handlePointerCancel = (event) => {
            const terminal = getActiveTerminal();

            if (terminal) {
                terminal.handlePointerCancel();
            }

            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
        };

        // Normal 3D monitor input
        renderer.domElement.addEventListener("pointerdown", handlePointerDown);

        renderer.domElement.addEventListener("pointermove", handlePointerMove);

        renderer.domElement.addEventListener("pointerup", handlePointerUp);

        renderer.domElement.addEventListener(
            "pointercancel",
            handlePointerCancel,
        );

        // Instantiate CubeInput
        this.CubeInput = new CubeInput(this.cube, renderer, this);

        window.addEventListener("keydown", async (event) => {
            if (event.code !== "KeyJ" || !event.shiftKey) {
                return;
            }

            const exporter = new GLTFExporter();

            /**
             * Clone the decal so exporting it doesn't change
             * the version currently positioned in the station.
             */
            const decalToExport = this.portfolioDecal.clone(true);

            /**
             * Put it at Blender's origin.
             *
             * We keep its current scale so the size you've chosen
             * in Three.js is preserved.
             */
            decalToExport.position.set(0, 0, 0);
            decalToExport.rotation.set(0, 0, 0);
            decalToExport.updateMatrixWorld(true);

            const exportScene = new THREE.Scene();
            exportScene.name = "PortfolioDecalExport";
            exportScene.add(decalToExport);

            try {
                const glb = await exporter.parseAsync(exportScene, {
                    binary: true,
                    onlyVisible: true,
                });

                const blob = new Blob([glb], {
                    type: "model/gltf-binary",
                });

                const downloadUrl = URL.createObjectURL(blob);
                const downloadLink = document.createElement("a");

                downloadLink.href = downloadUrl;
                downloadLink.download = "portfolio-wall-decal.glb";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();

                URL.revokeObjectURL(downloadUrl);
            } catch {
                // Export failures are intentionally ignored in the production UI.
            }
        });

        this.initHotspots = () => {
            const glassBox = new THREE.Box3().setFromObject(this.monitorGlass);
            const trueGlassCenter = new THREE.Vector3();
            glassBox.getCenter(trueGlassCenter);

            this.points = [
                {
                    name: "RubiksCube",
                    position: this.cube.cubeGroup.position,
                    element: document.querySelector("#hotspot-cube"),
                    ignoreMeshes: [
                        this.cube.cubeGroup,
                        this.floorMesh,
                        this.ceilingMeshes,
                    ],
                },
                {
                    name: "Terminal",
                    position: trueGlassCenter,
                    element: document.querySelector("#hotspot-terminal"),
                    ignoreMeshes: [
                        this.monitorGlass,
                        this.floorMesh,
                        this.ceilingMeshes,
                    ],
                },
            ];

            // Attach a click listener to every hotspot in the array
            this.points.forEach((point) => {
                point.element.addEventListener("click", () => {
                    if (!this.isFocused && !isTransitioning) {
                        this.currPointName = point.name;

                        // Pass the specific point we clicked into the focus function
                        enterFocusMode(point);

                        if (
                            point.name === "Terminal" &&
                            this.terminalFullscreen
                        ) {
                            this.terminalFullscreen.open();
                        }
                    }
                });
            });
        };

        // ---------------------------------------------------------
        // TICK FUNCTION & HOTSPOT TRACKING
        // ---------------------------------------------------------
        const timer = new THREE.Timer();
        // [ MEMORY PRE-ALLOCATION ]
        let canvasLocalX = 0;
        let canvasLocalY = 0;
        let targetX = 0;
        let targetY = 0;
        const tempScreenVector = new THREE.Vector2();
        this.assetsLoaded = false;

        controls.addEventListener("change", () => {
            hotspotNeedUpdate = true;
        });

        trackballControls.addEventListener("change", () => {
            hotspotNeedUpdate = true;
        });

        const tick = (timestamp) => {
            renderer.info.reset();
            controls.update(); // Keep hotspot projection synchronized with the current camera frame.
            if (!this.terminalFullscreen?.shouldPauseScene) {
                effectComposer.render();
            }

            timer.update(timestamp);
            const elapsedTime = timer.getElapsed();
            if (this.terminalGlitchUniforms) {
                this.terminalGlitchUniforms.time.value = elapsedTime;
            }
            const delta = timer.getDelta();
            this.CubeInput.update(delta);

            this.loadingScreen.update(delta);

            // ---- CAMERA LERP ----
            if (isTransitioning) {
                hotspotNeedUpdate = true;
                // 1. Lerp position and look target
                this.camera.position.lerp(cameraTarget, delta * 12);
                controls.target.lerp(lookTarget, delta * 12);

                // 2. Lerp the FOV
                this.camera.fov = THREE.MathUtils.lerp(
                    this.camera.fov,
                    targetFov,
                    delta * 12,
                );
                this.camera.updateProjectionMatrix(); // CRITICAL: Required when FOV changes

                // Check if we've arrived (close enough)
                if (this.camera.position.distanceTo(cameraTarget) < 0.01) {
                    // Bumped to 0.01 to prevent micro-stutters at the end of the lerp
                    this.camera.position.copy(cameraTarget);
                    this.camera.fov = targetFov; // Snap exactly to target just in case
                    this.camera.updateProjectionMatrix(); //
                    isTransitioning = false;

                    // Re-enable orbit controls only when returning home
                    if (!this.isFocused) {
                        controls.update();
                        trackballControls.update();
                        trackballControls.enabled = true;
                        controls.enabled = true;
                        controls.enableRotate = true;
                        controls.enablePan = true;
                    }
                }
            }
            const target = controls.target;
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
                        point.element.classList.remove("visible");
                        continue;
                    }

                    // Reuse a pre-allocated Vector2 instead of creating a new one every frame.
                    // This avoids unnecessary garbage collection during the render loop.
                    tempScreenVector.set(screenPos.x, screenPos.y);

                    // Create a ray from the camera through the hotspot's projected screen position.
                    // This ray represents the line of sight between the camera and the hotspot.
                    raycaster.setFromCamera(tempScreenVector, this.camera);
                    const intersects = raycaster.intersectObjects(
                        this.objectsArr,
                        true,
                    );
                    if (intersects.length === 0) {
                        point.element.classList.add("visible");
                    } else {
                        const intersectionDistance = intersects[0].distance;
                        const pointDistance = point.position.distanceTo(
                            this.camera.position,
                        );

                        if (intersectionDistance < pointDistance) {
                            point.element.classList.remove("visible");
                            continue;
                        } else {
                            point.element.classList.add("visible");
                        }
                    }

                    // [ REVERSE-RAYCASTING: 3D TO HTML DOM ]
                    canvasLocalX =
                        (screenPos.x * 0.5 + 0.5) * this.canvasRect.width;
                    canvasLocalY =
                        (screenPos.y * -0.5 + 0.5) * this.canvasRect.height;

                    targetX = Math.round(this.canvasRect.left + canvasLocalX);
                    targetY = Math.round(this.canvasRect.top + canvasLocalY);

                    // DYNAMIC DOM UPDATE: Applies the math to whatever HTML element this point owns
                    point.element.style.transform = `translate(${targetX}px, ${targetY}px)`;
                }
                hotspotNeedUpdate = false;
            }
            this.supernova.update(elapsedTime, this.camera);
            trackballControls.target.set(target.x, target.y, target.z);
            trackballControls.update();
            requestAnimationFrame(tick);
        };
        tick();
    }
}
