export default class SignalTracePipeRenderer {
    constructor(ctx, tileSize, tileGap) {
    this.ctx = ctx
    this.tileSize = tileSize
    this.tileGap = tileGap

    /**
     * Terminal-style color palette.
     * This keeps Signal Trace visually connected to TerminalCanvas.
     */
    this.colors = {
    terminalGreen: "#00FF41",
    terminalBackground: "#050505",

    pipeOuter: "#020602",
    pipeDark: "#061006",
    pipeMid: "#123d18",
    pipeBright: "#00FF41",
    pipeHighlight: "#b8ffc0",

    clampDark: "#020602",
    clampMid: "#16491f",
    clampBright: "#00FF41"
}
}

   drawPipe(x, y, tile) {
    if (!tile) {
        return
    }

    if (!tile.connections || tile.connections.length === 0) {
        return
    }

    const connections = tile.connections

    const centerX = x + this.tileSize / 2
    const centerY = y + this.tileSize / 2

    this.ctx.save()

    this.ctx.lineCap = "round"
    this.ctx.lineJoin = "round"

    /**
     * Pass 1: dark outer shadow.
     * This separates the pipe from the tile background.
     */
    this.ctx.shadowColor = "rgba(0, 255, 65, 0.25)"
    this.ctx.shadowBlur = 10
    this.ctx.strokeStyle = this.colors.pipeOuter
    this.ctx.lineWidth = 48
    this.strokePipeShape(x, y, centerX, centerY, connections)

    /**
     * Turn off shadow before drawing body layers.
     */
    this.ctx.shadowBlur = 0

    /**
     * Pass 2: dark pipe shell.
     */
    this.ctx.strokeStyle = this.colors.pipeDark
    this.ctx.lineWidth = 42
    this.strokePipeShape(x, y, centerX, centerY, connections)

    /**
     * Pass 3: green terminal-metal body.
     */
    this.ctx.strokeStyle = this.createPipeBodyGradient(x, y, connections)
    this.ctx.lineWidth = 30
    this.strokePipeShape(x, y, centerX, centerY, connections)

    /**
     * Pass 4: terminal-green surface highlight.
     * This should feel like a lit circuit trace, not white metal.
     */
    this.ctx.strokeStyle = "rgba(0, 255, 65, 0.75)"
    this.ctx.lineWidth = 8
    this.strokePipeShape(x, y, centerX, centerY, connections)

    /**
     * Pass 5: active signal core.
     * This is the powered part of the pipe.
     */
    this.ctx.shadowColor = this.colors.terminalGreen
    this.ctx.shadowBlur = 12
    this.ctx.strokeStyle = "rgba(190, 255, 200, 0.95)"
    this.ctx.lineWidth = 3
    this.strokePipeShape(x, y, centerX, centerY, connections)

    this.ctx.shadowBlur = 0

    this.drawPipeConnectorBands(x, y, connections)
    this.drawPipeJoint(centerX, centerY)

    this.ctx.restore()
}
drawConnectorBand(x, y, direction) {
    /**
     * The connector band is a short line drawn across the pipe.
     * It acts like a metal clamp/coupler near the edge of the tile.
     */
    const bandSize = 18

    /**
     * Start a new path for this band.
     */
    this.ctx.beginPath()

    /**
     * If the pipe goes left/right, the pipe is horizontal.
     * So the band should be vertical, crossing over it.
     */
    if (direction === "left" || direction === "right") {
        this.ctx.moveTo(x, y - bandSize)
        this.ctx.lineTo(x, y + bandSize)
    }

    /**
     * If the pipe goes up/down, the pipe is vertical.
     * So the band should be horizontal, crossing over it.
     */
    if (direction === "up" || direction === "down") {
        this.ctx.moveTo(x - bandSize, y)
        this.ctx.lineTo(x + bandSize, y)
    }

    /**
     * Actually draw the band using whatever strokeStyle/lineWidth
     * was set before calling this method.
     */
    this.ctx.stroke()
}
drawPipeConnectorBands(x, y, connections) {
    for (const direction of connections) {
        const point = this.getPipeEndPoint(x, y, direction)

        /**
         * Outer dark clamp.
         */
        this.ctx.strokeStyle = this.colors.clampDark
        this.ctx.lineWidth = 24
        this.drawConnectorBand(point.x, point.y, direction)

        /**
         * Main green clamp.
         */
        this.ctx.strokeStyle = this.colors.clampMid
        this.ctx.lineWidth = 14
        this.drawConnectorBand(point.x, point.y, direction)

        /**
         * Bright terminal reflection.
         */
        this.ctx.strokeStyle = "rgba(0, 255, 65, 0.9)"
        this.ctx.lineWidth = 4
        this.drawConnectorBand(point.x, point.y, direction)
    }
}
createPipeBodyGradient(x, y, connections) {
    let gradient

    /**
     * Horizontal pipes get top-to-bottom shading.
     */
    if (connections.length === 2 && connections.includes("left") && connections.includes("right")) {
        gradient = this.ctx.createLinearGradient(
            x,
            y,
            x,
            y + this.tileSize
        )
    }

    /**
     * Vertical pipes get left-to-right shading.
     */
    else if (connections.length === 2 && connections.includes("up") && connections.includes("down")) {
        gradient = this.ctx.createLinearGradient(
            x,
            y,
            x + this.tileSize,
            y
        )
    }

    /**
     * Corners/endpoints use diagonal shading.
     */
    else {
        gradient = this.ctx.createLinearGradient(
            x,
            y,
            x + this.tileSize,
            y + this.tileSize
        )
    }

    /**
     * Terminal green material:
     * dark edge -> green body -> bright scanline-like reflection -> dark edge.
     */
    gradient.addColorStop(0.00, "#020602")
gradient.addColorStop(0.18, "#071407")
gradient.addColorStop(0.34, "#123d18")
gradient.addColorStop(0.50, "#1f6b2d")
gradient.addColorStop(0.64, "#00FF41")
gradient.addColorStop(0.78, "#16491f")
gradient.addColorStop(1.00, "#020602")

    return gradient
}

    strokePipeShape(x, y, centerX, centerY, connections) {
        /**
         * Move your existing strokePipeShape logic here.
         */
         /**
     * Get the end points for all connected directions.
     * These are slightly outside the tile so pipes visually meet across gaps.
     */
    const up = this.getPipeEndPoint(x, y, "up")
    const right = this.getPipeEndPoint(x, y, "right")
    const down = this.getPipeEndPoint(x, y, "down")
    const left = this.getPipeEndPoint(x, y, "left")

    this.ctx.beginPath()

    /**
     * Straight horizontal pipe.
     */
    if (connections.length === 2 && connections.includes("left") && connections.includes("right")) {
        this.ctx.moveTo(left.x, left.y)
        this.ctx.lineTo(right.x, right.y)
        this.ctx.stroke()
        return
    }

    /**
     * Straight vertical pipe.
     */
    if (connections.length === 2 && connections.includes("up") && connections.includes("down")) {
        this.ctx.moveTo(up.x, up.y)
        this.ctx.lineTo(down.x, down.y)
        this.ctx.stroke()
        return
    }

    /**
     * Corner pipe.
     * If there are exactly two connections and they are not opposite,
     * draw a curved elbow using quadraticCurveTo.
     */
    if (connections.length === 2) {
        const firstPoint = this.getPipeEndPoint(x, y, connections[0])
        const secondPoint = this.getPipeEndPoint(x, y, connections[1])

        this.ctx.moveTo(firstPoint.x, firstPoint.y)

        /**
         * The center of the tile acts as the curve control point.
         * This bends the pipe through the center, creating a rounded corner.
         */
        this.ctx.quadraticCurveTo(centerX, centerY, secondPoint.x, secondPoint.y)

        this.ctx.stroke()
        return
    }

    /**
     * Single endpoint pipe.
     * Useful for source/target tiles.
     */
    if (connections.length === 1) {
        const point = this.getPipeEndPoint(x, y, connections[0])

        this.ctx.moveTo(centerX, centerY)
        this.ctx.lineTo(point.x, point.y)
        this.ctx.stroke()
        return
    }

    /**
     * T-junctions and crosses.
     * For now, draw branches from the center to each connected side.
     */
    for (const direction of connections) {
        const point = this.getPipeEndPoint(x, y, direction)

        this.ctx.moveTo(centerX, centerY)
        this.ctx.lineTo(point.x, point.y)
    }

    this.ctx.stroke()
    }

    getPipeEndPoint(x, y, direction) {
        /**
         * Move your existing getPipeEndPoint logic here.
         */
        const centerX = x + this.tileSize / 2
    const centerY = y + this.tileSize / 2

    /**
     * Extend the pipe slightly into the gap between tiles.
     * This makes neighboring pipes visually connect.
     */
    const extension = this.tileGap / 2

    if (direction === "up") {
        return {
            x: centerX,
            y: y - extension
        }
    }

    if (direction === "right") {
        return {
            x: x + this.tileSize + extension,
            y: centerY
        }
    }

    if (direction === "down") {
        return {
            x: centerX,
            y: y + this.tileSize + extension
        }
    }

    if (direction === "left") {
        return {
            x: x - extension,
            y: centerY
        }
    }
    }

   drawPipeJoint(centerX, centerY) {
    this.ctx.save()

    /**
     * Outer dark ring.
     */
    this.ctx.fillStyle = this.colors.clampDark
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
    this.ctx.fill()

    /**
     * Green radial body.
     */
    const jointGradient = this.ctx.createRadialGradient(
        centerX - 6,
        centerY - 6,
        4,
        centerX,
        centerY,
        17
    )

    jointGradient.addColorStop(0.00, "#b8ffc0")
    jointGradient.addColorStop(0.22, "#00FF41")
    jointGradient.addColorStop(0.58, "#1f6b2d")
    jointGradient.addColorStop(1.00, "#061006")

    this.ctx.fillStyle = jointGradient
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2)
    this.ctx.fill()

    /**
     * Powered core.
     */
    this.ctx.shadowColor = this.colors.terminalGreen
    this.ctx.shadowBlur = 10
    this.ctx.fillStyle = "#d8ffdc"
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.restore()
}
}