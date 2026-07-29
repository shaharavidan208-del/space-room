import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
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
const STICKER_COUNT = 54;





// Color palette
// Green replaced with purple, standard red/orange shifted for better distinction.
const colorMap = {
    'right': 0xD50032, // strong red
    'left': 0xFFFFFF, // white
    'top': 0xFFD500, // yellow
    'bottom': 0x0033A0, // deep blue
    'front': 0xE45C00, // strong orange
    'back': 0x6E1F7A, // purple (replaces green)
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
    this.pieceSize = 0.12

    this.rndAxisArr = ['x', 'y', 'z']
    this.faceName = null

    this.scene = scene

    // Parent for the complete Rubik's Cube.
    this.cubeGroup = new THREE.Group()

    // Real cubie meshes.
    this.pieces = []

    // Logical sticker references used by solve detection.
    // These now point to the invisible hit stickers.
    this.edges = []

    // Invisible sticker meshes used by CubeInput raycasting.
    this.stickerArr = []

    // Shared sticker geometry.
    this.stickerGeometry = new THREE.PlaneGeometry(
        this.pieceSize * STICKER_SCALE,
        this.pieceSize * STICKER_SCALE
    )

    /**
     * These materials are only used by the invisible raycast stickers.
     *
     * Keeping the correct material orientation means the existing
     * sticker raycasting continues behaving exactly as before.
     */
    this.stickerMaterials = {
        right: new THREE.MeshBasicMaterial({
            color: colorMap.right
        }),

        left: new THREE.MeshBasicMaterial({
            color: colorMap.left
        }),

        top: new THREE.MeshBasicMaterial({
            color: colorMap.top
        }),

        bottom: new THREE.MeshBasicMaterial({
            color: colorMap.bottom
        }),

        front: new THREE.MeshBasicMaterial({
            color: colorMap.front
        }),

        back: new THREE.MeshBasicMaterial({
            color: colorMap.back
        })
    }

    /**
     * One white material for all visible sticker instances.
     *
     * The white base color is multiplied by each instance color.
     */
    this.stickerInstanceMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff
    })

    /**
     * All 54 visible stickers are now rendered by one InstancedMesh.
     */
    this.stickerInstances = new THREE.InstancedMesh(
        this.stickerGeometry,
        this.stickerInstanceMaterial,
        STICKER_COUNT
    )

    this.stickerInstances.name = 'RubiksCubeStickers'

    // Instance matrices change whenever a layer rotates.
    this.stickerInstances.instanceMatrix.setUsage(
        THREE.DynamicDrawUsage
    )

    this.cubeGroup.add(this.stickerInstances)

    /**
     * Reusable matrices.
     *
     * Reusing them avoids creating 54 new Matrix4 objects every
     * time the player moves a layer.
     */
    this.stickerRootInverse = new THREE.Matrix4()
    this.stickerInstanceMatrix = new THREE.Matrix4()

    /**
     * The invisible hit stickers are scaled up so they cover the
     * entire cubie face.
     *
     * Before copying their matrices into the visible instances,
     * this matrix removes that extra raycast-only scale.
     */
    this.hitStickerScaleCorrection = new THREE.Matrix4()

    this.hitStickerScaleCorrection.makeScale(
        STICKER_SCALE,
        STICKER_SCALE,
        1
    )

    // Shared cubie geometry.
    this.geometry = new RoundedBoxGeometry(
        this.pieceSize,
        this.pieceSize,
        this.pieceSize,
        4,
        PIECE_CORNER_RADIUS * this.pieceSize
    )

    // Shared cubie material.
    this.material = new THREE.MeshLambertMaterial({
        color: 'black'
    })

    this.buildCubies()
}
buildCubies() {
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                const cubie = new THREE.Mesh(
                    this.geometry,
                    this.material
                )

                cubie.position.set(
                    x * this.pieceSize,
                    y * this.pieceSize,
                    z * this.pieceSize
                )

                this.cubeGroup.add(cubie)
                this.pieces.push(cubie)

                if (x === 1) {
                    this.addSticker(cubie, 'right', '+x')
                }

                if (x === -1) {
                    this.addSticker(cubie, 'left', '-x')
                }

                if (y === 1) {
                    this.addSticker(cubie, 'top', '+y')
                }

                if (y === -1) {
                    this.addSticker(cubie, 'bottom', '-y')
                }

                if (z === 1) {
                    this.addSticker(cubie, 'front', '+z')
                }

                if (z === -1) {
                    this.addSticker(cubie, 'back', '-z')
                }
            }
        }
    }

    this.rotator = new Rotator(this)

    this.cubeGroup.position.set(
        0,
        1.8,
        -1.8
    )

    this.scene.add(this.cubeGroup)

    /**
     * Create the initial 54 instance matrices and calculate
     * their bounds once.
     */
    this.syncStickerInstances(true)
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
        for (let i = 0; i < this.pieces.length; i++) {
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
    /**
 * Creates an invisible sticker used for:
 *
 * - raycasting
 * - face normal detection
 * - solve detection
 * - tracking the sticker's transform
 *
 * The visible version is rendered by this.stickerInstances.
 *
 * @param {THREE.Mesh} cubie
 * @param {string} faceName
 * @param {string} direction
 */
addSticker(cubie, faceName, direction) {
    this.faceName = faceName

    /**
     * This mesh does not render.
     *
     * It remains a child of the cubie so all your current
     * CubeInput and Rotator logic continues working.
     */
    const hitSticker = new THREE.Mesh(
        this.stickerGeometry,
        this.stickerMaterials[faceName]
    )

    const offset = this.pieceSize / 2 + 0.001

    switch (direction) {
        case '+x':
            hitSticker.position.set(offset, 0, 0)
            hitSticker.rotation.y = Math.PI / 2
            break

        case '-x':
            hitSticker.position.set(-offset, 0, 0)
            hitSticker.rotation.y = -Math.PI / 2
            break

        case '+y':
            hitSticker.position.set(0, offset, 0)
            hitSticker.rotation.x = -Math.PI / 2
            break

        case '-y':
            hitSticker.position.set(0, -offset, 0)
            hitSticker.rotation.x = Math.PI / 2
            break

        case '+z':
            hitSticker.position.set(0, 0, offset)
            break

        case '-z':
            hitSticker.position.set(0, 0, -offset)
            hitSticker.rotation.y = Math.PI
            break
    }

    hitSticker.name = faceName

    /**
     * Increase only the invisible hit area.
     *
     * The original sticker geometry is STICKER_SCALE times the
     * cubie face size, so this inverse scale expands the hit area
     * back to the complete face.
     */
    const hitScale = 1 / STICKER_SCALE

    hitSticker.scale.set(
        hitScale,
        hitScale,
        1
    )

    hitSticker.visible = false

    cubie.add(hitSticker)

    const instanceIndex = this.stickerArr.length

    hitSticker.userData.stickerInstanceIndex = instanceIndex

    this.stickerArr.push(hitSticker)

    /**
     * Solve detection can keep using this.edges.
     *
     * Position, rotation, name and parent are all still correct.
     * The extra scale does not affect the sticker's center or normal.
     */
    this.edges.push(hitSticker)

    /**
     * Give this visible instance its permanent sticker color.
     */
    const instanceColor = new THREE.Color(
        colorMap[faceName]
    )

    this.stickerInstances.setColorAt(
        instanceIndex,
        instanceColor
    )
}

/**
 * Copies every invisible sticker's current transform into the
 * corresponding visible sticker instance.
 *
 * @param {boolean} updateBounds
 */
syncStickerInstances(updateBounds = false) {
    /**
     * Update the cubies, helper group and invisible stickers before
     * reading their matrixWorld values.
     */
    this.cubeGroup.updateMatrixWorld(true)

    /**
     * Instance matrices must be relative to the InstancedMesh,
     * not relative to the world.
     */
    this.stickerRootInverse
        .copy(this.stickerInstances.matrixWorld)
        .invert()

    for (let i = 0; i < this.stickerArr.length; i++) {
        const hitSticker = this.stickerArr[i]

        /**
         * Convert:
         *
         * hit sticker world transform
         *              ↓
         * stickerInstances local transform
         */
        this.stickerInstanceMatrix.multiplyMatrices(
            this.stickerRootInverse,
            hitSticker.matrixWorld
        )

        /**
         * Remove the extra scale that exists only to make
         * raycasting easier.
         */
        this.stickerInstanceMatrix.multiply(
            this.hitStickerScaleCorrection
        )

        this.stickerInstances.setMatrixAt(
            i,
            this.stickerInstanceMatrix
        )
    }

    /**
     * Tell Three.js to upload the changed instance data.
     */
    this.stickerInstances.instanceMatrix.needsUpdate = true

    if (this.stickerInstances.instanceColor) {
        this.stickerInstances.instanceColor.needsUpdate = true
    }

    /**
     * The overall cube bounds do not change during legal Rubik's
     * Cube rotations, so this only needs to happen initially.
     */
    if (updateBounds) {
        this.stickerInstances.computeBoundingBox()
        this.stickerInstances.computeBoundingSphere()
    }
}
}