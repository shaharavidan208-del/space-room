import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import SupernovaRemnant from './SupernovaRemnant.js'
import Particles from './Particles.js'
import GUI from 'lil-gui';
import Cube from './Cube/Cube.js'
import CubeInput from './Cube/CubeInput.js'
import gsap from 'gsap'


export default class Experience {
    constructor(canvas) {
        // Scene
        let sceneReady = false
        const scene = new THREE.Scene()
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
        scene.add(overlay)
        const gu = new GUI()


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

        this.cube = new Cube(scene)
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
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
        directionalLight.castShadow = true

        directionalLight.shadow.camera.far = 10
        directionalLight.shadow.camera.left = - 6
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        const _directionalLight = new THREE.DirectionalLight(directionalLight)
        directionalLight.position.x = 3
        _directionalLight.position.x = -3
        scene.add(directionalLight, _directionalLight)

        this.supernova = new SupernovaRemnant(scene, {
            position: new THREE.Vector3(-15, 5, 50),  // far away from room
            scale: 8,
            visible: true
        })

        /**
         * Shader
         */
        this.supernova.mesh.position.x = -15
        this.supernova.mesh.position.y = 5
        this.supernova.mesh.position.z = -850
        this.supernova.mesh.scale.setScalar(200)
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
        const environmentMap = loader.load('/environmentMaps/volcanic_planet._4k.hdr', (texture) => {
            environmentMap.mapping = THREE.EquirectangularReflectionMapping

            scene.background = environmentMap
        })


        // Camera
        this.camera = new THREE.PerspectiveCamera(65,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );
        this.camera.position.set(0, 7, 14.5);
        this.camera.lookAt(0, 5, 6)
        scene.add(this.camera);

        const cam = gu.addFolder('Camera')
        // (min, max, increments), change supernova position 
        cam.add(this.camera.position, 'x', -25, 25, 0.5).name('Position X')
        cam.add(this.camera.position, 'y', -25, 25, 0.5).name('Position Y')
        cam.add(this.camera.position, 'z', -25, 25, 0.5).name('Position Z')


        // Controls
        const controls = new OrbitControls(this.camera, canvas);
        controls.target.set(0, 5, 6); // Set the initial target to match camera.lookAt

        controls.enableDamping = true;
        controls.enablePan = false;
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE  // ← RMB now orbits instead of panning
        };


        // Hot spot variables
        this.isFocused = false;
        const cameraTarget = new THREE.Vector3(); // where the camera moves toward (either cube or home position)
        const lookTarget = new THREE.Vector3();   // what camera is looking toward
        let isTransitioning = false; // 

        // Store the "home" position so you can return to it
        const cameraHome = new THREE.Vector3(0, 7, 14.5); // existing camera.position values
        const lookHome = new THREE.Vector3(0, 5, 6); // your existing camera.lookAt values
        // this.cube.rotator.rotateLayer('x', 1, 1)
        // this.cube.rotator.rotateLayer('y', 0, -1)
        // this.cube.rotator.rotateLayer('z', -1, 1)
        // this.cube.rotator.rotateLayer('x', -1, 1)
        // this.cube.rotator.rotateLayer('y', 1, -1)
        // this.cube.rotator.rotateLayer('x', 1, 1)
        // this.cube.rotator.rotateLayer('y', 0, -1)
        // this.cube.rotator.rotateLayer('z', -1, 1)
        // this.cube.rotator.rotateLayer('x', -1, 1)
        // this.cube.rotator.rotateLayer('y', 1, -1)
        // this.cube.rotator.rotateLayer('x', 1, 1)
        // this.cube.rotator.rotateLayer('y', 0, -1)
        // this.cube.rotator.rotateLayer('z', -1, 1)
        // this.cube.rotator.rotateLayer('x', -1, 1)
        // this.cube.rotator.rotateLayer('y', 1, -1)

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
            cameraTarget.copy(lookTarget).add(new THREE.Vector3(0, 0.5, 0.8));

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
        const model = gltfLoader.load(
            '/models/LowerResTextures3.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    // console.log(child.name, child.type)
                })
                walls = gltf.scene.getObjectByName('Cube001')
                scene.add(gltf.scene)


            }
        )


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

        /**
        * Sizes
        */
        // const sizes = {
        //     width: window.innerWidth,
        //     height: window.innerHeight
        // }
        // console.log(sizes.width)
        // console.log(window.innerWidth)


        // Raycaster
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        // Add text Geometry
        this.particles = new Particles(scene)

        // Instantiate CubeInput
        this.CubeInput = new CubeInput(this.cube, renderer, this)

        // Tick function 
        const clock = new THREE.Clock()
        const cubeWorldPos = new THREE.Vector3();
        let hotspotX = 0;
        let hotspotY = 0;
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
                        controls.enabled = true;
                    }
                }
            }
            controls.update();
            // Go through each points 
            if (sceneReady === true) {
                for (const point of points) {
                    const screenPos = point.position.clone() // clone the cube's position
                    screenPos.project(this.camera) // convert 3D coordinates to 2D (NDC)
                    raycaster.setFromCamera(new THREE.Vector2(screenPos.x, screenPos.y), this.camera)
                    const intersects = raycaster.intersectObjects(scene.children, true)
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

                    // const translateX = screenPos.x * innerWidth * 0.5
                    const targetX = (screenPos.x * 0.5 + 0.5) * innerWidth; // convert NDC to screen coordinates (pixels from top-left)
                    const targetY = (screenPos.y * -0.5 + 0.5) * innerHeight; // NDC Y is inverted, so multiply by -1 
                    hotspotX = targetX;
                    hotspotY = targetY;
                    cubeHotspot.style.left = `${hotspotX}px`;
                    cubeHotspot.style.top = `${hotspotY}px`;

                }
            }
            this.supernova.update(elapsedTime, this.camera);
            renderer.render(scene, this.camera);
            stats.end();

            requestAnimationFrame(tick);
        };
        tick()



    }




}   