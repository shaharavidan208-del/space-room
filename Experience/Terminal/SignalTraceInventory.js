export default class SignalTraceInventory {
    constructor(signalTrace) {
        this.signalTrace = signalTrace
        this.ctx = signalTrace.ctx

        this.slotSize = signalTrace.tileSize
        this.slotGap = 26

        this.panelX = 1280
        this.panelY = 350
        this.panelWidth = 470

        this.items = this.createItemsFromLevel()
    }

    createItemsFromLevel() {
        if (this.signalTrace.level.inventory) {
            return this.cloneInventoryItems(this.signalTrace.level.inventory)
        }

        return [
            {
                connections: ["left", "right"],
                count: 3
            },
            {
                connections: ["up", "down"],
                count: 3
            },
            {
                connections: ["up", "right"],
                count: 2
            },
            {
                connections: ["right", "down"],
                count: 2
            }
        ]
    }

    /**
     * Creates a deep copy of the inventory items
     * @param {*object} items the inventory items to clone 
     * @returns {Array<{label: string, connections: Array<string>, count: number}>} a deep copy of the inventory items
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

    draw() {
        this.drawPanelBackground()
        this.drawPanelTitle()

        for (let i = 0; i < this.items.length; i++) {
            this.drawSlot(i)
        }
    }

    drawPanelBackground() {
        const ctx = this.ctx
        const panelHeight = this.items.length * (this.slotSize + this.slotGap) + 115

        ctx.save()

        ctx.fillStyle = "rgba(0, 255, 65, 0.025)"
        ctx.fillRect(this.panelX - 30, this.panelY - 80, this.panelWidth, panelHeight)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.16)"
        ctx.lineWidth = 4
        ctx.strokeRect(this.panelX - 30, this.panelY - 80, this.panelWidth, panelHeight)

        ctx.restore()
    }

    drawPanelTitle() {
        const ctx = this.ctx

        ctx.save()

        ctx.fillStyle = "#00FF41"
        ctx.font = "34px monospace"
        ctx.textAlign = "left"
        ctx.fillText("MODULE CACHE", this.panelX - 10, this.panelY - 35)


        ctx.restore()
    }

    drawSlot(index) {
        const item = this.items[index]
        const position = this.getSlotPosition(index)
        const x = position.x
        const y = position.y
        const ctx = this.ctx

        ctx.save()

        if (item.count <= 0) {
            ctx.globalAlpha = 0.28
        }

        ctx.fillStyle = "rgba(0, 255, 65, 0.045)"
        ctx.fillRect(x, y, this.slotSize, this.slotSize)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.22)"
        ctx.lineWidth = 5
        ctx.strokeRect(x, y, this.slotSize, this.slotSize)

        const previewTile = {
            connections: item.connections
        }

        this.signalTrace.pipeRenderer.drawPipe(x, y, previewTile)

        ctx.fillStyle = "rgba(216, 255, 220, 0.78)"
        ctx.font = "30px monospace"
        ctx.fillText("x" + item.count, x + this.slotSize + 24, y + 88)

        ctx.restore()
    }

    getSlotPosition(index) {
        return {
            x: this.panelX,
            y: this.panelY + index * (this.slotSize + this.slotGap)
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

    createTileFromSlot(index) {
        const item = this.items[index]

        return {
            connections: [...item.connections]
        }
    }

    decreaseSlotCount(index) {
        if (!this.canPickUpSlot(index)) {
            return
        }

        this.items[index].count -= 1
    }
}