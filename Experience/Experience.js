import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import GUI from 'lil-gui';

export default class Experience {
    constructor(canvas) {
        const gu = new GUI()
        const hdrLoader = new HDRLoader()
        const cubeTextureLoader = new THREE.CubeTextureLoader()


        // Scene
        const scene = new THREE.Scene();
        console.log(hdrLoader)
        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.set(1024, 1024)
        directionalLight.shadow.camera.far = 15
        directionalLight.shadow.camera.left = - 7
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        directionalLight.position.set(5, 5, 5)
        scene.add(directionalLight)
    
 /**
 * Environment map
 */




const environmentMap = hdrLoader.load('/environmentMaps/volcanic_planet.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

scene.background = environmentMap



        // Camera
        const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(6, 4, 8);
        scene.add(camera);

        // Controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;


        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // נחוץ ל-RectAreaLight
        RectAreaLightUniformsLib.init();

        // תאורה + GUI
        // LDR cube texture

    

        // טעינת המודל
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(
            '/models/Room.glb',
            (gltf) => {
                scene.add(gltf.scene);
                console.log('החדר נטען בהצלחה');
            },
            undefined,
            (error) => { console.error('שגיאה בטעינת המודל:', error); }
        );

        // Resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        // Raycaster
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('click', () => {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                console.log('פגעת ב:', intersects[0].object.name);
            }
        });

        // לולאת אנימציה
        const tick = () => {
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(tick);
        };
        tick();
    }

   
}
