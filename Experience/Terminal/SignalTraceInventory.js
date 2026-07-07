export default class SignalTraceInventory {
    constructor(signalTrace) {
        /**
         * Store a reference to the main SignalTrace instance.
         *
         * The inventory does not own the full game state.
         * It uses SignalTrace so it can access:
         * - the canvas context
         * - the pipe renderer
         * - the active level data
         * - tile sizing values
         */
        this.signalTrace = signalTrace
        this.ctx = signalTrace.ctx

        /**
         * Inventory slots use the same size as board tiles.
         * This lets us reuse SignalTracePipeRenderer directly,
         * because the pipe renderer expects tile-sized drawing areas.
         */
        this.slotSize = signalTrace.tileSize

        /**
         * Vertical gap between inventory slots.
         */
        this.slotGap = 26

        /**
         * Right-side inventory panel layout.
         *
         * These values are canvas-space coordinates.
         * They control where the module cache appears on the terminal screen.
         */
        this.panelX = 1280
        this.panelY = 350
        this.panelWidth = 500
        this.rightSideInventoryCnt = -1
        this.columnGap = 60
        /**
         * Active mutable inventory state.
         *
         * This is copied from the level inventory instead of directly referencing it,
         * so changing counts during gameplay does not mutate the level definition.
         */
        this.items = this.createItemsFromLevel()
    }

    /**
     * Creates the starting inventory for the current level.
     *
     * If the level defines its own inventory, clone it.
     * Otherwise, return a small fallback inventory so the system can still work
     * during testing even if a level forgot to define inventory data.
     *
     * @returns {Array<{connections: Array<string>, count: number}>}
     */
    createItemsFromLevel() {
        if (this.signalTrace.level.inventory) {
            return this.cloneInventoryItems(this.signalTrace.level.inventory)
        }
    }

    /**
     * Creates a deep copy of the level inventory items.
     *
     * This is important because inventory counts change during gameplay.
     * If we used the level's original item objects directly, placing pipes
     * would permanently mutate the level definition object.
     *
     * @param {Array<{connections: Array<string>, count: number}>} items
     * The inventory items from the level definition.
     *
     * @returns {Array<{connections: Array<string>, count: number}>}
     * A cloned inventory array with copied connection arrays.
     */
    cloneInventoryItems(items) {
        const clonedItems = []

        for (const item of items) {
            clonedItems.push({
                connections: [...item.connections],
                count: item.count
            })
        }

        return clonedItems
    }

    /**
     * Draws the full inventory panel.
     *
     * Rendering order:
     * 1. Panel background
     * 2. Panel title
     * 3. Each inventory slot
     *
     * This should be called from SignalTrace's main draw method.
     */
    draw() {
        this.drawPanelBackground()
        this.drawPanelTitle()

        for (let i = 0; i < this.items.length; i++) {
            this.drawSlot(i)
        }
    }

    /**
     * Draws the translucent panel behind the inventory slots.
     *
     * The panel height is calculated from the number of inventory items,
     * so the panel grows/shrinks with the level inventory.
     */
    drawPanelBackground() {
        const ctx = this.ctx
        const panelHeight = (this.signalTrace.tileSize + this.signalTrace.tileGap) * this.signalTrace.rows

        ctx.save()

        ctx.fillStyle = "rgba(0, 255, 65, 0.025)"
        ctx.fillRect(this.panelX - 30, this.panelY - 80, this.panelWidth, panelHeight)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.16)"
        ctx.lineWidth = 4
        ctx.strokeRect(this.panelX - 30, this.panelY - 80, this.panelWidth, panelHeight)

        ctx.restore()
    }

    /**
     * Draws the inventory panel title.
     */
    drawPanelTitle() {
        const ctx = this.ctx

        ctx.save()

        ctx.fillStyle = "#00FF41"
        ctx.font = "34px monospace"
        ctx.textAlign = "left"
        ctx.fillText("MODULE CACHE", this.panelX - 10, this.panelY - 35)

        ctx.restore()
    }

    /**
     * Draws a single inventory slot.
     *
     * Each slot contains:
     * - a tile-sized background
     * - a pipe preview
     * - the remaining count
     * If the count is 0, the whole slot is drawn dimmed.
     * @param {number} index
     * The index of the inventory item to draw.
     */
    drawSlot(index) {
        const item = this.items[index]
        const position = this.getSlotPosition(index)
        const x = position.x
        const y = position.y
        const ctx = this.ctx

        ctx.save()

        /**
         * Visually disable empty inventory slots.
         * The slot still exists, but the player cannot pick it up.
         */
        if (item.count <= 0) {
            ctx.globalAlpha = 0.28
        }

        /**
         * Slot background.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.045)"
        ctx.fillRect(x, y, this.slotSize, this.slotSize)

        /**
         * Slot border.
         */
        ctx.strokeStyle = "rgba(0, 255, 65, 0.22)"
        ctx.lineWidth = 5
        ctx.strokeRect(x, y, this.slotSize, this.slotSize)

        /**
         * Create a temporary tile-like object for the pipe renderer.
         *
         * The pipe renderer does not care whether a pipe came from the board,
         * inventory, or drag preview. It only needs a connections array.
         */
        const previewTile = {
            connections: item.connections
        }

        this.signalTrace.pipeRenderer.drawPipe(x, y, previewTile)

        /**
         * Draw remaining module count.
         */
        ctx.fillStyle = "rgba(216, 255, 220, 0.78)"
        ctx.font = "30px monospace"
        ctx.fillText("x" + item.count, x + this.slotSize + 24, y + 88)

        ctx.restore()
    }


    /**
     * Converts a canvas mouse/pointer position into an inventory slot index.
     * This is the inventory equivalent of board tile hit detection.
     * It checks whether the pointer is inside any inventory slot rectangle.
     * @param {number} canvasX
     * Pointer X position in terminal canvas coordinates.
     *
     * @param {number} canvasY
     * Pointer Y position in terminal canvas coordinates.
     *
     * @returns {{index: number} | null}
     * The clicked inventory slot, or null if no slot was hit.
     */
    getSlotPosition(index) {
        const slotsPerColumn = 4

        const column = Math.floor(index / slotsPerColumn) // when the index is 4, we make a new column
        const row = index % slotsPerColumn

        const columnGap = this.slotSize + this.slotGap + 40

        return {
            x: this.panelX + column * columnGap,
            y: this.panelY + row * (this.slotSize + this.slotGap)
        }
    }

    getSlotAtCanvasPosition(canvasX, canvasY) {
    for (let i = 0; i < this.items.length; i++) {
        const position = this.getSlotPosition(i)

        const left = position.x
        const right = position.x + this.slotSize
        const top = position.y
        const bottom = position.y + this.slotSize

        if (canvasX >= left && canvasX <= right && canvasY >= top && canvasY <= bottom) {
            return {
                index: i
            }
        }
    }

    return null
}

    /**
     * Checks whether an inventory slot can be picked up.
     *
     * A slot can be picked up only if:
     * - the index is inside the inventory array
     * - the item exists
     * - the item count is greater than 0
     *
     * @param {number} index
     * Inventory slot index.
     *
     * @returns {boolean}
     * True if the player can drag a module from this slot.
     */
    canPickUpSlot(index) {
        if (index < 0) {
            return false
        }

        if (index >= this.items.length) {
            return false
        }

        const item = this.items[index]

        if (!item) {
            return false
        }

        if (item.count <= 0) {
            return false
        }

        return true
    }

    /**
     * Creates a new board tile object from an inventory slot.
     *
     * This does not decrease the inventory count.
     * The count should only decrease after the dragged tile is successfully
     * dropped onto the board.
     * @param {number} index
     * Inventory slot index.
     * @returns {{connections: Array<string>}}
     * A fresh tile object that can be placed into SignalTrace.grid.
     */
    createTileFromSlot(index) {
        const item = this.items[index]

        return {
            connections: [...item.connections]
        }
    }

    /**
     * Decreases the count of an inventory slot by 1.
     *
     * This should be called only after a successful drop onto the board.
     * Invalid drops should not consume inventory modules.
     *
     * @param {number} index
     * The index of the slot to decrease.
     */
    changeSlotCount(index, change) {
        this.items[index].count += change
        console.log(this.items)

    }
}