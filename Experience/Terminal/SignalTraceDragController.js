export default class SignalTraceDragController {
    constructor(signalTrace) {
        this.signalTrace = signalTrace

        /**
         * The pipe tile currently being dragged.
         * Null means we are not holding anything.
         */
        this.heldTile = null

        /**
         * Original grid position of the held tile.
         * Used to restore the tile if the drop is invalid.
         */
        this.sourcePosition = null

        /**
         * Current pointer position in terminal canvas coordinates.
         */
        this.dragCanvasX = 0
        this.dragCanvasY = 0
    }

    isDragging() {
        if (this.heldTile) {
            return true
        }

        return false
    }

    handlePointerDown(canvasX, canvasY) {
        const tilePosition = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)

        if (!tilePosition) {
            return
        }

        if (!this.signalTrace.canPickUpTile(tilePosition.row, tilePosition.col)) {
            return
        }

        const tile = this.signalTrace.grid[tilePosition.row][tilePosition.col]

        this.heldTile = tile
        this.sourcePosition = {
            row: tilePosition.row,
            col: tilePosition.col
        }

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        /**
         * Remove the pipe from the board while it is being held.
         * The pipe still exists in this.heldTile.
         */
        this.signalTrace.grid[tilePosition.row][tilePosition.col] = {
            connections: []
        }

        this.signalTrace.updateSignalState()
        this.signalTrace.drawBootScreen()
    }

    handlePointerMove(canvasX, canvasY) {
        if (!this.isDragging()) {
            return
        }

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        this.signalTrace.drawBootScreen()
    }

    handlePointerUp(canvasX, canvasY) {
        if (!this.isDragging()) {
            return
        }

        this.dragCanvasX = canvasX
        this.dragCanvasY = canvasY

        const tilePosition = this.signalTrace.getTileAtCanvasPosition(canvasX, canvasY)

        if (tilePosition && this.signalTrace.canDropTile(tilePosition.row, tilePosition.col)) {
            this.placeHeldTile(tilePosition.row, tilePosition.col)
        }

        else {
            this.restoreHeldTile()
        }

        this.clearHeldTile()

        this.signalTrace.updateSignalState()
        this.signalTrace.drawBootScreen()
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
        if (!this.sourcePosition) {
            return
        }

        this.signalTrace.grid[this.sourcePosition.row][this.sourcePosition.col] = this.heldTile
    }

    clearHeldTile() {
        this.heldTile = null
        this.sourcePosition = null
    }

    drawHeldPipe() {
        if (!this.isDragging()) {
            return
        }

        const signalTrace = this.signalTrace
        const ctx = signalTrace.ctx

        /**
         * Center the dragged pipe under the pointer.
         */
        const x = this.dragCanvasX - signalTrace.tileSize / 2
        const y = this.dragCanvasY - signalTrace.tileSize / 2

        ctx.save()

        /**
         * Faint tile backing so the dragged module reads as a tile,
         * not just loose pipe pixels.
         */
        ctx.globalAlpha = 0.9
        ctx.fillStyle = "rgba(0, 255, 65, 0.055)"
        ctx.fillRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        ctx.strokeStyle = "rgba(216, 255, 220, 0.55)"
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, signalTrace.tileSize, signalTrace.tileSize)

        ctx.globalAlpha = 0.92
        signalTrace.pipeRenderer.drawPipe(x, y, this.heldTile)

        ctx.restore()
    }
}