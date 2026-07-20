import SignalTracePipeRenderer from './SignalTracePipeRenderer.js'
import SignalTraceLevelOne from './SignalTraceLevelOne.js'
import SignalTraceLevelTwo from './SignalTraceLevelTwo.js'
import SignalTraceLevelThree from './SignalTraceLevelThree.js'
import SignalTraceLevelFour from './SignalTraceLevelFour.js'
import SignalTraceLevelFive from './SignalTraceLevelFive.js'
import SignalTraceLevelSix from './SignalTraceLevelSix.js'
import SignalTraceDragController from './SignalTraceDragController.js'
import SignalTraceInventory from './SignalTraceInventory.js'
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

        this.level = new SignalTraceLevelFive()

        /**
 * Grid properties.
 * rows/cols/source/target come from the current level.
 */
        this.rows = this.level.rows
        this.cols = this.level.cols

        this.tileSize = 140
        this.tileGap = 8

        this.boardStartY = 300

        this.titleFontSize = 52
        this.subtitleFontSize = 36
        this.statusFontSize = 36
        this.controlsFontSize = 28
        this.nodeLabelFontSize = 32


        this.tile = {
            pipe: null,
            locked: false,
            blocked: false
        }

        /**
         * Copy the level endpoints into SignalTrace.
         * SignalTrace uses these for drawing and path checking.
         */
        this.source = {
            row: this.level.source.row,
            col: this.level.source.col,
            direction: this.level.source.direction
        }

        if (!this.source.direction) {
            this.source.direction = "right"
        }

        this.target = {
            row: this.level.target.row,
            col: this.level.target.col,
            direction: this.level.target.direction
        }



        if (!this.target.direction) {
            this.target.direction = "left"
        }




        this.pipeRenderer = new SignalTracePipeRenderer(
            this.ctx,
            this.tileSize,
            this.tileGap
        )

        this.relay = {
            row: this.level.relay.row,
            col: this.level.relay.col,
        }

        /**
         * the inventory is an object that manages the inventory state and drawing
         * SignalTrace owns the inventory, and passes itself to the inventory so it can call back to SignalTrace when needed
         */
        this.dragController = new SignalTraceDragController(this)
        /**
        * Whether the current pipe layout creates
        * a valid signal path from SRC to ARC.
        */
        console.log("SignalTrace object ", this)
        console.log("Level object ", this.level)
        console.log("Drag controller object ", this.dragController)
        this.signalConnected;

        /**
        * Create the current level grid.
        * 2D array of tile objects, each with a connections array that lists the directions of the pipes in that tile
        * SignalTrace owns the active grid state after this point,
        */
        this.grid = this.level.createGrid()
        this.inventory = new SignalTraceInventory(this)
        /**
         * Check the starting board state.
         * This lets the status text be correct immediately when Signal Trace opens.
         */
        // this.signalConnected = this.checkSignalPath()
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
        this.ctx.font = `${this.titleFontSize}px monospace`
        this.ctx.textAlign = "left"
        this.ctx.fillText("SIGNAL TRACE ONLINE", 90, 125)

        // Draw temporary status text.
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.72)"
        this.ctx.font = `${this.subtitleFontSize}px monospace`
        this.ctx.fillText("ARCHIVE RECOVERY PROTOCOL INITIALIZED", 90, 185)
        this.drawBoardPlaceholder()
        /**
         * Draw current signal connection status and controls.
         */
        this.drawSignalStatusText()

        // Tell Three.js that the canvas texture changed.
        this.texture.needsUpdate = true;
    }


    /**
     * Draw the current signal connection status and controls.
     * This is called whenever the status changes
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
        this.ctx.font = `${this.statusFontSize}px monospace`
        this.ctx.textAlign = "left"
        this.ctx.fillText(statusText, 90, 245)

        /**
         * Draw control hint under the status.
         * This is useful now that the puzzle is interactive.
         */
        this.ctx.font = "40px monospace"
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.38)"
        this.ctx.fillText("DRAG MODULES TO REBUILD SIGNAL PATH", 1080, 200)
    }


    returnTilePosition(row, col) {
        const x = this.boardStartX + col * (this.tileSize + this.tileGap) // determine the x position for the next tile
        const y = this.boardStartY + row * (this.tileSize + this.tileGap) // same logic as with x 
        return {
            x: x,
            y: y
        }
    }

    /**
     * Redraw the full Signal Trace screen
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
        this.boardStartX = (this.canvas.width - boardWidth) / 2 - 400 // change to this because now I'll have access to it anywhere in the class
        /**
         * Draw every tile in the grid.
         */

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = this.boardStartX + col * (this.tileSize + this.tileGap) // determine the x position for the next tile
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
                /**
                 * drawPipe recieves a tile object and draws the pipe within that boundary
                 */
                if (tile.pipe) {
                    if (tile.pipe.connections) {
                        console.log("tile in placehloder: " , tile)
                        this.pipeRenderer.drawPipe(x, y, tile.pipe.connections)
                    }
                }
                if (row === this.source.row && col === this.source.col) {
                    this.drawNode(x, y, "#00ff99", "SRC")
                }

                if (row === this.target.row && col === this.target.col) {
                    this.drawNode(x, y, "#ff8a3d", "ARC")
                }

                if (this.relay && row === this.relay.row && col === this.relay.col) {
                    this.drawNode(x, y, "#46d9ff", "RLY")
                }

            }
        }

        this.inventory.draw()


        this.dragController.drawHeldPipe()
    }



    getTileAtCanvasPosition(canvasX, canvasY) {
        /**
         * Get the pointer exact position relative to the board
         */
        const localX = canvasX - this.boardStartX
        const localY = canvasY - this.boardStartY

        if (localX < 0) {
            return null
        }

        if (localY < 0) {
            return null
        }

        const tileStep = this.tileSize + this.tileGap // calculate the distance between each tile

        const col = Math.floor(localX / tileStep)
        const row = Math.floor(localY / tileStep)

        if (!this.isInsideBoard(row, col)) {
            return null
        }

        /**
         * Reject clicks inside the gap between tiles.
         */
        const insideTileX = localX % tileStep
        const insideTileY = localY % tileStep

        if (insideTileX > this.tileSize) {
            return null
        }

        if (insideTileY > this.tileSize) {
            return null
        }
        const tile = this.grid[row][col]
        return tile
    }

    getTile(row, col) {

    }

    canPickUpPipe(row, col) {
        if (!this.isInsideBoard(row, col)) {
            return false
        }
        if (this.isEndpointPosition(row, col)) {
            return false
        }
        const tile = this.grid[row][col]

        if (tile.pipe) {
            if (!tile ||
                tile.locked ||
                tile.blocked ||
                !tile.pipe.connections ||
                tile.pipe.connections.length === 0

            ) {
                return false
            }
        }

        return true
    }

    updateSignalState() {
        this.signalConnected = this.checkSignalPath()
    }

    handlePointerDown(canvasX, canvasY) {
        this.dragController.handlePointerDown(canvasX, canvasY)
    }

    handlePointerMove(canvasX, canvasY) {
        this.dragController.handlePointerMove(canvasX, canvasY)
    }

    handlePointerUp(canvasX, canvasY) {
        this.dragController.handlePointerUp(canvasX, canvasY)
    }

    handlePointerCancel() {
        this.dragController.cancelDrag()
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
        this.ctx.font = `${this.nodeLabelFontSize}px monospace`
        this.ctx.textAlign = "center"
        this.ctx.fillText(label, centerX, centerY + 28)
    }







    addSourceNeighborPipesToStack(stack) {
        const directions = ["up", "down", "left", "right"]

        for (const direction of directions) {
            const neighborPosition = this.getNeighborPosition(
                this.source.row,
                this.source.col,
                direction
            )

            if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            if (this.isTargetPosition(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            const neighborTile = this.grid[neighborPosition.row][neighborPosition.col]

            if (!this.isPipeTile(neighborTile)) {
                continue
            }

            const directionBackToSource = this.getOppositeDirection(direction)

            if (!directionBackToSource) {
                continue
            }

            if (!neighborTile.connections.includes(directionBackToSource)) {
                continue
            }

            stack.push({
                row: neighborPosition.row,
                col: neighborPosition.col
            })
        }
    }

    isPipeTile(tile) {
        if (!tile) {
            return false
        }

        if (!tile.connections) {
            return false
        }

        if (tile.connections.length === 0) {
            return false
        }

        return true
    }

    pipeConnectsToTarget(row, col, tile) {
        if (!this.isPipeTile(tile)) {
            return false
        }

        for (const direction of tile.connections) {
            const neighborPosition = this.getNeighborPosition(row, col, direction)

            if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            if (this.isTargetPosition(neighborPosition.row, neighborPosition.col)) {
                return true
            }
        }

        return false
    }

    isSourcePosition(row, col) {
        if (row === this.source.row && col === this.source.col) {
            return true
        }

        return false
    }

    isRelayPosition(row, col) {
        if (!this.relay) {
            return false
        }

        if (row === this.relay.row && col === this.relay.col) {
            return true
        }

        return false
    }

    isEndpointPosition(row, col) {
        if (this.isSourcePosition(row, col)) {
            return true
        }

        if (this.isRelayPosition(row, col)) {
            return true
        }

        if (this.isTargetPosition(row, col)) {
            return true
        }

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

    checkSignalPath() {
        if (this.relay) {
            if (!this.canReachEndpoint(this.source, this.relay)) {
                return false
            }

            if (!this.canReachEndpoint(this.relay, this.target)) {
                return false
            }

            return true
        }

        return this.canReachEndpoint(this.source, this.target)
    }

    canReachEndpoint(startEndpoint, endEndpoint) {
        /**
             * use a set to track visited tiles, so we don't get stuck in a loop
             * A set is like an array, but it cannot store duplicate values. This is important because we don't want to visit the same tile twice, which would cause an infinite loop.
             * Also, With an array, .includes() has to scan through the array until it finds the value.
             * With a Set, .has() is built for quick lookup.
             * We use a set and not an array because we want to be able to quickly check if a tile has already been visited.
             * If we used an array, we would have to loop through the array to check if a tile has already been visited, which would be slower.
             */
        const visited = new Set()
        /**
         * use a stack to track tiles to visit, so we can do a depth-first search
         * DFS means:
         * Start somewhere, follow one path as deep as possible, and only backtrack when you hit a dead end.
         * A stack is last in, first out. We add tiles to the stack as we find them, and 
         * then we pop them off the stack to visit them. This way, we always visit the most recently found tile first, 
         */
        const stack = []
        // so Stack = places we still need to inspect
        // Visited = places we've already inspected
        // DFS = keep pulling from the stack and crawling through connected pipes until we either reach the endpoint or run out of options.

        this.addEndpointNeighborPipesToStack(stack, startEndpoint)

        while (stack.length > 0) {
            const currentPosition = stack.pop()

            const row = currentPosition.row
            const col = currentPosition.col
            const positionKey = `${row},${col}`

            if (visited.has(positionKey)) {
                continue
            }

            visited.add(positionKey)

            const currentTile = this.grid[row][col]

            if (!this.isPipeTile(currentTile)) {
                continue
            }

            if (this.pipeConnectsToEndpoint(row, col, currentTile, endEndpoint)) {
                return true
            }

            for (const direction of currentTile.connections) {
                const neighborPosition = this.getNeighborPosition(row, col, direction)

                if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                    continue
                }

                if (this.isEndpointPosition(neighborPosition.row, neighborPosition.col)) {
                    continue
                }

                const neighborTile = this.grid[neighborPosition.row][neighborPosition.col]

                if (!this.tilesConnect(currentTile, neighborTile, direction)) {
                    continue
                }

                const neighborKey = `${neighborPosition.row},${neighborPosition.col}`

                if (!visited.has(neighborKey)) {
                    stack.push(neighborPosition)
                }
            }
        }

        return false
    }
    /**
     * Adds neighboring pipe tiles to the stack for a given endpoint.
     * @param {*array} stack the stack of tiles to visit. this is an array of objects with row and col properties
     * @param {*object} endpoint the endpoint to check (for example, relay, source, ). this is an object with row, col, and direction properties
     */
    addEndpointNeighborPipesToStack(stack, endpoint) {
        const endpointConnections = this.getEndpointConnections(endpoint) // get the endpoint connections
        for (const direction of endpointConnections) {
            const neighborPosition = this.getNeighborPosition(
                endpoint.row,
                endpoint.col,
                direction
            )

            if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            if (this.isEndpointPosition(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            const neighborTile = this.grid[neighborPosition.row][neighborPosition.col]

            if (!this.isPipeTile(neighborTile)) {
                continue
            }

            const directionBackToEndpoint = this.getOppositeDirection(direction)

            if (!directionBackToEndpoint) {
                continue
            }

            if (!neighborTile.connections.includes(directionBackToEndpoint)) {
                continue
            }

            stack.push({
                row: neighborPosition.row,
                col: neighborPosition.col
            })
        }
    }

    pipeConnectsToEndpoint(row, col, tile, endpoint) {
        if (!this.isPipeTile(tile)) {
            return false
        }

        const endpointConnections = this.getEndpointConnections(endpoint)

        for (const direction of tile.connections) {
            const neighborPosition = this.getNeighborPosition(row, col, direction)

            if (neighborPosition.row !== endpoint.row) {
                continue
            }

            if (neighborPosition.col !== endpoint.col) {
                continue
            }

            const directionFromEndpointToPipe = this.getOppositeDirection(direction)

            if (!directionFromEndpointToPipe) {
                continue
            }

            if (endpointConnections.includes(directionFromEndpointToPipe)) {
                return true
            }
        }

        return false
    }

    getEndpointConnections(endpoint) {
        const endpointTile = this.grid[endpoint.row][endpoint.col]

        if (endpointTile && endpointTile.connections && endpointTile.connections.length > 0) {
            return endpointTile.connections
        }

        if (endpoint.direction) {
            return [endpoint.direction]
        }

        return []
    }
    addSourceNeighborPipesToStack(stack) {
        const directions = ["up", "down", "left", "right"]

        for (const direction of directions) {
            const neighborPosition = this.getNeighborPosition(
                this.source.row,
                this.source.col,
                direction
            )

            if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            if (this.isTargetPosition(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            const neighborTile = this.grid[neighborPosition.row][neighborPosition.col]

            if (!this.isPipeTile(neighborTile)) {
                continue
            }

            const directionBackToSource = this.getOppositeDirection(direction)

            if (!directionBackToSource) {
                continue
            }

            if (!neighborTile.connections.includes(directionBackToSource)) {
                continue
            }

            stack.push({
                row: neighborPosition.row,
                col: neighborPosition.col
            })
        }
    }

    isPipeTile(tile) {
        if (!tile) {
            return false
        }

        if (!tile.connections) {
            return false
        }

        if (tile.connections.length === 0) {
            return false
        }

        return true
    }

    pipeConnectsToTarget(row, col, tile) {
        if (!this.isPipeTile(tile)) {
            return false
        }

        for (const direction of tile.connections) {
            const neighborPosition = this.getNeighborPosition(row, col, direction)

            if (!this.isInsideBoard(neighborPosition.row, neighborPosition.col)) {
                continue
            }

            if (this.isTargetPosition(neighborPosition.row, neighborPosition.col)) {
                return true
            }
        }

        return false
    }

    isSourcePosition(row, col) {
        if (row === this.source.row && col === this.source.col) {
            return true
        }

        return false
    }





}