import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import SupernovaRemnant from './SupernovaRemnant.js'
import Particles from './Particles.js'
import GUI from 'lil-gui';


export default class Experience {
    constructor(canvas) {
        const gui = new GUI()
        const loader = new HDRLoader();

        // Scene
        const scene = new THREE.Scene();



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

        // In constructor, after scene is set up:
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
        const camera = new THREE.PerspectiveCamera(65,
            window.innerWidth / window.innerHeight,
            0.1, // near
            1000, // far
        );
        camera.position.set(5, 5, 10);
        camera.lookAt(5, 5, 5)
        scene.add(camera);

        // const cam = gu.addFolder('Camera')
        // // (min, max, increments), change supernova position 
        // cam.add(camera.position, 'x', 0, 2 * Math.PI, 0.1).name('Position X')
        // cam.add(camera.position, 'y', 0, 2 * Math.PI, 0.1).name('Position Y')
        // cam.add(camera.position, 'z', 0, 2 * Math.PI, 0.1).name('Position Z')
        // cam.add(camera.scale, 'x', 1, 100, 0.5).name('Scale').onChange((val) => {
        //     camera.scale.setScalar(val)
        // })

        // Controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;


        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;








        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        // טעינת המודל
        const model = gltfLoader.load(
            '/models/Room5.glb',
            (gltf) => {
                scene.add(gltf.scene)
                

            }
        )



        // Raycaster
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        window.addEventListener('click', (event) => {
            // Convert mouse position to normalized device coordinates (-1 to +1)
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

            // Cast ray from camera through mouse position
            raycaster.setFromCamera(mouse, camera)

            // Find intersected objects
            const intersects = raycaster.intersectObjects(scene.children, true)

            if (intersects.length > 0) {
                const clicked = intersects[0].object
                console.log('%c🎯 Clicked:', 'color: orange; font-weight: bold')
                console.log('  Name:', clicked.name || '(no name)')
                console.log('  Type:', clicked.type)
                console.log('  Parent:', clicked.parent?.name || '(no parent name)')
                console.log('  Full object:', clicked)
            } else {
                console.log('Clicked empty space')
            }
        })



        this.particles = new Particles(scene)


        console.log(renderer.info)

       


        // Animation
        const clock = new THREE.Clock()
        const tick = () => {
            const elapsedTime = clock.getElapsedTime();

            stats.begin();
            controls.update()
            this.supernova.update(elapsedTime, camera);
            renderer.render(scene, camera)
            stats.end();

          



            requestAnimationFrame(tick);
        };
        tick()



    }




}
