import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import GUI from 'lil-gui'
const pieceSize = 0.1
const PIECE_CORNER_RADIUS = 0.12;
const STICKER_CORNER_ROUNDNESS = 0.15;
const STICKER_SCALE = 0.82;
const STICKER_DEPTH = 0.01;
const stickerGeometry = new THREE.PlaneGeometry(pieceSize * STICKER_SCALE, pieceSize * STICKER_SCALE);
const colorMap = {
    'right':  0xD50032, // strong red
    'left':   0xFFFFFF, // white
    'top':    0xFFD500, // yellow
    'bottom': 0x0033A0, // deep blue
    'front':  0xE45C00, // strong orange
    'back':   0x6E1F7A, // purple (replaces green)
};

export default class Cube {
    
    
    constructor(scene) {
const axesHelper = new THREE.AxesHelper( 5 )
scene.add( axesHelper )

        // Scene 
        this.scene = scene
        // GUI
        const gui = new GUI()
        // pieces
        this.pieces = [] // 27 cubie meshes
        this.edges = [] // 54 sticker meshes
        const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] };

        // Cube propeties
        const geometry = new RoundedBoxGeometry(pieceSize, 
            pieceSize,
             pieceSize,
              4, 
              PIECE_CORNER_RADIUS * pieceSize, )
// width, height, depth, segments, radius
        // sticker.scale.set(STICKER_SCALE, STICKER_SCALE, STICKER_SCALE)
        const material = new THREE.MeshLambertMaterial({ color: 'grey' })
        const cubeMesh = new THREE.Mesh(geometry, material)
        const cube = new THREE.Group()

            

        for(let x = -1; x <= 1; x++) {
            for (let y = -1; y <=1; y++) {
                for(let z = -1; z <= 1; z++) {
                    const cubie = new THREE.Mesh(geometry, material)
                    cubie.position.set(x * pieceSize, y * pieceSize, z * pieceSize)
                    cube.add(cubie)
                    // Figure out which faces need stickers
            if (x === 1)  this.addSticker(cubie, 'right',  '+x');
            if (x === -1) this.addSticker(cubie, 'left',   '-x');
            if (y === 1)  this.addSticker(cubie, 'top',    '+y');
            if (y === -1) this.addSticker(cubie, 'bottom', '-y');
            if (z === 1)  this.addSticker(cubie, 'front',  '+z');
            if (z === -1) this.addSticker(cubie, 'back',   '-z');
                    console.log(cubie.position)

                }
            }
        }

        

        cube.position.set(0.7, 0.9, -2)
        scene.add(cube)
        const cubeFolder = gui.addFolder('Cube')

// Position
cubeFolder.add(cubeMesh.position, 'x', -10, 10, 0.01).name('Position X')
cubeFolder.add(cubeMesh.position, 'y', -10, 10, 0.01).name('Position Y')
cubeFolder.add(cubeMesh.position, 'z', -10, 10, 0.01).name('Position Z')

// Uniform scale
const scaleControl = { scale: 1 }
cubeFolder.add(scaleControl, 'scale', 0.1, 5, 0.01).name('Scale').onChange((val) => {
    cubeMesh.scale.setScalar(val)
})

// Rotation (in case you want to test orientation)
cubeFolder.add(cube.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotation X')
cubeFolder.add(cube.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotation Y')
cubeFolder.add(cube.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotation Z')

cubeFolder.open()

    }

    addSticker(cubie, faceName, direction) {
    
    const stickerMaterial = new THREE.MeshBasicMaterial({ color: colorMap[faceName] });
    const sticker = new THREE.Mesh(stickerGeometry, stickerMaterial);
    
    // Position and rotate based on which face
    const offset = pieceSize / 2 + 0.001; // tiny offset to prevent z-fighting
    
    switch (direction) {
        case '+x':
            sticker.position.set(offset, 0, 0);
            sticker.rotation.y = Math.PI / 2;
            break;
        case '-x':
            sticker.position.set(-offset, 0, 0);
            sticker.rotation.y = -Math.PI / 2;
            break;
        case '+y':
            sticker.position.set(0, offset, 0);
            sticker.rotation.x = -Math.PI / 2;
            break;
        case '-y':
            sticker.position.set(0, -offset, 0);
            sticker.rotation.x = Math.PI / 2;
            break;
        case '+z':
            sticker.position.set(0, 0, offset);
            // No rotation needed — plane already faces +z by default
            break;
        case '-z':
            sticker.position.set(0, 0, -offset);
            sticker.rotation.y = Math.PI;
            break;
    }
    
    sticker.name = faceName;
    cubie.add(sticker); // sticker is child of cubie
    this.edges.push(sticker); // also store flat reference for later
}
}