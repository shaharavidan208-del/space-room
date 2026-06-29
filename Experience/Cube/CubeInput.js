import * as THREE from 'three'
import gsap from 'gsap';
export default class CubeInput {

    onEmptyDown() {
        this.isDragging = true
        this.dragMode = "cube"
        this.axisLocked = false
        if (this.mouse.x >= 0) {
            this.cube.zArrowHelperFront.visible = true
            this.cube.zArrowHelperBack.visible = true
        }
        else {
            this.cube.xArrowHelperFront.visible = true
            this.cube.xArrowHelperBack.visible = true
        }
    }

    onCubeDown() {
        this.dragMode = "layer"
    }

    onDragEnd() {
        const isLMB = this.button === 0;

        // Snap whole-cube rotations to the nearest 90 degrees (Pi/2)
        if (this.dragMode === 'cube') {
            this.cube.rotator.isAnimating = true
            const rot = this.cube.cubeGroup.rotation
            // Calculate the perfect grid targets for ALL THREE axes
            const targetX = Math.round(rot.x / (Math.PI / 2)) * (Math.PI / 2);
            const targetY = Math.round(rot.y / (Math.PI / 2)) * (Math.PI / 2);
            const targetZ = Math.round(rot.z / (Math.PI / 2)) * (Math.PI / 2);
            gsap.to(this.cube.cubeGroup.rotation, { // The very first thing you hand to gsap.to() is the specific object you want it to manipulate.
                x: targetX,
                y: targetY,
                z: targetZ,
                duration: 0.28, // 280 ms
                ease: "power2.out", // ease out curve built by GSAP
                onComplete: () => {
                    rot.x = Math.round(rot.x / (Math.PI / 2)) * (Math.PI / 2)
                    rot.y = Math.round(rot.y / (Math.PI / 2)) * (Math.PI / 2)
                    rot.z = Math.round(rot.z / (Math.PI / 2)) * (Math.PI / 2)
                    this.cube.rotator.isAnimating = false
                }
            })
        }
        else if (this.dragMode === 'layer' && this.axisLocked) {
            this.cube.rotator.endRotation()
        }

        this.activePointerId = null
        this.isPointerActive = false
        this.dragMode = ''
        this.isDragging = false

        // TODO: Future snapping logic
        // if(Math.cos(this.cube.cubeGroup.rotation.x) > 0.5)
        //     this.cube.cubeGroup.rotation.x = 0
        // else if(Math.cos(this.cube.cubeGroup.rotation.x) < 0.5)
    }

    constructor(cube, renderer, experience) {

        // --- Core Dependencies ---
        this.cube = cube
        this.renderer = renderer
        this.experience = experience

        // --- Constants & Raycasting ---
        const xVector = new THREE.Vector3(1, 0, 0)
        const yVector = new THREE.Vector3(0, 1, 0)
        const zVector = new THREE.Vector3(0, 0, 1)
        const axes = ['x', 'y', 'z'];
        this.raycaster = new THREE.Raycaster() // Projects a 3D ray starting at the camera and passing through that 2D pixel into the 3D scene.
        this.mouse = new THREE.Vector2()

        // --- Drag State Trackers ---
        this.isDragging = false
        this.dragMode = "" // Tracks whether current drag is "layer" or "cube"
        this.axisLocked = false // Locks the axis once rotation intent is determined
        this.activePointerId = null;
        this.isPointerActive = false;

        // --- Interaction Data ---
        this.hitCubie = null
        this.hitStickerNormal = null
        this.hitLocalNormal = null
        this.layerIndex = -2
        this.direction = -2
        this.rotationAxis = ''
        this.flipAxis = null
        this.dxLarger = null
        this.sensitivity = 0.008

        // --- 2D Screen Coordinates ---
        this.startX = 0
        this.startY = 0
        this.prevX = 0
        this.prevY = 0
        this.dx = 0
        this.dy = 0

        // --- 3D Spatial Coordinates ---
        this.dragPlane = new THREE.Plane()
        this.currentDragWorld = new THREE.Vector3()
        this.startDragWorld = null
        this.startDragLocal = null
        this.prevDragLocal = null
        this.currentDragLocal = null
        this.dragDelta = null



        // ==========================================
        // EVENT: POINTER DOWN
        // Fires when any mouse button is pressed or screen is touched
        // ==========================================
        renderer.domElement.addEventListener('pointerdown', (input) => {

            const isLMB = input.button === 0; // Works for touch too!
            if (this.isDragging || !isLMB || !this.experience.isFocused || this.cube.rotator.isAnimating || this.experience.currPointName !== "RubiksCube") return;

            if (this.isPointerActive === true) {
                return;
            }



            // From this point onward, this pointer is accepted.
            // Now it is safe to reset interaction state.
            this.rotationAxis = '';
            this.axisLocked = false;

            this.isPointerActive = true;
            this.activePointerId = input.pointerId;

            this.dx = input.clientX - this.prevX;
            this.dy = input.clientY - this.prevY;

            // 1. Get the exact boundaries of the canvas on the screen
            const rect = renderer.domElement.getBoundingClientRect();

            // 2. Calculate the exact pixel coordinates inside the canvas
            const canvasX = input.clientX - rect.left;
            const canvasY = input.clientY - rect.top;

            // Keeping prevX/Y as raw clientX/Y is perfect for drag deltas
            this.prevX = input.clientX;
            this.prevY = input.clientY;
            this.isDragging = true;
            renderer.domElement.setPointerCapture(input.pointerId);

            // 3. Calculate NDC (Normalized Device Coordinates) relative to the canvas, not the window
            this.mouse.x = (canvasX / rect.width) * 2 - 1;
            this.mouse.y = -(canvasY / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.experience.camera);
            this.startX = input.clientX;
            this.startY = input.clientY;

            const stickerHits = this.raycaster.intersectObjects(this.cube.stickerArr);
            this.axisLocked = false;

            if (stickerHits.length > 0) {
                // We clicked a sticker — initialize layer rotation
                this.hitCubie = stickerHits[0].object.parent;
                // Clone normal to avoid aliasing, then translate it from Local to World space
                this.hitStickerNormal = stickerHits[0].face.normal.clone()
                    .transformDirection(stickerHits[0].object.matrixWorld) 
                    .round(); // round to nearest integer to avoid floating point errors. we do this because we want to know which face of the cube was clicked, not the exact world direction.

                /* Snap the virtual graph paper onto the sticker:
                   - Normal: Tilts the infinite sheet so it faces this exact direction.
                   - Coplanar Point: Slides the infinite sheet until it slices through the 3D click coordinate. */
                this.dragPlane.setFromNormalAndCoplanarPoint(this.hitStickerNormal, stickerHits[0].point);

                this.startDragWorld = stickerHits[0].point.clone()
                this.startDragLocal = this.cube.cubeGroup.worldToLocal(this.startDragWorld); // Saved for pointermove
                this.prevDragLocal = this.startDragLocal.clone()

                // ------------------------------------------
                // THE UNTWIST (World Normal -> Local Normal)
                // ------------------------------------------
                // The raycaster gives us the World Normal (where the sticker points in the room).
                // If the user rotated the entire puzzle, this direction is skewed and breaks layer math.
                // By applying the *inverse* of the cube's rotation, we mathematically "untwist" the room.
                // This forces the sticker to remember its true identity (e.g., White is always Top), 
                // completely ignoring how the user tumbled the camera or the puzzle!
                const inverseCubeRotation = this.cube.cubeGroup.quaternion.clone().invert();
                this.hitLocalNormal = this.hitStickerNormal.clone().applyQuaternion(inverseCubeRotation).round(); // We apply inverse quaternion to world normal to get local normal, then round to nearest integer to avoid floating point errors. we do this because we want to know which face of the cube was clicked, not the exact world direction.
                this.axisLocked = false
                this.onCubeDown();
                return;

            } else if (this.dragMode !== "layer" && stickerHits.length === 0) {
                // Clicked empty space — initialize whole cube rotation
                this.dragMode = "cube"
                this.onEmptyDown();
                return;
            }
        });



        // ==========================================
        // EVENT: POINTER MOVE
        // Fires on every mouse movement while dragging
        // ==========================================
        renderer.domElement.addEventListener('pointermove', (input) => {
            if (!this.experience.isFocused) return;
            if (!this.isDragging) return;
            if (this.cube.rotator.isAnimating) return;
            if (this.isPointerActive === false) {
                return;
            }

            if (input.pointerId !== this.activePointerId) {
                return;
            }
            this.dx = input.clientX - this.prevX
            this.dy = input.clientY - this.prevY

            // Calculate total distance from initial click for intent detection
            const totalDx = input.clientX - this.startX;
            const totalDy = input.clientY - this.startY;

            // ------------------------------------------
            // TRACK 1: WHOLE CUBE ROTATION
            // ------------------------------------------
            if (this.dragMode === "cube") {
                // GATE 1: Lock the primary drag axis (Horizontal vs Vertical) based on initial intent
                if (!this.axisLocked && (Math.abs(totalDx) > 8 || Math.abs(totalDy) > 8)) {
                    this.dxLarger = Math.abs(totalDx) > Math.abs(totalDy);
                    if (this.dxLarger) {
                        this.rotationAxis = 'y'
                    }
                    else if (this.mouse.x >= 0)
                        this.rotationAxis = 'x'
                    else
                        this.rotationAxis = 'z'
                    this.axisLocked = true;
                }

                // GATE 2: Spin the entire cube group
                if (this.axisLocked) {
                    if (this.dxLarger) {
                        // Dragging Left/Right -> Spin around the World Y-Axis (Up/Down)
                        this.flipAxis = yVector;
                        this.cube.cubeGroup.rotateOnWorldAxis(this.flipAxis, this.dx * this.sensitivity);
                    } else if (this.rotationAxis === 'x') {
                        // Dragging Up/Down -> Spin around the World X-Axis (Left/Right)
                        this.flipAxis = xVector;
                        this.cube.zArrowHelperFront.visible = true
                        this.cube.zArrowHelperBack.visible = true
                        this.cube.cubeGroup.rotateOnWorldAxis(this.flipAxis, this.dy * this.sensitivity);
                    }
                    else {
                        this.flipAxis = zVector;
                        this.cube.xArrowHelperFront.visible = true
                        this.cube.xArrowHelperBack.visible = true
                        this.cube.cubeGroup.rotateOnWorldAxis(this.flipAxis, this.dy * this.sensitivity);
                    }
                }
            }

            // Update NDC and Raycaster for 3D logic
            const rect = renderer.domElement.getBoundingClientRect(); // Get the exact boundaries of the canvas on the screen
            const canvasX = input.clientX - rect.left;
            const canvasY = input.clientY - rect.top;
            this.mouse.x = (canvasX / rect.width) * 2 - 1;
            this.mouse.y = -(canvasY / rect.height) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.experience.camera); // Update the raycaster to point through the new mouse position

            // ------------------------------------------
            // TRACK 2: LAYER ROTATION (2D/3D HYBRID)
            // ------------------------------------------
            if (this.dragMode !== "cube") {
                // Shoot the laser at the drag plane so we can find the exact 3D point under the mouse cursor
                const planeHit = this.raycaster.ray.intersectPlane(this.dragPlane, this.currentDragWorld);
                // The Safe Guard: Bail out if ray is perfectly parallel to plane (prevents stale data loops)
                if (!planeHit) return; 
                /**
                 * transform world coordinates into local coordinates relative to the cube group. 
                 * This is necessary because the cube can be rotated in 3D space, and we want to measure the drag distance in the cube's local space, 
                 * not the world space.
                 * if we didn't do this, the drag distance would be skewed by the cube's rotation, and the layer rotation would be at affected by the camera, which means different rotations at different camera angles, which is not what we want.
                 */
                this.currentDragLocal = this.cube.cubeGroup.worldToLocal(this.currentDragWorld);

                // Calculate the exact X, Y, and Z distances the mouse moved in Local Space
                this.dragDelta = this.currentDragLocal.clone().sub(this.startDragLocal)
                const dragDistance = this.dragDelta.length();

                /* The Cross Product: 
                   1. .clone(): Create detached copy of normal to avoid mutating geometry.
                   2. .cross(): Multiply normal and drag arrows using matrix math.
                   3. Result: A Vector3 pointing perpendicular to both, containing the exact 
                      drag distance inside one of its axes (x, y, or z). */
                const rotationVector = this.hitLocalNormal.clone().cross(this.dragDelta);
                // Phase 1: Determine Rotation Intent (Which layer are we spinning?)
                if (!this.axisLocked && dragDistance > 0.03) {
                    this.dragMode = "layer"
                    this.axisLocked = true

                    // The Tournament: Compare absolute values inside rotationVector to find the dominant axis
                    this.rotationAxis = axes.reduce((champion, challenger) => {
                        return Math.abs(rotationVector[champion]) > Math.abs(rotationVector[challenger]) ? champion : challenger; 
                    });

                    this.direction = Math.sign(rotationVector[this.rotationAxis]); // using the rotation axis that we determined, check if the direction is positive or negative
                    this.layerIndex = Math.round(this.hitCubie.position[this.rotationAxis] / this.cube.pieceSize)

                    this.cube.rotator.beginRotation(this.rotationAxis, this.layerIndex, this.direction)
                }

                // Phase 2: Execute Hybrid Rotation
                if (this.axisLocked) {
                    const lastFrameDelta = this.currentDragLocal.clone().sub(this.prevDragLocal);
                    /**
                     * framerotationVector is the cross product of the hitLocalNormal and the lastFrameDelta, which gives us a vector that represents the rotation direction and magnitude for this frame.
                     * This is an array of 3 numbers, where the index of the largest absolute value corresponds to the axis of rotation (x, y, or z), and the sign of that value corresponds to the direction of rotation (positive or negative). (eg: [0, 1, 0] means rotation around the y-axis in the positive direction) 
                     */
                    const frameRotationVector = this.hitLocalNormal.clone().cross(lastFrameDelta);

                    // Hybrid Architecture: Decouple physical feel from 3D distortion
                    // 1. SPEED: Use physical 2D screen distance (eliminates horizon distortion)
                    const screenDistance = Math.sqrt(this.dx * this.dx + this.dy * this.dy); // we use square root of sum of squares to get the Euclidean distance (Pythagorean theorem) of the mouse movement in pixels

                    // 2. DIRECTION: Use 3D cross product exclusively for logic sign (1 or -1)
                    const frameSign = Math.sign(frameRotationVector[this.rotationAxis]); // Math.sign() returns 1 for positive numbers, -1 for negative numbers, and 0 for zero. This gives us the direction of rotation based on the cross product.

                    // 3. SYNTHESIS: Speed driven by 2D, Direction driven by 3D
                    const rotationAmount = screenDistance * frameSign * 0.010;

                    this.cube.rotator.updateRotation(this.rotationAxis, rotationAmount);
                }
            }





            // ------------------------------------------
            // MANDATORY TRACKERS
            // (Must run at bottom of frame to prep for next tick)
            // ------------------------------------------
            if (this.dragMode !== "cube")
                this.prevDragLocal = this.currentDragLocal.clone();
            this.prevX = input.clientX;
            this.prevY = input.clientY;
        })
        // Actively kill native multi-touch gestures before the OS can hijack the pointer
        renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        // ==========================================
        // EVENT: POINTER UP & CANCEL
        // ==========================================
        renderer.domElement.addEventListener('pointerup', (input) => {
            this.cube.zArrowHelperFront.visible = false
            this.cube.zArrowHelperBack.visible = false
            this.cube.xArrowHelperFront.visible = false
            this.cube.xArrowHelperBack.visible = false
            if (this.isPointerActive === false) {
                return;
            }
            if (input.pointerId !== this.activePointerId) {
                return;
            }
            if (input.target.hasPointerCapture(input.pointerId)) {
                input.target.releasePointerCapture(input.pointerId);
            }
            if (!this.experience.isFocused) return;
            this.onDragEnd()
            if (!this.isDragging) return;
            if (!this.axisLocked) return;
        })

        renderer.domElement.addEventListener('pointercancel', (input) => {
            this.cube.zArrowHelperFront.visible = false
            this.cube.zArrowHelperBack.visible = false
            this.cube.xArrowHelperFront.visible = false
            this.cube.xArrowHelperBack.visible = false
            if (this.isPointerActive === false) {
                return;
            }

            if (input.pointerId !== this.activePointerId) {
                return;
            }
            if (input.target.hasPointerCapture(input.pointerId)) {
                input.target.releasePointerCapture(input.pointerId);
            }
            this.onDragEnd()
            this.dragMode = null
            this.isDragging = false
        })
    }
}