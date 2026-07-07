export default class SignalTraceEndpointRenderer {
    constructor(signalTrace) {
        this.signalTrace = signalTrace
        this.ctx = signalTrace.ctx
        this.pipeRenderer = signalTrace.pipeRenderer

        this.tileSize = signalTrace.tileSize
        this.tileGap = signalTrace.tileGap
    }

    drawEndpoint(endpoint, label) {
        const anchor = this.getEndpointAnchor(endpoint)

        if (!anchor) {
            return
        }

        this.ctx.save()
        this.ctx.translate(anchor.x, anchor.y)
        this.ctx.rotate(this.getRotationForDirection(endpoint.direction))

        this.drawEndpointPipeShape()

        this.ctx.restore()

        this.drawLabel(anchor.x, anchor.y, endpoint.direction, label)
    }

    getEndpointAnchor(endpoint) {
        const step = this.tileSize + this.tileGap
        const boardStartX = this.signalTrace.boardStartX
        const boardStartY = this.signalTrace.boardStartY

        if (endpoint.direction === "right") {
            return {
                x: boardStartX - 58,
                y: boardStartY + endpoint.row * step + this.tileSize / 2
            }
        }

        if (endpoint.direction === "left") {
            return {
                x: boardStartX + this.signalTrace.cols * step - this.tileGap + 58,
                y: boardStartY + endpoint.row * step + this.tileSize / 2
            }
        }

        if (endpoint.direction === "down") {
            return {
                x: boardStartX + endpoint.col * step + this.tileSize / 2,
                y: boardStartY - 58
            }
        }

        if (endpoint.direction === "up") {
            return {
                x: boardStartX + endpoint.col * step + this.tileSize / 2,
                y: boardStartY + this.signalTrace.rows * step - this.tileGap + 58
            }
        }

        return null
    }

    getRotationForDirection(direction) {
        if (direction === "right") {
            return 0
        }

        if (direction === "left") {
            return Math.PI
        }

        if (direction === "down") {
            return Math.PI / 2
        }

        if (direction === "up") {
            return -Math.PI / 2
        }

        return 0
    }

    drawEndpointPipeShape() {
        const ctx = this.ctx
        const colors = this.pipeRenderer.colors

        ctx.save()

        /**
         * Rear circular socket.
         * Drawn first so the endpoint body sits inside / on top of it.
         */
        this.drawMountLoop()

        /**
         * Outer endpoint body.
         */
        ctx.shadowColor = colors.terminalGreen
        ctx.shadowBlur = 12
        ctx.fillStyle = colors.pipeOuter

        this.drawEndpointOuterPath()
        ctx.fill()

        /**
         * Inner endpoint body.
         */
        ctx.shadowBlur = 0
        ctx.fillStyle = colors.pipeDark

        this.drawEndpointInnerPath()
        ctx.fill()

        /**
         * Core signal line.
         */
        ctx.strokeStyle = "rgba(190, 255, 200, 0.95)"
        ctx.shadowColor = colors.terminalGreen
        ctx.shadowBlur = 10
        ctx.lineWidth = 3
        ctx.lineCap = "round"

        ctx.beginPath()
        ctx.moveTo(-48, 0)
        ctx.lineTo(64, 0)
        ctx.stroke()

        ctx.shadowBlur = 0

        /**
         * Front connector band.
         */
        this.drawConnectorBand(64, 0)

        ctx.restore()
    }

    drawMountLoop() {
        const ctx = this.ctx
        const colors = this.pipeRenderer.colors

        const x = -40
        const y = 0

        const outerRadius = 30
        const innerRadius = 20

        ctx.save()

        /**
         * Important:
         * No shadow here. The socket should be structural, not another glowing focal point.
         */
        ctx.shadowBlur = 0
        ctx.shadowColor = "transparent"

        /**
         * Real circular ring.
         * This replaces the old rounded-rectangle socket.
         */
        ctx.fillStyle = colors.clampDark

        ctx.beginPath()
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2)
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2, true)
        ctx.fill("evenodd")

        /**
         * Slight metal/pipe rim.
         * Still no glow.
         */
        ctx.strokeStyle = colors.clampMid
        ctx.lineWidth = 4

        ctx.beginPath()
        ctx.arc(x, y, outerRadius - 2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = "rgba(190, 255, 200, 0.35)"
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.arc(x, y, innerRadius + 1, 0, Math.PI * 2)
        ctx.stroke()

        ctx.restore()
    }

    drawEndpointOuterPath() {
        const ctx = this.ctx

        const frontX = 72
        const backCenterX = -28
        const radius = 20

        ctx.beginPath()

        ctx.moveTo(frontX, -radius)
        ctx.lineTo(backCenterX, -radius)

        ctx.arc(
            backCenterX,
            0,
            radius,
            -Math.PI / 2,
            Math.PI / 2,
            true
        )

        ctx.lineTo(frontX, radius)

        ctx.closePath()
    }

    drawEndpointInnerPath() {
        const ctx = this.ctx

        const frontX = 66
        const backCenterX = -24
        const radius = 13

        ctx.beginPath()

        ctx.moveTo(frontX, -radius)
        ctx.lineTo(backCenterX, -radius)

        ctx.arc(
            backCenterX,
            0,
            radius,
            -Math.PI / 2,
            Math.PI / 2,
            true
        )

        ctx.lineTo(frontX, radius)

        ctx.closePath()
    }

    drawConnectorBand(x, y) {
        const ctx = this.ctx
        const colors = this.pipeRenderer.colors

        const bandSize = 22

        ctx.save()

        ctx.strokeStyle = colors.clampDark
        ctx.lineWidth = 24
        this.strokeLine(x, y - bandSize, x, y + bandSize)

        ctx.strokeStyle = colors.clampMid
        ctx.lineWidth = 14
        this.strokeLine(x, y - bandSize, x, y + bandSize)

        ctx.strokeStyle = "rgba(0, 255, 65, 0.9)"
        ctx.lineWidth = 4
        this.strokeLine(x, y - bandSize, x, y + bandSize)

        ctx.restore()
    }

    strokeLine(startX, startY, endX, endY) {
        const ctx = this.ctx

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
    }

    drawLabel(anchorX, anchorY, direction, label) {
        const ctx = this.ctx

        let labelX = anchorX
        let labelY = anchorY + 54

        if (direction === "down") {
            labelY = anchorY - 36
        }

        ctx.save()

        ctx.fillStyle = "#d8ffdc"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        ctx.fillText(label, labelX, labelY)

        ctx.restore()
    }
}