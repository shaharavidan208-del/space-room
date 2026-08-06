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

        /**
 * Stores completed levels for the current session.
 *
 * We will use this later when drawing completed states
 * on the level selection screen.
 */
this.completedLevelIndexes = new Set()

/**
 * Victory animation state.
 */
this.victoryAnimationFrame = null
this.victorySplashStartedAt = 0

/**
 * Victory screen buttons.
 */
this.nextLevelButton = {
    x: 0,
    y: 0,
    width: 360,
    height: 96
}

this.victoryLevelSelectButton = {
    x: 0,
    y: 0,
    width: 360,
    height: 96
}
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
        if (this.currentScreen === "victorySplash") {
    /**
     * The cinematic splash cannot be skipped accidentally.
     */
    return
}

if (this.currentScreen === "victory") {
    const hasNextLevel =
        this.currentLevelIndex <
        this.levelClasses.length - 1

    if (
        hasNextLevel &&
        this.isInsideRect(
            canvasX,
            canvasY,
            this.nextLevelButton
        )
    ) {
        this.loadNextLevel()
        return
    }

    if (
        this.isInsideRect(
            canvasX,
            canvasY,
            this.victoryLevelSelectButton
        )
    ) {
        this.openLevelSelect()
    }

    return
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
        this.stopVictoryAnimation()
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
    const nextLevelIndex =
        this.currentLevelIndex + 1

    if (
        nextLevelIndex >=
        this.levelClasses.length
    ) {
        this.openLevelSelect()
        return
    }

    this.loadLevel(nextLevelIndex)
}

    /**
 * Begins the cinematic victory sequence.
 *
 * The solved board remains visible briefly before the
 * SIGNAL RESTORED banner begins appearing over it.
 */
openVictorySplash() {
    if (this.currentScreen !== "playing") {
        return
    }

    this.stopVictoryAnimation()

    this.currentScreen = "victorySplash"

    /**
     * Record this level as completed.
     *
     * The level selection screen will use this later.
     */
    this.completedLevelIndexes.add(
        this.currentLevelIndex
    )

    this.victorySplashStartedAt = performance.now()

    this.animateVictorySplash()
}

/**
 * Draws every frame of the victory splash.
 */
animateVictorySplash() {
    if (this.currentScreen !== "victorySplash") {
        return
    }

    const currentTime = performance.now()
    const elapsedTime =
        currentTime - this.victorySplashStartedAt

    /**
     * Let the player see the completed board before
     * covering it with the victory announcement.
     */
    const boardHoldDuration = 350

    /**
     * Time used by the actual SIGNAL RESTORED animation.
     */
    const bannerDuration = 1550

    const totalDuration =
        boardHoldDuration + bannerDuration

    /**
     * Always redraw the solved board first.
     */
    this.signalTrace.drawBootScreen()

    if (elapsedTime >= boardHoldDuration) {
        const bannerElapsed =
            elapsedTime - boardHoldDuration

        let progress =
            bannerElapsed / bannerDuration

        if (progress > 1) {
            progress = 1
        }

        this.drawVictorySplashOverlay(progress)
    }

    this.signalTrace.texture.needsUpdate = true

    if (elapsedTime < totalDuration) {
        this.victoryAnimationFrame =
            requestAnimationFrame(() => {
                this.animateVictorySplash()
            })

        return
    }

    this.victoryAnimationFrame = null
    this.openVictoryScreen()
}

/**
 * Draws the darkened overlay and cinematic victory banner.
 *
 * @param {number} progress
 * Animation progress between 0 and 1.
 */
drawVictorySplashOverlay(progress) {
    const ctx = this.signalTrace.ctx
    const canvas = this.signalTrace.canvas

    const easedProgress =
        1 - Math.pow(1 - progress, 3)

    /**
     * Gradually darken the solved board.
     */
    const overlayAlpha =
        easedProgress * 0.78

    ctx.save()

    ctx.fillStyle =
        `rgba(0, 0, 0, ${overlayAlpha})`

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    )

    ctx.restore()

    this.drawVictoryBanner(
        progress,
        canvas.height / 2
    )
}

/**
 * Draws the wide SIGNAL RESTORED announcement.
 *
 * The design borrows the geometry of the reference:
 * - large centered text
 * - horizontal glowing band
 * - light trails extending sideways
 *
 * @param {number} progress
 * Banner animation progress between 0 and 1.
 *
 * @param {number} centerY
 * Vertical center of the banner.
 */
drawVictoryBanner(progress, centerY) {
    const ctx = this.signalTrace.ctx
    const canvas = this.signalTrace.canvas

    /**
     * The banner finishes expanding before the entire
     * splash animation ends, giving it time to remain visible.
     */
    let expansionProgress = progress / 0.55

    if (expansionProgress > 1) {
        expansionProgress = 1
    }

    const easedExpansion =
        1 - Math.pow(1 - expansionProgress, 3)

    /**
     * Fade the main text in shortly after the band begins.
     */
    let textAlpha =
        (progress - 0.08) / 0.32

    if (textAlpha < 0) {
        textAlpha = 0
    }

    if (textAlpha > 1) {
        textAlpha = 1
    }

    /**
     * Supporting text appears near the end.
     */
    let subtitleAlpha =
        (progress - 0.55) / 0.25

    if (subtitleAlpha < 0) {
        subtitleAlpha = 0
    }

    if (subtitleAlpha > 1) {
        subtitleAlpha = 1
    }

    const bandWidth =
        canvas.width * easedExpansion

    const bandX =
        canvas.width / 2 - bandWidth / 2

    const bandHeight = 132
    const bandY = centerY - bandHeight / 2

    ctx.save()

    /**
     * Broad, dim glow behind the title.
     */
    const outerBandGradient =
        ctx.createLinearGradient(
            bandX,
            0,
            bandX + bandWidth,
            0
        )

    outerBandGradient.addColorStop(
        0,
        "rgba(0, 255, 65, 0)"
    )

    outerBandGradient.addColorStop(
        0.16,
        "rgba(0, 255, 65, 0.04)"
    )

    outerBandGradient.addColorStop(
        0.5,
        "rgba(0, 255, 65, 0.17)"
    )

    outerBandGradient.addColorStop(
        0.84,
        "rgba(0, 255, 65, 0.04)"
    )

    outerBandGradient.addColorStop(
        1,
        "rgba(0, 255, 65, 0)"
    )

    ctx.fillStyle = outerBandGradient

    ctx.fillRect(
        bandX,
        bandY,
        bandWidth,
        bandHeight
    )

    /**
     * Brighter central signal strip.
     */
    const innerBandGradient =
        ctx.createLinearGradient(
            bandX,
            0,
            bandX + bandWidth,
            0
        )

    innerBandGradient.addColorStop(
        0,
        "rgba(92, 255, 177, 0)"
    )

    innerBandGradient.addColorStop(
        0.25,
        "rgba(92, 255, 177, 0.12)"
    )

    innerBandGradient.addColorStop(
        0.5,
        "rgba(92, 255, 177, 0.46)"
    )

    innerBandGradient.addColorStop(
        0.75,
        "rgba(92, 255, 177, 0.12)"
    )

    innerBandGradient.addColorStop(
        1,
        "rgba(92, 255, 177, 0)"
    )

    ctx.fillStyle = innerBandGradient

    ctx.fillRect(
        bandX,
        centerY - 13,
        bandWidth,
        26
    )

    /**
     * Thin signal line through the middle.
     */
    ctx.fillStyle =
        `rgba(216, 255, 220, ${textAlpha * 0.34})`

    ctx.fillRect(
        bandX,
        centerY - 2,
        bandWidth,
        4
    )

    /**
     * Main title.
     */
    const titleFontSize =
        Math.min(
            112,
            canvas.width * 0.065
        )

    ctx.font =
        `${titleFontSize}px monospace`

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    /**
     * Horizontal ghost copies create the stretched,
     * signal-smear look from the reference.
     */
    const trailDistance =
        90 * (1 - easedExpansion)

    for (let trail = 4; trail >= 1; trail--) {
        const offset =
            trailDistance * (trail / 4)

        const trailAlpha =
            textAlpha * (0.035 + trail * 0.012)

        ctx.fillStyle =
            `rgba(92, 255, 177, ${trailAlpha})`

        ctx.fillText(
            "SIGNAL RESTORED",
            canvas.width / 2 - offset,
            centerY
        )

        ctx.fillText(
            "SIGNAL RESTORED",
            canvas.width / 2 + offset,
            centerY
        )
    }

    /**
     * Bright central title.
     */
    ctx.shadowColor = "#00ff77"
    ctx.shadowBlur = 30

    ctx.fillStyle =
        `rgba(216, 255, 220, ${textAlpha})`

    ctx.fillText(
        "SIGNAL RESTORED",
        canvas.width / 2,
        centerY
    )

    ctx.shadowBlur = 0

    /**
     * Small confirmation message underneath.
     */
    ctx.font = "30px monospace"

    ctx.fillStyle =
        `rgba(92, 255, 177, ${subtitleAlpha * 0.72})`

    ctx.fillText(
        "ARCHIVE CONNECTION STABILIZED",
        canvas.width / 2,
        centerY + 92
    )

    ctx.restore()
}

/**
 * Opens the interactive victory screen after the
 * cinematic announcement finishes.
 */
openVictoryScreen() {
    this.stopVictoryAnimation()

    this.currentScreen = "victory"

    this.drawVictoryScreen()
}

/**
 * Draws the completed-level screen.
 */
drawVictoryScreen() {
    const signalTrace = this.signalTrace
    const ctx = signalTrace.ctx
    const canvas = signalTrace.canvas

    /**
     * Keep the solved board behind the victory interface.
     */
    signalTrace.drawBootScreen()

    /**
     * Dark overlay.
     */
    ctx.fillStyle = "rgba(0, 0, 0, 0.84)"

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    )

    /**
     * Keep the cinematic announcement geometry,
     * but position it higher to leave room for buttons.
     */
    const bannerCenterY =
        canvas.height * 0.34

    this.drawVictoryBanner(
        1,
        bannerCenterY
    )

    /**
     * Level recovery confirmation.
     */
    const levelNumber =
        String(
            this.currentLevelIndex + 1
        ).padStart(3, "0")

    ctx.save()

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.fillStyle =
        "rgba(0, 255, 65, 0.5)"

    ctx.font = "30px monospace"

    ctx.fillText(
        `ARCHIVE NODE ${levelNumber} RECOVERED`,
        canvas.width / 2,
        bannerCenterY + 148
    )

    ctx.restore()

    this.drawVictoryButtons()

    /**
     * CRT scanlines over the completed screen.
     */
    ctx.fillStyle =
        "rgba(0, 255, 65, 0.022)"

    for (
        let y = 0;
        y < canvas.height;
        y += 6
    ) {
        ctx.fillRect(
            0,
            y,
            canvas.width,
            2
        )
    }

    signalTrace.texture.needsUpdate = true
}

/**
 * Draws the victory navigation buttons.
 */
drawVictoryButtons() {
    const ctx = this.signalTrace.ctx
    const canvas = this.signalTrace.canvas

    const hasNextLevel =
        this.currentLevelIndex <
        this.levelClasses.length - 1

    const gap = 38
    const buttonY =
        canvas.height * 0.68

    if (hasNextLevel) {
        const totalWidth =
            this.nextLevelButton.width +
            this.victoryLevelSelectButton.width +
            gap

        this.nextLevelButton.x =
            canvas.width / 2 -
            totalWidth / 2

        this.nextLevelButton.y =
            buttonY

        this.victoryLevelSelectButton.x =
            this.nextLevelButton.x +
            this.nextLevelButton.width +
            gap

        this.victoryLevelSelectButton.y =
            buttonY

        this.drawVictoryButton(
            this.nextLevelButton,
            "NEXT LEVEL",
            true
        )
    } else {
        /**
         * There is no NEXT LEVEL button after
         * the final currently available level.
         */
        this.victoryLevelSelectButton.x =
            canvas.width / 2 -
            this.victoryLevelSelectButton.width / 2

        this.victoryLevelSelectButton.y =
            buttonY
    }

    this.drawVictoryButton(
        this.victoryLevelSelectButton,
        "LEVEL SELECT",
        false
    )

    ctx.textAlign = "center"
}

/**
 * Draws one victory-screen button.
 *
 * @param {Object} button
 * Button rectangle.
 *
 * @param {string} label
 * Text shown inside the button.
 *
 * @param {boolean} primary
 * Whether this is the main action.
 */
drawVictoryButton(button, label, primary) {
    const ctx = this.signalTrace.ctx

    ctx.save()

    /**
     * Shadow behind the button.
     */
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)"

    ctx.fillRect(
        button.x + 14,
        button.y + 14,
        button.width,
        button.height
    )

    if (primary) {
        ctx.fillStyle =
            "rgba(0, 255, 65, 0.12)"

        ctx.strokeStyle =
            "rgba(92, 255, 177, 0.58)"
    } else {
        ctx.fillStyle =
            "rgba(0, 255, 65, 0.045)"

        ctx.strokeStyle =
            "rgba(0, 255, 65, 0.24)"
    }

    ctx.fillRect(
        button.x,
        button.y,
        button.width,
        button.height
    )

    ctx.lineWidth = 5

    ctx.strokeRect(
        button.x,
        button.y,
        button.width,
        button.height
    )

    /**
     * Bright top edge.
     */
    ctx.fillStyle = primary
        ? "rgba(216, 255, 220, 0.62)"
        : "rgba(216, 255, 220, 0.24)"

    ctx.fillRect(
        button.x + 10,
        button.y + 9,
        button.width - 20,
        4
    )

    ctx.fillStyle = primary
        ? "#d8ffdc"
        : "rgba(216, 255, 220, 0.68)"

    ctx.font = "38px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.fillText(
        label,
        button.x + button.width / 2,
        button.y + button.height / 2 + 3
    )

    ctx.restore()
}

/**
 * Stops any victory animation that is currently running.
 */
stopVictoryAnimation() {
    if (this.victoryAnimationFrame === null) {
        return
    }

    cancelAnimationFrame(
        this.victoryAnimationFrame
    )

    this.victoryAnimationFrame = null
}


}