import SignalTracePipeRenderer from './SignalTracePipeRenderer.js'
import SignalTraceRotationPulse from './SignalTraceRotationPulse.js'
import SignalTraceLevelOne from './SignalTraceLevelOne.js'
import SignalTraceLevelTwo from './SignalTraceLevelTwo.js'
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

        this.level = new SignalTraceLevelTwo()

        /**
 * Grid properties.
 * rows/cols/source/target come from the current level.
 */
        this.rows = this.level.rows
        this.cols = this.level.cols

        this.tileSize = 120
        this.tileGap = 8
        this.boardStartY = 320

        /**
         * Copy the level endpoints into SignalTrace.
         * SignalTrace uses these for drawing and path checking.
         */
        this.source = {
            row: this.level.source.row,
            col: this.level.source.col
        }

        this.target = {
            row: this.level.target.row,
            col: this.level.target.col
        }
        /**
        * Cursor position.
        * This represents the currently selected tile.
        * For now it starts in the center of the board.
        * the range is between 0 and 4 for now
        */
        this.cursor = { row: 2, col: 2 }

        /**
         * Handles the short pulse feedback effect when a tile rotates.
         * SignalTrace owns the gameplay state, while this class owns the pulse animation.
         * The rotation pulse is drawn above the pipe, but below the cursor, so it does not obscure the cursor.
         */
        this.rotationPulse = new SignalTraceRotationPulse(
            this.ctx,
            this.tileSize,
            () => {
                this.drawBootScreen()
            }
        )

        this.pipeRenderer = new SignalTracePipeRenderer(
            this.ctx,
            this.tileSize,
            this.tileGap
        )
        /**
 * Whether the current pipe layout creates
 * a valid signal path from SRC to ARC.
 */
        this.signalConnected = false

        /**
 * Create the current level grid.
 * 2D array of tile objects, each with a connections array that lists the directions of the pipes in that tile
 * SignalTrace owns the active grid state after this point,
 * because rotations will mutate this grid.
 */
        this.grid = this.level.createGrid()

        /**
         * Check the starting board state.
         * This lets the status text be correct immediately when Signal Trace opens.
         */
        this.signalConnected = this.checkSignalPath()
        /**
 * Current Signal Trace level.
 * The level class owns the puzzle layout data.
 */

    }


    /**
     * Go from dialogue into Signal Trace mode in the terminal
     */
    startSignalTrace() {
        this.isRunning = true;
        this.terminal.mode = "signalTrace"
        // Draw a temporary startup screen.
        this.drawBootScreen();
    }


    /**
     * Draw the initial Signal Trace screeen with title, status, and board.
     * This is called when Signal Trace first starts,
     * and also whenever the screen needs to be redrawn.
     */
    drawBootScreen() {
        /**
         * Background styling
         */
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height) // clear the whole terminal screen
        this.ctx.fillStyle = "#050505"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height) // fill the rect with the current fillStyle

        /**
         * Title styling
         */
        this.ctx.fillStyle = "#00FF41"
        this.ctx.font = "32px monospace";
        this.ctx.textAlign = "left";
        this.ctx.fillText("SIGNAL TRACE ONLINE", 80, 120);


        // Draw temporary status text.
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.72)"
        this.ctx.font = "28px monospace";
        this.ctx.fillText("ARCHIVE RECOVERY PROTOCOL INITIALIZED", 80, 170);

        // Temporary instruction text.
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.42)"
        this.ctx.font = "28px monospace";
        /**
 * Draw current signal connection status and controls.
 */
        this.drawSignalStatusText()

        this.drawBoardPlaceholder()

        // Tell Three.js that the canvas texture changed.
        this.texture.needsUpdate = true;
    }


    /**
     * Draw the current signal connection status and controls.
     * This is called whenever the status changes, like after a tile rotation.
     * It is also called once when Signal Trace first starts.
     */
    drawSignalStatusText() {
        /**
         * Default status is disconnected.
         * We only switch to connected if signalConnected is true.
         */
        let statusText = "SIGNAL LINK: BROKEN"
        let statusColor = "rgba(255, 138, 61, 0.78)"

        /**
         * If the source can reach the archive,
         * show the successful signal status.
         */
        if (this.signalConnected) {
            statusText = "SIGNAL LINK: ESTABLISHED"
            statusColor = "rgba(0, 255, 65, 0.82)"
        }

        /**
         * Draw the status line.
         */
        this.ctx.fillStyle = statusColor
        this.ctx.font = "28px monospace"
        this.ctx.textAlign = "left"
        this.ctx.fillText(statusText, 700, 230)

        /**
         * Draw control hint under the status.
         * This is useful now that the puzzle is interactive.
         */
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.38)"
        this.ctx.font = "22px monospace"
        this.ctx.fillText("ARROWS: MOVE  //  SPACE: ROTATE MODULE", 80, 270)
    }


    /**
     * Redraw the full Signal Trace screen without any pulse effect.
     * This is called after a pulse finishes, so the tile returns to normal.
     */
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
                this.ctx.fillStyle = "rgba(0, 255, 65, 0.035)"
                this.ctx.fillRect(x, y, this.tileSize, this.tileSize)

                /**
                 * Default tile border.
                 */
                this.ctx.strokeStyle = "rgba(0, 255, 65, 0.13)"
                this.ctx.lineWidth = 8
                this.ctx.strokeRect(x, y, this.tileSize, this.tileSize) // this draws the actual rectangle

                /**
 * Draw the pipe inside this tile.
 * The tile data comes from this.grid using the current row/col.
 * This must happen after the tile background, otherwise the background covers it.
 */
                const tile = this.grid[row][col]
                this.pipeRenderer.drawPipe(x, y, tile)

                /**
                 * If this tile was recently rotated, draw a short pulse effect.
                 * This happens after the pipe is drawn, so the glow appears above the pipe.
                 * It happens before the cursor, so the cursor stays readable.
                 */
                this.rotationPulse.draw(x, y, row, col)

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
     * Draw a node at the specified position.
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
        this.ctx.fillStyle = "#d8ffdc"
        this.ctx.font = "26px monospace"
        this.ctx.textAlign = "center"
        this.ctx.fillText(label, centerX, centerY + 24)
    }


    /**
     * Draw the cursor at the specified position.
     * @param {number} x - the tile's top-left X position
     * @param {number} y - the tile's top-left Y position
     */
    drawCursor(x, y) {
        /**
         * Draw a corner-bracket cursor instead of a full rectangle.
         * This highlights the selected tile without covering the pipe details.
         */
        this.ctx.save()

        /**
         * Cursor style.
         * It should be readable, but not dominate the pipe.
         */
        this.ctx.strokeStyle = "rgba(216, 255, 220, 0.9)"
        this.ctx.lineWidth = 1
        this.ctx.shadowColor = "#00FF41"
        this.ctx.shadowBlur = 1
        this.ctx.lineCap = "square"

        /**
         * Cursor padding from the tile edge.
         * Higher value = cursor moves inward.
         */
        const padding = 10

        /**
         * Length of each corner bracket arm.
         */
        const cornerLength = 26

        const left = x + padding
        const right = x + this.tileSize - padding
        const top = y + padding
        const bottom = y + this.tileSize - padding

        this.ctx.beginPath()

        /**
         * Top-left corner.
         */
        this.ctx.moveTo(left + cornerLength, top)
        this.ctx.lineTo(left, top)
        this.ctx.lineTo(left, top + cornerLength)

        /**
         * Top-right corner.
         */
        this.ctx.moveTo(right - cornerLength, top)
        this.ctx.lineTo(right, top)
        this.ctx.lineTo(right, top + cornerLength)

        /**
         * Bottom-right corner.
         */
        this.ctx.moveTo(right, bottom - cornerLength)
        this.ctx.lineTo(right, bottom)
        this.ctx.lineTo(right - cornerLength, bottom)

        /**
         * Bottom-left corner.
         */
        this.ctx.moveTo(left + cornerLength, bottom)
        this.ctx.lineTo(left, bottom)
        this.ctx.lineTo(left, bottom - cornerLength)

        this.ctx.stroke()

        this.ctx.restore()
    }


    /**
     * Handle key down events for the Signal Trace screen.
     * @param {KeyboardEvent} event - the key down event
     * @returns {boolean} - true if the event was handled, false otherwise (handled means we return early and don't let the browser do its default behavior) 
     */
    handleKeyDown(event) {
        /**
         * Arrow keys move the selected tile cursor.
         * Space rotates the currently selected pipe tile.
         */

        if (event.key === "ArrowUp") {
            this.moveCursor(-1, 0)
            return
        }

        else if (event.key === "ArrowDown") {
            this.moveCursor(1, 0)
            return
        }

        else if (event.key === "ArrowLeft") {
            this.moveCursor(0, -1)
            return
        }

        else if (event.key === "ArrowRight") {
            this.moveCursor(0, 1)
            return
        }


        if (event.key === " ") { // Space key (why empty string? Because event.key is a string with the space character)
            event.preventDefault() // preventDefault() stops the browser from treating Space as a scroll command
            this.rotateSelectedTile() // Rotate the selected tile
            return // Return early to prevent the browser from doing its default behavior 
        }
    }


    /**
     * Rotation logic for the currently selected tile.
     * Rotate the currently selected tile, if it is not the source or target.
     * This changes the game state and triggers a redraw of the screen.
     * @returns {void} 
     */
    rotateSelectedTile() {
        /**
         * Get the currently selected tile position.
         */
        const row = this.cursor.row
        const col = this.cursor.col

        /**
         * Do not rotate the source tile.
         * The source is a fixed starting point for the signal.
         */
        if (row === this.source.row && col === this.source.col) {
            return
        }

        /**
         * Do not rotate the target/archive tile.
         * The archive is a fixed endpoint for the signal.
         */
        if (row === this.target.row && col === this.target.col) {
            return
        }

        /**
         * Get the tile from the grid.
         */
        const tile = this.grid[row][col] // each tile is an object with a "connections" array that lists the directions of the pipes in that tile

        if (!tile) {
            return // If the tile does not exist, do nothing.) 
        }

        /**
         * Empty tiles have no pipe to rotate.
         */
        if (!tile.connections || tile.connections.length === 0) {
            return
        }

        /**
         * Build a new list of rotated connections.
         *
         * Example:
         * "up" becomes "right"
         * "right" becomes "down"
         * "down" becomes "left"
         * "left" becomes "up"
         */
        const rotatedConnections = [] // make a new array to hold the rotated connections, because we don't want to modify the original array while we're iterating over it.

        /**
         * Loop through each connection direction in the connections array in tile and rotate it clockwise.
         * The rotated direction is pushed into the new array.
         */
        for (const direction of tile.connections) {
            const rotatedDirection = this.rotateDirectionClockwise(direction) // rotate the direction clockwise
            rotatedConnections.push(rotatedDirection) // add the rotated direction to the new array
        }

        /**
        * Replace the tile's old connections with the rotated ones.
        * This changes the actual game state.
        */
        tile.connections = rotatedConnections

        this.signalConnected = this.checkSignalPath() // Check if the signal connects now or if connection broke since the last rotation.

        /**
         * Temporary debug log.
         */
        console.log("SIGNAL CONNECTED:", this.signalConnected)

        /**
         * Start a short pulse effect on the rotated tile.
         * The pulse animation handles redrawing the screen.
         */
        this.rotationPulse.start(row, col)
    }


    /**
     * Rotate a connection direction clockwise.
     * @param {String} direction - the current connection direction ("up", "down", "left", "right") 
     * @returns {String} - the rotated connection direction
     */

    rotateDirectionClockwise(direction) {
        /**
         * Convert one connection direction into its clockwise version.
         *
         * This represents rotating the whole pipe tile 90 degrees clockwise.
         */
        if (direction === "up") {
            return "right"
        }

        if (direction === "right") {
            return "down"
        }

        if (direction === "down") {
            return "left"
        }

        if (direction === "left") {
            return "up"
        }

        /**
         * Fallback.
         * If an unknown direction somehow appears, return it unchanged
         * instead of breaking the game.
         */
        return direction
    }

    /**
     * This method checks whether the signal can travel
     * from the source tile to the target/archive tile.
     * It does not draw anything.
     * It only returns true or false.
     */
    checkSignalPath() {

        /**
         * Visited Tracks which grid positions have already been checked.
         * This prevents the path search from looping forever through connected pipes.
         * Positions are stored as strings like "2,3" because Set values are unique and fast to check with visited.has(positionKey).
         * and fast to check with visited.has(positionKey).
         */
        const visited = new Set()

        /**
         * This is an array of objects that represent the row/col positions of tiles to check.
         * The stack stores tiles that still need to be checked.
         * We start from the source tile.
         */
        const stack = [
            {
                row: this.source.row, // start the search from the source tile (row 4, col 0)
                col: this.source.col // the source tile is the starting point for the signal
            }
        ]


        /**
         * Keep searching while there are still tiles to check.
         */
        while (stack.length > 0) {
            console.log("Stack length before pop:", stack.length)
            console.log("Stack before pop:", [...stack])
            /**
             * Take one tile position from the stack.
             */
            const currentPosition = stack.pop() // pop() removes the last element from the stack and returns it. this is the current tile we are checking.
            console.log("Popped position:", currentPosition)
            console.log("Stack length after pop:", stack.length)
            console.log("Stack after pop:", [...stack]) // ...stack creates a shallow copy of the stack array for logging, so we can see the state of the stack after popping.
            const row = currentPosition.row
            const col = currentPosition.col

            /**
             * Create a unique text key for this tile position.
             */
            const positionKey = `${row},${col}` // create a unique string key for the current tile position, like "2,3" for row 2, col 3
            // $ means we are using a template literal, which allows us to embed expressions inside a string. the backticks `` allow us to use ${} to insert variables into the string.
            /**
             * If we already checked this tile, skip it.
             */


            /**
            * If this position was already processed, skip it.
            * This prevents loops and avoids checking the same tile twice
            * when multiple pipe branches lead to the same position.
            */
            if (visited.has(positionKey)) {
                continue
            }

            /**
             * Mark this tile as checked.
             */
            visited.add(positionKey)

            /**
             * If this tile is the archive/target,
             * the signal path is complete.
             */
            if (this.isTargetPosition(row, col)) {
                return true
            }
            /**
             * Get the current tile from the grid.
             */
            const currentTile = this.grid[row][col]
            /**
             * If the tile does not exist, skip it.
             */
            if (!currentTile) {
                continue
            }
            /**
             * If the tile has no pipe connections, the signal cannot continue.
             */
            if (!currentTile.connections || currentTile.connections.length === 0) {
                continue
            }



            /**
             * Now we know the current tile exists and has connections.
             * so we can try to move the signal through each connection direction.
             * The signal can only continue if the neighbor tile exists and connects back to the current tile.
             * Try moving through each connection direction.
             */
            for (const direction of currentTile.connections) {
                const neighborPosition = this.getNeighborPosition(row, col, direction) // get the row/col of the neighboring tile in the current direction

                /**
                 * If the neighbor would be outside the board, ignore it.
                 */
                if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                    continue
                }

                const neighborTile = this.grid[neighborPosition.row][neighborPosition.col] // get the neighboring tile from the grid

                /**
                 * The current tile and neighbor tile must connect to each other.
                 */
                if (!this.tilesConnect(currentTile, neighborTile, direction)) {
                    continue
                }

                const neighborKey = `${neighborPosition.row},${neighborPosition.col}`

                /**
                 * If we have not already checked this neighbor,
                 * add it to the stack so the signal can continue from there.
                 */
                if (!visited.has(neighborKey)) {
                    stack.push(neighborPosition)
                }
            }
        }

        /**
         * If the search ends without reaching the target,
         * there is no complete signal path.
         */
        return false
    }

    /**
     * Check whether a row/col position is the archive target.
     * @param {*Number} row the row index of the tile to check
     * @param {*Number} col the column index of the tile to check
     * @returns {boolean} true if the position is the target, false otherwise
     */
    isTargetPosition(row, col) {
        /**
         * Check whether a row/col position is the archive target.
         */
        if (row === this.target.row && col === this.target.col) {
            return true
        }

        return false
    }

    /**
     * Check if a row/col position exists inside the grid.
     * @param {*Number} row the row index to check
     * @param {*Number} col the column index to check
     * @returns {boolean} true if the position is inside the board, false otherwise
     */
    isInsideBoard(row, col) {
        /**
         * Check if a row/col position exists inside the grid.
         */

        if (row < 0) {
            return false
        }

        if (row >= this.rows) {
            return false
        }

        if (col < 0) {
            return false
        }

        if (col >= this.cols) {
            return false
        }

        return true
    }


    /**
     * Get the row and column of the neighboring tile in the specified direction.
     * We need this for pathfinding, because the signal can only move through connected pipes.
     * @param {*Number} row the row index of the current tile
     * @param {*Number} col the column index of the current tile
     * @param {*String} direction the direction to move (up, down, left, right)
     * @returns {Object} the row and column of the neighboring tile
     */
    getNeighborPosition(row, col, direction) {
        /**
         * Convert a direction into the neighboring grid position.
         *
         * up    = row - 1
         * down  = row + 1
         * left  = col - 1
         * right = col + 1
         */

        if (direction === "up") {
            return {
                row: row - 1,
                col: col
            }
        }

        if (direction === "down") {
            return {
                row: row + 1,
                col: col
            }
        }

        if (direction === "left") {
            return {
                row: row,
                col: col - 1
            }
        }

        if (direction === "right") {
            return {
                row: row,
                col: col + 1
            }
        }

        /**
         * Fallback.
         * If an unknown direction appears, stay in the same position.
         */
        return {
            row: row,
            col: col
        }
    }

    /**
     * Get the opposite direction of the specified direction.
     * We need this for pathfinding, because the signal can only move through connected pipes.
     * @param {*String} direction the direction to get the opposite of
     * @returns {String} the opposite direction
     */
    getOppositeDirection(direction) {
        /**
         * The neighbor must connect back from the opposite side.
         */

        if (direction === "up") {
            return "down"
        }

        if (direction === "down") {
            return "up"
        }

        if (direction === "left") {
            return "right"
        }

        if (direction === "right") {
            return "left"
        }

        /**
         * Unknown direction fallback.
         */
        return null
    }

    /**
     * Check whether two tiles are connected in the specified direction.
     * @param {*Object} currentTile the tile to check
     * @param {*Object} neighborTile the neighboring tile to check
     * @param {*String} direction the direction to check
     * @returns {boolean} true if the tiles are connected, false otherwise
     */
    tilesConnect(currentTile, neighborTile, direction) {
        /**
         * Check whether the current tile and neighbor tile
         * actually connect to each other.
         *
         * Example:
         * current exits right.
         * neighbor must have left.
         */

        if (!currentTile) {
            return false
        }

        if (!neighborTile) {
            return false
        }

        if (!currentTile.connections) {
            return false
        }

        if (!neighborTile.connections) {
            return false
        }

        /**
         * The current tile must have the direction we are trying to travel through.
         */
        if (!currentTile.connections.includes(direction)) {
            return false
        }

        const oppositeDirection = this.getOppositeDirection(direction)

        /**
         * If the direction is invalid, the tiles cannot connect.
         */
        if (!oppositeDirection) {
            return false
        }

        /**
         * The neighbor must connect back from the opposite side.
         */
        if (!neighborTile.connections.includes(oppositeDirection)) {
            return false
        }

        return true
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





}