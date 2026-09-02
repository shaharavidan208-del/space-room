/**
 * Presents either the wide mobile dialogue canvas or the original terminal
 * canvas as a fullscreen DOM interface. The original canvas remains the
 * THREE.CanvasTexture source and is used unchanged by Signal Trace.
 *
 * Mobile-only availability should be decided by the owner before creating
 * this class. This class only manages the fullscreen DOM presentation.
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
     * monitor UI and Signal Trace are drawn.
     * @param {HTMLCanvasElement} options.dialogueCanvas Wide mobile dialogue UI.
     * @param {Function|null} [options.onDialogueResize=null] Receives the exact
     * displayed size before the mobile dialogue canvas is fitted.
     * @param {Function|null} [options.onStateChange=null] Optional callback fired
     * after fullscreen has completely opened or closed.
     */
    constructor({
        terminalCanvas,
        dialogueCanvas,
        onDialogueResize = null,
        onStateChange = null
    }) {
        this.terminalCanvas = terminalCanvas
        this.dialogueCanvas = dialogueCanvas
        this.onDialogueResize = onDialogueResize
        this.onStateChange = onStateChange

        /**
         * The overlay represents the entire fullscreen layer. It controls
         * visibility, interaction, accessibility state, and the fullscreen
         * coordinate area used by the surface.
         */
        this.overlay = document.querySelector('#terminal-fullscreen')

        /**
         * The surface is the fullscreen terminal display. The existing terminal
         * canvas is moved into this element without disconnecting it from the
         * CanvasTexture.
         */
        this.surface = document.querySelector(
            '#terminal-fullscreen-surface'
        )

        if (!this.overlay || !this.surface) {
            throw new Error(
                'TerminalFullscreen requires #terminal-fullscreen and ' +
                '#terminal-fullscreen-surface in the HTML.'
            )
        }

        if (
            !(this.terminalCanvas instanceof HTMLCanvasElement) ||
            !(this.dialogueCanvas instanceof HTMLCanvasElement)
        ) {
            throw new Error(
                'TerminalFullscreen requires terminal and dialogue canvases.'
            )
        }

        this.opened = false
        this.transitioning = false

        // The owner can pause the 3D render loop after fullscreen completely
        // covers the scene and resume it before the overlay closes.
        this.pauseScene = false

        /** Preserve the DOM position and inline size of both canvases. */
        this.canvasStates = new Map()

        for (const canvas of [
            this.terminalCanvas,
            this.dialogueCanvas
        ]) {
            this.canvasStates.set(canvas, {
                parent: canvas.parentNode,
                nextSibling: canvas.nextSibling,
                width: canvas.style.getPropertyValue('width'),
                widthPriority:
                    canvas.style.getPropertyPriority('width'),
                height: canvas.style.getPropertyValue('height'),
                heightPriority:
                    canvas.style.getPropertyPriority('height')
            })
        }

        /**
         * CSS controls only the canvas's displayed size. Its internal drawing
         * buffer remains unchanged, and the same element remains a valid source
         * for the terminal's Three.js CanvasTexture.
         */
        this.activeCanvas = this.dialogueCanvas
        this.surface.appendChild(this.activeCanvas)

        /**
         * Browser UI appearing or disappearing changes visualViewport without
         * necessarily changing the canvas drawing buffer. Refit the DOM canvas
         * whenever that usable area changes while fullscreen is active.
         */
        this.handleViewportResize = () => {
            if (this.opened || this.transitioning) {
                this.fitCanvasToSurface()
            }
        }

        window.addEventListener(
            'resize',
            this.handleViewportResize
        )

        if (window.visualViewport) {
            window.visualViewport.addEventListener(
                'resize',
                this.handleViewportResize
            )
        }
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
     * Swap the DOM presentation without touching either drawing buffer.
     * Dialogue supplies its own wide canvas; Signal Trace supplies the original
     * 1920x1200 terminal canvas.
     */
    setActiveCanvas(canvas) {
        if (
            canvas !== this.dialogueCanvas &&
            canvas !== this.terminalCanvas
        ) {
            return
        }

        if (canvas === this.activeCanvas) {
            if (this.opened || this.transitioning) {
                this.fitCanvasToSurface()
            }
            return
        }

        this.activeCanvas.remove()
        this.activeCanvas = canvas
        this.surface.appendChild(this.activeCanvas)

        if (this.opened || this.transitioning) {
            this.fitCanvasToSurface()
        }
    }

    /** Opens or closes fullscreen mode according to its completed state. */
    async toggle() {
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
     * Reveals the mobile overlay, runs its CSS entrance transition, and hands
     * pointer interaction to the fullscreen canvas.
     */
    async open() {
        if (this.opened || this.transitioning) {
            return
        }

        this.transitioning = true

        try {
            this.overlay.classList.remove(
                'is-expanded',
                'is-interactive'
            )

            this.overlay.classList.add('is-visible')
            this.overlay.setAttribute('aria-hidden', 'false')

            // Give the visible overlay one layout pass, then size the canvas
            // from the surface's real content box before it animates onscreen.
            await this.nextAnimationFrame()
            this.fitCanvasToSurface()

            const surfaceTransition =
                this.waitForSurfaceTransition()

            this.overlay.classList.add('is-expanded')

            await surfaceTransition

            this.overlay.classList.add('is-interactive')

            this.opened = true
            this.pauseScene = true

            this.notifyStateChange(true)
        }
        finally {
            this.transitioning = false
        }
    }

    /**
     * Resumes the 3D scene behind the overlay, disables fullscreen interaction,
     * and runs the CSS exit transition before hiding the overlay.
     */
    async close() {
        if (!this.opened || this.transitioning) {
            return
        }

        this.transitioning = true
        this.pauseScene = false

        try {
            this.overlay.classList.remove('is-interactive')

            const surfaceTransition =
                this.waitForSurfaceTransition()

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
     * Converts a DOM pointer event into the terminal canvas's internal pixel
     * coordinates. The normal 3D terminal can continue using raycast UVs.
     */
    getCanvasCoordinates(event) {
        const rect = this.activeCanvas.getBoundingClientRect()

        if (rect.width === 0 || rect.height === 0) {
            return null
        }

        return {
            x:
                (event.clientX - rect.left) *
                (this.activeCanvas.width / rect.width),

            y:
                (event.clientY - rect.top) *
                (this.activeCanvas.height / rect.height)
        }
    }

    /**
     * Fits the complete terminal drawing buffer inside the surface without
     * cropping or distortion.
     *
     * CSS percentage sizing of a canvas can be resolved from width first on
     * some mobile browsers. When the resulting intrinsic height is taller than
     * the landscape viewport, overflow:hidden clips the lower terminal area.
     * Measuring both available axes and applying one explicit contain scale
     * avoids that browser-dependent sizing path.
     */
    fitCanvasToSurface() {
        /**
         * Size from the complete overlay, not the surface's content box.
         * EXIT and BACK are overlays inside this same area; they must never
         * reserve a separate column or reduce the terminal canvas width.
         */
        const availableWidth = Math.max(
            0,
            this.overlay.clientWidth
        )

        const availableHeight = Math.max(
            0,
            this.overlay.clientHeight
        )

        if (
            this.activeCanvas === this.dialogueCanvas &&
            this.onDialogueResize
        ) {
            this.onDialogueResize(
                availableWidth,
                availableHeight
            )
        }

        const bufferWidth = this.activeCanvas.width
        const bufferHeight = this.activeCanvas.height

        if (
            availableWidth === 0 ||
            availableHeight === 0 ||
            bufferWidth === 0 ||
            bufferHeight === 0
        ) {
            return
        }

        const scale = Math.min(
            availableWidth / bufferWidth,
            availableHeight / bufferHeight
        )

        const displayedWidth = bufferWidth * scale
        const displayedHeight = bufferHeight * scale

        this.activeCanvas.style.setProperty(
            'width',
            `${displayedWidth}px`,
            'important'
        )

        this.activeCanvas.style.setProperty(
            'height',
            `${displayedHeight}px`,
            'important'
        )
    }

    /**
     * Returns a Promise that resolves when the surface's transform transition
     * ends. A timeout covers browsers that omit transitionend during viewport
     * or orientation changes.
     */
    waitForSurfaceTransition() {
        if (this.prefersReducedMotion()) {
            return Promise.resolve()
        }

        const durationText = getComputedStyle(this.overlay)
            .getPropertyValue('--terminal-transition-duration')

        const duration = parseFloat(durationText) || 320

        return new Promise((resolve) => {
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

            window.setTimeout(finish, duration + 130)
        })
    }

    /** Returns a Promise resolved immediately before the browser's next paint. */
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
     * Resets the overlay and returns the canvas to the exact DOM position it
     * occupied before this class was created.
     */
    destroy() {
        window.removeEventListener(
            'resize',
            this.handleViewportResize
        )

        if (window.visualViewport) {
            window.visualViewport.removeEventListener(
                'resize',
                this.handleViewportResize
            )
        }

        this.overlay.classList.remove(
            'is-visible',
            'is-expanded',
            'is-interactive'
        )

        this.overlay.setAttribute('aria-hidden', 'true')

        for (const [canvas, state] of this.canvasStates) {
            if (state.parent) {
                state.parent.insertBefore(
                    canvas,
                    state.nextSibling
                )
            }
            else {
                canvas.remove()
            }

            canvas.style.setProperty(
                'width',
                state.width,
                state.widthPriority
            )

            canvas.style.setProperty(
                'height',
                state.height,
                state.heightPriority
            )
        }

        this.opened = false
        this.transitioning = false
        this.pauseScene = false
    }
}
