import * as THREE from 'three'

export function createPortfolioWallDecal() {
    const root = new THREE.Group()
    root.name = 'PortfolioWallDecal'

    const canvas = document.createElement('canvas')

    canvas.width = 2048
    canvas.height = 800

    const ctx = canvas.getContext('2d')

    drawDecal(ctx, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)

    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter

    const geometry = new THREE.PlaneGeometry(
        3.2,
        1.25
    )

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,

        /**
         * Keeps the cyan glow from being affected
         * by your scene's tone mapping.
         */
        toneMapped: false,

        /**
         * We only care about the visible side.
         */
        side: THREE.FrontSide,

        /**
         * Useful since this sits extremely close to a wall.
         */
        depthWrite: true,
    })

    material.name = 'PortfolioWallDecalMaterial'

    const plane = new THREE.Mesh(
        geometry,
        material
    )

    plane.name = 'PortfolioWallDecalPlane'

    plane.castShadow = false
    plane.receiveShadow = false

    root.add(plane)

    return root
}

function drawDecal(ctx, width, height) {
    ctx.clearRect(
        0,
        0,
        width,
        height
    )

    /**
     * Main panel.
     */
    drawChamferedPanel(
        ctx,
        80,
        70,
        width - 160,
        height - 140,
        80
    )

    const panelGradient =
        ctx.createLinearGradient(
            0,
            0,
            width,
            height
        )

    panelGradient.addColorStop(
        0,
        'rgba(4, 18, 27, 0.96)'
    )

    panelGradient.addColorStop(
        0.5,
        'rgba(8, 29, 39, 0.97)'
    )

    panelGradient.addColorStop(
        1,
        'rgba(3, 14, 22, 0.96)'
    )

    ctx.fillStyle = panelGradient
    ctx.fill()

    /**
     * Outer dark metallic-looking frame.
     */
    ctx.lineWidth = 26
    ctx.strokeStyle = '#152b36'
    ctx.stroke()

    /**
     * Main glowing cyan frame.
     */
    ctx.save()

    ctx.shadowColor = '#51eaff'
    ctx.shadowBlur = 32

    ctx.lineWidth = 9
    ctx.strokeStyle = '#71efff'

    drawChamferedPanel(
        ctx,
        115,
        105,
        width - 230,
        height - 210,
        62
    )

    ctx.stroke()

    ctx.restore()

    /**
     * Inner frame.
     */
    ctx.lineWidth = 3
    ctx.strokeStyle =
        'rgba(83, 223, 255, 0.65)'

    drawChamferedPanel(
        ctx,
        145,
        135,
        width - 290,
        height - 270,
        50
    )

    ctx.stroke()

    /**
     * Corner accents.
     */
    drawCornerAccent(
        ctx,
        155,
        145,
        1,
        1
    )

    drawCornerAccent(
        ctx,
        width - 155,
        145,
        -1,
        1
    )

    drawCornerAccent(
        ctx,
        155,
        height - 145,
        1,
        -1
    )

    drawCornerAccent(
        ctx,
        width - 155,
        height - 145,
        -1,
        -1
    )

    /**
     * Small center emblem.
     */
    drawEmblem(
        ctx,
        width * 0.5,
        220
    )

    /**
     * Horizontal HUD lines.
     */
    ctx.save()

    ctx.strokeStyle =
        'rgba(103, 234, 255, 0.8)'

    ctx.lineWidth = 3

    ctx.beginPath()

    ctx.moveTo(
        width * 0.2,
        295
    )

    ctx.lineTo(
        width * 0.42,
        295
    )

    ctx.moveTo(
        width * 0.58,
        295
    )

    ctx.lineTo(
        width * 0.8,
        295
    )

    ctx.stroke()

    ctx.restore()

    /**
     * Main name.
     */
    ctx.save()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.font =
        '700 108px Arial, sans-serif'

    ctx.fillStyle = '#e8fbff'

    ctx.shadowColor = '#4adfff'
    ctx.shadowBlur = 18

    ctx.fillText(
        'SHAHAR AVIDAN',
        width * 0.5,
        410
    )

    ctx.restore()

    /**
     * Separator.
     */
    const separatorY = 500

    ctx.strokeStyle =
        'rgba(73, 222, 255, 0.72)'

    ctx.lineWidth = 2

    ctx.beginPath()

    ctx.moveTo(
        width * 0.23,
        separatorY
    )

    ctx.lineTo(
        width * 0.77,
        separatorY
    )

    ctx.stroke()

    /**
     * Tiny center dot.
     */
    ctx.save()

    ctx.fillStyle = '#7ff6ff'
    ctx.shadowColor = '#4deaff'
    ctx.shadowBlur = 18

    ctx.beginPath()

    ctx.arc(
        width * 0.5,
        separatorY,
        7,
        0,
        Math.PI * 2
    )

    ctx.fill()

    ctx.restore()

    /**
     * Subtitle.
     */
    ctx.save()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.font =
        '600 46px Arial, sans-serif'

    ctx.fillStyle =
        'rgba(235, 252, 255, 0.94)'

    ctx.shadowColor = '#46ddff'
    ctx.shadowBlur = 10

    drawSpacedText(
        ctx,
        'INTERACTIVE DEVELOPER PORTFOLIO',
        width * 0.5,
        580,
        5
    )

    ctx.restore()

    /**
     * Little bottom HUD details.
     */
    ctx.strokeStyle =
        'rgba(69, 222, 255, 0.55)'

    ctx.lineWidth = 3

    ctx.beginPath()

    ctx.moveTo(
        width * 0.43,
        670
    )

    ctx.lineTo(
        width * 0.48,
        670
    )

    ctx.moveTo(
        width * 0.52,
        670
    )

    ctx.lineTo(
        width * 0.57,
        670
    )

    ctx.stroke()

    ctx.fillStyle =
        'rgba(99, 236, 255, 0.8)'

    ctx.fillRect(
        width * 0.495,
        665,
        width * 0.01,
        10
    )
}

function drawChamferedPanel(
    ctx,
    x,
    y,
    width,
    height,
    cut
) {
    ctx.beginPath()

    ctx.moveTo(
        x + cut,
        y
    )

    ctx.lineTo(
        x + width - cut,
        y
    )

    ctx.lineTo(
        x + width,
        y + cut
    )

    ctx.lineTo(
        x + width,
        y + height - cut
    )

    ctx.lineTo(
        x + width - cut,
        y + height
    )

    ctx.lineTo(
        x + cut,
        y + height
    )

    ctx.lineTo(
        x,
        y + height - cut
    )

    ctx.lineTo(
        x,
        y + cut
    )

    ctx.closePath()
}

function drawCornerAccent(
    ctx,
    x,
    y,
    directionX,
    directionY
) {
    ctx.save()

    ctx.strokeStyle = '#71efff'
    ctx.lineWidth = 10

    ctx.shadowColor = '#47e8ff'
    ctx.shadowBlur = 20

    ctx.beginPath()

    ctx.moveTo(
        x,
        y + 55 * directionY
    )

    ctx.lineTo(
        x,
        y + 20 * directionY
    )

    ctx.lineTo(
        x + 40 * directionX,
        y - 20 * directionY
    )

    ctx.lineTo(
        x + 150 * directionX,
        y - 20 * directionY
    )

    ctx.stroke()

    ctx.restore()
}

function drawEmblem(
    ctx,
    centerX,
    centerY
) {
    ctx.save()

    ctx.translate(
        centerX,
        centerY
    )

    ctx.strokeStyle = '#8af6ff'
    ctx.lineWidth = 11

    ctx.shadowColor = '#56ebff'
    ctx.shadowBlur = 22

    ctx.beginPath()

    ctx.moveTo(0, -45)
    ctx.lineTo(25, -10)
    ctx.lineTo(0, 45)
    ctx.lineTo(-25, -10)

    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()

    ctx.moveTo(-40, 0)
    ctx.lineTo(-10, -20)
    ctx.lineTo(0, 0)
    ctx.lineTo(-10, 20)

    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()

    ctx.moveTo(40, 0)
    ctx.lineTo(10, -20)
    ctx.lineTo(0, 0)
    ctx.lineTo(10, 20)

    ctx.closePath()
    ctx.stroke()

    ctx.restore()
}

/**
 * Canvas has no native letter-spacing property,
 * so we draw each character manually.
 */
function drawSpacedText(
    ctx,
    text,
    centerX,
    y,
    spacing
) {
    const characters =
        text.split('')

    let totalWidth = 0

    for (const character of characters) {
        totalWidth +=
            ctx.measureText(character).width +
            spacing
    }

    totalWidth -= spacing

    let x =
        centerX -
        totalWidth * 0.5

    for (const character of characters) {
        const width =
            ctx.measureText(character).width

        ctx.fillText(
            character,
            x + width * 0.5,
            y
        )

        x +=
            width +
            spacing
    }
}