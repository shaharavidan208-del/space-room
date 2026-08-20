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
    constructor({
        terminalCanvas,
        terminalScreenMesh,
        camera,
        renderer,
        cameraPushDistance = 0.12,
        onStateChange = null
    }) {
        this.terminalCanvas = terminalCanvas
        this.terminalScreenMesh = terminalScreenMesh
        this.camera = camera
        this.renderer = renderer
        this.cameraPushDistance = cameraPushDistance
        this.onStateChange = onStateChange

        this.overlay = document.querySelector('#terminal-fullscreen')
        this.surface = document.querySelector('#terminal-fullscreen-surface')

        if(!this.overlay || !this.surface) {
            throw new Error(
                'TerminalFullscreen requires #terminal-fullscreen and ' +
                '#terminal-fullscreen-surface in the HTML.'
            )
        }

        if(!(this.terminalCanvas instanceof HTMLCanvasElement)) {
            throw new Error(
                'TerminalFullscreen requires the terminal HTMLCanvasElement.'
            )
        }

        if(!this.terminalScreenMesh?.isMesh) {
            throw new Error(
                'TerminalFullscreen requires the mesh displaying the terminal texture.'
            )
        }

        this.opened = false
        this.transitioning = false
        this.pauseScene = false

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

    get isOpen() {
        return this.opened
    }

    get isTransitioning() {
        return this.transitioning
    }

    get shouldPauseScene() {
        return this.pauseScene
    }

    async toggle() {
        if(this.transitioning) {
            return
        }

        if(this.opened) {
            await this.close()
            return
        }

        await this.open()
    }

    async open() {
        if(this.opened || this.transitioning) {
            return
        }

        this.transitioning = true

        try {
            const terminalRect = this.getProjectedTerminalRect()

            this.setStartRect(terminalRect)

            this.overlay.classList.remove(
                'is-expanded',
                'is-interactive'
            )

            this.overlay.classList.add('is-visible')
            this.overlay.setAttribute('aria-hidden', 'false')

            /**
             * Force the browser to commit the monitor-sized starting state before
             * .is-expanded changes the transform to fullscreen.
             */
            this.surface.getBoundingClientRect()

            const cameraAnimation = this.pushCameraForward()

            await this.nextAnimationFrame()

            const surfaceTransition = this.waitForSurfaceTransition()

            this.overlay.classList.add('is-expanded')

            await Promise.all([
                surfaceTransition,
                cameraAnimation
            ])

            this.overlay.classList.add('is-interactive')

            this.opened = true
            this.pauseScene = true

            this.notifyStateChange(true)
        }
        finally {
            this.transitioning = false
        }
    }

    async close() {
        if(!this.opened || this.transitioning) {
            return
        }

        this.transitioning = true
        this.pauseScene = false

        try {
            this.overlay.classList.remove('is-interactive')

            /**
             * Restore the normal terminal-focus camera while the fullscreen canvas
             * still hides the 3D scene. This gives the closing transform an exact
             * monitor rectangle to collapse back into.
             */
            await this.restoreCameraPosition()

            const terminalRect = this.getProjectedTerminalRect()

            this.setStartRect(terminalRect)

            const surfaceTransition = this.waitForSurfaceTransition()

            this.overlay.classList.remove('is-expanded')

            await surfaceTransition

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
        const rect = this.terminalCanvas.getBoundingClientRect()

        if(rect.width === 0 || rect.height === 0) {
            return null
        }

        return {
            x:
                (event.clientX - rect.left) *
                (this.terminalCanvas.width / rect.width),

            y:
                (event.clientY - rect.top) *
                (this.terminalCanvas.height / rect.height)
        }
    }

    getProjectedTerminalRect() {
        const mesh = this.terminalScreenMesh
        const geometry = mesh.geometry

        if(!geometry.boundingBox) {
            geometry.computeBoundingBox()
        }

        mesh.updateWorldMatrix(true, false)

        const min = geometry.boundingBox.min
        const max = geometry.boundingBox.max

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

        let left = Infinity
        let right = -Infinity
        let top = Infinity
        let bottom = -Infinity

        for(const corner of corners) {
            corner.applyMatrix4(mesh.matrixWorld)
            corner.project(this.camera)

            const screenX =
                rendererRect.left +
                (corner.x * 0.5 + 0.5) * rendererRect.width

            const screenY =
                rendererRect.top +
                (-corner.y * 0.5 + 0.5) * rendererRect.height

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

    setStartRect(terminalRect) {
        const overlayRect = this.overlay.getBoundingClientRect()

        const startX = terminalRect.left - overlayRect.left
        const startY = terminalRect.top - overlayRect.top

        const scaleX = terminalRect.width / overlayRect.width
        const scaleY = terminalRect.height / overlayRect.height

        this.overlay.style.setProperty(
            '--terminal-start-x',
            `${startX}px`
        )

        this.overlay.style.setProperty(
            '--terminal-start-y',
            `${startY}px`
        )

        this.overlay.style.setProperty(
            '--terminal-start-scale-x',
            Math.max(scaleX, 0.001)
        )

        this.overlay.style.setProperty(
            '--terminal-start-scale-y',
            Math.max(scaleY, 0.001)
        )
    }

    pushCameraForward() {
        this.savedCameraPosition.copy(this.camera.position)

        this.camera.getWorldDirection(this.cameraForward)

        const destination = this.camera.position
            .clone()
            .addScaledVector(
                this.cameraForward,
                this.cameraPushDistance
            )

        return this.animateCameraPosition(destination, 0.52)
    }

    restoreCameraPosition() {
        return this.animateCameraPosition(
            this.savedCameraPosition,
            0.4
        )
    }

    animateCameraPosition(destination, duration) {
        if(this.prefersReducedMotion()) {
            this.camera.position.copy(destination)
            return Promise.resolve()
        }

        if(this.cameraTween) {
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

    waitForSurfaceTransition() {
        if(this.prefersReducedMotion()) {
            return Promise.resolve()
        }

        const durationText = getComputedStyle(this.overlay)
            .getPropertyValue('--terminal-transition-duration')

        const duration = parseFloat(durationText) || 520

        return new Promise((resolve) => {
            let completed = false

            const finish = () => {
                if(completed) {
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
                if(
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

    nextAnimationFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(resolve)
        })
    }

    prefersReducedMotion() {
        return window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches
    }

    notifyStateChange(isOpen) {
        if(this.onStateChange) {
            this.onStateChange(isOpen)
        }
    }

    destroy() {
        if(this.cameraTween) {
            this.cameraTween.kill()
            this.cameraTween = null
        }

        this.overlay.classList.remove(
            'is-visible',
            'is-expanded',
            'is-interactive'
        )

        this.overlay.setAttribute('aria-hidden', 'true')

        if(this.originalParent) {
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
