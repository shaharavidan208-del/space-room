import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export function createPortfolioWallDecal() {
    const root = new THREE.Group()
    root.name = 'PortfolioWallDecal'

    /**
     * ---------------------------------------------------------
     * DECAL TEXTURE
     * ---------------------------------------------------------
     */
    const canvas = document.createElement('canvas')

    canvas.width = 2048
    canvas.height = 800

    const ctx = canvas.getContext('2d')

    drawDecal(
        ctx,
        canvas.width,
        canvas.height
    )

    const texture =
        new THREE.CanvasTexture(canvas)

    texture.colorSpace =
        THREE.SRGBColorSpace

    texture.minFilter =
        THREE.LinearMipmapLinearFilter

    texture.magFilter =
        THREE.LinearFilter

    /**
     * ---------------------------------------------------------
     * MATERIALS
     * ---------------------------------------------------------
     */

    const backPlateMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x101820,
            metalness: 0.82,
            roughness: 0.42,
        })

    backPlateMaterial.name =
        'PlaqueBackPlateMaterial'

    const recessMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x05090c,
            metalness: 0.4,
            roughness: 0.7,
        })

    recessMaterial.name =
        'PlaqueRecessMaterial'

    const frameMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x263a44,
            metalness: 0.9,
            roughness: 0.28,
        })

    frameMaterial.name =
        'PlaqueFrameMaterial'

    const trimMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x172832,
            metalness: 0.85,
            roughness: 0.36,
        })

    trimMaterial.name =
        'PlaqueWallTrimMaterial'

    const cyanMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x4edfff,
            emissive: 0x42dfff,
            emissiveIntensity: 2.2,
            metalness: 0.1,
            roughness: 0.25,
        })

    cyanMaterial.name =
        'PlaqueCyanAccentMaterial'

    /**
     * ---------------------------------------------------------
     * 1. BACK PLATE
     * ---------------------------------------------------------
     *
     * Larger than the actual sign so you get a physical
     * dark-metal structure behind the decal.
     */
    const backPlateGeometry =
        new RoundedBoxGeometry(
            3.48,
            1.42,
            0.11,
            5,
            0.07
        )

    const backPlate =
        new THREE.Mesh(
            backPlateGeometry,
            backPlateMaterial
        )

    backPlate.name =
        'PortfolioPlaqueBackPlate'

    backPlate.position.z = -0.045

    backPlate.castShadow = true
    backPlate.receiveShadow = true

    root.add(backPlate)

    /**
     * ---------------------------------------------------------
     * 2. RECESS
     * ---------------------------------------------------------
     *
     * This dark layer sits behind the plaque itself.
     *
     * Combined with the frame sitting farther forward,
     * it creates the illusion that the display has been
     * inserted into the wall.
     */
    const recessGeometry =
        new RoundedBoxGeometry(
            3.3,
            1.3,
            0.055,
            4,
            0.055
        )

    const recess =
        new THREE.Mesh(
            recessGeometry,
            recessMaterial
        )

    recess.name =
        'PortfolioPlaqueRecess'

    recess.position.z = 0.025

    root.add(recess)

    /**
     * ---------------------------------------------------------
     * DISPLAY PLANE
     * ---------------------------------------------------------
     */
    const decalGeometry =
        new THREE.PlaneGeometry(
            3.12,
            1.17
        )

    const decalMaterial =
        new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            toneMapped: false,
            side: THREE.FrontSide,
        })

    decalMaterial.name =
        'PortfolioWallDecalMaterial'

    const plane =
        new THREE.Mesh(
            decalGeometry,
            decalMaterial
        )

    plane.name =
        'PortfolioWallDecalPlane'

    /**
     * Notice that the plane is NOT the front-most object.
     *
     * The surrounding frame will protrude slightly beyond it,
     * which is what makes it feel embedded.
     */
    plane.position.z = 0.058

    plane.castShadow = false
    plane.receiveShadow = false

    root.add(plane)

    /**
     * ---------------------------------------------------------
     * RECESSED OUTER FRAME
     * ---------------------------------------------------------
     *
     * Four separate pieces instead of one giant box.
     *
     * This leaves the actual display visible while creating
     * a physical raised lip around it.
     */

    const frameDepth = 0.085
    const frameZ = 0.082

    addRoundedBox(
        root,
        'PlaqueFrameTop',
        [3.4, 0.085, frameDepth],
        [0, 0.67, frameZ],
        frameMaterial,
        0.025
    )

    addRoundedBox(
        root,
        'PlaqueFrameBottom',
        [3.4, 0.085, frameDepth],
        [0, -0.67, frameZ],
        frameMaterial,
        0.025
    )

    addRoundedBox(
        root,
        'PlaqueFrameLeft',
        [0.085, 1.28, frameDepth],
        [-1.66, 0, frameZ],
        frameMaterial,
        0.025
    )

    addRoundedBox(
        root,
        'PlaqueFrameRight',
        [0.085, 1.28, frameDepth],
        [1.66, 0, frameZ],
        frameMaterial,
        0.025
    )

    /**
     * Small cyan accent bars embedded into the physical frame.
     */
    addRoundedBox(
        root,
        'PlaqueTopGlow',
        [1.1, 0.018, 0.02],
        [0, 0.677, 0.132],
        cyanMaterial,
        0.006
    )

    addRoundedBox(
        root,
        'PlaqueBottomGlow',
        [0.5, 0.018, 0.02],
        [0, -0.677, 0.132],
        cyanMaterial,
        0.006
    )

    /**
     * ---------------------------------------------------------
     * 3. WALL PANEL TRIMS
     * ---------------------------------------------------------
     *
     * These extend beyond the plaque itself so it feels like
     * part of the wall architecture instead of something
     * glued onto the surface.
     */

    addRoundedBox(
        root,
        'PlaqueWallTrimTop',
        [4.05, 0.045, 0.045],
        [0, 0.82, -0.015],
        trimMaterial,
        0.012
    )

    addRoundedBox(
        root,
        'PlaqueWallTrimBottom',
        [4.05, 0.045, 0.045],
        [0, -0.82, -0.015],
        trimMaterial,
        0.012
    )

    /**
     * Slightly shorter secondary line under the upper trim.
     */
    addRoundedBox(
        root,
        'PlaqueWallTrimSecondary',
        [3.72, 0.025, 0.035],
        [0, 0.75, -0.005],
        frameMaterial,
        0.008
    )

    /**
     * Side connector trims.
     *
     * These make the paneling visually continue into the wall.
     */
    addRoundedBox(
        root,
        'PlaqueWallConnectorLeft',
        [0.55, 0.045, 0.04],
        [-1.97, 0.43, -0.015],
        trimMaterial,
        0.01
    )

    addRoundedBox(
        root,
        'PlaqueWallConnectorRight',
        [0.55, 0.045, 0.04],
        [1.97, 0.43, -0.015],
        trimMaterial,
        0.01
    )

    root.userData.markingPlane =
        plane

    root.userData.dimensions = {
        width: 4.25,
        height: 1.66,
        depth: 0.17,
    }

    return root
}

/**
 * Small helper for all the physical plaque details.
 */
function addRoundedBox(
    parent,
    name,
    size,
    position,
    material,
    radius
) {
    let safeRadius = radius

    const maxRadius =
        Math.min(
            size[0],
            size[1],
            size[2]
        ) * 0.49

    if (safeRadius > maxRadius) {
        safeRadius = maxRadius
    }

    const geometry =
        new RoundedBoxGeometry(
            size[0],
            size[1],
            size[2],
            4,
            safeRadius
        )

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        )

    mesh.name = name

    mesh.position.set(
        position[0],
        position[1],
        position[2]
    )

    mesh.castShadow = true
    mesh.receiveShadow = true

    parent.add(mesh)

    return mesh
}

/**
 * Everything below here is your existing Canvas drawing code.
 */
function drawDecal(ctx, width, height) {
    ctx.clearRect(
        0,
        0,
        width,
        height
    )

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

    ctx.lineWidth = 26
    ctx.strokeStyle = '#152b36'
    ctx.stroke()

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

    drawEmblem(
        ctx,
        width * 0.5,
        220
    )

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

    ctx.moveTo(x + cut, y)

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