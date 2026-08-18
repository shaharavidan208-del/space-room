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
import { createPortfolioWallDecal } from './createPortfolioWallDecal.js'
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { DotScreenPass } from "three/addons/postprocessing/DotScreenPass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js'
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js'



export default class Experience {

    loadAssets() {
        this.loadModel()
        this.loadEnvironmentMap()
    }

    setupLighting(renderer) {
        RectAreaLightUniformsLib.init()

        renderer.toneMappingExposure = 1.35

        /**
         * Adds a color controller for any THREE.Color property.
         */
        const addColorController = (
            folder,
            object,
            property,
            label
        ) => {
            const colorSettings = {
                color: `#${object[property].getHexString()}`
            }

            folder
                .addColor(colorSettings, 'color')
                .name(label)
                .onChange((value) => {
                    object[property].set(value)
                })
        }

        /**
         * Adds position or target controls for a Vector3.
         */
        const addVector3Controls = (
            parentFolder,
            label,
            vector,
            onChange
        ) => {
            const folder =
                parentFolder.addFolder(label)

            folder
                .add(vector, 'x', -50, 50, 0.1)
                .name('X')
                .onChange(onChange)

            folder
                .add(vector, 'y', -50, 50, 0.1)
                .name('Y')
                .onChange(onChange)

            folder
                .add(vector, 'z', -50, 50, 0.1)
                .name('Z')
                .onChange(onChange)

            return folder
        }

        /**
         * Adds the complete GUI for a RectAreaLight.
         */
        const addRectAreaLightGUI = (
            parentFolder,
            label,
            light,
            target
        ) => {
            const folder =
                parentFolder.addFolder(label)

            const updateDirection = () => {
                light.lookAt(target)
            }

            addColorController(
                folder,
                light,
                'color',
                'Color'
            )

            folder
                .add(light, 'intensity', 0, 30, 0.05)
                .name('Intensity')

            folder
                .add(light, 'width', 0.1, 50, 0.1)
                .name('Width')

            folder
                .add(light, 'height', 0.1, 30, 0.1)
                .name('Height')

            folder
                .add(light, 'visible')
                .name('Visible')

            addVector3Controls(
                folder,
                'Position',
                light.position,
                updateDirection
            )

            addVector3Controls(
                folder,
                'Target',
                target,
                updateDirection
            )
        }

        /**
         * Adds the complete GUI for a PointLight.
         */
        const addPointLightGUI = (
            parentFolder,
            label,
            light
        ) => {
            const folder =
                parentFolder.addFolder(label)

            addColorController(
                folder,
                light,
                'color',
                'Color'
            )

            folder
                .add(light, 'intensity', 0, 30, 0.05)
                .name('Intensity')

            folder
                .add(light, 'distance', 0, 50, 0.1)
                .name('Distance')

            folder
                .add(light, 'decay', 0, 4, 0.05)
                .name('Decay')

            folder
                .add(light, 'visible')
                .name('Visible')

            addVector3Controls(
                folder,
                'Position',
                light.position,
                () => { }
            )
        }

        /**
         * STATION BASE FILL
         *
         * Provides broad visibility and prevents unlit geometry from
         * disappearing into complete darkness.
         */
        const stationBaseFillLight =
            new THREE.HemisphereLight(
                0xec5555,
                0x164574,
                1.61
            )

        stationBaseFillLight.name =
            'StationBaseFillLight'

        /**
         * STATION MAIN LIGHT
         *
         * This used to be called novaLightMain. It now provides the
         * station's dominant cool directional illumination.
         */
        const stationMainLight =
            new THREE.DirectionalLight(
                0x8a7575,
                16.15
            )

        stationMainLight.name =
            'StationMainLight'

        stationMainLight.position.set(
            0,
            9.2,
            -6.7
        )

        stationMainLight.target.position.set(
            0,
            -3.2,
            -5.6
        )

        stationMainLight.castShadow = true


        stationMainLight.shadow.mapSize.set(
            512,
            512
        )

        stationMainLight.shadow.camera.left = -12
        stationMainLight.shadow.camera.right = 12
        stationMainLight.shadow.camera.top = 10
        stationMainLight.shadow.camera.bottom = -10
        stationMainLight.shadow.camera.near = 0.1
        stationMainLight.shadow.camera.far = 500

        stationMainLight.shadow.normalBias = 0.01
        stationMainLight.shadow.bias = 0

        stationMainLight.shadow.radius = 1

        stationMainLight.shadow.camera
            .updateProjectionMatrix()

        /**
         * NOVA FLOOR SPILL
         *
         * This used to be called windowBounceLight. It now creates the
         * subtle orange illumination visible across the floor.
         */
        const novaFloorSpillLight =
            new THREE.RectAreaLight(
                0xff4400,
                1.6,
                7.1,
                3
            )

        novaFloorSpillLight.name =
            'NovaFloorSpillLight'

        novaFloorSpillLight.position.set(
            0,
            -4.9,
            -19
        )

        const novaFloorSpillTarget =
            new THREE.Vector3(
                0,
                5,
                0
            )

        novaFloorSpillLight.lookAt(
            novaFloorSpillTarget
        )


        /**
         * TERMINAL SIDE LIGHT
         */
        const terminalSideLight =
            new THREE.PointLight(
                0x186a72,
                15.15,
                26.7,
                0.8
            )

        terminalSideLight.name =
            'TerminalSideLight'

        terminalSideLight.decay = 1.15

        terminalSideLight.position.set(
            2.9,
            1.2,
            -3.9
        )

        /**
         * Add every active light and the directional-light target.
         */
        this.scene.add(
            stationBaseFillLight,
            stationMainLight,
            stationMainLight.target,
            novaFloorSpillLight,
            terminalSideLight
        )

        /**
         * Keep references available for other systems if needed later.
         */
        this.lights = {
            stationBaseFillLight,
            stationMainLight,
            novaFloorSpillLight,
            terminalSideLight
        }

        /**
         * LIGHTING GUI
         */
        const lightingFolder =
            this.gu.addFolder('Lighting')

        /**
         * Scene and HDR controls.
         */
        const sceneFolder =
            lightingFolder.addFolder('Scene / HDR')

        sceneFolder
            .add(
                this.scene,
                'backgroundIntensity',
                0,
                20,
                0.05
            )
            .name('Background Intensity')
            .listen()

        sceneFolder
            .add(
                this.scene,
                'environmentIntensity',
                0,
                3,
                0.01
            )
            .name('Environment Intensity')
            .listen()

        sceneFolder
            .add(
                this.scene,
                'backgroundBlurriness',
                0,
                1,
                0.01
            )
            .name('Background Blur')
            .listen()

        sceneFolder
            .add(
                renderer,
                'toneMappingExposure',
                0.1,
                3,
                0.01
            )
            .name('Exposure')
            .listen()

        /**
         * Station base-fill controls.
         */
        const baseFillFolder =
            lightingFolder.addFolder(
                'Station Base Fill'
            )

        addColorController(
            baseFillFolder,
            stationBaseFillLight,
            'color',
            'Sky Color'
        )

        addColorController(
            baseFillFolder,
            stationBaseFillLight,
            'groundColor',
            'Ground Color'
        )

        baseFillFolder
            .add(
                stationBaseFillLight,
                'intensity',
                0,
                5,
                0.01
            )
            .name('Intensity')

        baseFillFolder
            .add(
                stationBaseFillLight,
                'visible'
            )
            .name('Visible')

        /**
         * Station directional-light controls.
         */
        const stationMainFolder =
            lightingFolder.addFolder(
                'Station Main Light'
            )

        addColorController(
            stationMainFolder,
            stationMainLight,
            'color',
            'Color'
        )

        stationMainFolder
            .add(
                stationMainLight,
                'intensity',
                0,
                30,
                0.05
            )
            .name('Intensity')

        stationMainFolder
            .add(
                stationMainLight,
                'visible'
            )
            .name('Visible')

        stationMainFolder
            .add(
                stationMainLight,
                'castShadow'
            )
            .name('Cast Shadow')

        addVector3Controls(
            stationMainFolder,
            'Position',
            stationMainLight.position,
            () => { }
        )

        addVector3Controls(
            stationMainFolder,
            'Target',
            stationMainLight.target.position,
            () => { }
        )

        /**
         * Shadow controls.
         */
        const shadowFolder =
            stationMainFolder.addFolder('Shadow')

        const updateShadowCamera = () => {
            stationMainLight.shadow.camera
                .updateProjectionMatrix()
        }

        shadowFolder
            .add(
                stationMainLight.shadow,
                'normalBias',
                -0.2,
                0.2,
                0.001
            )
            .name('Normal Bias')

        shadowFolder
            .add(
                stationMainLight.shadow,
                'bias',
                -0.01,
                0.01,
                0.0001
            )
            .name('Bias')

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'near',
                0.1,
                20,
                0.1
            )
            .name('Near')
            .onChange(updateShadowCamera)

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'far',
                10,
                1000,
                1
            )
            .name('Far')
            .onChange(updateShadowCamera)

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'left',
                -50,
                0,
                0.1
            )
            .name('Left')
            .onChange(updateShadowCamera)

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'right',
                0,
                50,
                0.1
            )
            .name('Right')
            .onChange(updateShadowCamera)

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'top',
                0,
                50,
                0.1
            )
            .name('Top')
            .onChange(updateShadowCamera)

        shadowFolder
            .add(
                stationMainLight.shadow.camera,
                'bottom',
                -50,
                0,
                0.1
            )
            .name('Bottom')
            .onChange(updateShadowCamera)

        /**
         * Local area-light controls.
         */
        const areaLightsFolder =
            lightingFolder.addFolder(
                'Local Area Lights'
            )

        addRectAreaLightGUI(
            areaLightsFolder,
            'Nova Floor Spill',
            novaFloorSpillLight,
            novaFloorSpillTarget
        )


        /**
         * Terminal-light controls.
         */
        const terminalLightsFolder =
            lightingFolder.addFolder(
                'Terminal Lights'
            )


        addPointLightGUI(
            terminalLightsFolder,
            'Terminal Side Light',
            terminalSideLight
        )

        lightingFolder.open()
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
            "Occluder_Wall"

        ]); // set of names for meshes that should be used as occluders for hotspots


        const shouldAddHotspotOccluder = (obj) => {
            if (hotspotOccluderNames.has(obj.name)) {
                return true;
            }

            return false;
        };

        this.monitorMeshes = []
        this.ceilingMeshes = [];
        this.glbDebugMeshes = [];

        let walls;
        this.monitorGlass;
        let monitorFrame;
        this.terminalPosition;

        this.objectsArr = []


        const dracoLoader = new DRACOLoader(this.loadingManager)
        dracoLoader.setDecoderPath('/draco/') // Set the path to the Draco decoder files
        this.loader = new HDRLoader(this.loadingManager)
        const gltfLoader = new GLTFLoader(this.loadingManager)
        gltfLoader.setDRACOLoader(dracoLoader)

        this.objsToHide = [] // Store meshes that should be hidden when the terminal is focused on

        gltfLoader.load('/models/Untitled21.glb', (gltf) => {
            gltf.scene.traverse((obj) => {
                if (!obj.isMesh) {
                    return;
                }

                if (!obj.name.includes("Mesh043") && !obj.name.includes("Box00") && !obj.name.includes("Auto") && !obj.name.includes("Cube_Screen") && !obj.name.includes("Cube007") && !obj.name.includes("spaceship-window-side001") && !obj.name.includes("Occluder"))
                    this.objsToHide.push(obj)


                this.glbDebugMeshes.push(obj);


                // KILL THE DOUBLE-RENDER TRANSMISSION PASS 
                if (obj.material && obj.material.transmission > 0) {
                    console.log("Transmission obj: ")
                    // Force transmission to 0 to cancel the background render pass
                    obj.material.transmission = 0;
                    // Ensure it falls back to standard, cheap transparency
                    obj.material.transparent = true;
                    obj.material.needsUpdate = true;
                }
                if (obj.isMesh) {


                    if (shouldAddHotspotOccluder(obj)) {
                        this.objectsArr.push(obj);
                    }
                    if (obj.name.includes("ceil") || obj.name.includes("Mesh018") || obj.name.includes("Mesh019") || obj.name.includes("Mesh021") || obj.name === "Mesh001_1" || obj.name === "Mesh001" || obj.name.includes("Mesh001") || obj.name.includes("Mesh045") || obj.name.includes("Mesh047")) {
                        this.ceilingMeshes.push(obj); // it will catch all the ceiling meshes and hide them when the cube is focused on, but not when the terminal is focused on
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


                    if (obj.name.includes("Circle") || obj.name.includes("Plane") || obj.name.includes("Machine") || obj.name.includes("Shelf") || obj.name.includes("Cube007")) {
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
                        this.monitorMeshes.push(obj)
                        this.monitorGlass = obj
                        this.terminalPosition = obj.position
                        // Completely overwrite whatever material Blender sent
                        obj.material = new THREE.MeshBasicMaterial({
                            map: this.terminal.texture,
                        })

                        /**
                         * Terminal-only shader controls.
                         *
                         * These objects are shared with the compiled shader,
                         * so changing .value later immediately affects the GPU.
                         */
                        this.terminalGlitchUniforms = {
                            strength: {
                                value: 0
                            },

                            time: {
                                value: 0
                            }
                        }

                        obj.material.onBeforeCompile = (shader) => {

                            shader.uniforms.terminalGlitchStrength =
                                this.terminalGlitchUniforms.strength

                            shader.uniforms.terminalGlitchTime =
                                this.terminalGlitchUniforms.time


                            shader.fragmentShader =
                                shader.fragmentShader.replace(
                                    '#include <common>',
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
            `
                                )


                            shader.fragmentShader =
                                shader.fragmentShader.replace(
                                    '#include <map_fragment>',
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
            `
                                )
                        }

                        obj.material.needsUpdate = true
                    }

                    this.terminal.texture.repeat.set(1, 1); // No tiling
                    obj.material.needsUpdate = true;


                }

            })
            this.instanceRepeatedMeshes(gltf.scene, [
                'Mesh057_1',
                'Mesh057_2',
                'Mesh057_3',
                'Mesh048',
                'Mesh048_1'
            ]);
            this.initHotspots();
            this.scene.add(gltf.scene)
        })

    }

    loadEnvironmentMap() {
        /**
       * Environment map
       */
        this.exrLoader = new EXRLoader() // Set the path to the EXR loader files
        const environmentMap = this.exrLoader.load(
            '/environmentMaps/abstract-sci-fi-space_2K_2d6e1402-da4e-4b19-b175-931eceb2ceda.exr',
            (environmentMap) => {
                environmentMap.mapping =
                    THREE.EquirectangularReflectionMapping

                this.scene.background = environmentMap
                this.scene.environment = environmentMap

                /**
                 * Only changes the visible skybox.
                 */
                this.scene.backgroundIntensity = 0.7

                /**
                 * Changes how strongly the HDR lights and reflects
                 * on physical materials.
                 */
                this.scene.environmentIntensity = 1.8



            }
        )
    }
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

                onAnimationFinished: () => {
                    this.loadAssets()
                },

                onSceneReady: () => {
                    sceneReady = true
                    playTerminalGlitch()
                }
            })

        /**
         * Keep a local reference so the existing loaders do not
         * need to change beyond this extraction.
         */
        this.loadingManager =
            this.loadingScreen.loadingManager
        // Initialize the math library BEFORE creating the light
        RectAreaLightUniformsLib.init();
        // (Color, Intensity, Width, Height) 
        // Make the width/height roughly the size of your window opening
        const windowBounceLight = new THREE.RectAreaLight(0xff4400, 1.0, 30, 10);

        // Position it exactly at the glass, facing inward
        windowBounceLight.position.set(0, 5, -18);
        windowBounceLight.lookAt(0, 5, 0);


        // Camera
        this.camera = new THREE.PerspectiveCamera(70,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );


        this.camera.position.set(1.5, 2.5, 10.5);
        this.camera.lookAt(0.9, 1.24, 0)
        this.scene.add(this.camera);


        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: window.devicePixelRatio <= 1,
            powerPreference: 'high-performance'
        });
        console.log(renderer.antialias)
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        console.log("Pixel Ratio: ", window.devicePixelRatio)

        renderer.toneMapping =
            THREE.ACESFilmicToneMapping

        renderer.toneMappingExposure = 1 // tone mapping intensity

        let hotspotNeedUpdate = false

        // ---------------------------------------------------------
        // VIEWPORT & ASPECT RATIO MANAGER
        // ---------------------------------------------------------
        // We lock the baseline to 21:9 (Ultra-wide cinematic). 
        // This physically shrinks the canvas on standard 16:9 or 16:10 monitors, 
        // acting as a massive fill-rate optimization by saving the GPU from 
        // rendering the empty space at the top and bottom of the screen.
        const TARGET_ASPECT = 22 / 9;

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

            let DYNAMIC_TARGET_ASPECT = TARGET_ASPECT; // start by assuming we want the cinematic 22/9 crop (Default state). 
            let fullWidth = 1920                              // 100% black bars - 1920x1080 - 22/9
            // if the resolution is 1920x1080, DYNAMIC_TARGET_ASPECT stays 22/9
            DYNAMIC_TARGET_ASPECT *= window.innerWidth * 1/fullWidth  
            console.log("Dynmaic target aspect: ", DYNAMIC_TARGET_ASPECT)  // otherwise, multiply it by the percentage of the width from 1920
            if (isPortrait || windowAspect >= DYNAMIC_TARGET_ASPECT) {
                // Mobile: Abandon the crop and use the phone's native aspect ratio to fill the screen
                DYNAMIC_TARGET_ASPECT = windowAspect; // the aspect ratio just becomes the phone's native 

            }

            // create two mutable variables and initially set them to fill 100% of the screen
            this.canvasWidth = window.innerWidth;
            this.canvasHeight = window.innerHeight;
            console.log(window.innerWidth)
            // [ CANVAS BOUNDARY MATH ]
            // Calculate exact pixel dimensions to maintain the DYNAMIC_TARGET_ASPECT.
            if (windowAspect < DYNAMIC_TARGET_ASPECT) {
                // if the window is narrower than target (e.g., standard 16:9 monitor).
                // Keep max width, shrink height. Flexbox will auto-center it, creating Top/Bottom black bars.
                this.canvasHeight = window.innerWidth / DYNAMIC_TARGET_ASPECT;
                console.log(this.canvasHeight)
            }

            // 1. Lock the Three.js Camera frustum to the new mathematical ratio
            this.camera.aspect = DYNAMIC_TARGET_ASPECT; // Update the camera to render at the new aspect ratio to match the canvas
            this.camera.updateProjectionMatrix(); // compile the new aspect ratio into the core webGL math so the GPU can use it
            // after any modification to a camera propety we need to update projection matrix
            // since three.js doesn't need to update things  like FOV/AR each frame we need to update it manually

            // 2. Physically resize the WebGL Canvas element in the DOM
            renderer.setSize(this.canvasWidth, this.canvasHeight);
            effectComposer.setSize(this.canvasWidth, this.canvasHeight)
            // 3. Sync the Heavy Shader (Supernova)
            // The shader requires the exact pixel count to calculate uv coordinates correctly.
            // We multiply by devicePixelRatio to ensure it stays sharp on high-density displays (like retina/phones).
            if (this.supernova) {
                const currentRatio = renderer.getPixelRatio();
                this.supernova.uniforms.iResolution.value.set(
                    this.canvasWidth * currentRatio,
                    this.canvasHeight * currentRatio
                );
            }

            // [ DOM MEASUREMENT CACHE ]
            // measure the physical footprint of the canvas
            // This is required for raycasting and UI hotspots. 
            this.canvasRect = renderer.domElement.getBoundingClientRect();
        });
        const effectComposer = new EffectComposer(renderer)
        console.log(this.canvasHeight, this.canvasWidth)
        effectComposer.setSize(this.canvasWidth, this.canvasHeight)
        effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        window.dispatchEvent(new Event('resize'));
        /**
 * Post processing
 */

        const renderPass = new RenderPass(this.scene, this.camera)
        effectComposer.addPass(renderPass)

        const glitchPass = new GlitchPass()
        effectComposer.addPass(glitchPass)
        glitchPass.enabled = false


        const outputPass = new OutputPass()
        effectComposer.addPass(outputPass)


        const terminalGlitchTimeouts = []

        const playTerminalGlitch = () => {

            for (const timeout of terminalGlitchTimeouts) {
                clearTimeout(timeout)
            }

            terminalGlitchTimeouts.length = 0

            const glitch = (delay, duration, wild = false) => {

                terminalGlitchTimeouts.push(
                    setTimeout(() => {
                        glitchPass.goWild = wild
                        glitchPass.enabled = true
                    }, delay)
                )

                terminalGlitchTimeouts.push(
                    setTimeout(() => {
                        glitchPass.enabled = false
                        glitchPass.goWild = false
                    }, delay + duration)
                )
            }

            // Violent connection snap
            glitch(0, 160, true)

            // Follow-up interference
            glitch(260, 180, false)

            // Final stronger hiccup before stabilizing
            glitch(520, 220, true)
        }

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


        this.scene.add(deskLight, deskLight2)

        // ---------------------------------------------------------
        // COOL FLOOR DETAIL LIGHT
        // final-ish favorite version
        // ---------------------------------------------------------
        const coolFloorDetailLight = new THREE.RectAreaLight(0x7eb5e2, 1.5, 22, 9);

        coolFloorDetailLight.position.set(3.8, -9.2, -4.9);
        coolFloorDetailLight.lookAt(3.8, 0, 2.1);

        this.scene.add(coolFloorDetailLight);

        const coolFloorDetailLight2 = new THREE.RectAreaLight(0x7eb5e2, 1.5, 22, 9);

        coolFloorDetailLight2.position.set(10, -9.2, -4.9);
        coolFloorDetailLight2.lookAt(3.8, 0, 2.1);


        const coolFloorDetailLight3 = new THREE.RectAreaLight(0x7eb5e2, 1.5, 22, 9);

        coolFloorDetailLight3.position.set(-5, -9.2, -4.9);
        coolFloorDetailLight3.lookAt(3.8, 0, 2.1);



        /**
         * Bed back fill light
         *
         * RectAreaLight does not use a target object like DirectionalLight.
         * We store our own Vector3 target and call lookAt() whenever it changes.
         */

        const bedBackLight = new THREE.RectAreaLight(
            0x5f9fc7,
            3,
            4,
            2.5
        )

        this.scene.add(
            coolFloorDetailLight2,
            coolFloorDetailLight3
        )
        coolFloorDetailLight.intensity = 0.9
        coolFloorDetailLight2.intensity = 0.9
        coolFloorDetailLight3.intensity = 0.9
        this.scene.environmentIntensity = 0.55

        const stationAmbientLight = new THREE.HemisphereLight(
            0x9ab3c4, // Pale blue-grey, not saturated cyan
            0x101820, // Dark blue-grey underneath
            0.65
        )

        this.scene.add(stationAmbientLight)

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
        this.gu.hide()
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

        /**
* LIGHTING DEBUG GUI
*/

        const lightingFolder =
            this.gu.addFolder('Lighting')

        /**
         * Adds a color controller for any THREE.Color property.
         */
        const addColorController = (
            folder,
            object,
            property,
            label
        ) => {
            const colorParams = {
                color: `#${object[property].getHexString()}`
            }

            folder
                .addColor(colorParams, 'color')
                .name(label)
                .onChange((value) => {
                    object[property].set(value)
                })
        }

        /**
         * Adds XYZ position controls.
         */
        const addPositionControls = (
            folder,
            position,
            onChange
        ) => {
            folder
                .add(position, 'x', -30, 30, 0.1)
                .name('X')
                .onChange(onChange)

            folder
                .add(position, 'y', -20, 20, 0.1)
                .name('Y')
                .onChange(onChange)

            folder
                .add(position, 'z', -30, 30, 0.1)
                .name('Z')
                .onChange(onChange)
        }

        /**
         * Adds controls for a RectAreaLight.
         */
        const addRectAreaLightGUI = (
            parentFolder,
            label,
            light,
            target
        ) => {
            const folder =
                parentFolder.addFolder(label)

            addColorController(
                folder,
                light,
                'color',
                'Color'
            )

            folder
                .add(light, 'intensity', 0, 20, 0.05)
                .name('Intensity')

            folder
                .add(light, 'width', 0.1, 40, 0.1)
                .name('Width')

            folder
                .add(light, 'height', 0.1, 20, 0.1)
                .name('Height')

            folder
                .add(light, 'visible')
                .name('Visible')

            const updateDirection = () => {
                light.lookAt(target)
            }

            const positionFolder =
                folder.addFolder('Position')

            addPositionControls(
                positionFolder,
                light.position,
                updateDirection
            )

            const targetFolder =
                folder.addFolder('Target')

            addPositionControls(
                targetFolder,
                target,
                updateDirection
            )
        }

        /**
         * SCENE / HDR
         */

        const sceneFolder =
            lightingFolder.addFolder('Scene / HDR')

        sceneFolder
            .add(
                this.scene,
                'backgroundIntensity',
                0,
                15,
                0.05
            )
            .name('Background Intensity')
            .listen()

        sceneFolder
            .add(
                this.scene,
                'environmentIntensity',
                0,
                3,
                0.01
            )
            .name('Environment Intensity')
            .listen()

        sceneFolder
            .add(
                this.scene,
                'backgroundBlurriness',
                0,
                1,
                0.01
            )
            .name('Background Blur')

        sceneFolder
            .add(
                renderer,
                'toneMappingExposure',
                0.1,
                3,
                0.01
            )
            .name('Exposure')

        /**
         * NEUTRAL STATION FILL
         */

        const ambientFolder =
            lightingFolder.addFolder('Station Fill')

        addColorController(
            ambientFolder,
            stationAmbientLight,
            'color',
            'Sky Color'
        )

        addColorController(
            ambientFolder,
            stationAmbientLight,
            'groundColor',
            'Ground Color'
        )

        ambientFolder
            .add(
                stationAmbientLight,
                'intensity',
                0,
                3,
                0.01
            )
            .name('Intensity')

        ambientFolder
            .add(stationAmbientLight, 'visible')
            .name('Visible')

        /**
         * MAIN NOVA LIGHT
         */



        /**
         * RECT AREA LIGHTS
         *
         * Each RectAreaLight needs a stored Vector3 target.
         */

        const windowBounceTarget =
            new THREE.Vector3(0, 5, 0)

        const floorBounceTarget =
            new THREE.Vector3(11.7, 0, 0)

        const coolFloorTarget1 =
            new THREE.Vector3(3.8, 0, 2.1)

        const coolFloorTarget2 =
            new THREE.Vector3(10, 0, 2.1)

        const coolFloorTarget3 =
            new THREE.Vector3(-5, 0, 2.1)

        windowBounceLight.lookAt(windowBounceTarget)
        floorBounceLight.lookAt(floorBounceTarget)

        coolFloorDetailLight.lookAt(coolFloorTarget1)
        coolFloorDetailLight2.lookAt(coolFloorTarget2)
        coolFloorDetailLight3.lookAt(coolFloorTarget3)


        /**
         * Lights must be inside the scene for their Visible toggles
         * to have any effect.
         */
        this.scene.add(
            windowBounceLight,
            coolFloorDetailLight2,
            coolFloorDetailLight3
        )

        /**
         * Start the problematic accent lights disabled.
         */
        windowBounceLight.visible = false
        coolFloorDetailLight.visible = false
        coolFloorDetailLight2.visible = false
        coolFloorDetailLight3.visible = false



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

        this.setupLighting(renderer)

        // FPS counter 
        const stats = new Stats();
        document.body.appendChild(stats.dom);




        const debugParams = {
            lookX: 1,
            lookY: 1.24, // Start slightly above the floor
            lookZ: 0
        };





        const mainLightFolder = this.gu.addFolder('Main Light');







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





        document.addEventListener('contextmenu', (e) => e.preventDefault()) // prevent RMB click pop up






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
            lookTarget.x + isometricDistance,
            lookTarget.y + isometricDistance,
            lookTarget.z + isometricDistance
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
        /**
         * focus mode on cube
         */
        const cubeControlsHint = document.querySelector('#cube-controls-hint'); // UI for the cube controls 
        const cubeHotspot = document.querySelector("#hotspot-cube")
        const terminalShaderGlitchTimeouts = []


        /**
         * Immediately stops the terminal glitch and cancels
         * every scheduled burst that has not happened yet.
         */
        const stopTerminalShaderGlitch = () => {

            for (const timeout of terminalShaderGlitchTimeouts) {
                clearTimeout(timeout)
            }

            terminalShaderGlitchTimeouts.length = 0

            if (!this.terminalGlitchUniforms) {
                return
            }

            this.terminalGlitchUniforms.strength.value = 0
        }


        /**
         * Plays a violent terminal connection sequence.
         *
         * Strong corruption at first, followed by progressively
         * smaller signal hiccups until the display stabilizes.
         */
        const playTerminalShaderGlitch = () => {

            if (!this.terminalGlitchUniforms) {
                return
            }

            /**
             * Important if the transition somehow gets triggered
             * again before the previous sequence has finished.
             */
            stopTerminalShaderGlitch()

            const strength =
                this.terminalGlitchUniforms.strength


            /**
             * Schedule one instantaneous strength change.
             */
            const setStrength = (delay, value) => {

                const timeout = setTimeout(() => {
                    strength.value = value
                }, delay)

                terminalShaderGlitchTimeouts.push(timeout)
            }


            /**
             * First hit happens immediately.
             *
             * This is intentionally above 1.
             */
            strength.value = 1.35


            // Initial violent connection failure
            setStrength(220, 0.75)
            setStrength(420, 1.2)
            setStrength(620, 0.3)

            // Another hard signal tear
            setStrength(740, 1.05)
            setStrength(980, 0)

            // Short secondary burst
            setStrength(1130, 0.85)
            setStrength(1340, 0.15)

            // Signal is beginning to recover
            setStrength(1480, 0.65)
            setStrength(1690, 0)

            // Final tiny hiccup
            setStrength(1870, 0.35)

            // Connection stable
            setStrength(2050, 0)
        }
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
                showItems(false, this.ceilingMeshes)
                showItems(false, this.monitorMeshes)

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
                    isometricDistance *
                    (1 + ((scaleFactor - 1) * 0.2))

                /**
                 * Keep the camera horizontally and vertically aligned
                 * with the cube, and move it only along world Z.
                 *
                 * This creates a straight-on front view.
                 */
                cameraTarget.set(
                    lookTarget.x + dynamicDistance,
                    lookTarget.y + dynamicDistance,
                    lookTarget.z + dynamicDistance
                )
            }

            // --- 2. TERMINAL LOGIC ---
            else if (activePoint.name === 'Terminal') {
                this.terminalGlitchUniforms.strength.value = 1
                showItems(false, this.objsToHide)
                showItems(false, this.ceilingMeshes)
                playTerminalShaderGlitch()
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
            showItems(true, this.ceilingMeshes) // unhide ceiling
            showItems(true, this.monitorMeshes)
            showItems(true, this.objsToHide)
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

            const hits = raycaster.intersectObjects(this.glbDebugMeshes, true);

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
        }
        /**
         * Given a pointer event, this function calculates the corresponding position on the terminal's canvas.
         * It uses raycasting to determine where the pointer intersects with the monitor glass and then maps that intersection to the terminal's canvas coordinates. 
         * @param {*} event the pointer event (e.g., mouse click or touch) from which to derive the position.
         * @returns an object with x and y properties representing the position on the terminal's canvas, or null if the pointer does not intersect with the monitor glass.
         */
        const getTerminalCanvasPositionFromPointerEvent = (event) => {
            if (!this.monitorGlass) {
                return null
            }

            const rect = renderer.domElement.getBoundingClientRect()

            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(pointer, this.camera)

            const hits = raycaster.intersectObject(this.monitorGlass)

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




        window.addEventListener('keydown', async (event) => {
            if (event.code !== 'KeyJ' || !event.shiftKey) {
                return
            }

            const exporter = new GLTFExporter()

            /**
             * Clone the decal so exporting it doesn't change
             * the version currently positioned in the station.
             */
            const decalToExport =
                this.portfolioDecal.clone(true)

            /**
             * Put it at Blender's origin.
             *
             * We keep its current scale so the size you've chosen
             * in Three.js is preserved.
             */
            decalToExport.position.set(0, 0, 0)
            decalToExport.rotation.set(0, 0, 0)

            decalToExport.updateMatrixWorld(true)

            const exportScene = new THREE.Scene()

            exportScene.name = 'PortfolioDecalExport'
            exportScene.add(decalToExport)

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
                    'portfolio-wall-decal.glb'

                document.body.appendChild(
                    downloadLink
                )

                downloadLink.click()
                downloadLink.remove()

                URL.revokeObjectURL(downloadUrl)

                console.log(
                    'Portfolio decal exported successfully.'
                )
            }
            catch (error) {
                console.error(
                    'Failed to export portfolio decal:',
                    error
                )
            }
        })



        this.initHotspots = () => {
            const glassBox = new THREE.Box3().setFromObject(this.monitorGlass);
            const trueGlassCenter = new THREE.Vector3();
            glassBox.getCenter(trueGlassCenter);

            this.points = [
                {
                    name: 'RubiksCube',
                    position: this.cube.cubeGroup.position,
                    element: document.querySelector('#hotspot-cube'),
                    ignoreMeshes: [this.cube.cubeGroup, this.floorMesh, this.ceilingMeshes]
                },
                {
                    name: 'Terminal',
                    position: trueGlassCenter,
                    element: document.querySelector('#hotspot-terminal'),
                    ignoreMeshes: [this.monitorGlass, this.floorMesh, this.ceilingMeshes]
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
        this.assetsLoaded = false

        controls.addEventListener('change', () => {
            hotspotNeedUpdate = true;
        });

        trackballControls.addEventListener('change', () => {
            hotspotNeedUpdate = true
        });

        const tick = (timestamp) => {
            controls.update(); // Moved update controls and renderer update to the top so the hotspot gets synced with them at the current frame
            effectComposer.render()

            timer.update(timestamp)
            const elapsedTime = timer.getElapsed();
            if (this.terminalGlitchUniforms) {

                this.terminalGlitchUniforms.time.value =
                    elapsedTime
            }
            const delta = timer.getDelta()
            this.CubeInput.update(delta)

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
                    const intersects = raycaster.intersectObjects(this.objectsArr, true)
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
