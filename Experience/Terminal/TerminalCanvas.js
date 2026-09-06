import * as THREE from 'three';
import TerminalTree from './TerminalTree.js';
import SignalTrace from './SignalTrace.js';


export default class TerminalCanvas {
    constructor(experience) {
        // Store a reference to the main Experience instance.
        // This lets the terminal know things about the 3D scene,
        // such as whether the user is currently focused on the terminal.
        this.experience = experience;

        this.mode = "dialogue" // on default, mode should be dialogue


        // ==========================================
        // 1. OFF-SCREEN CANVAS SETUP
        // ==========================================

        // Create a normal HTML canvas element.
        // We do NOT add this canvas to the DOM.
        // It exists only in memory and acts like a hidden drawing surface.
        this.canvas = document.createElement('canvas');

        // Set the internal pixel resolution of the canvas.
        // This is not the CSS size. This is the actual texture resolution.
        // Higher resolution = sharper text when the 3D camera zooms into the monitor.
        this.monitorCanvasWidth = 2160
        this.monitorCanvasHeight = 1350

        this.canvas.width = this.monitorCanvasWidth;
        this.canvas.height = this.monitorCanvasHeight;

        // Get the 2D drawing context.
        // This is the "brush" we use to draw text, rectangles, highlights, etc.
        this.ctx = this.canvas.getContext('2d');

        /**
         * Mobile dialogue uses a separate, viewport-shaped drawing surface.
         * The original 1920x1200 canvas remains the monitor texture and the
         * Signal Trace canvas, so neither of those layouts is resized.
         */
        this.mobileCanvas = document.createElement('canvas')
        this.mobileCanvas.width = 1920
        this.mobileCanvas.height = 864
        this.mobileCtx = this.mobileCanvas.getContext('2d')

        // ==========================================
        // 2. CANVAS → THREE.JS TEXTURE BRIDGE
        // ==========================================

        // Convert the hidden 2D canvas into a Three.js texture.
        // This texture will later be assigned to the monitor screen material.
        // Whatever we draw on this canvas becomes visible on the 3D monitor.
        this.texture = new THREE.CanvasTexture(this.canvas);
        
        // Texture wrapping controls what happens when UVs sample outside the texture.
        // ClampToEdge prevents the texture from repeating/tapping pixels from the opposite side.
        // This is safer for UI screens because we usually do not want repeated terminal text.
        this.texture.wrapS = THREE.MirroredRepeatWrapping;
        this.texture.wrapT = THREE.MirroredRepeatWrapping;

        // Texture filtering controls how the texture is sampled when scaled.
        // LinearFilter gives smoother text.
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        // ==========================================
        // 3. TERMINAL STATE
        // ==========================================

        // currentNodeId is the "address" of the current screen/node.
        // Example:
        // "start"
        // "projects_menu"
        // "about_me"
        // "supernova_info"
        //
        // draw() uses this ID to fetch the correct node from TerminalTree.
        this.currentNodeId = 'start';

        // Tracks which choice is currently highlighted inside the current node.
        // 0 = first choice
        // 1 = second choice
        this.dialogueSelectedIndex = 0;

        /**
         * Stores each dialogue screen visited before the current one.
         * Keeping the selected option with the node lets Back restore the
         * exact dialogue state the user came from.
         */
        this.dialogueHistory = []

        /** Optional feedback appended beneath the active dialogue text. */
        this.dialogueNotice = ''

        /**
         * Rebuilt by draw() from the exact rectangles used to render choices.
         * Pointer input reads these areas instead of duplicating layout math.
         */
        this.dialogueHitAreas = []

        /** Exact hit rectangles drawn on the wide mobile dialogue canvas. */
        this.mobileDialogueHitAreas = []

        this.mobilePressedChoiceIndex = -1
        this.mobilePointerId = null
        this.fullscreenController = null
        this.signalTraceUsesMobileAspect = false

        // Fullscreen DOM input belongs to the terminal canvas itself. The
        // normal monitor still reaches these methods through Experience's
        // raycast path, but the mobile canvas no longer depends on Experience
        // forwarding DOM events back into it.
        this.domPointerId = null

        /** Desktop controls are rendered into the monitor texture itself. */
        this.desktopControlsVisible = false
        this.desktopControlHitAreas = []
        this.desktopPressedControl = null
        this.desktopExitHandler = null

        this.signalTrace = new SignalTrace(this);
        // Set up keyboard input and draw the first frame immediately.
        this.setupHiddenInput();
        this.setupCanvasPointerInput();
        this.setupMobileCanvasPointerInput()
        this.draw();
    }

    downloadCanvasImage(fileName = "terminal-screen.png") {
    this.canvas.toBlob((blob) => {
        if (!blob) {
            console.warn("Canvas export failed.")
            return
        }

        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        link.click()

        URL.revokeObjectURL(url)
    }, "image/png")
}

    // ==========================================
    // 4. KEYBOARD INTERCEPTION
    // ==========================================

    setupHiddenInput() {
        // This input was originally useful for free typing.
        // Right now, the terminal is choice-based, so the actual input element
        // is not doing much because it is not appended to document.body.
        //
        // The important part below is the global keydown listener.
        this.inputElement = document.createElement('input');

        // Standard text input.
        this.inputElement.type = 'text';

        // Hide the input visually.
        // We avoid display:none because browsers often refuse to focus hidden inputs.
        this.inputElement.style.position = 'absolute';
        this.inputElement.style.opacity = '0';
        this.inputElement.style.left = '-9999px';

        // Currently commented out.
        // If you ever return to real text typing or mobile keyboard support,
        // this may become useful again.
        // document.body.appendChild(this.inputElement);

        // Listen for keyboard events globally.
        // This means arrow keys / Enter can control the terminal
        // even though the terminal itself is just a canvas texture.
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Handles the canvas while it is mounted directly inside the mobile
     * fullscreen surface. Dialogue uses a normal click, while Signal Trace
     * keeps pointer down/move/up so dragging continues to work.
     */
    setupCanvasPointerInput() {
        this.canvas.addEventListener('click', (event) => {
            if (this.mode !== 'dialogue') {
                return
            }

            const canvasPosition =
                this.getCanvasPositionFromDOMEvent(event)

            if (!canvasPosition) {
                return
            }

            event.preventDefault()

            this.activateDialogueChoiceAt(
                canvasPosition.x,
                canvasPosition.y
            )
        })

        this.canvas.addEventListener('pointerdown', (event) => {
            if (this.mode !== 'signalTrace') {
                return
            }

            const canvasPosition =
                this.getCanvasPositionFromDOMEvent(event)

            if (!canvasPosition) {
                return
            }

            event.preventDefault()
            this.domPointerId = event.pointerId
            this.canvas.setPointerCapture?.(event.pointerId)

            this.signalTrace.handlePointerDown(
                canvasPosition.x,
                canvasPosition.y
            )
        })

        this.canvas.addEventListener('pointermove', (event) => {
            if (
                this.mode !== 'signalTrace' ||
                event.pointerId !== this.domPointerId
            ) {
                return
            }

            const canvasPosition =
                this.getCanvasPositionFromDOMEvent(event)

            if (!canvasPosition) {
                return
            }

            event.preventDefault()

            this.signalTrace.handlePointerMove(
                canvasPosition.x,
                canvasPosition.y
            )
        })

        this.canvas.addEventListener('pointerup', (event) => {
            if (
                this.mode !== 'signalTrace' ||
                event.pointerId !== this.domPointerId
            ) {
                return
            }

            const canvasPosition =
                this.getCanvasPositionFromDOMEvent(event)

            if (canvasPosition) {
                this.signalTrace.handlePointerUp(
                    canvasPosition.x,
                    canvasPosition.y
                )
            }
            else {
                this.signalTrace.handlePointerCancel()
            }

            this.releaseDOMPointer(event.pointerId)
        })

        this.canvas.addEventListener('pointercancel', (event) => {
            if (event.pointerId !== this.domPointerId) {
                return
            }

            this.signalTrace.handlePointerCancel()
            this.releaseDOMPointer(event.pointerId)
        })
    }

    /** Convert a DOM event on the displayed canvas into drawing-buffer pixels. */
    getCanvasPositionFromDOMEvent(event) {
        const rect = this.canvas.getBoundingClientRect()

        if (rect.width === 0 || rect.height === 0) {
            return null
        }

        return {
            x:
                (event.clientX - rect.left) *
                (this.canvas.width / rect.width),
            y:
                (event.clientY - rect.top) *
                (this.canvas.height / rect.height)
        }
    }

    /** Release Signal Trace's active DOM pointer after up or cancellation. */
    releaseDOMPointer(pointerId) {
        if (this.canvas.hasPointerCapture?.(pointerId)) {
            this.canvas.releasePointerCapture(pointerId)
        }

        this.domPointerId = null
    }

    /**
     * Direct input for the wide mobile dialogue canvas. A press is shown
     * immediately, but navigation only happens when that same pointer is
     * released over the same card.
     */
    setupMobileCanvasPointerInput() {
        this.mobileCanvas.addEventListener('pointerdown', (event) => {
            if (this.mode !== 'dialogue') {
                return
            }

            const canvasPosition =
                this.getCanvasPositionFromElementEvent(
                    event,
                    this.mobileCanvas
                )

            const hitArea = this.getMobileDialogueHitAreaAt(
                canvasPosition?.x,
                canvasPosition?.y
            )

            if (!hitArea) {
                return
            }

            event.preventDefault()

            this.mobilePointerId = event.pointerId
            this.mobilePressedChoiceIndex = hitArea.choiceIndex

            this.mobileCanvas.setPointerCapture?.(event.pointerId)
            this.drawMobileDialogue()
        })

        this.mobileCanvas.addEventListener('pointerup', (event) => {
            if (event.pointerId !== this.mobilePointerId) {
                return
            }

            const pressedChoiceIndex =
                this.mobilePressedChoiceIndex

            const canvasPosition =
                this.getCanvasPositionFromElementEvent(
                    event,
                    this.mobileCanvas
                )

            const hitArea = this.getMobileDialogueHitAreaAt(
                canvasPosition?.x,
                canvasPosition?.y
            )

            this.releaseMobilePointer(event.pointerId)

            if (
                hitArea &&
                hitArea.choiceIndex === pressedChoiceIndex
            ) {
                this.activateDialogueChoice(pressedChoiceIndex)
                return
            }

            this.drawMobileDialogue()
        })

        this.mobileCanvas.addEventListener('pointercancel', (event) => {
            if (event.pointerId !== this.mobilePointerId) {
                return
            }

            this.releaseMobilePointer(event.pointerId)
            this.drawMobileDialogue()
        })
    }

    /** Convert a DOM event into pixels belonging to one displayed canvas. */
    getCanvasPositionFromElementEvent(event, canvas) {
        const rect = canvas.getBoundingClientRect()

        if (
            rect.width === 0 ||
            rect.height === 0 ||
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {
            return null
        }

        return {
            x:
                (event.clientX - rect.left) *
                (canvas.width / rect.width),
            y:
                (event.clientY - rect.top) *
                (canvas.height / rect.height)
        }
    }

    /** Find the mobile card beneath one canvas-space point. */
    getMobileDialogueHitAreaAt(canvasX, canvasY) {
        if (
            !Number.isFinite(canvasX) ||
            !Number.isFinite(canvasY)
        ) {
            return null
        }

        for (const hitArea of this.mobileDialogueHitAreas) {
            if (
                this.isPointInsideHitArea(
                    canvasX,
                    canvasY,
                    hitArea
                )
            ) {
                return hitArea
            }
        }

        return null
    }

    /** Clear the visual press state and release pointer capture safely. */
    releaseMobilePointer(pointerId) {
        if (this.mobileCanvas.hasPointerCapture?.(pointerId)) {
            this.mobileCanvas.releasePointerCapture(pointerId)
        }

        this.mobilePointerId = null
        this.mobilePressedChoiceIndex = -1
    }

    /** Connect the terminal state to the mobile fullscreen canvas switcher. */
    setFullscreenController(fullscreenController) {
        this.fullscreenController = fullscreenController
        this.syncFullscreenCanvas()
    }

    /** Display dialogue or Signal Trace without changing either canvas layout. */
    syncFullscreenCanvas() {
        if (!this.fullscreenController) {
            return
        }

        if (this.mode === 'signalTrace') {
            this.fullscreenController.setActiveCanvas(this.canvas)
            return
        }

        this.fullscreenController.setActiveCanvas(this.mobileCanvas)
    }

    /**
     * Match the mobile drawing buffer to the fullscreen viewport. CSS pixels
     * are multiplied by a capped DPR so text remains sharp without allocating
     * an unnecessarily huge phone canvas.
     */
    resizeMobileCanvas(displayedWidth, displayedHeight) {
        if (displayedWidth <= 0 || displayedHeight <= 0) {
            return
        }

        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        )

        const bufferWidth = Math.max(
            1,
            Math.round(displayedWidth * pixelRatio)
        )

        const bufferHeight = Math.max(
            1,
            Math.round(displayedHeight * pixelRatio)
        )

        if (
            this.mobileCanvas.width === bufferWidth &&
            this.mobileCanvas.height === bufferHeight
        ) {
            return
        }

        this.mobileCanvas.width = bufferWidth
        this.mobileCanvas.height = bufferHeight
        this.mobileCtx = this.mobileCanvas.getContext('2d')

        this.drawMobileDialogue()
    }

    /**
     * Widen the real Signal Trace drawing buffer to the phone viewport before
     * the game draws its first screen. Height and all game-space measurements
     * stay unchanged, so tiles, type, and line work keep their exact styling.
     */
    prepareSignalTraceCanvasForFullscreen() {
        if (!this.fullscreenController) {
            return
        }

        const mobileAspect =
            this.mobileCanvas.width / this.mobileCanvas.height

        if (!Number.isFinite(mobileAspect) || mobileAspect <= 0) {
            return
        }

        const signalTraceWidth = Math.round(
            this.monitorCanvasHeight * mobileAspect
        )

        if (
            this.canvas.width === signalTraceWidth &&
            this.canvas.height === this.monitorCanvasHeight
        ) {
            this.signalTraceUsesMobileAspect = true
            return
        }

        this.canvas.width = signalTraceWidth
        this.canvas.height = this.monitorCanvasHeight
        this.ctx = this.canvas.getContext('2d')

        this.syncSignalTraceDrawingContext()
        this.signalTraceUsesMobileAspect = true
        this.texture.needsUpdate = true
    }

    /** Keep Signal Trace's renderer helpers attached after a canvas resize. */
    syncSignalTraceDrawingContext() {
        this.signalTrace.ctx = this.ctx

        if (this.signalTrace.tileRenderer) {
            this.signalTrace.tileRenderer.ctx = this.ctx
        }

        if (this.signalTrace.pipeRenderer) {
            this.signalTrace.pipeRenderer.ctx = this.ctx
        }
    }

    /** Restore the monitor texture's original 16:10 drawing buffer. */
    restoreMonitorCanvasSize() {
        if (!this.signalTraceUsesMobileAspect) {
            return
        }

        this.canvas.width = this.monitorCanvasWidth
        this.canvas.height = this.monitorCanvasHeight
        this.ctx = this.canvas.getContext('2d')

        this.syncSignalTraceDrawingContext()
        this.signalTraceUsesMobileAspect = false
        this.texture.needsUpdate = true
    }

    /**
     * EXIT can leave fullscreen directly from Signal Trace. Restore the normal
     * monitor canvas before the 3D station becomes visible again.
     */
    restoreAfterMobileSignalTraceExit() {
        if (!this.signalTraceUsesMobileAspect) {
            return
        }

        this.mode = 'dialogue'
        this.signalTrace.isRunning = false
        this.restoreMonitorCanvasSize()
        this.returnToMainMenu()
    }

    // ==========================================
    // 5. TEXT WRAPPING UTILITY
    // ==========================================

    drawWrappedText(fullMessage, startX, startY, maxPixelWidth, lineDropDistance) {
        // Canvas does not wrap text automatically.
        // If we call fillText() with a long sentence, it will draw one huge line
        // and continue outside the terminal screen.
        //
        // This function manually splits text into lines based on pixel width.

        const wordsArray = fullMessage.split(' ');

        // finalizedLine stores the current line being built.
        let finalizedLine = '';

        // currentBrushY tracks where the next line should be drawn vertically.
        let currentBrushY = startY;

        for (let i = 0; i < wordsArray.length; i++) {
            // Try adding the next word to the current line.
            const testLine = finalizedLine + wordsArray[i] + ' ';

            // Measure how many pixels wide the line would be.
            const metrics = this.ctx.measureText(testLine);
            const pixelWidth = metrics.width;

            // If the line becomes too wide, draw the previous valid line
            // and start a new line with the current word.
            if (pixelWidth > maxPixelWidth && i > 0) {
                this.ctx.fillText(finalizedLine, startX, currentBrushY);

                // Start the next line with the word that did not fit.
                finalizedLine = wordsArray[i] + ' ';

                // Move the brush down before drawing the next line.
                currentBrushY += lineDropDistance;
            } else {
                // The word still fits, so keep building the current line.
                finalizedLine = testLine;
            }
        }

        // Draw the final line that remains after the loop ends.
        this.ctx.fillText(finalizedLine, startX, currentBrushY);

        // Return the Y position after the wrapped text.
        // draw() uses this so choices can appear below the body text,
        // no matter how many lines the body text took.
        return currentBrushY + lineDropDistance;
    }

    /**
     * Draws Signal Trace as a dedicated game launcher instead of another
     * generic dialogue row.
     *
     * The choice still uses the normal terminal selection index and action,
     * so this changes only its visual hierarchy—not its navigation logic.
     *
     * @param {number} startX
     * @param {number} panelWidth
     * @param {boolean} isSelected
     */
    drawSignalTraceLauncher(startX, panelWidth, isSelected) {
        const panelHeight = 300
        const panelBottomMargin = 55
        const panelTop =
            this.canvas.height -
            panelHeight -
            panelBottomMargin

        const panelRight = startX + panelWidth

        const terminalGreen = '#00FF41'
        const dimGreen = '#087A2C'
        const terminalBlack = '#050505'
        const signalAmber = '#FFB000'

        let panelBackground = '#060D08'
        let moduleGreen = dimGreen
        let moduleTitleGreen = '#00C83A'
        let moduleLineWidth = 2
        let launchText = '[ INITIALIZE ]'
        let footerText = 'GAME MODULE // STANDBY'
        let footerColor = dimGreen

        if (isSelected) {
            panelBackground = '#071D0E'
            moduleGreen = terminalGreen
            moduleTitleGreen = terminalGreen
            moduleLineWidth = 4
            launchText = '> INITIALIZE <'
            footerText = 'ENTER // LAUNCH GAME MODULE'
            footerColor = signalAmber
        }

        this.ctx.save()

        /**
         * Section label and divider detach the game module from the normal
         * dialogue choices above it.
         */
        this.ctx.fillStyle = dimGreen
        this.ctx.font = '40px monospace'
        this.ctx.fillText(
            'AVAILABLE GAME MODULE',
            startX,
            panelTop - 32
        )

        this.ctx.fillRect(
            startX + 395,
            panelTop - 43,
            panelWidth - 395,
            3
        )

        /**
         * Main game-module housing.
         */
        this.ctx.fillStyle = panelBackground

        this.ctx.fillRect(
            startX,
            panelTop,
            panelWidth,
            panelHeight
        )

        this.ctx.strokeStyle = moduleGreen
        this.ctx.lineWidth = moduleLineWidth

        this.ctx.strokeRect(
            startX,
            panelTop,
            panelWidth,
            panelHeight
        )

        /**
         * Solid left rail makes the module visually heavier than normal
         * terminal choices even when it is not selected.
         */
        this.ctx.fillStyle = moduleGreen

        this.ctx.fillRect(
            startX,
            panelTop,
            10,
            panelHeight
        )

        /**
         * Module identification.
         */
        this.ctx.fillStyle = moduleTitleGreen

        this.ctx.font = 'bold 55px monospace'
        this.ctx.fillText(
            'SIGNAL TRACE // ROUTING PROTOCOL',
            startX + 42,
            panelTop + 69
        )

        this.ctx.fillStyle = signalAmber
        this.ctx.font = '46px monospace'
        this.ctx.fillText(
            'INTERACTIVE LOGIC SIMULATION',
            startX + 44,
            panelTop + 116
        )

        /**
         * Draw a miniature source-to-target route. This previews the visual
         * language of the game without trying to reproduce the entire board.
         */
        const routeY = panelTop + 210
        const routeStartX = startX + 54
        const routePoints = [
            { x: routeStartX, y: routeY },
            { x: routeStartX + 165, y: routeY },
            { x: routeStartX + 165, y: routeY + 34 },
            { x: routeStartX + 355, y: routeY + 34 },
            { x: routeStartX + 355, y: routeY - 20 },
            { x: routeStartX + 565, y: routeY - 20 }
        ]

        this.ctx.strokeStyle = moduleGreen

        this.ctx.lineWidth = 5
        this.ctx.beginPath()
        this.ctx.moveTo(routePoints[0].x, routePoints[0].y)

        for (let i = 1; i < routePoints.length; i++) {
            this.ctx.lineTo(
                routePoints[i].x,
                routePoints[i].y
            )
        }

        this.ctx.stroke()

        for (let i = 0; i < routePoints.length; i++) {
            const point = routePoints[i]

            this.ctx.fillStyle = terminalBlack
            this.ctx.strokeStyle = moduleGreen

            this.ctx.lineWidth = 4
            this.ctx.beginPath()
            this.ctx.arc(point.x, point.y, 13, 0, Math.PI * 2)
            this.ctx.fill()
            this.ctx.stroke()
        }

        this.ctx.fillStyle = signalAmber
        this.ctx.beginPath()
        this.ctx.arc(
            routePoints[0].x,
            routePoints[0].y,
            7,
            0,
            Math.PI * 2
        )
        this.ctx.fill()

        const targetPoint = routePoints[routePoints.length - 1]

        this.ctx.beginPath()
        this.ctx.arc(
            targetPoint.x,
            targetPoint.y,
            7,
            0,
            Math.PI * 2
        )
        this.ctx.fill()

        /**
         * Compact telemetry separates the launcher from ordinary prose.
         */
        const telemetryX = startX + 710

        this.ctx.font = '46px monospace'
        this.ctx.fillStyle = '#00C83A'
        this.ctx.fillText(
            'SYSTEM  ONLINE',
            telemetryX,
            panelTop + 194
        )

        this.ctx.fillText(
            'MODE    PUZZLE',
            telemetryX,
            panelTop + 242
        )

        /**
         * Launch control on the right side of the module.
         */
        const launchWidth = 470
        const launchHeight = 108
        const launchX = panelRight - launchWidth - 42
        const launchY = panelTop + 78

        this.ctx.lineWidth = 3
        this.ctx.strokeStyle = moduleGreen

        if (isSelected) {
            this.ctx.fillStyle = terminalGreen
            this.ctx.fillRect(
                launchX,
                launchY,
                launchWidth,
                launchHeight
            )

            this.ctx.fillStyle = terminalBlack
        }
        else {
            this.ctx.strokeRect(
                launchX,
                launchY,
                launchWidth,
                launchHeight
            )

            this.ctx.fillStyle = moduleTitleGreen
        }

        this.ctx.font = 'bold 50px monospace'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(
            launchText,
            launchX + launchWidth / 2,
            launchY + 69
        )

        this.ctx.textAlign = 'left'
        this.ctx.fillStyle = footerColor

        this.ctx.font = '40px monospace'
        this.ctx.fillText(
            footerText,
            launchX,
            panelTop + 248
        )

        this.ctx.restore()

        return {
            x: startX,
            y: panelTop,
            width: panelWidth,
            height: panelHeight
        }
    }

    /**
     * Draw wrapped text with explicit paragraph breaks for the wide mobile UI.
     * Rendering stops cleanly at maxY instead of spilling beneath the launcher.
     */
    drawMobileWrappedText(
        ctx,
        text,
        startX,
        startY,
        maxWidth,
        lineHeight,
        maxY
    ) {
        const paragraphs = text.split('\n')
        let currentY = startY

        for (let paragraphIndex = 0;
            paragraphIndex < paragraphs.length;
            paragraphIndex++
        ) {
            const paragraph = paragraphs[paragraphIndex].trim()

            if (paragraph.length === 0) {
                currentY += lineHeight * 0.65
                continue
            }

            const words = paragraph.split(/\s+/)
            let line = ''

            for (let wordIndex = 0;
                wordIndex < words.length;
                wordIndex++
            ) {
                const nextLine = line + words[wordIndex] + ' '

                if (
                    ctx.measureText(nextLine).width > maxWidth &&
                    line.length > 0
                ) {
                    if (currentY + lineHeight > maxY) {
                        ctx.fillText('...', startX, currentY)
                        return currentY
                    }

                    ctx.fillText(line.trimEnd(), startX, currentY)
                    line = words[wordIndex] + ' '
                    currentY += lineHeight
                }
                else {
                    line = nextLine
                }
            }

            if (currentY + lineHeight > maxY) {
                ctx.fillText('...', startX, currentY)
                return currentY
            }

            ctx.fillText(line.trimEnd(), startX, currentY)
            currentY += lineHeight
        }

        return currentY
    }

    /** Remove desktop-only keyboard help from the touch presentation. */
    getMobileDialogueText(node) {
        let mobileText = node.aiText || ''

        if (this.currentNodeId === 'start') {
            const keyboardInstructionsStart =
                mobileText.indexOf('\n\nKEYBOARD:')

            if (keyboardInstructionsStart !== -1) {
                mobileText = mobileText.slice(
                    0,
                    keyboardInstructionsStart
                )
            }
        }

        if (this.currentNodeId === 'controls_terminal') {
            const touchInstructionsStart =
                mobileText.indexOf('TOUCH\n')

            if (touchInstructionsStart !== -1) {
                mobileText = mobileText.slice(
                    touchInstructionsStart + 'TOUCH\n'.length
                )
            }
        }

        if (this.dialogueNotice) {
            mobileText += `\n\n${this.dialogueNotice}`
        }

        return mobileText
    }

    /** Reduce one mobile label only when its card is too narrow. */
    setMobileFittedFont(
        ctx,
        text,
        maxWidth,
        preferredSize,
        minimumSize,
        fontWeight = ''
    ) {
        let fontSize = preferredSize

        while (fontSize > minimumSize) {
            ctx.font = `${fontWeight}${fontSize}px monospace`

            if (ctx.measureText(text).width <= maxWidth) {
                return fontSize
            }

            fontSize -= 1
        }

        ctx.font = `${fontWeight}${minimumSize}px monospace`
        return minimumSize
    }

    /** Draw one clearly tappable, restrained mobile dialogue card. */
    drawMobileDialogueCard(
        choice,
        choiceIndex,
        x,
        y,
        width,
        height,
        scale
    ) {
        const ctx = this.mobileCtx
        const isKeyboardSelected =
            choiceIndex === this.dialogueSelectedIndex
        const isPressed =
            choiceIndex === this.mobilePressedChoiceIndex

        let background = '#061008'
        let border = '#087A2C'
        let textColor = '#00C83A'
        let railColor = '#087A2C'
        let lineWidth = Math.max(2, 2 * scale)

        if (isKeyboardSelected) {
            background = '#07170B'
            border = '#00C83A'
            textColor = '#00FF41'
            railColor = '#00FF41'
        }

        if (isPressed) {
            background = '#0B2111'
            border = '#FFB000'
            textColor = '#E7FFE9'
            railColor = '#FFB000'
            lineWidth = Math.max(3, 3 * scale)
        }

        ctx.fillStyle = background
        ctx.fillRect(x, y, width, height)

        ctx.strokeStyle = border
        ctx.lineWidth = lineWidth
        ctx.strokeRect(x, y, width, height)

        ctx.fillStyle = railColor
        ctx.fillRect(x, y, Math.max(5, 6 * scale), height)

        const numberWidth = 54 * scale
        const numberX = x + 24 * scale
        const centerY = y + height / 2

        ctx.fillStyle = '#087A2C'
        ctx.font = `${18 * scale}px monospace`
        ctx.textBaseline = 'middle'
        ctx.fillText(
            String(choiceIndex + 1).padStart(2, '0'),
            numberX,
            centerY
        )

        ctx.fillStyle = textColor

        const labelX = x + numberWidth + 28 * scale
        const actionWidth = 80 * scale
        const labelWidth =
            width - (labelX - x) - actionWidth - 22 * scale

        this.setMobileFittedFont(
            ctx,
            choice.text,
            labelWidth,
            28 * scale,
            18 * scale,
            'bold '
        )

        ctx.fillText(choice.text, labelX, centerY)

        ctx.fillStyle = '#FFB000'
        ctx.font = `${15 * scale}px monospace`
        ctx.textAlign = 'right'
        ctx.fillText('OPEN >', x + width - 20 * scale, centerY)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'

        this.mobileDialogueHitAreas.push({
            choiceIndex,
            x,
            y,
            width,
            height
        })
    }

    /**
     * Mobile version of the Signal Trace launcher. This changes only the
     * directory card; the actual Signal Trace renderer remains untouched.
     */
    drawMobileSignalTraceLauncher(
        choiceIndex,
        x,
        y,
        width,
        height,
        scale
    ) {
        const ctx = this.mobileCtx
        const isSelected =
            choiceIndex === this.dialogueSelectedIndex
        const isPressed =
            choiceIndex === this.mobilePressedChoiceIndex

        let panelBackground = '#060D08'
        let moduleGreen = '#087A2C'
        let launchColor = '#00C83A'

        if (isSelected) {
            panelBackground = '#07170B'
            moduleGreen = '#00C83A'
            launchColor = '#00FF41'
        }

        if (isPressed) {
            panelBackground = '#0B2111'
            moduleGreen = '#FFB000'
            launchColor = '#FFFFFF'
        }

        ctx.fillStyle = '#087A2C'
        ctx.font = `${17 * scale}px monospace`
        ctx.fillText('AVAILABLE GAME MODULE', x, y - 12 * scale)

        const labelWidth = 250 * scale
        ctx.fillRect(
            x + labelWidth,
            y - 18 * scale,
            width - labelWidth,
            Math.max(2, 2 * scale)
        )

        ctx.fillStyle = panelBackground
        ctx.fillRect(x, y, width, height)

        ctx.strokeStyle = moduleGreen
        ctx.lineWidth = Math.max(2, 2 * scale)
        ctx.strokeRect(x, y, width, height)

        ctx.fillStyle = moduleGreen
        ctx.fillRect(x, y, Math.max(6, 8 * scale), height)

        const titleX = x + 34 * scale
        const titleY = y + 52 * scale

        ctx.fillStyle = launchColor
        this.setMobileFittedFont(
            ctx,
            'SIGNAL TRACE // ROUTING PROTOCOL',
            width * 0.5,
            34 * scale,
            22 * scale,
            'bold '
        )
        ctx.fillText(
            'SIGNAL TRACE // ROUTING PROTOCOL',
            titleX,
            titleY
        )

        ctx.fillStyle = '#FFB000'
        ctx.font = `${19 * scale}px monospace`
        ctx.fillText(
            'INTERACTIVE LOGIC SIMULATION',
            titleX,
            titleY + 32 * scale
        )

        const routeY = y + height - 48 * scale
        const routeStartX = titleX
        const routeWidth = Math.min(width * 0.4, 470 * scale)

        ctx.strokeStyle = moduleGreen
        ctx.lineWidth = Math.max(3, 4 * scale)
        ctx.beginPath()
        ctx.moveTo(routeStartX, routeY)
        ctx.lineTo(routeStartX + routeWidth * 0.28, routeY)
        ctx.lineTo(
            routeStartX + routeWidth * 0.28,
            routeY - 26 * scale
        )
        ctx.lineTo(
            routeStartX + routeWidth * 0.62,
            routeY - 26 * scale
        )
        ctx.lineTo(
            routeStartX + routeWidth * 0.62,
            routeY + 10 * scale
        )
        ctx.lineTo(routeStartX + routeWidth, routeY + 10 * scale)
        ctx.stroke()

        const launchWidth = Math.min(390 * scale, width * 0.28)
        const launchHeight = Math.min(90 * scale, height * 0.52)
        const launchX = x + width - launchWidth - 30 * scale
        const launchY = y + (height - launchHeight) / 2

        ctx.strokeStyle = moduleGreen
        ctx.lineWidth = Math.max(2, 2 * scale)
        ctx.strokeRect(
            launchX,
            launchY,
            launchWidth,
            launchHeight
        )

        ctx.fillStyle = launchColor
        ctx.font = `bold ${27 * scale}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
            'TAP TO INITIALIZE',
            launchX + launchWidth / 2,
            launchY + launchHeight / 2
        )
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'

        this.mobileDialogueHitAreas.push({
            choiceIndex,
            x,
            y,
            width,
            height
        })
    }

    /**
     * Purpose-built wide terminal directory for phone landscape. Styling is
     * shared with the monitor UI, but the layout uses the full phone aspect:
     * readable content on the left and explicit touch cards on the right.
     */
    drawMobileDialogue() {
        if (this.mode !== 'dialogue') {
            return
        }

        const ctx = this.mobileCtx
        const width = this.mobileCanvas.width
        const height = this.mobileCanvas.height

        if (!ctx || width === 0 || height === 0) {
            return
        }

        this.mobileDialogueHitAreas = []

        const node = TerminalTree[this.currentNodeId]
        const scale = height / 800
        const marginX = 42 * scale
        const topMargin = 30 * scale

        ctx.fillStyle = '#050505'
        ctx.fillRect(0, 0, width, height)

        const ambientGradient = ctx.createRadialGradient(
            width * 0.18,
            height * 0.35,
            0,
            width * 0.18,
            height * 0.35,
            width * 0.72
        )

        ambientGradient.addColorStop(0, '#06120B')
        ambientGradient.addColorStop(1, '#050505')
        ctx.fillStyle = ambientGradient
        ctx.fillRect(0, 0, width, height)

        if (!node) {
            ctx.fillStyle = '#00FF41'
            ctx.font = `${32 * scale}px monospace`
            ctx.fillText('ERROR: NODE NOT FOUND', marginX, 90 * scale)
            return
        }

        ctx.fillStyle = '#00FF41'

        const headerText = node.header || 'TERMINAL'
        this.setMobileFittedFont(
            ctx,
            headerText,
            width - marginX * 2 - 340 * scale,
            43 * scale,
            28 * scale,
            'bold '
        )
        ctx.fillText(headerText, marginX, topMargin + 43 * scale)

        const dividerY = topMargin + 65 * scale
        ctx.fillStyle = '#00C83A'
        ctx.fillRect(
            marginX,
            dividerY,
            width - marginX * 2,
            Math.max(2, 2 * scale)
        )

        const choices = node.choices || []
        const mobileDialogueText = this.getMobileDialogueText(node)
        const signalTraceChoiceIndex = choices.findIndex(
            (choice) => choice.action === 'startSignalTrace'
        )
        const hasSignalTraceLauncher = signalTraceChoiceIndex !== -1

        const contentTop = dividerY + 42 * scale
        let contentBottom = height - 30 * scale

        let launcherHeight = 0
        let launcherY = 0

        if (hasSignalTraceLauncher) {
            launcherHeight = 182 * scale
            launcherY = height - 28 * scale - launcherHeight
            contentBottom = launcherY - 40 * scale
        }

        const availableContentWidth = width - marginX * 2
        const columnGap = 48 * scale
        const leftColumnWidth = availableContentWidth * 0.54
        const rightColumnX =
            marginX + leftColumnWidth + columnGap
        const rightColumnWidth =
            width - marginX - rightColumnX

        ctx.fillStyle = '#087A2C'
        ctx.font = `${15 * scale}px monospace`
        ctx.fillText('TERMINAL RECORD', marginX, contentTop)
        ctx.fillText(
            'SELECT DESTINATION',
            rightColumnX,
            contentTop
        )

        const sectionTop = contentTop + 30 * scale

        ctx.fillStyle = '#00C83A'

        let bodyFontSize = 26 * scale
        if (mobileDialogueText.length > 520) {
            bodyFontSize = 23 * scale
        }
        if (mobileDialogueText.length > 760) {
            bodyFontSize = 20 * scale
        }

        ctx.font = `${bodyFontSize}px monospace`

        if (mobileDialogueText) {
            this.drawMobileWrappedText(
                ctx,
                mobileDialogueText,
                marginX,
                sectionTop + bodyFontSize,
                leftColumnWidth,
                bodyFontSize * 1.38,
                contentBottom
            )
        }

        const normalChoices = []

        for (let choiceIndex = 0;
            choiceIndex < choices.length;
            choiceIndex++
        ) {
            if (choiceIndex === signalTraceChoiceIndex) {
                continue
            }

            normalChoices.push({
                choice: choices[choiceIndex],
                choiceIndex
            })
        }

        if (normalChoices.length > 0) {
            const cardGap = 10 * scale
            const cardsHeight = contentBottom - sectionTop
            const cardHeight =
                (cardsHeight -
                    cardGap * (normalChoices.length - 1)) /
                normalChoices.length

            for (let index = 0;
                index < normalChoices.length;
                index++
            ) {
                const entry = normalChoices[index]
                const cardY =
                    sectionTop + index * (cardHeight + cardGap)

                this.drawMobileDialogueCard(
                    entry.choice,
                    entry.choiceIndex,
                    rightColumnX,
                    cardY,
                    rightColumnWidth,
                    cardHeight,
                    scale
                )
            }
        }

        if (hasSignalTraceLauncher) {
            this.drawMobileSignalTraceLauncher(
                signalTraceChoiceIndex,
                marginX,
                launcherY,
                width - marginX * 2,
                launcherHeight,
                scale
            )
        }
    }

    // ==========================================
    // 6. RETURN TO ROOT MENU
    // ==========================================


    returnToMainMenu() {
        this.dialogueHistory = []
        this.dialogueNotice = ''
        this.currentNodeId = 'start'
        this.dialogueSelectedIndex = 0
        this.draw()
    }

    /** Keep the external mobile Back control synchronized. */
    syncBackButtons() {
        const backButton = document.querySelector(
            '#terminal-fullscreen-back'
        )

        if (!backButton) {
            return
        }

        const canGoBack = this.canGoBack()
        const returnsToPortfolio = this.mode === 'signalTrace'
        const backLabel = backButton.querySelector(
            '.terminal-fullscreen-close-label'
        )

        if (backLabel) {
            backLabel.textContent = this.getBackButtonLabel()
            backLabel.style.width = returnsToPortfolio ? '100%' : ''
            backLabel.style.whiteSpace = returnsToPortfolio ? 'normal' : ''
            backLabel.style.fontSize = returnsToPortfolio
                ? 'clamp(0.3rem, 1.3dvh, 0.38rem)'
                : ''
            backLabel.style.letterSpacing = returnsToPortfolio
                ? '0.04em'
                : ''
            backLabel.style.lineHeight = returnsToPortfolio ? '1.25' : ''
        }

        backButton.setAttribute(
            'aria-label',
            returnsToPortfolio
                ? 'Back to portfolio'
                : 'Back to previous screen'
        )

        backButton.hidden = !canGoBack
        backButton.disabled = !canGoBack
    }

    /** Use a destination-specific label while Signal Trace is active. */
    getBackButtonLabel() {
        if (this.mode === 'signalTrace') {
            return 'BACK TO PORTFOLIO'
        }

        return 'BACK'
    }

    /** Whether Back has somewhere to return to from the current screen. */
    canGoBack() {
        return (
            this.mode === 'signalTrace' ||
            this.dialogueHistory.length > 0
        )
    }

    /** Give the canvas EXIT control the same focus teardown used by Escape. */
    setDesktopExitHandler(exitHandler) {
        this.desktopExitHandler = exitHandler
    }

    /** Show or hide the controls drawn inside the desktop monitor texture. */
    setDesktopControlsVisible(isVisible) {
        if (this.desktopControlsVisible === isVisible) {
            return
        }

        this.desktopControlsVisible = isVisible
        this.desktopPressedControl = null

        if (isVisible) {
            this.drawDesktopControls()
        }
        else {
            this.clearDesktopControls()
        }

        this.texture.needsUpdate = true
    }

    /** Return the canvas region reserved for the desktop terminal controls. */
    getDesktopControlsBounds() {
        const controlWidth = 180
        const controlHeight = 140
        const controlGap = 16
        const marginTop = 44
        const marginRight = 46

        return {
            controlWidth: controlWidth,
            controlHeight: controlHeight,
            controlGap: controlGap,
            x: this.canvas.width - marginRight - controlWidth * 2 - controlGap,
            y: marginTop,
            width: controlWidth * 2 + controlGap,
            height: controlHeight
        }
    }

    /** Clear the reserved top-right area after desktop focus closes. */
    clearDesktopControls() {
        const bounds = this.getDesktopControlsBounds()

        this.ctx.save()
        this.ctx.fillStyle = '#050505'
        this.ctx.fillRect(
            bounds.x - 4,
            bounds.y - 4,
            bounds.width + 8,
            bounds.height + 8
        )
        this.ctx.restore()

        this.desktopControlHitAreas = []
    }

    /** Draw one monitor-space control using the mobile terminal's visual style. */
    drawDesktopControl(action, label, x, y, width, height) {
        const isPressed = this.desktopPressedControl === action
        const centerX = x + width / 2
        const iconCenterY = y + 42
        const labelLines = label === 'BACK TO PORTFOLIO'
            ? ['BACK TO', 'PORTFOLIO']
            : [label]

        this.ctx.save()
        this.ctx.fillStyle = isPressed
            ? 'rgba(255, 176, 0, 0.13)'
            : 'rgba(5, 12, 7, 0.72)'
        this.ctx.strokeStyle = isPressed
            ? 'rgba(255, 255, 255, 0.82)'
            : 'rgba(0, 255, 65, 0.42)'
        this.ctx.lineWidth = 2
        this.ctx.fillRect(x, y, width, height)
        this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2)

        this.ctx.strokeStyle = isPressed
            ? '#ffffff'
            : 'rgba(0, 255, 65, 0.82)'
        this.ctx.lineWidth = 3
        this.ctx.shadowColor = this.ctx.strokeStyle
        this.ctx.shadowBlur = 8
        this.ctx.beginPath()

        if (action === 'back') {
            this.ctx.moveTo(centerX + 18, iconCenterY)
            this.ctx.lineTo(centerX - 18, iconCenterY)
            this.ctx.moveTo(centerX - 18, iconCenterY)
            this.ctx.lineTo(centerX - 4, iconCenterY - 14)
            this.ctx.moveTo(centerX - 18, iconCenterY)
            this.ctx.lineTo(centerX - 4, iconCenterY + 14)
        }
        else {
            this.ctx.moveTo(centerX - 15, iconCenterY - 15)
            this.ctx.lineTo(centerX + 15, iconCenterY + 15)
            this.ctx.moveTo(centerX + 15, iconCenterY - 15)
            this.ctx.lineTo(centerX - 15, iconCenterY + 15)
        }

        this.ctx.stroke()
        this.ctx.shadowBlur = 0
        this.ctx.fillStyle = isPressed
            ? '#ffffff'
            : 'rgba(0, 255, 65, 0.82)'
        this.ctx.font = labelLines.length > 1
            ? '26px "Audiowide", monospace'
            : '30px "Audiowide", monospace'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'alphabetic'

        for (let index = 0; index < labelLines.length; index++) {
            const labelY = labelLines.length > 1
                ? y + 84 + index * 22
                : y + 92

            this.ctx.fillText(labelLines[index], centerX, labelY)
        }

        this.ctx.restore()

        this.desktopControlHitAreas.push({
            action: action,
            x: x,
            y: y,
            width: width,
            height: height
        })
    }

    /** Draw desktop BACK/EXIT directly into the terminal's monitor texture. */
    drawDesktopControls() {
        this.desktopControlHitAreas = []

        if (
            !this.desktopControlsVisible ||
            this.signalTraceUsesMobileAspect
        ) {
            return
        }

        const bounds = this.getDesktopControlsBounds()
        const exitX = bounds.x + bounds.controlWidth + bounds.controlGap

        if (this.canGoBack()) {
            this.drawDesktopControl(
                'back',
                this.getBackButtonLabel(),
                bounds.x,
                bounds.y,
                bounds.controlWidth,
                bounds.controlHeight
            )
        }

        this.drawDesktopControl(
            'exit',
            'EXIT',
            exitX,
            bounds.y,
            bounds.controlWidth,
            bounds.controlHeight
        )
    }

    /** Find the monitor-space desktop control beneath one pointer position. */
    getDesktopControlAt(canvasX, canvasY) {
        for (const hitArea of this.desktopControlHitAreas) {
            if (this.isPointInsideHitArea(canvasX, canvasY, hitArea)) {
                return hitArea
            }
        }

        return null
    }

    /** Run the action belonging to a released desktop canvas control. */
    activateDesktopControl(action) {
        if (action === 'back') {
            return this.goBack()
        }

        if (action === 'exit' && this.desktopExitHandler) {
            this.desktopExitHandler()
            return true
        }

        return false
    }

    /**
     * Performs the terminal's shared Back behavior for every input method.
     * Signal Trace returns to the root; dialogue returns to its previous node.
     */
    goBack() {
        if (this.mode === 'signalTrace') {
            this.mode = 'dialogue'
            this.signalTrace.isRunning = false
            this.restoreMonitorCanvasSize()
            this.syncFullscreenCanvas()
            this.returnToMainMenu()
            return true
        }

        if (this.dialogueHistory.length === 0) {
            return false
        }

        const previousDialogue = this.dialogueHistory.pop()

        if (!TerminalTree[previousDialogue.nodeId]) {
            this.returnToMainMenu()
            return true
        }

        this.currentNodeId = previousDialogue.nodeId
        this.dialogueSelectedIndex = previousDialogue.selectedIndex
        this.dialogueNotice = ''
        this.draw()

        return true
    }

    /** Copy terminal text, with a selectable prompt when Clipboard is blocked. */
    copyText(text) {
        if (!text) {
            return false
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            const sourceNodeId = this.currentNodeId

            navigator.clipboard.writeText(text)
                .then(() => {
                    if (this.currentNodeId !== sourceNodeId) {
                        return
                    }

                    this.dialogueNotice = 'EMAIL COPIED TO CLIPBOARD.'
                    this.draw()
                })
                .catch(() => {
                    window.prompt('Copy this email address:', text)
                })

            return true
        }

        window.prompt('Copy this email address:', text)
        return true
    }

    /** Open a terminal link in a separate browser tab. */
    openUrl(url) {
        if (!url) {
            return false
        }

        window.open(url, '_blank', 'noopener,noreferrer')
        return true
    }

    /**
     * Activates one dialogue choice. Keyboard Enter and direct pointer taps use
     * this same method so both input paths always produce identical state.
     */
    activateDialogueChoice(choiceIndex = this.dialogueSelectedIndex) {
        const currentNode = TerminalTree[this.currentNodeId]

        if (!currentNode) {
            this.draw()
            return false
        }

        const choices = currentNode.choices || []
        const selectedChoice = choices[choiceIndex]

        if (!selectedChoice) {
            return false
        }

        this.dialogueSelectedIndex = choiceIndex

        if (selectedChoice.action === 'startSignalTrace') {
            this.dialogueSelectedIndex = 0
            this.dialogueNotice = ''
            this.prepareSignalTraceCanvasForFullscreen()
            this.signalTrace.startSignalTrace()
            this.syncFullscreenCanvas()
            this.syncBackButtons()
            return true
        }

        if (selectedChoice.action === 'copyText') {
            return this.copyText(selectedChoice.value)
        }

        if (selectedChoice.action === 'openUrl') {
            return this.openUrl(selectedChoice.url)
        }

        if (!selectedChoice.nextId) {
            return false
        }

        if (selectedChoice.nextId === 'start') {
            this.returnToMainMenu()
            return true
        }

        if (selectedChoice.nextId === this.currentNodeId) {
            return false
        }

        this.dialogueHistory.push({
            nodeId: this.currentNodeId,
            selectedIndex: choiceIndex
        })

        this.currentNodeId = selectedChoice.nextId
        this.dialogueSelectedIndex = 0
        this.dialogueNotice = ''
        this.draw()

        return true
    }

    /** Whether one canvas-space point lies inside a recorded choice rectangle. */
    isPointInsideHitArea(canvasX, canvasY, hitArea) {
        return (
            canvasX >= hitArea.x &&
            canvasX <= hitArea.x + hitArea.width &&
            canvasY >= hitArea.y &&
            canvasY <= hitArea.y + hitArea.height
        )
    }

    /** Activate the dialogue option drawn beneath one canvas-space point. */
    activateDialogueChoiceAt(canvasX, canvasY) {
        for (const hitArea of this.dialogueHitAreas) {
            if (
                this.isPointInsideHitArea(
                    canvasX,
                    canvasY,
                    hitArea
                )
            ) {
                return this.activateDialogueChoice(
                    hitArea.choiceIndex
                )
            }
        }

        return false
    }

    /** Routes a pointer press to dialogue choices or Signal Trace. */
    handlePointerDown(canvasX, canvasY) {
        const desktopControl = this.getDesktopControlAt(canvasX, canvasY)

        if (desktopControl) {
            this.desktopPressedControl = desktopControl.action
            this.drawDesktopControls()
            this.texture.needsUpdate = true
            return true
        }

        if (this.mode === 'signalTrace') {
            this.signalTrace.handlePointerDown(canvasX, canvasY)
            return true
        }

        return this.activateDialogueChoiceAt(canvasX, canvasY)
    }

    /** Signal Trace alone needs continuous pointer movement. */
    handlePointerMove(canvasX, canvasY) {
        if (this.desktopPressedControl) {
            return
        }

        if (this.mode !== 'signalTrace') {
            return
        }

        this.signalTrace.handlePointerMove(canvasX, canvasY)
    }

    /** Signal Trace alone needs pointer release coordinates. */
    handlePointerUp(canvasX, canvasY) {
        if (this.desktopPressedControl) {
            const pressedControl = this.desktopPressedControl
            const releasedControl = this.getDesktopControlAt(
                canvasX,
                canvasY
            )

            this.desktopPressedControl = null

            if (
                releasedControl &&
                releasedControl.action === pressedControl
            ) {
                this.activateDesktopControl(pressedControl)
            }
            else {
                this.drawDesktopControls()
                this.texture.needsUpdate = true
            }

            return
        }

        if (this.mode !== 'signalTrace') {
            return
        }

        this.signalTrace.handlePointerUp(canvasX, canvasY)
    }

    /** Cancel an active Signal Trace drag when pointer capture is lost. */
    handlePointerCancel() {
        if (this.desktopPressedControl) {
            this.desktopPressedControl = null
            this.drawDesktopControls()
            this.texture.needsUpdate = true
            return
        }

        if (this.mode !== 'signalTrace') {
            return
        }

        this.signalTrace.handlePointerCancel()
    }
    

    // ==========================================
    // 7. KEYBOARD LOGIC
    // ==========================================   
    // Terminal new workflow:

    // Get current node
    // ↓
    // Look at its choices
    // ↓
    // ArrowDown moves selection down
    // ↓
    // ArrowUp moves selection up
    // ↓
    // Enter follows selected choice.nextId
    // ↓
    // Left returns to the previous dialogue node

    handleKeyDown(event) {

    // Ignore keyboard input unless the user is currently focused on the terminal.
    if (this.experience.currPointName !== "Terminal") {
        return;
    }
    if (this.mode === "signalTrace") {
        if(event.key === "ArrowLeft") {
            this.goBack()
        }
        return
}


    // Get the current node from the terminal tree.
    // currentNodeId is the "address" of the current terminal screen.
    const currentNode = TerminalTree[this.currentNodeId];
    // Safety check.
    // If currentNodeId points to a missing node, redraw will show the error screen.
    // We return here so key input doesn't crash when trying to read choices.
    if (!currentNode) {
        this.draw();
        return;
    }


    // Some nodes might not have choices.
    // If choices is missing, we use an empty array so the rest of the code stays safe.
    const choices = currentNode.choices || []; // || falls back to the second choice if choices is missing
    // .choices refers to the array in TerminalTree that holds each object containing text and nextId
    const maxChoices = choices.length;

    // Universal Back key.
    // Left Arrow returns to the dialogue node visited immediately before this one.
    if (event.key === 'ArrowLeft') {
        this.goBack();
        return;
    }

    // If this node has no choices, there is nothing to navigate.
    if (maxChoices === 0) {
        return;
    }

    if (event.key === 'ArrowDown') {
        // Move the selected option down.
        // Modulo wraps back to 0 when we go past the last option.
        this.dialogueSelectedIndex = (this.dialogueSelectedIndex + 1) % maxChoices;
        this.draw();
    }

    else if (event.key === 'ArrowUp') {
        // Move the selected option up.
        // Adding maxChoices before modulo prevents negative index issues.
        this.dialogueSelectedIndex = (this.dialogueSelectedIndex - 1 + maxChoices) % maxChoices;
        this.draw();
    }

    else if (event.key === 'Enter') {
        this.activateDialogueChoice()
    }
}

    // ==========================================
    // 8. TERMINAL RENDERER
    // ==========================================

    // What draw does: 
    // 1. Clear the old frame.
    // 2. Fetch the current node.
    // 3. Decide the visual style.
    // 4. Decide where sections begin.
    // 5. Call wrapText when body text needs to be drawn.
    // 6. Draw the choices under the body.
    // 7. Tell Three.js: “upload this new canvas to the monitor texture.”

    draw() {
        this.dialogueHitAreas = []
        this.syncBackButtons()

        /**
         * Signal Trace and its menus draw centered text onto this same context.
         * Re-establish the dialogue renderer's text state so a previous screen
         * cannot shift dialogue content away from its intended coordinates.
         */
        this.ctx.textAlign = 'left'
        this.ctx.textBaseline = 'alphabetic'

        // ------------------------------------------
        // 1. CLEAR THE PREVIOUS FRAME
        // ------------------------------------------

        // Canvas does not automatically erase old text.
        // If we do not clear it, new text gets drawn on top of old text.
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ------------------------------------------
        // 2. FETCH CURRENT NODE
        // ------------------------------------------

        // currentNodeId is the key/address of the current terminal screen.
        // Example:
        // this.currentNodeId = "start"
        // node = TerminalTree["start"]
        const node = TerminalTree[this.currentNodeId];

        // ------------------------------------------
        // 3. SAFETY CHECK
        // ------------------------------------------

        // If a choice points to a node that does not exist,
        // show an error on the terminal instead of crashing silently.
        //
        // This is extremely useful while writing TerminalTree content.
        if (!node) {
            this.ctx.fillStyle = '#00FF41';
            this.ctx.font = '40px monospace';

            this.ctx.fillText('ERROR: NODE NOT FOUND', 50, 80);
            this.ctx.fillText(`Missing node: ${this.currentNodeId}`, 50, 130);

            this.drawDesktopControls()

            // Tell Three.js to update the monitor texture.
            this.texture.needsUpdate = true;
            this.drawMobileDialogue()
            return;
        }

        // ------------------------------------------
        // 4. DRAW HEADER
        // ------------------------------------------

        const paddingX = 70
        const headerFontSize = 60
        const bodyFontSize = 55
        const choiceFontSize = 50
        const bodyLineHeight = 58
        const choiceLineHeight = 68
        const highlightHeight = 56

        // Terminal green.
        this.ctx.fillStyle = '#00FF41';

        // Header font size.
        this.ctx.font = `${headerFontSize}px monospace`

        // If the node has a custom header, draw it.
        // Otherwise use a generic fallback.
        if (node.header) {
            this.ctx.fillText(node.header, paddingX, 135)
        } else {
            this.ctx.fillText('TERMINAL', paddingX, 135)
        }
        // Simple divider line below the header.
        this.ctx.fillText('---------------------------------', paddingX, 170)

        // ------------------------------------------
        // 5. DRAW BODY TEXT
        // ------------------------------------------

        // Body text font size.
        this.ctx.font = `${bodyFontSize}px monospace`

        // cursorY tracks where the next thing should be drawn.
        // We start below the header.
        let cursorY = 240;

         // Draw the node's main text if it exists.
        let dialogueText = node.aiText || ''

        if (this.dialogueNotice) {
            dialogueText += `\n\n${this.dialogueNotice}`
        }

        if (dialogueText) {
            const maxTextWidth = this.canvas.width - paddingX * 2.6

            cursorY = this.drawWrappedText(
                dialogueText,
                paddingX,
                cursorY,
                maxTextWidth,
                bodyLineHeight
            )

            // Add extra spacing between body text and choices.
            cursorY += 45
        }

        this.ctx.font = `${choiceFontSize}px monospace`

          // Only draw choices if this node actually has choices.
        if (node.choices && node.choices.length > 0) {
            let hasSignalTraceLauncher = false
            let isSignalTraceSelected = false
            let signalTraceChoiceIndex = -1

            for (let i = 0; i < node.choices.length; i++) {
                const choice = node.choices[i]
                const isSelected =
                    i === this.dialogueSelectedIndex

                /**
                 * Signal Trace is a full game, so its action receives a
                 * dedicated launch module instead of the generic text row.
                 */
                if (choice.action === 'startSignalTrace') {
                    hasSignalTraceLauncher = true
                    isSignalTraceSelected = isSelected
                    signalTraceChoiceIndex = i

                    continue
                }

                this.dialogueHitAreas.push({
                    choiceIndex: i,
                    x: paddingX - 25,
                    y: cursorY - 50,
                    width: 1200,
                    height: choiceLineHeight
                })

                // If this choice is currently selected,
                // draw a green highlight bar behind it.
                if (isSelected) {
                    this.ctx.fillStyle = '#00FF41'

                    // Highlight rectangle.
                    this.ctx.fillRect(
                        paddingX - 15,
                        cursorY - 39,
                        1120,
                        highlightHeight
                    )

                    // Selected text becomes dark so it is readable on the green bar.
                    this.ctx.fillStyle = '#050505'
                    this.ctx.fillText(`> ${choice.text}`, paddingX, cursorY)
                } else {
                    // Normal unselected choice.
                    this.ctx.fillStyle = '#00FF41'
                    this.ctx.fillText(`  ${choice.text}`, paddingX, cursorY)
                }

                // Move down before drawing the next choice.
                cursorY += choiceLineHeight
            }

            /**
             * The game launcher is rendered after the normal dialogue list
             * and anchored independently to the bottom of the terminal.
             */
            if (hasSignalTraceLauncher) {
                const signalTracePanelWidth =
                    this.canvas.width - paddingX * 2

                const signalTraceBounds = this.drawSignalTraceLauncher(
                    paddingX,
                    signalTracePanelWidth,
                    isSignalTraceSelected
                )

                this.dialogueHitAreas.push({
                    choiceIndex: signalTraceChoiceIndex,
                    x: signalTraceBounds.x,
                    y: signalTraceBounds.y,
                    width: signalTraceBounds.width,
                    height: signalTraceBounds.height
                })
            }
        }

        this.drawDesktopControls()

        // ------------------------------------------
        // 7. SEND UPDATED CANVAS TO GPU
        // ------------------------------------------

        // The 2D canvas changed in browser memory.
        // Three.js does not automatically upload those changed pixels to the GPU.
        //
        // This flag tells Three.js:
        // "The texture changed. Upload the new canvas pixels before rendering."
        this.texture.needsUpdate = true;
        this.drawMobileDialogue()
    }
}

    // ==========================================
    // 5. THE RENDER ENGINE
    // ==========================================
    // Every time a single letter changes, this entire function runs to rebuild the 1024x1024 image.
    // draw() {
    //     // 1. WIPE THE CANVAS
    //     // We must paint a giant black box over the entire canvas first, or the new text will just 
    //     // draw directly on top of the old text, creating a blurry, unreadable mess.
    //     this.ctx.fillStyle = '#050505';
    //     this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // draw a rectangle to erase the previous screen


    //     // 2.FETCH: Get the current node from the Database
    //     const node = SystemDatabase[this.currentNodeId];


    //     // 3. RENDER HEADER
    //     this.ctx.fillStyle = '#00FF41';
    //     this.ctx.font = '28px monospace';
    //     this.ctx.fillText(node.header, 50, 80);
    //     this.ctx.fillText('------------------------', 50, 110);

    //     // 4. RENDER BODY
    //     // We use the wrapper to handle paragraphs, returning the final Y position
    //     let cursorY = this.wrapText(node.bodyText, 50, 180, 900, 40) + 60;

    //     // 5. RENDER CHOICES (The generic UI loop)
    //     node.choices.forEach((choice, index) => {
    //         if (index === this.dialogueSelectedIndex) {
    //             // Highlighted 
    //             this.ctx.fillStyle = '#00FF41';
    //             this.ctx.fillRect(40, cursorY - 30, 900, 40);
    //             this.ctx.fillStyle = 'black';
    //             this.ctx.fillText(`> ${choice.text}`, 50, cursorY);
    //         } else {
    //             // Normal
    //             this.ctx.fillStyle = '#00FF41';
    //             this.ctx.fillText(`  ${choice.text}`, 50, cursorY);
    //         }
    //         cursorY += 50;
    //     });

    // 3. RENDER BASED ON CURRENT MODE
    // We use a switch statement to ask the State Machine what we should be drawing right now.
