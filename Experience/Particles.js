import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'


export default class Particles {
    constructor(scene) {
        const gui = new GUI()
        /**
         * Base
         */

        // Scene
        this.scene = scene

        // Axes helper
        // const axesHelper = new THREE.AxesHelper()
        // scene.add(axesHelper)

        /**
         * Textures
         */
        const textureLoader = new THREE.TextureLoader()
        const matcapTexture = textureLoader.load('/fonts/flame_02.png')
        matcapTexture.colorSpace = THREE.SRGBColorSpace
        /**
         * Fonts
         */
        const fontLoader = new FontLoader()
        fontLoader.load(
            '/fonts/Audiowide_Regular.json',
            (font) => {
                const textGeometry = new TextGeometry(
                    'MY PORTFOLIO',
                    {
                        font: font,
                        size: 0.5,
                        depth: 0.5,
                        curveSegments: 5,
                        bevelEnabled: true,
                        bevelThickness: 0.03,
                        bevelSize: 0.02,
                        bevelOffset: 0,
                        bevelSegments: 4
                    }
                )
                // textGeometry.computeBoundingBox()
                // textGeometry.translate(
                //    - (textGeometry.boundingBox.max.x - 0.02) * 0.5,
                //    - (textGeometry.boundingBox.max.y -0.02) * 0.5,
                //    - (textGeometry.boundingBox.max.z - 0.03) * 0.5
                // )
                // textGeometry.computeBoundingBox()

                textGeometry.center()
                console.log(textGeometry.boundingBox)
                const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture})
                const text = new THREE.Mesh(textGeometry, textMaterial)
                const positionFolder = gui.addFolder('Mesh Position');
                text.position.set(0, 4, -5)
                // positionFolder.add(text.position, 'x', -10, 10, 0.1).name('X Axis');
                // positionFolder.add(text.position, 'y', -10, 10, 0.1).name('Y Axis');
                // positionFolder.add(text.position, 'z', -10, 10, 0.1).name('Z Axis');
                // positionFolder.addColor(textMaterial, 'color').name('Text Color')
                this.scene.add(text)


            })


        // console.time('donuts')

        //         const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
        //         const donutMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })
        //         for (let i = 0; i < 100; i++) {
        //             const donut = new THREE.Mesh(donutGeometry, donutMaterial)

        //             donut.position.x = (Math.random() - 0.5) * 10
        //             donut.position.y = (Math.random() - 0.5) * 10
        //             donut.position.z = (Math.random() - 0.5) * 10

        //             donut.rotation.x = Math.random() * Math.PI
        //             donut.rotation.Y = Math.random() * Math.PI

        //             const scale = Math.random()
        //             donut.scale.set(scale, scale, scale)


        //             this.scene.add(donut)
        //         }

        //         console.timeEnd('donuts')
        //     }
        // )













    }
}