export default class SignalTraceDragController {
    constructor(signalTrace) {
        this.signalTrace = signalTrace

        this.heldTile = null // the pipe currently being dragged

        this.originType = null // where the dragged pipe came from "board" or "inventory"
        this.sourcePosition = null // = original row/col if the pipe came from the board
        this.sourceInventoryIndex = null // inventory slot index if the pipe came from inventory
        /**
         * current mouse position in terminal canvas pixels
         */
        this.dragCanvasX = 0
        this.dragCanvasY = 0
        this.drawFramePending = false
    }


    requestDragRedraw() {
    if (this.drawFramePending) {
        return
    }

    this.drawFramePending = true

    requestAnimationFrame(() => {
        this.drawFramePending = false

        if (!this.isDragging()) {
            return
        }

        this.signalTrace.drawBootScreen()
    })
}
    isDragging() {
        if (this.heldTile) {
            return true
        }

        return false
    }

    handlePointerDown(canvasX, canvasY) {
        if (this.tryPickUpBoardTile(canvasX, canvasY)) {
            return
        }

        if (this.tryPickUpInventoryTile(canvasX, canvasY)) {
            return
        }
    }

    tryPickUpBoardTile(canvasX, canvasY) {
        const tilePosition = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)

        if (!tilePosition) {
            return false
        }

        if (!this.signalTrace.canPickUpTile(tilePosition.row, tilePosition.col)) {
            return false
        }

        const tile = this.signalTrace.grid[tilePosition.row][tilePosition.col]

        this.heldTile = tile
        this.originType = "board"
        this.sourcePosition = {
            row: tilePosition.row,
            col: tilePosition.col
        }
        this.sourceInventoryIndex = null

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        this.signalTrace.grid[tilePosition.row][tilePosition.col] = {
            connections: []
        }

        this.signalTrace.updateSignalState() // update the signal state to reflect the removal of the tile.
        this.signalTrace.drawBootScreen()

        return true
    }

    tryPickUpInventoryTile(canvasX, canvasY) {
        const inventoryPosition = this.signalTrace.inventory.getSlotAtCanvasPosition(canvasX, canvasY)

        if (!inventoryPosition) {
            return false
        }

        if (!this.signalTrace.inventory.canPickUpSlot(inventoryPosition.index)) {
            return false
        }

        this.heldTile = this.signalTrace.inventory.createTileFromSlot(inventoryPosition.index)
        this.originType = "inventory"
        this.sourcePosition = null
        this.sourceInventoryIndex = inventoryPosition.index

        this.signalTrace.inventory.changeSlotCount(this.sourceInventoryIndex, -1)

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        this.signalTrace.drawBootScreen()

        return true
    }

    handlePointerMove(canvasX, canvasY) {
    if (!this.isDragging()) {
        return
    }

    this.dragCanvasX = canvasX
    this.dragCanvasY = canvasY

    this.requestDragRedraw()
}

    handlePointerUp(canvasX, canvasY) {
        if (!this.isDragging()) {
            return
        }

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        const tilePosition = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)

        /**
         * if the pointer is over a valid board tile, and the tile can accept a new pipe,
         * place the held pipe there and finish the drag operation.
         * otherwise, restore the held pipe to its original location.
         * finally, clear the held pipe and redraw the screen.
         * update the signal state to reflect any changes.
         */
        if (tilePosition && this.signalTrace.canDropTile(tilePosition.row, tilePosition.col)) {
            this.placeHeldTile(tilePosition.row, tilePosition.col)
            this.clearHeldTile()
            this.signalTrace.updateSignalState()
            this.signalTrace.drawBootScreen()
        } else {
            this.cancelDrag()
        }


    }

    cancelDrag() {
        if (!this.isDragging()) {
            return
        }

        this.restoreHeldTile()
        this.clearHeldTile()

        this.signalTrace.updateSignalState()
        this.signalTrace.drawBootScreen()
    }

    placeHeldTile(row, col) {
        this.signalTrace.grid[row][col] = this.heldTile
    }



    restoreHeldTile() {
    if (this.originType === "board") {
        if (!this.sourcePosition) {
            return
        }

        this.signalTrace.grid[this.sourcePosition.row][this.sourcePosition.col] = this.heldTile
        return
    }

    if (this.originType === "inventory") {
        if (this.sourceInventoryIndex === null) {
            return
        }

        this.signalTrace.inventory.changeSlotCount(this.sourceInventoryIndex, 1)
    }
}

    clearHeldTile() {
        this.heldTile = null

        this.originType = null
        this.sourcePosition = null
        this.sourceInventoryIndex = null
    }

    drawHeldPipe() {
        if (!this.isDragging()) {
            return
        }

        const signalTrace = this.signalTrace
        const ctx = signalTrace.ctx

        const x = this.dragCanvasX - signalTrace.tileSize / 2
        const y = this.dragCanvasY - signalTrace.tileSize / 2

        ctx.save()

        ctx.globalAlpha = 0.9

        ctx.fillStyle = "rgba(0, 255, 65, 0.055)"
        ctx.fillRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        ctx.strokeStyle = "rgba(216, 255, 220, 0.55)"
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        ctx.globalAlpha = 0.92
        signalTrace.pipeRenderer.drawPipe(x, y, this.heldTile) // draw the pipe at the updated mouse coordinates

        ctx.restore()
    }
}