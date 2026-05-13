import * as THREE from 'three'
export default class CubeInput {

    onEmptyDown() {
        console.log("entered")
        this.isDragging = true
        this.dragMode = "cube"
        this.axisLocked = false

    }

    constructor(cube, renderer, experience) {
        const xVector = new THREE.Vector3(1, 0, 0)
        const yVector = new THREE.Vector3(0, 1, 0)
        this.cube = cube
        this.renderer = renderer
        this.experience = experience
        this.isDragging = false
        this.raycaster = new THREE.Raycaster() // Projects a 3D ray starting at the camera and passing through that 2D pixel into the 3D scene.
        this.mouse = new THREE.Vector2()
        this.hitCubie = null
        this.startX = 0
        this.startY = 0
        this.prevX = 0
        this.prevY = 0
        this.dxLarger = null
        this.axisLocked = false // once we determined which axis the rotation is in, lock the axis
        this.flipAxis;
        this.layerIndex = -2
        this.direction = -2
        this.dragMode = null // tracks whether current drag is layer or cube rotation
        this.sensitivity = 0.005

        // pointerdown fires when any mouse button is pressed
        renderer.domElement.addEventListener('pointerdown', (input) => {
            // const isTouch = input.pointerType === 'touch'; // touch later 
            const isLMB = input.button === 0; // boolean 
            if (!isLMB) return;
            if (!this.experience.isFocused) return;
            this.prevX = input.clientX
            this.prevY = input.clientY
            this.isDragging = true
            renderer.domElement.setPointerCapture(input.pointerId)
            this.mouse.x = (input.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -(input.clientY / window.innerHeight) * 2 + 1
            this.raycaster.setFromCamera(this.mouse, this.experience.camera)
            // Find intersected objects
            const intersects = this.raycaster.intersectObjects(this.cube.edges) // intersects array contains only the cube's edges
            this.startX = input.clientX
            this.startY = input.clientY
            if (intersects.length === 0) { // clicked empty space
                this.onEmptyDown()
                return
            }
            const sticker = intersects[0].object // closest sticker hit
            this.hitCubie = sticker.parent
            this.axisLocked = false
        });

        // fires on every mouse movement. The gate (if (!isDragging) return) immediately exits if RMB isn't held
        renderer.domElement.addEventListener('pointermove', (input) => {
            if (!this.experience.isFocused) return;
            if (!this.isDragging) return;
            const dx = input.clientX - this.prevX
            const dy = input.clientY - this.prevY
            if (this.dragMode === "cube") // cube drag mode
            {
                if (!this.axisLocked && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                    this.dxLarger = (Math.abs(dx) > Math.abs(dy))
                    this.axisLocked = true
                }
                if (this.axisLocked) {
                    if (this.dxLarger) {
                        this.flipAxis = yVector // the axis to rotate the cube around 
                        this.cube.cubeGroup.rotateOnWorldAxis(this.flipAxis, dx * this.sensitivity) // Vector3 to rotate around, and angle
                    }

                    else {
                        this.flipAxis = xVector
                        this.cube.cubeGroup.rotateOnWorldAxis(this.flipAxis, dy * this.sensitivity)
                    }
                }
            }
            this.prevX = input.clientX
            this.prevY = input.clientY
        })

        renderer.domElement.addEventListener('pointerup', (input) => {
            // console.log('pointerup fired', this.isDragging, this.axisLocked)
            const isLMB = input.button === 0;
            if (!isLMB) return;
            if (!this.isDragging) return;
            const rot = this.cube.cubeGroup.rotation
            rot.x = Math.round(rot.x / (Math.PI / 2)) * (Math.PI / 2)
            rot.y = Math.round(rot.y / (Math.PI / 2)) * (Math.PI / 2)
            rot.z = Math.round(rot.z / (Math.PI / 2)) * (Math.PI / 2)
            // if(Math.cos(this.cube.cubeGroup.rotation.x) > 0.5)
            //     this.cube.cubeGroup.rotation.x = 0
            // else if(Math.cos(this.cube.cubeGroup.rotation.x) < 0.5)
            this.rotationAxis = (0, 0, 0)
            this.dragMode = null
            this.isDragging = false

            // Direction: which way did the drag go?
            // dx/dy sign maps to rotation direction — may need flipping per face once you test it
            if (!this.axisLocked) return
        })
    }
}

