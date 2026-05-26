import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import GUI from 'lil-gui'
import Rotator from './Rotator.js'

// ============================================================
// CONSTANTS
// ============================================================

// Corner rounding ratio for cubie body (multiplied by pieceSize for actual radius)
const PIECE_CORNER_RADIUS = 0.12;

// Sticker corner rounding ratio (currently unused — for future RoundedPlaneGeometry upgrade)
const STICKER_CORNER_ROUNDNESS = 0.15;

// Sticker size as a fraction of the cubie face. Below 1.0 leaves a black gap between stickers,
const STICKER_SCALE = 0.87;

// Sticker thickness 
const STICKER_DEPTH = 0.01;




// Color palette
// Green replaced with purple, standard red/orange shifted for better distinction.
const colorMap = {
    'right':  0xD50032, // strong red
    'left':   0xFFFFFF, // white
    'top':    0xFFD500, // yellow
    'bottom': 0x0033A0, // deep blue
    'front':  0xE45C00, // strong orange
    'back':   0x6E1F7A, // purple (replaces green)
};


/**
 * Cube class — builds and manages a 3x3x3 Rubik's cube in Three.js.
 * 
 * Architecture:
 *   - 27 cubies (small rounded boxes) arranged in a 3x3x3 grid inside a parent Group
 *   - 54 stickers (colored planes) attached as children of cubies
 *   - When cubies rotate, their sticker children rotate automatically (Three.js scene graph)
 *   - this.pieces and this.edges hold flat references for fast iteration (solve detection, etc.)
 */
export default class Cube {
    constructor(scene) {
        this.rndAxisArr = ['x', 'y', 'z']
        this.faceName = null
        // Parent group for the entire cube. 
        this.cubeGroup = new THREE.Group()
        // Size of a single cubie 
        this.pieceSize = 0.1   
        // const axesHelper = new THREE.AxesHelper(5)
        // scene.add(axesHelper)
        this.scene = scene
        const gui = new GUI()
        // Flat references to all cubies and stickers — used for iteration in solve detection
        this.pieces = []  // 27 cubie meshes
        this.edges = []   // 54 sticker meshes
        // groups stickers by which face they currently sit on
        const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] };
        // Shared cubie geometry
        this.geometry = new RoundedBoxGeometry(
            this.pieceSize,
            this.pieceSize,
            this.pieceSize,
            4,                                 // segments — controls smoothness of rounded corners
            PIECE_CORNER_RADIUS * this.pieceSize    // absolute radius (the constant is a ratio)
        )
        // Shared cubie material
        this.material = new THREE.MeshLambertMaterial({ color: 'black' })
        this.buildCubies()
        // ============================================================
        // GUI CONTROLS — for tuning placement during development
        // ============================================================
        // const cubeGroupFolder = gui.addFolder('Cube')

        // cubeGroupFolder.add(this.cubeGroup.position, 'x', -10, 10, 0.01).name('Position X')
        // cubeGroupFolder.add(this.cubeGroup.position, 'y', -10, 10, 0.01).name('Position Y')
        // cubeGroupFolder.add(this.cubeGroup.position, 'z', -10, 10, 0.01).name('Position Z')

        // const scaleControl = { scale: 1 }
        // cubeGroupFolder.add(scaleControl, 'scale', 0.1, 5, 0.01).name('Scale').onChange((val) => {
        //     this.cubeGroup.scale.setScalar(val)
        // })

        // cubeGroupFolder.add(this.cubeGroup.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotation X')
        // cubeGroupFolder.add(this.cubeGroup.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotation Y')
        // cubeGroupFolder.add(this.cubeGroup.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotation Z')

        // cubeGroupFolder.open()
        // console.log(this.getLayer('x', 0))
    }

        buildCubies() {
        // Build the 3x3x3 grid of cubies. 
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const cubie = new THREE.Mesh(this.geometry, this.material)
                    cubie.position.set(x * this.pieceSize, y * this.pieceSize, z * this.pieceSize)
                    this.cubeGroup.add(cubie)
                    this.pieces.push(cubie)
                    // console.log(cubie.position)
                    // Add stickers to faces that are on the cube's outer surface.
                    // A face is visible only when its axis position is at the extreme (±1, not 0).
                    // Each axis is checked independently because corner cubies have multiple visible faces.
                    if (x === 1) { 
                        this.addSticker(cubie, 'right',  '+x');
                    }
                    if (x === -1) this.addSticker(cubie, 'left',   '-x');
                    if (y === 1)  this.addSticker(cubie, 'top',    '+y');
                    if (y === -1) this.addSticker(cubie, 'bottom', '-y');
                    if (z === 1)  this.addSticker(cubie, 'front',  '+z');
                    if (z === -1) this.addSticker(cubie, 'back',   '-z');
                    
                    // console.log(cubie.position)
                }
            }
        
        }

        // Position the entire cube in the room scene (sitting on the desk)
        this.rotator = new Rotator(this)
        this.cubeGroup.position.set(-2.45, 1.37, -1.44)
        this.scene.add(this.cubeGroup)
        console.log(this.pieces[0].position)
        // console.log(this.pieces)
        // console.log(this.rotator)

    }

    /**
     * get one layer
     * 
     * @param {string} axis - Which axis to rotate around. ('x', 'y', or 'z')
     * @param {number} layerIndex - Which of the 3 layers along that axis. -1, 0, or 1
     */
    getLayer(axis, layerIndex) { 
        const layer = []
        // console.log(this.pieces[0])
        // console.log(this)
        for (let i = 0; i < this.pieces.length; i++) 
        {
            if (Math.abs(this.pieces[i].position[axis] - layerIndex * this.pieceSize) < 0.001)
                layer.push(this.pieces[i])
        }
        return layer
        // get cubie's position in cubeGroup's local space
        // check if its coordinate on the given axis matches layerIndex * pieceSize
    }


    /**
     * Creates a colored sticker mesh and attaches it to a cubie as a child.
     * 
     * @param {THREE.Mesh} cubie - The parent cubie this sticker is being attached to
     * @param {string} faceName - Identifies the face ('right', 'left', etc.) — used for color lookup
     *                            and stays constant even after cube rotations (sticker's color identity)
     * @param {string} direction - Direction code ('+x', '-x', etc.) — used for positioning math
     */
    addSticker(cubie, faceName, direction) {
        // Shared sticker geometry
        this.faceName = faceName
        const stickerGeometry = new THREE.PlaneGeometry(this.pieceSize * STICKER_SCALE, this.pieceSize * STICKER_SCALE);
        const sticker = new THREE.Mesh(stickerGeometry);
        sticker.material.color.set(colorMap[faceName] )

        // Distance from cubie center to its outer surface, plus a tiny buffer.
        // The +0.001 prevents z-fighting between sticker and cubie face 
        const offset = this.pieceSize / 2 + 0.001;

        // PlaneGeometry is created facing +Z by default. Each face direction needs different
        // positioning AND rotation to make the sticker face outward correctly.
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
                // No rotation — plane already faces +Z by default
                break;
            case '-z':
                sticker.position.set(0, 0, -offset);
                sticker.rotation.y = Math.PI; // flip 180° to face backward
                break;
        }

        // Store the sticker's original face identity. Used later for solve detection —
        // the cube is solved when all stickers on a face share the same name.
        sticker.name = faceName;
        
        // Make sticker a child of cubie. Three.js scene graph will automatically apply
        // any cubie rotations to its sticker children — no manual sticker math needed during animations.
        cubie.add(sticker);
        
        // Also keep flat reference for fast iteration during solve detection and animations
        this.edges.push(sticker);
    }

    scrambler()
    {   
        let rndAxis = Math.floor(Math.random() * this.rndAxisArr.length)
        let rndLayerIndex = Math.floor(Math.random() * 3 - 1)
        let rndDirection = Math.random() < 0.5 ? -1 : 1
        this.rotator.rotateLayer(this.rndAxisArr[rndAxis], rndLayerIndex, rndDirection)
    }
}