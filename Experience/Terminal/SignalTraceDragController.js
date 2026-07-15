export default class SignalTraceDragController {
    /**
     * Creates the drag controller and stores the state needed while a pipe is
     * being dragged between the board and the inventory.
     *
     * @param {SignalTrace} signalTrace - The main Signal Trace game instance.
     */
    constructor(signalTrace) {
        this.signalTrace = signalTrace

        this.boardPipes = []

        // The pipe tile currently following the pointer.
        this.heldPipe = null

        // Stores where the held tile originally came from: "board" or "inventory".
        this.originType = null

        // Stores the original row and column when dragging from the board.
        this.sourcePosition = null

        // Stores the original slot index when dragging from the inventory.
        this.sourceInventoryIndex = null

        // Current pointer position in terminal canvas pixels.
        this.dragCanvasX = 0
        this.dragCanvasY = 0

        /**
         * Prevents multiple drag redraws from being scheduled in the same frame.
         */
        this.drawFramePending = false
    }

    /**
     * Requests a redraw of the drag preview on the next animation frame.
     * Multiple pointer-move events may happen before the browser renders a new
     * frame, so this method prevents unnecessary repeated redraws.
     *
     * @returns {void}
     */
    requestDragRedraw() {
        // Do not schedule another redraw if one is already waiting.
        if (this.drawFramePending) {
            return
        }

        this.drawFramePending = true

        requestAnimationFrame(() => {
            // Allow another redraw to be requested during the next frame.
            this.drawFramePending = false

            // The drag may have ended before this frame was rendered.
            if (!this.isDragging()) {
                return
            }

            // Redraw the game screen so the held pipe follows the pointer.
            this.signalTrace.drawBootScreen()
        })
    }


    /**
     * Checks whether a pipe tile is currently being dragged.
     *
     * @returns {boolean} True when a tile is being held; otherwise, false.
     */
    isDragging() {
        return this.heldPipe
    }



    /**
     * Handles the beginning of a pointer interaction.
     *
     * The board is checked first. If no board tile can be picked up, the
     * inventory is checked instead.
     *
     * @param {number} canvasX - Pointer X position in terminal canvas pixels.
     * @param {number} canvasY - Pointer Y position in terminal canvas pixels.
     * @returns {void}
     */
    handlePointerDown(canvasX, canvasY) {
        // Give board tiles priority when checking what the pointer selected.
        if (this.tryPickUpBoardTile(canvasX, canvasY)) {
            return
        }

        // Try the inventory when no board tile was picked up.
        if (this.tryPickUpInventoryTile(canvasX, canvasY)) {
            return
        }

    }

    /**
     * Attempts to pick up a pipe tile from the board.
     *
     * When successful, the tile is removed from its board position and stored
     * as the currently held tile.
     *
     * @param {number} canvasX - Pointer X position in terminal canvas pixels.
     * @param {number} canvasY - Pointer Y position in terminal canvas pixels.
     * @returns {boolean} True when a board tile was picked up; otherwise, false.
     */
    tryPickUpBoardTile(canvasX, canvasY) {
        // Convert the pointer position into a board row and column.
        const tilePosition = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)

        // The pointer is not currently over the board.
        if (!tilePosition) {
            return false
        }

        // Sources, endpoints, or other protected tiles cannot be picked up.
        if (!this.signalTrace.canPickUpTile(tilePosition.row, tilePosition.col)) {
            return false
        }
        this.tile = this.signalTrace.grid[tilePosition.row][tilePosition.col]
        // Store the tile and remember its original board position.
        this.heldPipe = this.tile
        this.originType = "board"
        this.sourcePosition = {
            row: tilePosition.row,
            col: tilePosition.col
        }
        this.sourceInventoryIndex = null

        // Begin drawing the held tile at the current pointer position.
        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        // Replace the original board tile with an empty tile while it is held.
        this.signalTrace.grid[tilePosition.row][tilePosition.col] = {
            connections: []
        }

        // Recalculate the signal because removing the pipe may break a path.
        this.signalTrace.updateSignalState()

        // Immediately redraw so the removed tile appears under the pointer.
        this.signalTrace.drawBootScreen()

        return true
    }

    /**
     * Attempts to pick up a pipe tile from an inventory slot.
     *
     * When successful, a new tile is created from the slot and the available
     * count for that inventory item is reduced.
     *
     * @param {number} canvasX - Pointer X position in terminal canvas pixels.
     * @param {number} canvasY - Pointer Y position in terminal canvas pixels.
     * @returns {boolean} True when an inventory tile was picked up; otherwise, false.
     */
    tryPickUpInventoryTile(canvasX, canvasY) {
        // Determine which inventory slot is underneath the pointer.
        this.inventoryPosition = this.signalTrace.inventory.getSlotAtCanvasPosition(
            canvasX,
            canvasY
        )


        // The pointer is not currently over an inventory slot.
        if (!this.inventoryPosition) {
            return false
        }

        // Empty or unavailable inventory slots cannot be picked up.
        if (!this.signalTrace.inventory.canPickUpSlot(this.inventoryPosition.index)) {
            return false
        }

        // Create the held tile using the selected inventory slot.
        this.heldPipe = this.signalTrace.inventory.createTileFromSlot(
            this.inventoryPosition.index
        )
        this.signalTrace.grid[tilePosition.row][tilePosition.col].inventoryPosition = this.inventoryPosition.index
        console.log(this.signalTrace.grid[tilePosition.row][tilePosition.col].inventoryPosition)

        // Remember where the tile came from in case the drag is cancelled.
        this.originType = "inventory"
        this.sourcePosition = null
        this.sourceInventoryIndex = this.inventoryPosition.index

        // Temporarily remove one pipe from the inventory.
        this.signalTrace.inventory.changeSlotCount(
            this.sourceInventoryIndex,
            -1
        )

        // Begin drawing the held tile at the current pointer position.
        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        // Immediately show the updated inventory and dragged tile.
        this.signalTrace.drawBootScreen()

        return true
    }

    /**
     * Updates the position of the held pipe while the pointer moves.
     *
     * @param {number} canvasX - New pointer X position in terminal canvas pixels.
     * @param {number} canvasY - New pointer Y position in terminal canvas pixels.
     * @returns {void}
     */
    handlePointerMove(canvasX, canvasY) {
        // Pointer movement does not affect anything when no tile is held.
        if (!this.isDragging()) {
            return
        }

        // Update the position used when drawing the drag preview.
        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        // Schedule one redraw for the next animation frame.
        this.requestDragRedraw()
    }

    /**
     * Handles the end of a drag operation.
     *
     * The held tile is placed when the pointer is over a valid board location.
     * Otherwise, the drag is cancelled and the tile is returned to its origin.
     *
     * @param {number} canvasX - Final pointer X position in terminal canvas pixels.
     * @param {number} canvasY - Final pointer Y position in terminal canvas pixels.
     * @returns {void}
     */
    handlePointerUp(canvasX, canvasY) {
        // Ignore pointer releases when no tile is being dragged.
        if (!this.isDragging()) {
            return
        }

        // Store the final pointer position before checking the drop location.
        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        const tilePosition = this.signalTrace.getTileAtCanvasPosition(
            canvasX,
            canvasY
        )

        // Place the pipe when the pointer is over a valid empty board tile.
        if (
            tilePosition &&
            this.canDropTile(tilePosition.row, tilePosition.col)
        ) {
            // Replace the destination grid tile with the held pipe.
            this.signalTrace.grid[tilePosition.row][tilePosition.col] = this.heldPipe
            this.boardPipes.push(this.heldPipe)
            console.log("held Pipe: ", this.heldPipe)
            this.clearHeldTile()
            // Recalculate the path after adding the pipe to the board.
            this.signalTrace.updateSignalState()
            this.signalTrace.drawBootScreen()
        }
        else if (this.canDropTileAtInventory(canvasX, canvasY)) {
            console.log(this.heldPipeInventoryIndex)
            this.signalTrace.inventory.changeSlotCount(this.heldPipe.inventoryPosition, 1)
        }

        else {
            // Invalid drops return the pipe to its original location.
            this.cancelDrag()
        }
    }

    canDropTile(row, col) {
        if (!this.signalTrace.isInsideBoard(row, col)) {
            return false
        }

        if (this.signalTrace.isEndpointPosition(row, col)) {
            return false
        }

        const tile = this.signalTrace.grid[row][col]
        if (!tile) {
            return false
        }

        if (tile.locked) {
            return false
        }

        if (tile.blocked) {
            return false
        }

        if (tile.connections.length > 0) {
            return false
        }

        return true
    }

    canDropTileAtInventory(canvasX, canvasY) {
        console.log("held tile propeties: ", this.heldPipe)
        if (this.signalTrace.inventory.getSlotAtCanvasPosition(canvasX, canvasY) !== null) {
            const destinationTile = this.signalTrace.inventory.getSlotAtCanvasPosition(canvasX, canvasY)
            this.clearHeldTile()
            return true
        }
        return false
    }

    /**
     * Cancels the current drag operation and restores the held tile to where
     * it originally came from.
     *
     * @returns {void}
     */
    cancelDrag() {
        // There is nothing to cancel when no tile is being dragged.
        if (!this.isDragging()) {
            return
        }

        // Return the pipe before clearing its stored origin information.
        this.restoreHeldTile()
        this.clearHeldTile()

        // Recalculate and redraw after restoring the original state.
        this.signalTrace.updateSignalState()
        this.signalTrace.drawBootScreen()
    }

    /**
     * Restores the held tile to its original board position or inventory slot.
     *
     * Board tiles are placed back into their original grid position. Inventory
     * tiles are restored by adding one back to their original slot count.
     *
     * @returns {void}
     */
    restoreHeldTile() {
        // Restore a tile that originally came from the board.
        if (this.originType === "board") {
            if (!this.sourcePosition) {
                return
            }

            this.signalTrace.grid[this.sourcePosition.row][
                this.sourcePosition.col
            ] = this.heldPipe

            return
        }

        // Restore a tile that originally came from the inventory.
        if (this.originType === "inventory") {
            if (this.sourceInventoryIndex === null) {
                return
            }

            this.signalTrace.inventory.changeSlotCount(
                this.sourceInventoryIndex,
                1
            )
        }
    }

    /**
     * Clears the currently held tile and all information about its origin.
     *
     * @returns {void}
     */
    clearHeldTile() {
        // Remove the tile currently attached to the pointer.
        this.heldPipe = null

        // Reset all origin information for the completed drag.
        this.originType = null
        this.sourcePosition = null
        this.sourceInventoryIndex = null
    }

    /**
     * Draws the currently held pipe at the latest pointer position.
     *
     * A transparent tile background and border are drawn behind the pipe so
     * the player can clearly see the tile being dragged.
     *
     * @returns {void}
     */
    drawHeldPipe() {
        // Do not draw a drag preview when no pipe is being held.
        if (!this.isDragging()) {
            return
        }

        const signalTrace = this.signalTrace
        const ctx = signalTrace.ctx

        // Convert the pointer's center position into the tile's top-left corner.
        const x = this.dragCanvasX - signalTrace.tileSize / 2
        const y = this.dragCanvasY - signalTrace.tileSize / 2

        // Protect the rest of the canvas from these temporary drawing settings.
        ctx.save()

        // Draw the transparent tile background.
        ctx.globalAlpha = 0.9
        ctx.fillStyle = "rgba(0, 255, 65, 0.055)"
        ctx.fillRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        // Draw the border surrounding the dragged tile.
        ctx.strokeStyle = "rgba(216, 255, 220, 0.55)"
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        // Draw the pipe itself at the updated pointer coordinates.
        ctx.globalAlpha = 0.92
        signalTrace.pipeRenderer.drawPipe(x, y, this.heldPipe)

        // Restore the canvas settings used before drawing the held pipe.
        ctx.restore()
    }
}