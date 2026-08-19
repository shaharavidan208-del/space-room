import * as THREE from 'three'
import gsap from 'gsap'

export default class Rotator {
    constructor(cube) {
        this.cube = cube

        this.helper = new THREE.Group()
        this.layer = []

        this.vectorAxis = new THREE.Vector3(
            0,
            0,
            0
        )

        this.direction = 0

        // Blocks new pointer interaction while GSAP owns a rotation.
        this.isAnimating = false

        // True while cubies are temporarily parented to this.helper.
        this.isLayerActive = false
    }

    beginRotation(axis, layerIndex, direction) {
        this.axis = axis
        this.direction = direction
        this.isLayerActive = true

        this.layer = this.cube.getLayer(
            axis,
            layerIndex
        )

        this.helper.rotation.set(
            0,
            0,
            0
        )

        this.cube.cubeGroup.add(this.helper)

        /**
         * Reparent the selected nine cubies to the rotation helper.
         *
         * Their invisible hit stickers move with them automatically.
         */
        for (let i = 0; i < this.layer.length; i++) {
            this.helper.attach(this.layer[i])
        }
    }

    updateRotation(axis, delta) {
        this.vectorAxis.set(
            0,
            0,
            0
        )

        if (axis === 'x') {
            this.vectorAxis.x = 1
        }
        else if (axis === 'y') {
            this.vectorAxis.y = 1
        }
        else if (axis === 'z') {
            this.vectorAxis.z = 1
        }

        this.helper.rotateOnAxis(
            this.vectorAxis,
            delta
        )

        /**
         * The real cubies have moved, so copy the new sticker
         * transforms into the InstancedMesh.
         */
        this.cube.syncStickerInstances()
    }

    endRotation() {
        this.isAnimating = true

        const currentAngle =
            this.helper.rotation[this.axis]

        const targetAngle =
            Math.round(
                currentAngle / (Math.PI / 2)
            ) * (Math.PI / 2)

        gsap.to(this.helper.rotation, {
            [this.axis]: targetAngle,

            duration: 0.28,

            ease: 'power2.out',

            /**
             * GSAP changes the helper rotation every animation frame,
             * so the sticker instances need to follow it.
             */
            onUpdate: () => {
                this.cube.syncStickerInstances()
            },

            onComplete: () => {
                this.finishRotation()

                this.isAnimating = false
            }
        })
    }

    /**
     * Animates one exact quarter-turn and resolves after every cubie
     * has been reparented and snapped back onto the cube grid.
     *
     * The animation lock is owned by animateSequence(), allowing the
     * complete scramble to behave as one uninterrupted operation.
     *
     * @param {string} axis
     * @param {number} layerIndex
     * @param {number} direction
     * @param {number} duration
     * @returns {Promise<void>}
     */
    animateLayer(axis, layerIndex, direction, duration) {
        this.beginRotation(
            axis,
            layerIndex,
            direction
        )

        return new Promise((resolve) => {
            gsap.to(this.helper.rotation, {
                [axis]: Math.PI * 0.5 * direction,
                duration,
                ease: 'power2.inOut',

                onUpdate: () => {
                    this.cube.syncStickerInstances()
                },

                onComplete: () => {
                    this.finishRotation()
                    resolve()
                }
            })
        })
    }

    /**
     * Plays automatic moves in order while keeping manual input locked.
     * Each move begins only after the previous layer has been snapped
     * and returned to cubeGroup.
     *
     * @param {{axis: string, layerIndex: number, direction: number}[]} moves
     * @param {number} duration - Duration of each quarter-turn in seconds.
     * @returns {Promise<boolean>} Whether the complete sequence was played.
     */
    async animateSequence(moves, duration = 0.14) {
        if (this.isAnimating || this.isLayerActive) {
            return false
        }

        if (moves.length === 0) {
            return false
        }

        this.isAnimating = true

        try {
            for (let i = 0; i < moves.length; i++) {
                const move = moves[i]

                await this.animateLayer(
                    move.axis,
                    move.layerIndex,
                    move.direction,
                    duration
                )
            }
        }
        finally {
            this.isAnimating = false
        }

        return true
    }

    /**
     * Reparents the active layer back to the cube and removes any
     * floating-point drift created during the rotation. This is shared
     * by manual snapping, animated scrambling and immediate rotations.
     */
    finishRotation() {
        const rotation = this.helper.rotation

        rotation.x =
            Math.round(
                rotation.x / (Math.PI / 2)
            ) * (Math.PI / 2)

        rotation.y =
            Math.round(
                rotation.y / (Math.PI / 2)
            ) * (Math.PI / 2)

        rotation.z =
            Math.round(
                rotation.z / (Math.PI / 2)
            ) * (Math.PI / 2)

        for (let i = 0; i < this.layer.length; i++) {
            const cubie = this.layer[i]

            this.cube.cubeGroup.attach(cubie)

            cubie.position.x =
                Math.round(
                    cubie.position.x /
                    this.cube.pieceSize
                ) * this.cube.pieceSize

            cubie.position.y =
                Math.round(
                    cubie.position.y /
                    this.cube.pieceSize
                ) * this.cube.pieceSize

            cubie.position.z =
                Math.round(
                    cubie.position.z /
                    this.cube.pieceSize
                ) * this.cube.pieceSize

            cubie.rotation.x =
                Math.round(
                    cubie.rotation.x /
                    (Math.PI / 2)
                ) * (Math.PI / 2)

            cubie.rotation.y =
                Math.round(
                    cubie.rotation.y /
                    (Math.PI / 2)
                ) * (Math.PI / 2)

            cubie.rotation.z =
                Math.round(
                    cubie.rotation.z /
                    (Math.PI / 2)
                ) * (Math.PI / 2)
        }

        this.cube.cubeGroup.remove(
            this.helper
        )

        /**
         * Final instance update after the real cubies have been
         * reparented and snapped onto their exact grid positions.
         */
        this.cube.syncStickerInstances()
        this.isLayerActive = false
    }

    /**
     * Rotates one layer immediately by 90 degrees.
     *
     * Used by undo and other non-animated automatic rotations.
     *
     * @param {string} axis
     * @param {number} layerIndex
     * @param {number} direction
     */
    rotateLayer(axis, layerIndex, direction) {
        if (this.isAnimating || this.isLayerActive) {
            return false
        }

        this.beginRotation(
            axis,
            layerIndex,
            direction
        )

        this.updateRotation(
            axis,
            Math.PI * 0.5 * direction
        )

        this.finishRotation()

        return true
    }
}
