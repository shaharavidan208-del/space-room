import * as THREE from 'three'
export default class Rotator {
    constructor(cube) {
        this.cube = cube;        // reference to main Cube class
        this.helper = new THREE.Group();
        // helper isn't added to scene initially — added/removed per rotation
    }


    /**
     * Rotates one layer of the cube 90 degrees.
     * 
     * @param {string} axis - Which axis to rotate around. 'x', 'y', or 'z'
     * @param {number} layerIndex - Which of the 3 layers along that axis. -1, 0, or 1
     * @param {number} direction - Clockwise or counterclockwise. 1 or -1 
     */
    rotateLayer(axis, layerIndex, direction) {
        const layer = this.cube.getLayer(axis, layerIndex)
        this.helper.rotation.set(0, 0, 0) // reset helper rotation to avoid compounding rotations
        this.cube.cubeGroup.add(this.helper) // add helper to scene so it has a position/rot
        // Reparent cubies to helper — they'll inherit its rotation when we spin it
        for (let i = 0; i < layer.length; i++) {
            this.helper.attach(layer[i])
        }
        this.helper[`rotate${axis.toUpperCase()}`](direction * Math.PI / 2)
        console.log('helper parent:', this.helper.parent)
        console.log('helper rotation after rotate:', this.helper.rotation) // rotate helper 90 degrees around specified axis
        for (let i = 0; i < layer.length; i++) {
            this.cube.cubeGroup.attach(layer[i])

            // Snap positions to nearest pieceSize increment — kills floating point drift
            layer[i].position.x = Math.round(layer[i].position.x / this.cube.pieceSize) * this.cube.pieceSize; 
            layer[i].position.y = Math.round(layer[i].position.y / this.cube.pieceSize) * this.cube.pieceSize;
            layer[i].position.z = Math.round(layer[i].position.z / this.cube.pieceSize) * this.cube.pieceSize;

            // Also snap rotations to 90-degree increments 
            layer[i].rotation.x = Math.round(layer[i].rotation.x / (Math.PI / 2)) * (Math.PI / 2);
            layer[i].rotation.y = Math.round(layer[i].rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            layer[i].rotation.z = Math.round(layer[i].rotation.z / (Math.PI / 2)) * (Math.PI / 2);
        }
        // 2. Reparent cubies to helper
        // 3. Rotate helper
        // 4. Reparent cubies back, remove helper
        // 5. Snap positions/rotations to clean values
        this.cube.cubeGroup.remove(this.helper)
    }


}
