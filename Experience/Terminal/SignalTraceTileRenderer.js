import GUI from "lil-gui"
export default class SignalTraceTileRenderer {
    constructor(ctx, tileSize, redrawCallback) {
    this.ctx = ctx
    this.tileSize = tileSize
    this.redrawCallback = redrawCallback

    this.lockSettings = {
    offsetX: 25,
    offsetY: 27,

    warningTintAlpha: 0.07,

    shackleRadius: 9,
    shackleOffsetY: -4,
    shackleLineWidth: 5,

    bodyWidth: 24,
    bodyHeight: 19,
    bodyOffsetY: -3,

    keyholeRadius: 3,
    keyholeOffsetY: 5,

    keyholeStemWidth: 4,
    keyholeStemHeight: 7
}

}

setupDebugGUI() {
    const gui = new GUI()
    const lockFolder = gui.addFolder("Locked Tile")

    this.addGUIController(
        lockFolder,
        "offsetX",
        0,
        70,
        1
    )

    this.addGUIController(
        lockFolder,
        "offsetY",
        0,
        70,
        1
    )

    this.addGUIController(
        lockFolder,
        "shackleRadius",
        1,
        30,
        1
    )

    this.addGUIController(
        lockFolder,
        "shackleOffsetY",
        -20,
        20,
        1
    )

    this.addGUIController(
        lockFolder,
        "shackleLineWidth",
        1,
        15,
        1
    )

    this.addGUIController(
        lockFolder,
        "bodyWidth",
        5,
        60,
        1
    )

    this.addGUIController(
        lockFolder,
        "bodyHeight",
        5,
        60,
        1
    )

    this.addGUIController(
        lockFolder,
        "bodyOffsetY",
        -20,
        20,
        1
    )

    this.addGUIController(
        lockFolder,
        "keyholeRadius",
        1,
        10,
        1
    )

    this.addGUIController(
        lockFolder,
        "keyholeStemWidth",
        1,
        15,
        1
    )

    this.addGUIController(
        lockFolder,
        "keyholeStemHeight",
        1,
        20,
        1
    )
}

addGUIController(folder, property, min, max, step) {
    folder
        .add(
            this.lockSettings,
            property,
            min,
            max,
            step
        )
        .onChange(() => {
            if (this.redrawCallback) {
                this.redrawCallback()
            }
        })
}

    /**
     * Draws the normal background and border of a tile.
     *
     * @param {number} x - Tile's top-left X position.
     * @param {number} y - Tile's top-left Y position.
     * @returns {void}
     */
    drawTile(x, y) {
        this.ctx.fillStyle = "rgba(0, 255, 65, 0.035)"
        this.ctx.fillRect(
            x,
            y,
            this.tileSize,
            this.tileSize
        )

        this.ctx.strokeStyle = "rgba(0, 255, 65, 0.13)"
        this.ctx.lineWidth = 8
        this.ctx.strokeRect(
            x,
            y,
            this.tileSize,
            this.tileSize
        )
    }



    /**
     * Draws the visual overlay for a locked tile.
     *
     * This runs after the pipe is drawn so the locked state
     * remains clearly visible.
     *
     * @param {number} x - Tile's top-left X position.
     * @param {number} y - Tile's top-left Y position.
     * @returns {void}
     */
    drawLockedTile(x, y) {
    const lockCenterX = x + this.tileSize - 66
    const lockCenterY = y + 23

    this.ctx.save()

    /**
     * Give the entire tile a faint warning tint.
     */
    this.ctx.fillStyle = "rgba(255, 138, 61, 0.07)"

    this.ctx.fillRect(
        x,
        y,
        this.tileSize,
        this.tileSize
    )

    /**
     * Draw the lock shackle.
     */
    this.ctx.beginPath()
    this.ctx.strokeStyle = "#ff8a3d"
    this.ctx.lineWidth = 8

    this.ctx.arc(
        lockCenterX,
        lockCenterY - 5,
        14,
        Math.PI,
        0
    )

    this.ctx.stroke()

    /**
     * Draw the rectangular lock body.
     */
    this.ctx.fillStyle = "#ff8a3d"

    this.ctx.fillRect(
        lockCenterX - 39 / 2,
        lockCenterY - 3,
        39,
        24
    )

    /**
     * Draw the dark keyhole.
     */
    const keyholeY = lockCenterY + 5

    this.ctx.fillStyle = "#050505"

    this.ctx.beginPath()

    this.ctx.arc(
        lockCenterX,
        keyholeY,
        5,
        0,
        Math.PI * 2
    )

    this.ctx.fill()

    this.ctx.fillRect(
        lockCenterX - 4 / 2,
        keyholeY,
        4,
        11
    )

    this.ctx.restore()
}
}