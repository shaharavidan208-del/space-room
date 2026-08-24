import * as THREE from 'three'
import gsap from 'gsap'

/**
 * Presents the terminal's existing HTMLCanvasElement as a fullscreen DOM
 * interface while keeping that same canvas available to THREE.CanvasTexture.
 *
 * Required HTML:
 * - #terminal-fullscreen
 * - #terminal-fullscreen-surface
 *
 * Required CSS states:
 * - .is-visible
 * - .is-expanded
 * - .is-interactive
 */
export default class TerminalFullscreen {
    /**
     * @param {Object} options
     * @param {HTMLCanvasElement} options.terminalCanvas The canvas on which the
     * terminal UI is drawn. The same element is used both as the source of the
     * Three.js CanvasTexture and as the directly displayed fullscreen DOM canvas.
     * @param {THREE.Mesh} options.terminalScreenMesh The 3D monitor mesh used to
     * determine where the terminal currently appears in browser pixels.
     * @param {THREE.Camera} options.camera The active Three.js camera used when
     * projecting the monitor mesh from 3D space into screen space.
     * @param {THREE.WebGLRenderer} options.renderer The renderer whose canvas
     * rectangle defines the screen area into which the 3D scene is rendered.
     * @param {number} [options.cameraPushDistance=0.12] Distance the camera moves
     * forward while the DOM terminal expands.
     * @param {Function|null} [options.onStateChange=null] Optional callback fired
     * after fullscreen has completely opened or closed.
     */
    constructor({
        terminalCanvas,
        terminalScreenMesh,
        camera,
        renderer,
        cameraPushDistance = 0.12,
        onStateChange = null
    }) {
        // References shared with the normal 3D terminal presentation.
        this.terminalCanvas = terminalCanvas
        this.terminalScreenMesh = terminalScreenMesh
        this.camera = camera
        this.renderer = renderer

        // Fullscreen-specific configuration and external state notification.
        this.cameraPushDistance = cameraPushDistance
        this.onStateChange = onStateChange

        /**
         * The overlay represents the entire fullscreen layer. It stays aligned with the viewport and manages the overall state
         * So it controls things like:
        * Whether fullscreen mode is visible.
        * Whether the user can interact with it.
        * Whether it is currently expanded.
        * Accessibility state through aria-hidden.
        * The fullscreen coordinate area used for calculations.
         */
        this.overlay = document.querySelector('#terminal-fullscreen')

        /**
         * the physical terminal display being animated inside that frame. The canvas is what the surface displays.
         */
        this.surface = document.querySelector('#terminal-fullscreen-surface')

        if (!this.overlay || !this.surface) {
            throw new Error(
                'TerminalFullscreen requires #terminal-fullscreen and ' +
                '#terminal-fullscreen-surface in the HTML.'
            )
        }

        if (!(this.terminalCanvas instanceof HTMLCanvasElement)) {
            throw new Error(
                'TerminalFullscreen requires the terminal HTMLCanvasElement.'
            )
        }

        if (!this.terminalScreenMesh?.isMesh) {
            throw new Error(
                'TerminalFullscreen requires the mesh displaying the terminal texture.'
            )
        }

        this.opened = false // whetear or not fullscreen mode has fully opened
        this.transitioning = false // whetear or not an opening or closing animation is currently running
        // The main render loop can read this flag and stop updating/rendering the
        // 3D scene only after the HTML terminal has completely covered it.
        this.pauseScene = false

        // Reusable transition state. savedCameraPosition is also the destination
        // used when closing fullscreen mode.
        this.savedCameraPosition = new THREE.Vector3()
        this.cameraForward = new THREE.Vector3()
        this.cameraTween = null

        /**
         * Remember where the canvas originally lived so destroy() can restore it.
         * An unattached canvas simply has a null originalParent.
         */
        this.originalParent = this.terminalCanvas.parentNode
        this.originalNextSibling = this.terminalCanvas.nextSibling

        /**
         * Moving the canvas into the DOM does not disconnect it from CanvasTexture.
         * Its internal width/height also remain unchanged; CSS only controls how
         * large the same drawing buffer appears on screen.
         */
        this.surface.appendChild(this.terminalCanvas)
    }

    /** Whether fullscreen mode has completely finished opening. */
    get isOpen() {
        return this.opened
    }

    /** Whether an opening or closing sequence is currently running. */
    get isTransitioning() {
        return this.transitioning
    }

    /** Whether the owner of this class should pause the normal 3D scene. */
    get shouldPauseScene() {
        return this.pauseScene
    }


    /**
     * Opens or closes fullscreen mode according to its current completed state.
     * Awaiting open()/close() makes this method's Promise settle only after the
     * selected transition has finished.
     */
    async toggle() {
        // ignore inputs if in the middle of opening or closing animation
        if (this.transitioning) {
            return
        }

        if (this.opened) {
            await this.close()
            return
        }

        await this.open()
    }

    /**
     * Performs the complete opening handoff:
     * 1. Match the hidden DOM surface to the monitor's current browser rectangle.
     * 2. Reveal it and animate it to fullscreen while pushing the camera forward.
     * 3. Enable DOM interaction and expose the completed open state.
     */
    async open() {
        // if full screen already opened or we're in the middle of a transition, exit
        if (this.opened || this.transitioning) {
            return
        }

        this.transitioning = true

        try {
            // The DOM surface must initially cover the exact pixels occupied by
            // the 3D monitor so switching presentation methods does not visibly jump.
            const terminalRect = this.getProjectedTerminalRect()

            // Convert the monitor rectangle into CSS translation and scale values.
            this.setStartRect(terminalRect)

            // Reset the surface to its monitor-sized, non-interactive CSS state
            // before making the overlay visible.
            this.overlay.classList.remove(
                'is-expanded',
                'is-interactive'
            )

            // The user now sees the canvas directly through the DOM overlay rather
            // than only as a texture on the 3D monitor.
            this.overlay.classList.add('is-visible')
            this.overlay.setAttribute('aria-hidden', 'false')

            /**
             * Force the browser to commit the monitor-sized starting state before
             * .is-expanded changes the transform to fullscreen.
             */
            this.surface.getBoundingClientRect()

            // Start the GSAP camera movement. This returns a Promise representing
            // the eventual completion of that animation.
            const cameraAnimation = this.pushCameraForward()

            // Give the browser a frame in which to render the monitor-sized start
            // state before changing the CSS transform to its fullscreen end state.
            await this.nextAnimationFrame()

            // Register the transition listener before adding the class that starts
            // the transition, so a fast transition cannot finish unnoticed.
            const surfaceTransition = this.waitForSurfaceTransition()

            this.overlay.classList.add('is-expanded')

            // Continue only when both independent animations have completed.
            await Promise.all([
                surfaceTransition,
                cameraAnimation
            ])

            // Pointer interaction is enabled only after the moving surface has
            // reached its stable fullscreen position.
            this.overlay.classList.add('is-interactive')

            this.opened = true
            this.pauseScene = true

            // Inform the terminal/scene owner that the opening process is complete.
            this.notifyStateChange(true)
        }
        // executes regardless of try's outcome
        finally {
            this.transitioning = false
        }
    }

    /**
     * Reverses the fullscreen handoff. The 3D scene resumes first, the camera
     * returns to its saved focus position, and the DOM surface then collapses
     * into the newly measured monitor rectangle before being hidden.
     */
    async close() {
        if (!this.opened || this.transitioning) {
            return
        }

        this.transitioning = true
        // Resume the 3D scene while the DOM overlay still covers it, allowing the
        // monitor underneath to be current before the surface collapses into it.
        this.pauseScene = false

        try {
            // Prevent pointer input while the surface is moving away from fullscreen.
            this.overlay.classList.remove('is-interactive')

            /**
             * Restore the normal terminal-focus camera while the fullscreen canvas
             * still hides the 3D scene. This gives the closing transform an exact
             * monitor rectangle to collapse back into.
             */
            await this.restoreCameraPosition()

            // Measure again after restoring the camera because the monitor's
            // browser rectangle depends on the camera position.
            const terminalRect = this.getProjectedTerminalRect()

            this.setStartRect(terminalRect)

            // Prepare the completion listener before removing the class that
            // triggers the reverse CSS transform.
            const surfaceTransition = this.waitForSurfaceTransition()

            this.overlay.classList.remove('is-expanded')

            await surfaceTransition

            // Once the DOM canvas visually reaches the monitor, hide the overlay;
            // the user is left seeing the same canvas through the 3D texture again.
            this.overlay.classList.remove('is-visible')
            this.overlay.setAttribute('aria-hidden', 'true')

            this.opened = false

            this.notifyStateChange(false)
        }
        finally {
            this.transitioning = false
        }
    }

    /**
     * Converts a DOM pointer event into the same internal pixel coordinates used
     * by the terminal canvas. Normal 3D focus mode can keep using monitor raycast
     * UVs; only the fullscreen DOM presentation uses this direct conversion.
     */
    getCanvasCoordinates(event) {
        // This rectangle describes the canvas's displayed CSS size and position,
        // which can differ from its internal drawing-buffer width and height.
        const rect = this.terminalCanvas.getBoundingClientRect()

        if (rect.width === 0 || rect.height === 0) {
            return null
        }

        return {
            // Convert browser CSS pixels into the canvas's internal pixel space.
            x:
                (event.clientX - rect.left) *
                (this.terminalCanvas.width / rect.width),

            y:
                (event.clientY - rect.top) *
                (this.terminalCanvas.height / rect.height)
        }
    }

    /**
     * Calculates the axis-aligned browser-pixel rectangle currently occupied by
     * the 3D terminal screen mesh.
     *
     * Coordinate conversion performed for each bounding-box corner:
     * geometry local space -> world space -> camera/NDC space -> browser pixels.
     *
     * @returns {{left: number, top: number, width: number, height: number}}
     */
    getProjectedTerminalRect() {
        const mesh = this.terminalScreenMesh
        const geometry = mesh.geometry

        // computeBoundingBox() finds the geometry vertices' minimum and maximum
        // local X/Y/Z values. It measures the geometry, not the canvas texture.
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox()
        }

        /**
         * ensures the mesh contains the current final world transformations
         * true - update its parents too
         * false - dont bother updating its children
         */
        mesh.updateWorldMatrix(true, false) 
        
        const min = geometry.boundingBox.min
        const max = geometry.boundingBox.max


        // these are the 8 corners of the invisible box surrounding the geometry
        const corners = [
            new THREE.Vector3(min.x, min.y, min.z),
            new THREE.Vector3(max.x, min.y, min.z),
            new THREE.Vector3(min.x, max.y, min.z),
            new THREE.Vector3(max.x, max.y, min.z),
            new THREE.Vector3(min.x, min.y, max.z),
            new THREE.Vector3(max.x, min.y, max.z),
            new THREE.Vector3(min.x, max.y, max.z),
            new THREE.Vector3(max.x, max.y, max.z)
        ]

        const rendererRect =
            this.renderer.domElement.getBoundingClientRect()

        // These values will shrink around all projected corners. Infinity ensures
        // the first real coordinate always becomes the initial boundary.
        let left = Infinity
        let right = -Infinity
        let top = Infinity
        let bottom = -Infinity

        for (const corner of corners) {
            // Convert from geometry-local coordinates into final world coordinates,
            // including the mesh and all of its parent transformations.
            corner.applyMatrix4(mesh.matrixWorld)

            // Convert world coordinates into normalized device coordinates (NDC),
            // where visible X and Y normally range from -1 to +1.
            corner.project(this.camera)

            // Remap NDC X from [-1, +1] to [0, renderer width], then offset it
            // by the renderer canvas's position within the browser viewport.
            const screenX =
                rendererRect.left +
                (corner.x * 0.5 + 0.5) * rendererRect.width

            // NDC Y points upward, while browser Y points downward. Negating Y
            // flips that direction before converting it to browser pixels.
            const screenY =
                rendererRect.top +
                (-corner.y * 0.5 + 0.5) * rendererRect.height

            // Expand the final 2D rectangle to contain this projected corner.
            left = Math.min(left, screenX)
            right = Math.max(right, screenX)
            top = Math.min(top, screenY)
            bottom = Math.max(bottom, screenY)
        }

        return {
            left,
            top,
            width: right - left,
            height: bottom - top
        }
    }

    /**
     * Converts the projected monitor rectangle into CSS custom properties used
     * by the surface's monitor-sized starting transform.
     *
     * The surface is laid out at its fullscreen size. Translation moves that
     * surface over the monitor, and scale makes its visible size match the monitor.
     */
    setStartRect(terminalRect) {
        // The overlay is the surface's fullscreen coordinate frame. Subtracting
        // its origin also works when the overlay does not begin at viewport (0, 0).
        const overlayRect = this.overlay.getBoundingClientRect()

        const startX = terminalRect.left - overlayRect.left
        const startY = terminalRect.top - overlayRect.top

        // Example: a 600px monitor inside a 1920px overlay needs scaleX = 0.3125.
        const scaleX = terminalRect.width / overlayRect.width
        const scaleY = terminalRect.height / overlayRect.height

        // The properties are set on the overlay and inherited/consumed by the
        // surface's CSS transform rules.
        this.overlay.style.setProperty(
            '--terminal-start-x',
            `${startX}px`
        )

        this.overlay.style.setProperty(
            '--terminal-start-y',
            `${startY}px`
        )

        // Avoid an exact zero scale if layout briefly reports a zero-sized monitor.
        this.overlay.style.setProperty(
            '--terminal-start-scale-x',
            Math.max(scaleX, 0.001)
        )

        this.overlay.style.setProperty(
            '--terminal-start-scale-y',
            Math.max(scaleY, 0.001)
        )
    }

    /**
     * Saves the current camera position and animates a short movement along the
     * camera's current forward direction. Returns the animation Promise.
     */
    pushCameraForward() {
        // copy() preserves a snapshot for close(); assigning camera.position would
        // only preserve another reference to the same mutable Vector3.
        this.savedCameraPosition.copy(this.camera.position)

        this.camera.getWorldDirection(this.cameraForward)

        // clone() ensures calculating the destination does not move the camera yet.
        const destination = this.camera.position
            .clone()
            .addScaledVector(
                this.cameraForward,
                this.cameraPushDistance
            )

        return this.animateCameraPosition(destination, 0.52)
    }

    /** Animates the camera back to the position captured by pushCameraForward(). */
    restoreCameraPosition() {
        return this.animateCameraPosition(
            this.savedCameraPosition,
            0.4
        )
    }

    /**
     * Animates camera.position and returns a Promise that resolves when GSAP calls
     * onComplete. This Promise is what allows open()/close() to await the tween.
     */
    animateCameraPosition(destination, duration) {
        // Respect the OS/browser accessibility preference by applying the final
        // state immediately while still returning an already-resolved Promise.
        if (this.prefersReducedMotion()) {
            this.camera.position.copy(destination)
            return Promise.resolve()
        }

        // Only one camera tween owned by this class should modify the camera.
        if (this.cameraTween) {
            this.cameraTween.kill()
        }

        return new Promise((resolve) => {
            this.cameraTween = gsap.to(this.camera.position, {
                x: destination.x,
                y: destination.y,
                z: destination.z,
                duration,
                ease: 'power3.inOut',
                onComplete: () => {
                    this.cameraTween = null
                    resolve()
                }
            })
        })
    }

    /**
     * Returns a Promise that resolves when the surface's CSS transform transition
     * ends. A timeout provides a fallback for browsers that omit transitionend.
     */
    waitForSurfaceTransition() {
        if (this.prefersReducedMotion()) {
            return Promise.resolve()
        }

        // parseFloat extracts the numeric millisecond value used by the CSS. The
        // fallback keeps the safety timeout useful if the property is unavailable.
        const durationText = getComputedStyle(this.overlay)
            .getPropertyValue('--terminal-transition-duration')

        const duration = parseFloat(durationText) || 520

        return new Promise((resolve) => {
            // transitionend and the fallback timeout can both call finish(); this
            // flag guarantees cleanup and Promise resolution happen only once.
            let completed = false

            const finish = () => {
                if (completed) {
                    return
                }

                completed = true

                this.surface.removeEventListener(
                    'transitionend',
                    handleTransitionEnd
                )

                resolve()
            }

            const handleTransitionEnd = (event) => {
                // Ignore transitions from descendants and unrelated CSS properties.
                if (
                    event.target === this.surface &&
                    event.propertyName === 'transform'
                ) {
                    finish()
                }
            }

            this.surface.addEventListener(
                'transitionend',
                handleTransitionEnd
            )

            /**
             * Some mobile browsers can omit transitionend when the viewport
             * changes during the animation.
             */
            window.setTimeout(finish, duration + 130)
        })
    }

    /**
     * Returns a Promise resolved by the browser immediately before its next paint.
     * This creates a frame boundary between the start and end CSS states.
     */
    nextAnimationFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(resolve)
        })
    }

    /** Returns the user's operating-system/browser reduced-motion preference. */
    prefersReducedMotion() {
        return window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches
    }

    /** Calls the optional external state callback after a completed transition. */
    notifyStateChange(isOpen) {
        if (this.onStateChange) {
            this.onStateChange(isOpen)
        }
    }

    /**
     * Cancels owned animation state, resets the overlay, and returns the terminal
     * canvas to the exact DOM location it occupied before this class was created.
     */
    destroy() {
        if (this.cameraTween) {
            this.cameraTween.kill()
            this.cameraTween = null
        }

        this.overlay.classList.remove(
            'is-visible',
            'is-expanded',
            'is-interactive'
        )

        this.overlay.setAttribute('aria-hidden', 'true')

        if (this.originalParent) {
            // insertBefore(originalNextSibling) restores the original ordering,
            // instead of merely appending the canvas to the old parent.
            this.originalParent.insertBefore(
                this.terminalCanvas,
                this.originalNextSibling
            )
        }
        else {
            this.terminalCanvas.remove()
        }

        this.opened = false
        this.transitioning = false
        this.pauseScene = false
    }
}
