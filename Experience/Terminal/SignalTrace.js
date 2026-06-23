import SignalTracePipeRenderer from './SignalTracePipeRenderer.js'
export default class SignalTrace {
    constructor(terminal) {
        this.terminal = terminal;  // store a reference to the terminal 
        this.isRunning = false;  // Track whether Signal Trace is currently active.
        // Borrow the terminal's canvas.
        // SignalTrace will draw onto the same canvas that is already used as the monitor texture.
        this.canvas = this.terminal.canvas;
        

        // Borrow the 2D drawing context.
        // This is what lets us draw text, rectangles, grid lines, pipes, etc.
        this.ctx = this.terminal.ctx;

        // Borrow the terminal texture.
        // After drawing to the canvas, we need to tell Three.js that the texture changed.
        this.texture = this.terminal.texture;


       
        /**
         * Grid propeties
         */
        this.rows = 5
        this.cols = 5
        this.tileSize = 120
        this.tileGap = 8
        this.boardStartY = 320

        this.source = { row: 2, col: 0 } // source starts in the middle-left
        this.target = { row: 2, col: 4 } // target/archive is in the middle-right

        /**
        * Cursor position.
        * This represents the currently selected tile.
        * For now it starts in the center of the board.
        * the range is between 0 and 4 for now
        */
        this.cursor = { row: 2, col: 2 }
         this.pipeRenderer = new SignalTracePipeRenderer(
    this.ctx,
    this.tileSize,
    this.tileGap
)
        /**
 * Temporary pipe grid.
 * Each tile stores which directions its pipe connects to.
 * For now, this is only for drawing static pipes.
 * Later, rotation will change these connections.
 */
        this.grid = this.createTestGrid()
    }

    startSignalTrace() {
        this.isRunning = true;
        this.terminal.mode = "signalTrace"
        // Draw a temporary startup screen.
        this.drawBootScreen();
    }

    drawBootScreen() {
        /**
         * Background styling
         */
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height) // clear the whole terminal screen
        this.ctx.fillStyle = "#031416" 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height) // fill the rect with the current fillStyle

        /**
         * Title styling
         */
        this.ctx.fillStyle = "#00FF41"
        this.ctx.font = "32px monospace";
        this.ctx.textAlign = "left";
        this.ctx.fillText("SIGNAL TRACE ONLINE", 80, 120);


        // Draw temporary status text.
        this.ctx.fillStyle = "#8fb7b0";
        this.ctx.font = "28px monospace";
        this.ctx.fillText("ARCHIVE RECOVERY PROTOCOL INITIALIZED", 80, 170);

        // Temporary instruction text.
        this.ctx.fillStyle = "#4f7f78";
        this.ctx.font = "28px monospace";
        this.ctx.fillText("Awaiting signal grid initialization...", 80, 230);
        this.drawBoardPlaceholder()

        // Tell Three.js that the canvas texture changed.
        this.texture.needsUpdate = true;
    }

    drawBoardPlaceholder() {
        /**
         * Calculate the full board width.
         */
        const boardWidth = this.cols * this.tileSize + (this.cols - 1) * this.tileGap
        // calculate the width by calculating total amount of columns multiplied by the tile size
        // also add to the calculation the columns * the gaps, but reduct one gap since the board has this.cols - 1 gaps

        /**
         * Center the board horizontally on the terminal canvas.
         */
        const boardStartX = (this.canvas.width - boardWidth) / 2

        /**
         * Draw every tile in the grid.
         */
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = boardStartX + col * (this.tileSize + this.tileGap) // determine the x position for the next tile
                // the position is calculated by the size of the tile + its gap, multiplied by the column
                // first tile starts at boardStartX
                const y = this.boardStartY + row * (this.tileSize + this.tileGap) // same logic as with x 


                /**
                 * Default tile background.
                 */
                this.ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize)

                /**
                 * Default tile border.
                 */
                this.ctx.strokeStyle = "rgba(0, 255, 65, 0.22)" // border style
                
                this.ctx.lineWidth = 10 // lineWidth controls how thick the outline is.
                this.ctx.strokeRect(x, y, this.tileSize, this.tileSize) // this draws the actual rectangle

                /**
 * Draw the pipe inside this tile.
 * The tile data comes from this.grid using the current row/col.
 * This must happen after the tile background, otherwise the background covers it.
 */
                const tile = this.grid[row][col]
                this.pipeRenderer.drawPipe(x, y, tile)

                // If this tile is currently selected, draw a brighter cursor border.
                if (row === this.cursor.row && col === this.cursor.col) {
                    this.drawCursor(x, y)
                }

                /**
                 * If this tile is the source, draw the source node.
                 */
                if (row === this.source.row && col === this.source.col) {
                    this.drawNode(x, y, "#00ff99", "SRC")
                }

                /**
                 * If this tile is the target, draw the archive node.
                 */
                if (row === this.target.row && col === this.target.col) {
                    this.drawNode(x, y, "#ff8a3d", "ARC") // At tile position x/y,
                    // draw a glowing green node,
                    // with the label SRC.
                }
            }
        }
    }
    /**
     * 
     * @param {number} x - the tile's top-left X position
     * @param {number} y - the tile's top-left Y position
     * @param {String} color - the node color, like green for SRC or orange for ARC
     * @param {String} label - the text under the node, like "SRC" or "ARC"
     */
    drawNode(x, y, color, label) {
        const centerX = x + this.tileSize / 2
        const centerY = y + this.tileSize / 2

        /**
         * Draw a soft glow behind the node.
         */
        this.ctx.save() // saves the current canvas drawing state. we'll use restore() later when we want to go back to the previous settings
        this.ctx.shadowColor = color // draw the glow
        this.ctx.shadowBlur = 18

        /**
         * Draw the node circle.
         */
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.arc(centerX, centerY - 6, 13, 0, Math.PI * 2) // create the circle
        this.ctx.fill()

        this.ctx.restore() // restores the old canvas drawing state from before save().
        // It removes the shadow settings so the next things you draw don’t accidentally glow too.

        /**
         * Draw the node label.
         */
        this.ctx.fillStyle = "#d8fff7"
        this.ctx.font = "26px monospace"
        this.ctx.textAlign = "center"
        this.ctx.fillText(label, centerX, centerY + 24)
    }

    drawCursor(x, y) {
        /**
         * Save the current canvas drawing state.
         * The cursor uses stronger glow/stroke settings,
         * and we don't want those settings leaking into other drawings.
         */
        this.ctx.save()

        /**
         * Cursor glow.
         * This makes the selected tile feel active.
         */
        this.ctx.shadowColor = "#d8fff7"
        this.ctx.shadowBlur = 2

        /**
         * Bright cursor border.
         */
        this.ctx.strokeStyle = "#d8fff7"
        this.ctx.lineWidth = 12

        /**
         * Draw the cursor slightly inside the tile.
         * This prevents the cursor from being clipped or fighting too much
         * with the thick default tile border.
         */
        this.ctx.strokeRect(
            x + 8,
            y + 8,
            this.tileSize - 16,
            this.tileSize - 16
        )

        /**
         * Restore the old drawing state.
         */
        this.ctx.restore()
    }

    handleKeyDown(event) {
        /**
         * Arrow keys should move the selected tile cursor.
         * For now, movement is the only gameplay input.
         */

        if (event.key === "ArrowUp") {
            this.moveCursor(-1, 0)
            return
        }

        if (event.key === "ArrowDown") {
            this.moveCursor(1, 0)
            return
        }

        if (event.key === "ArrowLeft") {
            this.moveCursor(0, -1)
            return
        }

        if (event.key === "ArrowRight") {
            this.moveCursor(0, 1)
            return
        }
    }

    moveCursor(rowChange, colChange) {
        /**
         * Calculate where the cursor wants to move.
         * We do not apply it immediately, because first we need to check boundaries.
         */
        const nextRow = this.cursor.row + rowChange
        const nextCol = this.cursor.col + colChange

        /**
         * Prevent moving above the first row.
         */
        if (nextRow < 0) {
            return
        }

        /**
         * Prevent moving below the last row.
         */
        if (nextRow >= this.rows) {
            return
        }

        /**
         * Prevent moving left of the first column.
         */
        if (nextCol < 0) {
            return
        }

        /**
         * Prevent moving right of the last column.
         */
        if (nextCol >= this.cols) {
            return
        }

        /**
         * The move is valid, so update the cursor position.
         */
        this.cursor.row = nextRow
        this.cursor.col = nextCol

        /**
         * Redraw the Signal Trace screen so the cursor appears in its new position.
         */
        this.drawBootScreen()
    }

    

  createTestGrid() {
    /**
     * Temporary test layout.
     * This creates a path with corners so we can test curved pipe rendering.
     *
     * Path:
     * SRC -> right -> up -> right -> right -> down -> right -> ARC
     */
    return [
        [
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] }
        ],
        [
            { connections: [] },
            { connections: ["down", "right"] },
            { connections: ["left", "right"] },
            { connections: ["left", "down"] },
            { connections: [] }
        ],
        [
            { connections: ["right"] },
            { connections: ["left", "up"] },
            { connections: [] },
            { connections: ["up", "right"] },
            { connections: ["left"] }
        ],
        [
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] }
        ],
        [
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] },
            { connections: [] }
        ]
    ]
}
   

    
}