import Pipe from './Pipe.js'
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
     * @returns {boolean} True when a pipe is being held; otherwise, false.
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
        // Convert the pointer position into a tile object
        this.tile = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)
        // The pointer is not currently over the board.
        if (!this.tile) {
            return false
        }


        // Sources, endpoints, or other protected tiles cannot be picked up.
        if (!this.signalTrace.canPickUpPipe(this.tile.row, this.tile.col)) {
            return false
        }
        this.heldPipe = this.tile.pipe
        // Store the tile and remember its original board position
        this.originType = "board"
        this.sourcePosition = {
            row: this.tile.row,
            col: this.tile.col
        }
        this.sourceInventoryIndex = null

        this.tile.pipe = null

        // Begin drawing the held pipe at the current pointer position.
        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

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
        this.heldPipe = this.signalTrace.inventory.createPipeFromSlot(
            this.inventoryPosition.index
        )
        console.log("held pipe ", this.heldPipe)
        this.originType = "inventory"
        this.sourcePosition = null
        this.sourceInventoryIndex = this.inventoryPosition.index


        // Temporarily remove one pipe from the inventory.
        this.signalTrace.inventory.changeSlotCount(
            this.sourceInventoryIndex,
            -1
        )

        // Begin drawing the held pipe at the current pointer position.
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

        const tile = this.signalTrace.getTileAtCanvasPosition(
            canvasX,
            canvasY
        )
        // Place the pipe when the pointer is over a valid empty board tile.
        if (
            tile &&
            this.canDropPipe(tile)
        ) {
            // Replace the destination grid tile with the held pipe.
            this.boardPipes.push(this.heldPipe)
            // Recalculate the path after adding the pipe to the board.
            tile.pipe = this.heldPipe
            this.signalTrace.updateSignalState()
            this.clearHeldPipe()
            this.signalTrace.drawBootScreen()
            return
        }

        else if (this.originType === "board" && this.dropTileAtInventory(canvasX, canvasY)) {
            return
        }
        else {
            // Invalid drops return the pipe to its original location.
            this.cancelDrag()
        }
    }

    canDropPipe(tile) {
        if (!this.signalTrace.isInsideBoard(tile.row, tile.col)) {
            return false
        }

        if (this.signalTrace.isEndpointPosition(tile.row, tile.col)) {
            return false
        }
        if (!tile) {
            return false
        }

        if (tile.locked) {
            return false
        }

        if (tile.blocked) {
            return false
        }
        if (tile.pipe && tile.pipe.connections.length > 0) {
            return false
        }

        return true
    }

    /**
     * returns true if we can drop tile at inventory and updates the inventory item count
     * Otherwise returns false
     */
    dropTileAtInventory(canvasX, canvasY) {
            const index = this.signalTrace.inventory.returnSlotPositionFromPipeType(this.heldPipe)
            console.log("index in drop tile ", index)
            if (!this.signalTrace.isCursorInsideBoard(canvasX, canvasY)) {
                this.signalTrace.inventory.changeSlotCount(index, 1)
                this.clearHeldPipe()
                this.tile.pipe = null
                this.signalTrace.drawBootScreen()
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
        this.clearHeldPipe()

        // Recalculate and redraw after restoring the original state.
        this.signalTrace.updateSignalState()
        this.signalTrace.drawBootScreen()
    }



    restoreHeldTile() {
        // Restore a pipe that originally came from the board.
        if (this.originType === "board") {
            if (!this.sourcePosition) {
                return
            }
            this.tile.pipe = this.heldPipe
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
    clearHeldPipe() {
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

        // Convert the pointer's center position into the tile's top-left corner.
        const x = this.dragCanvasX - signalTrace.tileSize / 2
        const y = this.dragCanvasY - signalTrace.tileSize / 2


        signalTrace.pipeRenderer.drawPipe(x, y, this.heldPipe.connections)
    }
}