import * as THREE from 'three'
import gsap from 'gsap';
export default class Rotator {
    constructor(cube) {
        this.cube = cube;        // reference to main Cube class
        this.helper = new THREE.Group();
        this.layer = []
        this.vectorAxis = new THREE.Vector3(0, 0, 0)
        this.direction = 0
        this.isAnimating = false
        // helper isn't added to scene initially — added/removed per rotation
    }



    beginRotation(axis, layerIndex, direction) {
        this.axis = axis
        this.direction = direction
        this.layer = this.cube.getLayer(axis, layerIndex)
        this.helper.rotation.set(0, 0, 0) // reset helper rotation to avoid compounding rotations
        this.cube.cubeGroup.add(this.helper) // add helper to scene so it has a position/rot
        // Reparent cubies to helper — they'll inherit its rotation when we spin it
        for (let i = 0; i < this.layer.length; i++) {
            this.helper.attach(this.layer[i])
        }
    }

    updateRotation(axis, delta) {
        this.vectorAxis.set(0, 0, 0)
        if (axis === 'x')
            this.vectorAxis.x = 1
        else if (axis === 'y')
            this.vectorAxis.y = 1
        else if (axis === 'z')
            this.vectorAxis.z = 1
        this.helper.rotateOnAxis(this.vectorAxis, delta)
    }

    endRotation() {
        this.isAnimating = true
        const currentAngle = this.helper.rotation[this.axis] // current rotation on the current axis
        const targetAngle = Math.round(currentAngle / (Math.PI / 2)) * (Math.PI / 2)

        gsap.to(this.helper.rotation, { // The very first thing you hand to gsap.to() is the specific object you want it to manipulate.
            [this.axis]: targetAngle, // Because this.axis is a string (like "x", "y", or "z"), putting it in brackets evaluates the variable before passing it to GSAP.
            duration: 0.28, // 300 ms
            ease: "power2.out", // ease out curve built by GSAP
            onComplete: () => { // By using an arrow function for onComplete, you perfectly preserve the scope of 'this'
                // ... cleanup logic
                console.log(this.axis)
                // Snap helper rotation to nearest 90 degrees   
                const rot = this.helper.rotation
                rot.x = Math.round(rot.x / (Math.PI / 2)) * (Math.PI / 2)
                rot.y = Math.round(rot.y / (Math.PI / 2)) * (Math.PI / 2)
                rot.z = Math.round(rot.z / (Math.PI / 2)) * (Math.PI / 2)

                for (let i = 0; i < this.layer.length; i++) {
                    this.cube.cubeGroup.attach(this.layer[i])
                    // Snap positions to nearest pieceSize increment — kills floating point drift
                    this.layer[i].position.x = Math.round(this.layer[i].position.x / this.cube.pieceSize) * this.cube.pieceSize;
                    this.layer[i].position.y = Math.round(this.layer[i].position.y / this.cube.pieceSize) * this.cube.pieceSize;
                    this.layer[i].position.z = Math.round(this.layer[i].position.z / this.cube.pieceSize) * this.cube.pieceSize;

                    // Also snap rotations to 90-degree increments 
                    this.layer[i].rotation.x = Math.round(this.layer[i].rotation.x / (Math.PI / 2)) * (Math.PI / 2);
                    this.layer[i].rotation.y = Math.round(this.layer[i].rotation.y / (Math.PI / 2)) * (Math.PI / 2);
                    this.layer[i].rotation.z = Math.round(this.layer[i].rotation.z / (Math.PI / 2)) * (Math.PI / 2);
                }
                this.cube.cubeGroup.remove(this.helper)
                this.isAnimating = false
            }
        });

    }


    /**
     * Rotates one layer of the cube 90 degrees.
     * 
     * @param {string} axis - Which axis to rotate around. 'x', 'y', or 'z'
     * @param {number} layerIndex - Which of the 3 layers along that axis. -1, 0, or 1
     * @param {number} direction - Clockwise or counterclockwise. 1 or -1 
     */
    rotateLayer(axis, layerIndex, direction) {
        this.layer = this.cube.getLayer(axis, layerIndex)
        this.helper.rotation.set(0, 0, 0) // reset helper rotation to avoid compounding rotations
        this.cube.cubeGroup.add(this.helper) // add helper to scene so it has a position/rot
        // Reparent cubies to helper — they'll inherit its rotation when we spin it
        for (let i = 0; i < this.layer.length; i++) {
            this.helper.attach(this.layer[i])
        }
        this.vectorAxis.set(0, 0, 0)
        if (axis === 'x')
            this.vectorAxis.x = 1
        else if (axis === 'y')
            this.vectorAxis.y = 1
        else if (axis === 'z')
            this.vectorAxis.z = 1
        this.helper.rotateOnAxis(this.vectorAxis, Math.PI * 0.5)
        // console.log('helper parent:', this.helper.parent)
        // console.log('helper rotation after rotate:', this.helper.rotation) // rotate helper 90 degrees around specified axis
        for (let i = 0; i < this.layer.length; i++) {
            this.cube.cubeGroup.attach(this.layer[i])

            // Snap positions to nearest pieceSize increment — kills floating point drift
            this.layer[i].position.x = Math.round(this.layer[i].position.x / this.cube.pieceSize) * this.cube.pieceSize;
            this.layer[i].position.y = Math.round(this.layer[i].position.y / this.cube.pieceSize) * this.cube.pieceSize;
            this.layer[i].position.z = Math.round(this.layer[i].position.z / this.cube.pieceSize) * this.cube.pieceSize;

            // Also snap rotations to 90-degree increments 
            this.layer[i].rotation.x = Math.round(this.layer[i].rotation.x / (Math.PI / 2)) * (Math.PI / 2);
            this.layer[i].rotation.y = Math.round(this.layer[i].rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            this.layer[i].rotation.z = Math.round(this.layer[i].rotation.z / (Math.PI / 2)) * (Math.PI / 2);
        }
        // 2. Reparent cubies to helper
        // 3. Rotate helper
        // 4. Reparent cubies back, remove helper
        // 5. Snap positions/rotations to clean values
        this.cube.cubeGroup.remove(this.helper)
    }


}
