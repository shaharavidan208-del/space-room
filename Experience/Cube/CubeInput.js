import * as THREE from 'three'
export default class CubeInput {

    onEmptyDown() {
        console.log("entered")
        this.isDragging = true
        this.dragMode = "cube"

    }

    constructor(cube, renderer, experience) {
        this.cube = cube
        this.renderer = renderer
        this.experience = experience
        this.isDragging = false
        this.raycaster = new THREE.Raycaster() // Projects a 3D ray starting at the camera and passing through that 2D pixel into the 3D scene.
        this.mouse = new THREE.Vector2()
        this.hitCubie = null
        this.startX = 0
        this.startY = 0
        this.dxLarger = null
        this.axisLocked = false
        this.rotationAxis = ''
        this.layerIndex = -2
        this.direction = -2
        this.dragMode = null // tracks whether current drag is layer or cube rotation
        this.sensitivity = 0.005
        this.dx = 0
        this.dy = 0
        this.currRotationX = this.cube.cubeGroup.rotation.y
        this.currRotationY = 0

        // pointerdown fires when any mouse button is pressed
        renderer.domElement.addEventListener('pointerdown', (input) => {
            // const isTouch = input.pointerType === 'touch'; // touch later 
            const isLMB = input.button === 0; // boolean 
            if (!isLMB) return;
            if (!this.experience.isFocused) return;
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
            // console.log(this.hitFace)
            // console.log(this.hitCubie)
            this.axisLocked = false
        });

        // fires on every mouse movement. The gate (if (!isDragging) return) immediately exits if RMB isn't held
        renderer.domElement.addEventListener('pointermove', (input) => {
            if (!this.experience.isFocused) return;
            if (!this.isDragging) return;
            this.dx = input.clientX - this.startX
            this.dy = input.clientY - this.startY
            if (this.dragMode === "cube") // cube drag mode
            {
                if (Math.abs(this.dx) > 8 || Math.abs(this.dy) > 8) {
                    this.dxLarger = (Math.abs(this.dx) > Math.abs(this.dy))
                    if (this.dxLarger && this.rotationAxis !== "y") {
                        this.rotationAxis = "x"
                        this.cube.cubeGroup.rotation.y = this.dx * this.sensitivity + this.currRotationX
                        const targetQuaternion = new THREE.Quaternion();
                    }

                    // else if(this.rotationAxis !== "x") {
                    //     this.rotationAxis = "y"
                    //     this.cube.cubeGroup.rotation.x = this.dy * this.sensitivity + this.currRotationY
                    //     const targetQuaternion = new THREE.Quaternion();
                    // }
                }
            }
        })

        renderer.domElement.addEventListener('pointerup', (input) => {
            // console.log('pointerup fired', this.isDragging, this.axisLocked)
            const isLMB = input.button === 0;
            if (!isLMB) return;
            if (!this.isDragging) return;
            this.cube.cubeGroup.rotation.y = Math.round(this.cube.cubeGroup.rotation.y / (Math.PI / 4)) * (Math.PI / 4)
            this.cube.cubeGroup.rotation.x = Math.round(this.cube.cubeGroup.rotation.x / (Math.PI / 4)) * (Math.PI / 4)
            // if(Math.cos(this.cube.cubeGroup.rotation.x) > 0.5)
            //     this.cube.cubeGroup.rotation.x = 0
            // else if(Math.cos(this.cube.cubeGroup.rotation.x) < 0.5)
            this.currRotationX = this.cube.cubeGroup.rotation.y
            this.currRotationY = this.cube.cubeGroup.rotation.x
            console.log(this.currRotationX)
            this.rotationAxis = ''
            this.dragMode = null
            this.isDragging = false

            // Direction: which way did the drag go?
            // dx/dy sign maps to rotation direction — may need flipping per face once you test it
            if (!this.axisLocked) return
            this.cube.rotator.rotateLayer(this.rotationAxis, this.layerIndex, this.direction)
        })
    }
}

