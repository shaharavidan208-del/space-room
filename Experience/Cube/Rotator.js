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
        this.isAnimating = false
    }

    beginRotation(axis, layerIndex, direction) {
        this.axis = axis
        this.direction = direction

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
                 * Final update after reparenting and snapping.
                 */
                this.cube.syncStickerInstances()

                this.isAnimating = false
            }
        })
    }

    /**
     * Rotates one layer immediately by 90 degrees.
     *
     * Used by scrambling, undo and other automatic rotations.
     *
     * @param {string} axis
     * @param {number} layerIndex
     * @param {number} direction
     */
    rotateLayer(axis, layerIndex, direction) {
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

        for (let i = 0; i < this.layer.length; i++) {
            this.helper.attach(this.layer[i])
        }

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
            Math.PI * 0.5 * direction
        )

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

        this.cube.syncStickerInstances()
    }
}