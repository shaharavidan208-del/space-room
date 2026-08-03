import SignalTraceLevelOne from "./SignalTraceLevelOne.js"
import SignalTraceLevelTwo from "./SignalTraceLevelTwo.js"
import SignalTraceLevelThree from "./SignalTraceLevelThree.js"
import SignalTraceLevelFour from "./SignalTraceLevelFour.js"
import SignalTraceLevelFive from "./SignalTraceLevelFive.js"
import SignalTraceLevelSix from "./SignalTraceLevelSix.js"
import SignalTraceInventory from "./SignalTraceInventory.js"

export default class SignalTraceLevelManager {
    constructor(signalTrace) {
        this.signalTrace = signalTrace

        this.levelClasses = [
            SignalTraceLevelOne,
            SignalTraceLevelTwo,
            SignalTraceLevelThree,
            SignalTraceLevelFour,
            SignalTraceLevelFive,
            SignalTraceLevelSix
        ]

        this.currentLevelIndex = 0
        this.currentScreen = "mainMenu"

        this.startButton = {
            x: 0,
            y: 0,
            width: 420,
            height: 110
        }

        this.menuButton = {
            x: 0,
            y: 0,
            width: 150,
            height: 54
        }

        this.levelButtons = []
    }

    /**
     * Opens the main menu screen.
     */
    openMainMenu() {
        this.currentScreen = "mainMenu"
        this.drawMainMenu()
    }

    /**
     * Opens the level selection screen.
     */
    openLevelSelect() {
        this.currentScreen = "levelSelect"
        this.drawLevelSelectScreen()
    }

    /**
     * Draw the main menu.
     */
    drawMainMenu() {
        const signalTrace = this.signalTrace
        const ctx = signalTrace.ctx
        const canvas = signalTrace.canvas

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        /**
         * Background.
         */
        ctx.fillStyle = "#050505"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        /**
         * Main frame.
         */
        const frameInset = 18
        const frameX = frameInset
        const frameY = frameInset
        const frameWidth = canvas.width - frameInset * 2
        const frameHeight = canvas.height - frameInset * 2

        ctx.fillStyle = "rgba(0, 255, 65, 0.025)"
        ctx.fillRect(frameX, frameY, frameWidth, frameHeight)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.16)"
        ctx.lineWidth = 4
        ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)

        /**
         * Decorative lines.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
        ctx.fillRect(frameX + 28, frameY + 28, 90, 4)
        ctx.fillRect(frameX + frameWidth - 118, frameY + 28, 90, 4)
        ctx.fillRect(frameX + 28, frameY + frameHeight - 32, 90, 4)
        ctx.fillRect(frameX + frameWidth - 118, frameY + frameHeight - 32, 90, 4)

        /**
         * Title.
         */
        ctx.fillStyle = "#5cffb1"
        ctx.font = "92px monospace"
        ctx.textAlign = "center"
        ctx.fillText("SIGNAL TRACE", canvas.width / 2, 280)

        ctx.fillStyle = "rgba(92, 255, 177, 0.72)"
        ctx.font = "34px monospace"
        ctx.fillText("RECOVERY TERMINAL", canvas.width / 2, 345)

        /**
         * Start button.
         */
        this.startButton.x = canvas.width / 2 - this.startButton.width / 2
        this.startButton.y = 520

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        ctx.fillRect(
            this.startButton.x + 14,
            this.startButton.y + 14,
            this.startButton.width,
            this.startButton.height
        )

        ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
        ctx.fillRect(
            this.startButton.x,
            this.startButton.y,
            this.startButton.width,
            this.startButton.height
        )

        ctx.strokeStyle = "rgba(0, 255, 65, 0.28)"
        ctx.lineWidth = 5
        ctx.strokeRect(
            this.startButton.x,
            this.startButton.y,
            this.startButton.width,
            this.startButton.height
        )

        ctx.fillStyle = "rgba(216, 255, 220, 0.45)"
        ctx.fillRect(
            this.startButton.x + 10,
            this.startButton.y + 10,
            this.startButton.width - 20,
            4
        )

        ctx.fillStyle = "#d8ffdc"
        ctx.font = "52px monospace"
        ctx.fillText(
            "START",
            canvas.width / 2,
            this.startButton.y + 72
        )

        /**
         * Scanlines.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.03)"

        for (let y = 0; y < canvas.height; y += 6) {
            ctx.fillRect(0, y, canvas.width, 2)
        }

        signalTrace.texture.needsUpdate = true
    }

    /**
     * Draw the level selection screen.
     */
    drawLevelSelectScreen() {
        const signalTrace = this.signalTrace
        const ctx = signalTrace.ctx
        const canvas = signalTrace.canvas

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        /**
         * Background.
         */
        ctx.fillStyle = "#050505"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        /**
         * Main frame.
         */
        const frameInset = 18
        const frameX = frameInset
        const frameY = frameInset
        const frameWidth = canvas.width - frameInset * 2
        const frameHeight = canvas.height - frameInset * 2

        ctx.fillStyle = "rgba(0, 255, 65, 0.025)"
        ctx.fillRect(frameX, frameY, frameWidth, frameHeight)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.16)"
        ctx.lineWidth = 4
        ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)

        /**
         * Decorative lines.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
        ctx.fillRect(frameX + 28, frameY + 28, 90, 4)
        ctx.fillRect(frameX + frameWidth - 118, frameY + 28, 90, 4)
        ctx.fillRect(frameX + 28, frameY + frameHeight - 32, 90, 4)
        ctx.fillRect(frameX + frameWidth - 118, frameY + frameHeight - 32, 90, 4)

        /**
         * Menu button at top center.
         */
        this.menuButton.x = canvas.width / 2 - this.menuButton.width / 2
        this.menuButton.y = 28

        ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
        ctx.fillRect(
            this.menuButton.x,
            this.menuButton.y,
            this.menuButton.width,
            this.menuButton.height
        )

        ctx.strokeStyle = "rgba(0, 255, 65, 0.24)"
        ctx.lineWidth = 4
        ctx.strokeRect(
            this.menuButton.x,
            this.menuButton.y,
            this.menuButton.width,
            this.menuButton.height
        )

        ctx.fillStyle = "#d8ffdc"
        ctx.font = "28px monospace"
        ctx.textAlign = "center"
        ctx.fillText(
            "MENU",
            canvas.width / 2,
            this.menuButton.y + 35
        )

        /**
         * Screen title.
         */
        ctx.fillStyle = "#5cffb1"
        ctx.font = "64px monospace"
        ctx.fillText("LEVEL SELECT", canvas.width / 2, 145)

        ctx.fillStyle = "rgba(92, 255, 177, 0.72)"
        ctx.font = "28px monospace"
        ctx.fillText("SELECT SIGNAL ARCHIVE", canvas.width / 2, 190)

        /**
         * Grid layout.
         */
        const columns = 3
        const buttonWidth = 180
        const buttonHeight = 110
        const gapX = 70
        const gapY = 74

        const levelCount = this.levelClasses.length
        const rows = Math.ceil(levelCount / columns)

        const totalGridWidth =
            columns * buttonWidth + (columns - 1) * gapX

        const totalGridHeight =
            rows * buttonHeight + (rows - 1) * gapY

        const startX = canvas.width / 2 - totalGridWidth / 2
        const startY = canvas.height / 2 - totalGridHeight / 2 + 70

        this.levelButtons = []

        for (let index = 0; index < levelCount; index++) {
            const column = index % columns
            const row = Math.floor(index / columns)

            const x = startX + column * (buttonWidth + gapX)
            const y = startY + row * (buttonHeight + gapY)

            this.levelButtons.push({
                index: index,
                x: x,
                y: y,
                width: buttonWidth,
                height: buttonHeight
            })

            this.drawLevelButton(index, x, y, buttonWidth, buttonHeight)
        }

        /**
         * Scanlines.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.03)"

        for (let y = 0; y < canvas.height; y += 6) {
            ctx.fillRect(0, y, canvas.width, 2)
        }

        signalTrace.texture.needsUpdate = true
    }

    /**
     * Draw a single level button.
     */
    drawLevelButton(index, x, y, width, height) {
        const ctx = this.signalTrace.ctx
        const levelNumber = String(index + 1).padStart(3, "0")

        /**
         * Decorative pips above the button.
         */
        const pipSize = 12
        const pipGap = 10
        const totalPipWidth = pipSize * 3 + pipGap * 2
        const pipStartX = x + width / 2 - totalPipWidth / 2
        const pipY = y - 26

        ctx.fillStyle = "rgba(92, 255, 177, 0.75)"

        for (let i = 0; i < 3; i++) {
            ctx.fillRect(
                pipStartX + i * (pipSize + pipGap),
                pipY,
                pipSize,
                pipSize
            )
        }

        /**
         * Button shadow.
         */
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        ctx.fillRect(x + 14, y + 14, width, height)

        /**
         * Button body.
         */
        ctx.fillStyle = "rgba(0, 255, 65, 0.08)"
        ctx.fillRect(x, y, width, height)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.28)"
        ctx.lineWidth = 4
        ctx.strokeRect(x, y, width, height)

        /**
         * Top highlight.
         */
        ctx.fillStyle = "rgba(216, 255, 220, 0.4)"
        ctx.fillRect(x + 8, y + 8, width - 16, 4)

        /**
         * Level number.
         */
        ctx.fillStyle = "#d8ffdc"
        ctx.font = "48px monospace"
        ctx.textAlign = "center"
        ctx.fillText(levelNumber, x + width / 2, y + 72)
    }

    /**
     * Handle clicks on menu screens.
     */
    handlePointerDown(canvasX, canvasY) {
        if (this.currentScreen === "mainMenu") {
            if (this.isInsideRect(canvasX, canvasY, this.startButton)) {
                this.openLevelSelect()
            }

            return
        }

        if (this.currentScreen === "levelSelect") {
            if (this.isInsideRect(canvasX, canvasY, this.menuButton)) {
                this.openMainMenu()
                return
            }

            const button = this.getLevelButtonAtCanvasPosition(canvasX, canvasY)

            if (button) {
                this.loadLevel(button.index)
            }
        }
    }

    /**
     * Finds which level button was clicked.
     */
    getLevelButtonAtCanvasPosition(canvasX, canvasY) {
        for (let i = 0; i < this.levelButtons.length; i++) {
            const button = this.levelButtons[i]

            if (this.isInsideRect(canvasX, canvasY, button)) {
                return button
            }
        }

        return null
    }

    /**
     * Shared rectangle hit test.
     */
    isInsideRect(canvasX, canvasY, rect) {
        if (canvasX < rect.x) {
            return false
        }

        if (canvasX > rect.x + rect.width) {
            return false
        }

        if (canvasY < rect.y) {
            return false
        }

        if (canvasY > rect.y + rect.height) {
            return false
        }

        return true
    }

    /**
     * Load a playable level.
     */
    loadLevel(index) {
        const LevelClass = this.levelClasses[index]

        if (!LevelClass) {
            return
        }

        this.currentLevelIndex = index
        this.currentScreen = "playing"

        const level = new LevelClass()
        const signalTrace = this.signalTrace

        signalTrace.level = level

        signalTrace.rows = level.rows
        signalTrace.cols = level.cols

        signalTrace.source = {
            row: level.source.row,
            col: level.source.col,
            direction: level.source.direction
        }

        if (!signalTrace.source.direction) {
            signalTrace.source.direction = "right"
        }

        signalTrace.target = {
            row: level.target.row,
            col: level.target.col,
            direction: level.target.direction
        }

        if (!signalTrace.target.direction) {
            signalTrace.target.direction = "left"
        }

        if (level.relay) {
            signalTrace.relay = {
                row: level.relay.row,
                col: level.relay.col,
                direction: level.relay.direction
            }
        } else {
            signalTrace.relay = null
        }

        signalTrace.grid = level.createGrid()
        signalTrace.inventory = new SignalTraceInventory(signalTrace)

        signalTrace.dragController.cancelDrag()
        signalTrace.signalConnected = signalTrace.checkSignalPath()

        if (signalTrace.isRunning) {
            signalTrace.drawBootScreen()
        }
    }

    restartLevel() {
        this.loadLevel(this.currentLevelIndex)
    }

    loadNextLevel() {
        this.loadLevel(this.currentLevelIndex + 1)
    }
}