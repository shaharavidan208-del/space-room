import Pipe from './Pipe.js'
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

        if(this.signalTrace.level.pipeCount) {
        this.items = [
            {
                pipe: new Pipe("vertical", ["up", "down"], 0),
                count: this.signalTrace.level.pipeCount.vertical,
                drawPipe: null
            },
            {
                pipe: new Pipe("cornerUpLeft", ["up", "left"], 1),
                count: this.signalTrace.level.pipeCount.cornerUpLeft,
                drawPipe: null
            },
            {
                pipe: new Pipe("cornerDownLeft", ["down", "left"], 2),
                count: this.signalTrace.level.pipeCount.cornerDownLeft,
                drawPipe: null
            },
            {
                pipe: new Pipe("cornerUpRight", ["up", "right"], 3),
                count: this.signalTrace.level.pipeCount.cornerUpRight,
                drawPipe: null
            },
            {
                pipe: new Pipe("horizontal", ["left", "right"], 4),
                count: this.signalTrace.level.pipeCount.horizontal,
                drawPipe: null
            },
            {
                pipe: new Pipe("cornerDownRight", ["down", "right"], 5),
                count: this.signalTrace.level.pipeCount.cornerDownRight,
                drawPipe: null
            },
            {
                pipe: new Pipe("splitDown", ["down", "left", "right"], 6),
                count: this.signalTrace.level.pipeCount.splitDown,
                drawPipe: null
            },
            {
                pipe: new Pipe("splitRight", ["down", "right", "up"], 7),
                count: this.signalTrace.level.pipeCount.splitRight,
                drawPipe: null
            },
            {
                pipe: new Pipe("splitUp", ["left", "right", "up"], 8),
                count: this.signalTrace.level.pipeCount.splitUp,
                drawPipe: null
            },

        ]
    }

        this.ctx = signalTrace.ctx

        /**
         * Inventory slots use the same size as board tiles.
         * This lets us reuse SignalTracePipeRenderer directly,
         * because the pipe renderer expects tile-sized drawing areas.
         */
        this.slotSize = signalTrace.tileSize



        this.slotGap = 70

        this.columnGap = this.slotSize + this.slotGap + 40

        /**
         * Right-side inventory panel layout.
         *
         * These values are canvas-space coordinates.
         * They control where the module cache appears on the terminal screen.
         */
        this.panelX = 1280
        this.panelY = signalTrace.boardStartY
        this.rightSideInventoryCnt = -1
        this.panelWidth = 500

        if(this.items)
            this.shouldDrawSlot()
        /**
         * Active mutable inventory state.
         *
         * This is copied from the level inventory instead of directly referencing it,
         * so changing counts during gameplay does not mutate the level definition.
         */
    }

    shouldDrawSlot() {
        this.slotCount = 0
        for(let i = 0; i < this.items.length; i++) {
            if(this.items[i].count > 0) {
                this.items[i].drawPipe = true
                this.items[i].slotPosition = this.slotCount
                this.slotCount++
            }
            else {
                this.items[i].drawPipe = false
            }
        }
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
        if(!this.items)
            return
        this.drawPanelBackground()
        this.drawPanelTitle()
        for (let i = 0; i < this.items.length; i++) {
                if(this.items[i].drawPipe) {
                    this.drawSlot(i)
                }
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
        this.rows = 4
        this.panelHeight = (this.slotSize + this.slotGap) * 4.25

        ctx.save()
        this.columns = Math.ceil(this.slotCount / 4)
        this.panelWidth = (this.slotSize + this.slotGap) * this.columns + 15
        ctx.fillStyle = "rgba(0, 255, 65, 0.025)"
        ctx.fillRect(this.panelX - 30, this.panelY, this.panelWidth, this.panelHeight)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.16)"
        ctx.lineWidth = 4
        ctx.strokeRect(this.panelX - 30, this.panelY, this.panelWidth, this.panelHeight)

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
        const position = this.getSlotPosition(this.items[index].slotPosition)
        const x = position.x
        const y = position.y
        const ctx = this.ctx

        ctx.save()

        /**
         * Visually disable empty inventory slots.
         * The slot still exists, but the player cannot pick it up.
         */
        if (this.items[index].count <= 0) {
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

        this.signalTrace.pipeRenderer.drawPipe(x, y, this.items[index].pipe.connections)

        /**
         * Draw remaining module count.
         */
        ctx.fillStyle = "rgba(216, 255, 220, 0.78)"
        ctx.font = "40px monospace"
        ctx.fillText("x" + this.items[index].count, x + this.slotSize + 32, y + 88)

        ctx.restore()
    }


    /**
  * Calculates the top-left canvas position of an inventory slot.
  *
  * The inventory is arranged vertically with four slots per column.
  * After every four slots, the next slot begins a new column.
  *
  * @param {number} index
  * The index of the inventory slot.
  *
  * @returns {{x: number, y: number}}
  * The top-left X and Y coordinates where the slot should be drawn
  * on the terminal canvas.
  */
    getSlotPosition(index) {
        const slotsPerColumn = 4

        // Determine which inventory column contains this slot.
        // Indices 0-3 are in column 0, indices 4-7 are in column 1, and so on.
        const column = Math.floor(index / slotsPerColumn)

        // Determine the slot's row inside its column.
        // The row resets back to 0 whenever a new column begins.
        const row = index % slotsPerColumn


        // Convert the slot's row and column into canvas coordinates.
        return {
            x: this.panelX + column * (this.slotSize + this.slotGap),
            y: this.panelY + row * (this.slotSize + this.slotGap)
        }
    }

    /**
     * Finds which inventory slot is underneath a canvas pointer position.
     *
     * This performs inventory hit detection by checking whether the pointer
     * is inside the rectangular area of each inventory slot.
     *
     * @param {number} canvasX
     * Pointer X position in terminal canvas coordinates.
     *
     * @param {number} canvasY
     * Pointer Y position in terminal canvas coordinates.
     *
     * @returns {{index: number} | null}
     * An object containing the index of the slot underneath the pointer,
     * or null when the pointer is not inside any inventory slot.
     */
    getSlotAtCanvasPosition(canvasX, canvasY) {
        // Check every inventory slot until one contains the pointer.
        for (let i = 0; i < this.items.length; i++) {
            // Get the top-left canvas position of this slot.
            const position = this.getSlotPosition(this.items[i].slotPosition)

            // Calculate the complete rectangular boundary of the slot.
            const left = position.x
            const right = position.x + this.slotSize
            const top = position.y
            const bottom = position.y + this.slotSize

            // Check whether the pointer is inside this slot's rectangle.
            if (
                canvasX >= left &&
                canvasX <= right &&
                canvasY >= top &&
                canvasY <= bottom
            ) {
                return {
                    index: i
                }
            }
        }

        // The pointer was not inside any inventory slot.
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
    createPipeFromSlot(index) {
        const item = this.items[index]
        const pipeCopy = new Pipe(item.pipe.type, item.pipe.connections)
        return pipeCopy
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
    }
}