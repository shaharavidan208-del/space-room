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
        this.canvas.width = 1920;
        this.canvas.height = 1200;

        // Get the 2D drawing context.
        // This is the "brush" we use to draw text, rectangles, highlights, etc.
        this.ctx = this.canvas.getContext('2d');

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
        this.signalTrace = new SignalTrace(this);
        // Set up keyboard input and draw the first frame immediately.
        this.setupHiddenInput();
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
        this.ctx.font = '34px monospace'
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
        this.ctx.font = '38px monospace'
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

        this.ctx.font = '38px monospace'
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

        this.ctx.font = 'bold 46px monospace'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(
            launchText,
            launchX + launchWidth / 2,
            launchY + 69
        )

        this.ctx.textAlign = 'left'
        this.ctx.fillStyle = footerColor

        this.ctx.font = '32px monospace'
        this.ctx.fillText(
            footerText,
            launchX,
            panelTop + 248
        )

        this.ctx.restore()
    }

    // ==========================================
    // 6. RETURN TO ROOT MENU
    // ==========================================


        returnToMainMenu() {
    this.currentNodeId = 'start';
    this.dialogueSelectedIndex = 0;
    this.draw();
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
    // Left returns to main menu

    handleKeyDown(event) {

    // Ignore keyboard input unless the user is currently focused on the terminal.
    if (this.experience.currPointName !== "Terminal") {
        return;
    }
    if (this.mode === "signalTrace") {
        if(event.key === "ArrowLeft") {
            this.mode = "dialogue"
            this.returnToMainMenu()
        }
        return
}


    // Get the current node from the terminal tree.
    // currentNodeId is the "address" of the current terminal screen.
    const currentNode = TerminalTree[this.currentNodeId];
    console.log(currentNode)
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

    // Universal escape key.
    // No matter where the user is in the terminal tree, Escape returns to the root menu.
    if (event.key === 'ArrowLeft') {
        this.returnToMainMenu();
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
        // Get the currently highlighted choice.
        const selectedChoice = choices[this.dialogueSelectedIndex];
        if(selectedChoice.action === "startSignalTrace") // If the current highlighted choice is Signal Trace then we initiate the game
        {
            this.dialogueSelectedIndex = 0 // temporary, because for now we're not in the dialogue tree anymore
            this.signalTrace.startSignalTrace()
            return
        }

        // If the selected choice has a nextId, move to that node.
        if (selectedChoice.nextId) {
            this.currentNodeId = selectedChoice.nextId;

            // Reset cursor to the first option of the new node.
            this.dialogueSelectedIndex = 0;

            this.draw();
        }
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
            this.ctx.font = '30px monospace';

            this.ctx.fillText('ERROR: NODE NOT FOUND', 50, 80);
            this.ctx.fillText(`Missing node: ${this.currentNodeId}`, 50, 130);

            // Tell Three.js to update the monitor texture.
            this.texture.needsUpdate = true;
            return;
        }

        // ------------------------------------------
        // 4. DRAW HEADER
        // ------------------------------------------

        const paddingX = 70
        const headerFontSize = 60
        const bodyFontSize = 50
        const choiceFontSize = 45
        const bodyLineHeight = 56
        const choiceLineHeight = 62
        const highlightHeight = 52

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
        if (node.aiText) {
            const maxTextWidth = this.canvas.width - paddingX * 2.6

            cursorY = this.drawWrappedText(
                node.aiText,
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

                    continue
                }

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

                this.drawSignalTraceLauncher(
                    paddingX,
                    signalTracePanelWidth,
                    isSignalTraceSelected
                )
            }
        }

        // ------------------------------------------
        // 7. SEND UPDATED CANVAS TO GPU
        // ------------------------------------------

        // The 2D canvas changed in browser memory.
        // Three.js does not automatically upload those changed pixels to the GPU.
        //
        // This flag tells Three.js:
        // "The texture changed. Upload the new canvas pixels before rendering."
        this.texture.needsUpdate = true;
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

