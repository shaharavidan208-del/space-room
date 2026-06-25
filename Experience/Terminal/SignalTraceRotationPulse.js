export default class SignalTraceRotationPulse {
    constructor(ctx, tileSize, redrawScreen) {
        /**
         * Canvas drawing context.
         * This lets the pulse draw directly onto the terminal canvas.
         */
        this.ctx = ctx

        /**
         * Tile size from SignalTrace.
         * The pulse needs this so it knows how large the glowing rectangle should be.
         */
        this.tileSize = tileSize

        /**
         * Function passed from SignalTrace.
         * The pulse animation calls this whenever it needs the screen redrawn.
         */
        this.redrawScreen = redrawScreen

        /**
         * The tile currently playing the pulse effect.
         * When this is null, no pulse is active.
         */
        this.pulseTile = null

        /**
         * How long the pulse lasts in milliseconds.
         */
        this.pulseDuration = 180

        /**
         * Overall opacity multiplier.
         */
        this.opacityStrength = 0.3

        /**
         * Stores the current requestAnimationFrame id.
         * This lets us cancel the old animation if a new pulse starts quickly.
         */
        this.animationFrameId = null
    }

    start(row, col) {
        /**
         * Store which tile should pulse.
         * startTime lets us calculate the fade progress.
         */
        this.pulseTile = {
            row: row,
            col: col,
            startTime: performance.now()
        }

        /**
         * If another pulse animation is already running,
         * cancel it before starting a fresh one.
         */
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }

        /**
         * Start the animation loop.
         */
        this.animate()
    }

    draw(x, y, row, col) {
        /**
         * If no pulse is active, there is nothing to draw.
         */
        if (!this.pulseTile) {
            return
        }

        /**
         * Only draw the pulse on the tile that triggered it.
         */
        if (row !== this.pulseTile.row || col !== this.pulseTile.col) {
            return
        }

        const currentTime = performance.now()
        const elapsedTime = currentTime - this.pulseTile.startTime

        /**
         * If the pulse already finished, skip drawing it.
         * The animation loop handles cleanup.
         */
        if (elapsedTime > this.pulseDuration) {
            return
        }

        /**
         * Convert elapsed time into progress.
         *
         * 0 = pulse just started
         * 1 = pulse is finished
         */
        const progress = elapsedTime / this.pulseDuration

        /**
         * Fade out over time.
         * opacityStrength keeps the effect subtle instead of nuking the screen.
         */
        const opacity = (1 - progress) * this.opacityStrength

        this.ctx.save()

        /**
         * Soft green fill over the tile.
         */
        this.ctx.fillStyle = `rgba(0, 255, 65, ${0.10 * opacity})`
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize)

        /**
         * Bright glowing border.
         */
        this.ctx.strokeStyle = `rgba(216, 255, 220, ${0.75 * opacity})`
        this.ctx.lineWidth = 6
        this.ctx.shadowColor = "#00FF41"
        this.ctx.shadowBlur = 24 * opacity
        this.ctx.strokeRect(x + 3, y + 3, this.tileSize - 6, this.tileSize - 6)

        this.ctx.restore()
    }

    animate() {
        /**
         * If no pulse exists, there is no animation to run.
         */
        if (!this.pulseTile) {
            return
        }

        const currentTime = performance.now()
        const elapsedTime = currentTime - this.pulseTile.startTime

        /**
         * If the pulse duration is finished,
         * clear the pulse and redraw once without the effect.
         */
        if (elapsedTime > this.pulseDuration) {
            this.pulseTile = null
            this.animationFrameId = null
            this.redrawScreen()
            return
        }

        /**
         * Redraw the full Signal Trace screen.
         * SignalTrace will call this.draw(...) while drawing the board.
         */
        this.redrawScreen()

        /**
         * Continue the animation on the next browser frame.
         */
        this.animationFrameId = requestAnimationFrame(() => {
            this.animate()
        })
    }
}