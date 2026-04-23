import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';


import GUI from 'lil-gui';



export default class Experience {
    constructor(canvas) {
        const gu = new GUI()
        const loader =  new HDRLoader();

        


         // FPS counter 
        const stats = new Stats();
        document.body.appendChild(stats.dom);

        // Scene
        const scene = new THREE.Scene();
        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
        directionalLight.castShadow = false

        directionalLight.shadow.camera.far = 10
        directionalLight.shadow.camera.left = - 6
        directionalLight.shadow.camera.top = 7
        directionalLight.shadow.camera.right = 7
        directionalLight.shadow.camera.bottom = - 7
        directionalLight.position.set(5, 5, 5)
        scene.add(directionalLight)
    
 /**
 * Environment map
 */






const environmentMap = loader.load('/environmentMaps/volcanic_planet_compressed.hdr', (texture) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    console.log(texture)
})





        // Camera
        const camera = new THREE.PerspectiveCamera(35,
             window.innerWidth / window.innerHeight, 
             0.1, // near
             1000, // far
            );
        camera.position.set(6, 4, 8);
        scene.add(camera);

        // Controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;


        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;


        


        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        // טעינת המודל

        gltfLoader.load(
            '/models/Merged_LowPoly_draco.glb',
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

    

    

        // לולאת אנימציה
        const tick = () => {

            stats.begin();
            controls.update();
            renderer.render(scene, camera);
            stats.end();
            requestAnimationFrame(tick);
        };
        tick();

    }



   
}
