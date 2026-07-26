import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * Static procedural sci-fi bed reconstructed from the supplied reference.
 *
 * Local axes:
 * X = length, Y = up, Z = width.
 * Foot is on negative X. Head is on positive X.
 * The root origin sits on the floor at the bed's center.
 *
 * @param {Object} options
 * @param {number} [options.scale=1]
 * @param {boolean} [options.shadows=true]
 * @param {number} [options.glowIntensity=5]
 * @returns {THREE.Group}
 */
export function createSciFiBedModel(options = {}) {
    let modelScale = 1
    let shadows = true
    let glowIntensity = 5

    if (options.scale !== undefined) {
        modelScale = options.scale
    }

    if (options.shadows !== undefined) {
        shadows = options.shadows
    }

    if (options.glowIntensity !== undefined) {
        glowIntensity = options.glowIntensity
    }

    const root = new THREE.Group()
    root.name = 'ProceduralSciFiBed'
    root.scale.setScalar(modelScale)

    const materials = createMaterials(glowIntensity)
    const nodes = {}

    nodes.shell = new THREE.Group()
    nodes.shell.name = 'BedShell'
    root.add(nodes.shell)

    nodes.bedding = new THREE.Group()
    nodes.bedding.name = 'Bedding'
    root.add(nodes.bedding)

    nodes.supports = new THREE.Group()
    nodes.supports.name = 'Supports'
    root.add(nodes.supports)

    buildMainHull(nodes.shell, materials)
    nodes.footCap = buildFootCap(nodes.shell, materials)
    nodes.headHousing = buildHeadHousing(nodes.shell, materials)
    buildSideDetails(nodes.shell, materials)
    buildSupports(nodes.supports, materials)
    nodes.mattress = buildMattress(nodes.bedding, materials)
    nodes.pillow = buildPillow(nodes.bedding, materials)
    nodes.headboard = buildHeadboard(nodes.bedding, materials)

    root.traverse((object) => {
        if (!object.isMesh) {
            return
        }

        object.castShadow = shadows
        object.receiveShadow = shadows
    })

    root.userData.sculptRuntime = {
        nodes: nodes,
        materials: materials,
        sockets: {
            floor: new THREE.Vector3(0, 0, 0),
            mattressCenter: new THREE.Vector3(0.15, 1.72, 0),
            pillowCenter: new THREE.Vector3(1.28, 1.98, 0),
        },
        dimensions: {
            length: 4.85,
            width: 2.02,
            height: 2.48,
        },
    }

    return root
}

function createMaterials(glowIntensity) {
    const shell = new THREE.MeshPhysicalMaterial({
        color: 0x292a2d,
        metalness: 0.88,
        roughness: 0.34,
        clearcoat: 0.25,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.15,
    })
    shell.name = 'BedShellMetal'

    const trim = new THREE.MeshPhysicalMaterial({
        color: 0x55514d,
        metalness: 0.92,
        roughness: 0.27,
        clearcoat: 0.18,
        clearcoatRoughness: 0.23,
        envMapIntensity: 1.25,
    })
    trim.name = 'BedEdgeMetal'

    const panel = new THREE.MeshStandardMaterial({
        color: 0x393a3c,
        metalness: 0.72,
        roughness: 0.48,
        envMapIntensity: 1,
    })
    panel.name = 'BedPanelMetal'

    const dark = new THREE.MeshStandardMaterial({
        color: 0x111315,
        metalness: 0.8,
        roughness: 0.48,
        envMapIntensity: 0.85,
    })
    dark.name = 'BedDarkTrim'

    const recess = new THREE.MeshStandardMaterial({
        color: 0x08090a,
        metalness: 0.35,
        roughness: 0.7,
    })
    recess.name = 'BedRecess'

    const fabric = new THREE.MeshStandardMaterial({
        color: 0xb49a82,
        roughness: 0.96,
        metalness: 0,
    })
    fabric.name = 'BedFabric'

    const fabricDark = new THREE.MeshStandardMaterial({
        color: 0x796553,
        roughness: 1,
        metalness: 0,
    })
    fabricDark.name = 'BedFabricSeams'

    const pillow = new THREE.MeshStandardMaterial({
        color: 0xd8c2aa,
        roughness: 0.98,
        metalness: 0,
    })
    pillow.name = 'BedPillowFabric'

    const glow = new THREE.MeshStandardMaterial({
        color: 0x6c2105,
        emissive: 0xff5a0a,
        emissiveIntensity: glowIntensity,
        roughness: 0.28,
        metalness: 0.08,
    })
    glow.name = 'BedOrangeEmission'

    const dimGlow = glow.clone()
    dimGlow.emissiveIntensity = glowIntensity * 0.5
    dimGlow.name = 'BedDimOrangeEmission'

    return {
        shell: shell,
        trim: trim,
        panel: panel,
        dark: dark,
        recess: recess,
        fabric: fabric,
        fabricDark: fabricDark,
        pillow: pillow,
        glow: glow,
        dimGlow: dimGlow,
    }
}

function buildMainHull(parent, materials) {
    addRoundedBox(
        parent,
        'MainLowerHull',
        [4.12, 0.98, 1.66],
        [0.02, 0.91, 0],
        materials.shell,
        0.17,
        6
    )

    addRoundedBox(
        parent,
        'UndersideChassis',
        [3.82, 0.24, 1.42],
        [0.08, 0.39, 0],
        materials.dark,
        0.07,
        4
    )

    addRoundedBox(
        parent,
        'UpperBedRail',
        [3.82, 0.2, 1.76],
        [0.08, 1.39, 0],
        materials.trim,
        0.07,
        4
    )

    addRoundedBox(
        parent,
        'MattressShadowGap',
        [3.56, 0.1, 1.67],
        [0.18, 1.49, 0],
        materials.recess,
        0.03,
        3
    )
}

function buildFootCap(parent, materials) {
    const group = new THREE.Group()
    group.name = 'FootCapAssembly'
    parent.add(group)

    addOctagonalPrism(
        group,
        'FootCapMain',
        0.48,
        1.83,
        1.4,
        [-2.17, 0.98, 0],
        materials.shell
    )

    addOctagonalPrism(
        group,
        'FootCapCollarOuter',
        0.15,
        1.85,
        1.37,
        [-1.88, 0.98, 0],
        materials.trim
    )

    addOctagonalPrism(
        group,
        'FootCapCollarDark',
        0.11,
        1.9,
        1.43,
        [-2.02, 0.98, 0],
        materials.dark
    )

    addOctagonalPrism(
        group,
        'FootCapCollarFront',
        0.1,
        1.86,
        1.4,
        [-2.29, 0.98, 0],
        materials.trim
    )

    addRoundedBox(
        group,
        'FootFaceRecess',
        [0.055, 0.78, 1.28],
        [-2.43, 0.99, 0],
        materials.recess,
        0.035,
        4
    )

    addRoundedBox(
        group,
        'FootFacePanel',
        [0.032, 0.62, 1.08],
        [-2.465, 0.99, 0],
        materials.panel,
        0.025,
        3
    )

    // Rectangular loop handle visible on the foot end.
    addRoundedBox(
        group,
        'FootHandleTop',
        [0.08, 0.055, 0.52],
        [-2.5, 1.08, 0],
        materials.dark,
        0.018,
        3
    )

    addRoundedBox(
        group,
        'FootHandleBottom',
        [0.08, 0.055, 0.52],
        [-2.5, 0.89, 0],
        materials.dark,
        0.018,
        3
    )

    addRoundedBox(
        group,
        'FootHandleSideA',
        [0.08, 0.24, 0.055],
        [-2.5, 0.985, 0.26],
        materials.dark,
        0.018,
        3
    )

    addRoundedBox(
        group,
        'FootHandleSideB',
        [0.08, 0.24, 0.055],
        [-2.5, 0.985, -0.26],
        materials.dark,
        0.018,
        3
    )

    addRoundedBox(
        group,
        'FootStatusLight',
        [0.025, 0.11, 0.3],
        [-2.49, 0.92, 0.48],
        materials.dimGlow,
        0.01,
        2
    )

    return group
}

function buildHeadHousing(parent, materials) {
    const group = new THREE.Group()
    group.name = 'HeadHousing'
    parent.add(group)

    addRoundedBox(
        group,
        'HeadEndMain',
        [0.42, 1.38, 1.78],
        [2.08, 1.08, 0],
        materials.shell,
        0.15,
        6
    )

    addRoundedBox(
        group,
        'HeadEndOuterBand',
        [0.13, 1.43, 1.84],
        [2.27, 1.08, 0],
        materials.trim,
        0.11,
        5
    )

    addRoundedBox(
        group,
        'HeadboardBackPanel',
        [0.14, 0.7, 1.28],
        [2.14, 1.72, 0],
        materials.dark,
        0.08,
        5
    )

    return group
}

function buildSideDetails(parent, materials) {
    const sides = [1, -1]

    for (const side of sides) {
        const group = new THREE.Group()

        if (side === 1) {
            group.name = 'FrontSideDetails'
        }
        else {
            group.name = 'BackSideDetails'
        }

        parent.add(group)

        addRoundedBox(
            group,
            'GlowStripRecess',
            [3.48, 0.29, 0.055],
            [0.18, 1.15, side * 0.855],
            materials.recess,
            0.024,
            3
        )

        addRoundedBox(
            group,
            'GlowStripLong',
            [2.45, 0.055, 0.026],
            [-0.22, 1.15, side * 0.902],
            materials.glow,
            0.012,
            3
        )

        addRoundedBox(
            group,
            'GlowStripShort',
            [0.74, 0.055, 0.026],
            [1.47, 1.15, side * 0.902],
            materials.glow,
            0.012,
            3
        )

        addRoundedBox(
            group,
            'TopSideRail',
            [3.56, 0.13, 0.095],
            [0.16, 1.46, side * 0.86],
            materials.trim,
            0.035,
            4
        )

        addSidePanel(group, -0.9, 0.88, side, materials)
        addSidePanel(group, 0.16, 1.08, side, materials)
        addSidePanel(group, 1.28, 0.88, side, materials)

        const dividerX = [-1.38, -0.44, 0.7, 1.75]

        for (const x of dividerX) {
            addRoundedBox(
                group,
                'VerticalPanelDivider',
                [0.025, 0.44, 0.025],
                [x, 0.76, side * 0.906],
                materials.dark,
                0.008,
                2
            )
        }

        addVentSlats(group, side, materials.dark)

        addRoundedBox(
            group,
            'LowerFootAccessPanel',
            [0.34, 0.29, 0.04],
            [-1.52, 0.7, side * 0.91],
            materials.recess,
            0.02,
            3
        )
    }
}

function addSidePanel(parent, x, width, side, materials) {
    const z = side * 0.875

    addRoundedBox(
        parent,
        'SidePanelRecess',
        [width, 0.42, 0.045],
        [x, 0.73, z],
        materials.dark,
        0.025,
        3
    )

    addRoundedBox(
        parent,
        'SidePanelFace',
        [width - 0.07, 0.35, 0.025],
        [x, 0.73, z + side * 0.027],
        materials.panel,
        0.018,
        3
    )

    addRoundedBox(
        parent,
        'SidePanelDetailLine',
        [width * 0.45, 0.018, 0.015],
        [x + width * 0.12, 0.74, z + side * 0.046],
        materials.dark,
        0.005,
        2
    )
}

function addVentSlats(parent, side, material) {
    const geometry = new RoundedBoxGeometry(
        0.43,
        0.032,
        0.028,
        2,
        0.009
    )

    const vents = new THREE.InstancedMesh(
        geometry,
        material,
        8
    )

    vents.name = 'SideVentSlats'

    const matrix = new THREE.Matrix4()

    for (let i = 0; i < 8; i++) {
        matrix.makeTranslation(
            -1.5,
            0.92 + i * 0.065,
            side * 0.914
        )

        vents.setMatrixAt(i, matrix)
    }

    vents.instanceMatrix.needsUpdate = true
    parent.add(vents)
}

function buildSupports(parent, materials) {
    const positions = [-1.72, 1.64]

    for (const x of positions) {
        const support = new THREE.Group()
        support.name = 'BedSupportFoot'
        support.position.x = x
        parent.add(support)

        addRoundedBox(
            support,
            'FootCrossbar',
            [0.58, 0.14, 1.92],
            [0, 0.1, 0],
            materials.dark,
            0.045,
            4
        )

        addRoundedBox(
            support,
            'FootCrossbarTop',
            [0.42, 0.055, 1.72],
            [0, 0.185, 0],
            materials.trim,
            0.018,
            3
        )

        addRoundedBox(
            support,
            'SupportPylonFront',
            [0.28, 0.48, 0.3],
            [0, 0.38, 0.62],
            materials.panel,
            0.055,
            4
        )

        addRoundedBox(
            support,
            'SupportPylonBack',
            [0.28, 0.48, 0.3],
            [0, 0.38, -0.62],
            materials.panel,
            0.055,
            4
        )

        addRoundedBox(
            support,
            'UnderBedMarkerLight',
            [0.18, 0.055, 0.28],
            [0, 0.22, 0.63],
            materials.dimGlow,
            0.015,
            3
        )
    }
}

function buildMattress(parent, materials) {
    const group = new THREE.Group()
    group.name = 'MattressAssembly'
    parent.add(group)

    addRoundedBox(
        group,
        'MattressBase',
        [3.45, 0.24, 1.5],
        [0.17, 1.58, 0],
        materials.fabricDark,
        0.13,
        8
    )

    addRoundedBox(
        group,
        'DuvetMain',
        [3.52, 0.25, 1.55],
        [0.12, 1.72, 0],
        materials.fabric,
        0.16,
        10
    )

    // Three slightly different flap sections make the blanket edge less rigid.
    const flaps = [
        {
            x: -1,
            width: 1.05,
            y: 1.58,
            rotation: -0.025,
        },
        {
            x: 0.03,
            width: 0.98,
            y: 1.57,
            rotation: 0.018,
        },
        {
            x: 1.05,
            width: 1,
            y: 1.59,
            rotation: -0.012,
        },
    ]

    for (const side of [1, -1]) {
        for (const flap of flaps) {
            const mesh = addRoundedBox(
                group,
                'DuvetSideFlap',
                [flap.width, 0.24, 0.075],
                [flap.x, flap.y, side * 0.79],
                materials.fabric,
                0.03,
                4
            )

            mesh.rotation.z = flap.rotation
        }

        addRoundedBox(
            group,
            'DuvetEdgeSeam',
            [3.22, 0.035, 0.035],
            [0.15, 1.67, side * 0.832],
            materials.fabricDark,
            0.012,
            3
        )
    }

    for (const x of [-0.78, 0.18, 0.98]) {
        addRoundedBox(
            group,
            'DuvetFoldLine',
            [0.045, 0.028, 1.34],
            [x, 1.858, 0],
            materials.fabricDark,
            0.012,
            3
        )
    }

    return group
}

function buildPillow(parent, materials) {
    const group = new THREE.Group()
    group.name = 'PillowAssembly'
    group.position.set(1.28, 1.99, 0)
    group.rotation.y = -0.08
    parent.add(group)

    addRoundedBox(
        group,
        'PillowBody',
        [0.68, 0.25, 1.18],
        [0, 0, 0],
        materials.pillow,
        0.16,
        10
    )

    addRoundedBox(
        group,
        'PillowUpperCushion',
        [0.58, 0.1, 1.06],
        [-0.015, 0.115, 0],
        materials.pillow,
        0.05,
        7
    )

    addRoundedBox(
        group,
        'PillowCenterCrease',
        [0.035, 0.018, 0.72],
        [0.02, 0.171, 0],
        materials.fabricDark,
        0.006,
        2
    )

    return group
}

function buildHeadboard(parent, materials) {
    const group = new THREE.Group()
    group.name = 'HeadboardArch'
    parent.add(group)

    const outer = new THREE.Mesh(
        createArchGeometry(1.52, 0.52, 0.22),
        materials.shell
    )

    outer.name = 'HeadboardOuterArch'
    outer.position.set(2, 1.42, 0)
    group.add(outer)

    const trim = new THREE.Mesh(
        createArchGeometry(1.34, 0.5, 0.12),
        materials.trim
    )

    trim.name = 'HeadboardInnerTrim'
    trim.position.set(1.87, 1.47, 0)
    group.add(trim)

    return group
}

/**
 * Creates and adds a rounded box.
 *
 * @returns {THREE.Mesh}
 */
function addRoundedBox(
    parent,
    name,
    size,
    position,
    material,
    radius,
    segments
) {
    let safeRadius = radius

    const maxRadius =
        Math.min(size[0], size[1], size[2]) * 0.49

    if (safeRadius > maxRadius) {
        safeRadius = maxRadius
    }

    const geometry = new RoundedBoxGeometry(
        size[0],
        size[1],
        size[2],
        segments,
        safeRadius
    )

    const mesh = new THREE.Mesh(
        geometry,
        material
    )

    mesh.name = name

    mesh.position.set(
        position[0],
        position[1],
        position[2]
    )

    parent.add(mesh)

    return mesh
}

function addOctagonalPrism(
    parent,
    name,
    depth,
    width,
    height,
    position,
    material
) {
    const geometry = createOctagonalPrismGeometry(
        depth,
        width,
        height,
        0.15
    )

    const mesh = new THREE.Mesh(
        geometry,
        material
    )

    mesh.name = name

    mesh.position.set(
        position[0],
        position[1],
        position[2]
    )

    parent.add(mesh)

    return mesh
}

/**
 * Creates the chamfered foot-end profile.
 *
 * The shape is drawn in width/height and extruded along X.
 */
function createOctagonalPrismGeometry(
    depth,
    width,
    height,
    cornerCut
) {
    const halfWidth = width * 0.5
    const halfHeight = height * 0.5

    const shape = new THREE.Shape()

    shape.moveTo(
        -halfWidth + cornerCut,
        -halfHeight
    )

    shape.lineTo(
        halfWidth - cornerCut,
        -halfHeight
    )

    shape.lineTo(
        halfWidth,
        -halfHeight + cornerCut
    )

    shape.lineTo(
        halfWidth,
        halfHeight - cornerCut
    )

    shape.lineTo(
        halfWidth - cornerCut,
        halfHeight
    )

    shape.lineTo(
        -halfWidth + cornerCut,
        halfHeight
    )

    shape.lineTo(
        -halfWidth,
        halfHeight - cornerCut
    )

    shape.lineTo(
        -halfWidth,
        -halfHeight + cornerCut
    )

    shape.closePath()

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 2,
    })

    geometry.center()

    // ExtrudeGeometry normally extrudes along Z.
    // Rotate it so the extrusion follows the bed's X axis.
    geometry.rotateY(Math.PI * 0.5)

    return geometry
}

/**
 * Creates the armored U-shaped headboard arch.
 */
function createArchGeometry(
    outerWidth,
    legHeight,
    depth
) {
    const outerRadius = outerWidth * 0.5
    const innerRadius = outerWidth * 0.32
    const innerLegHeight = legHeight + 0.08

    const shape = new THREE.Shape()

    shape.moveTo(-outerRadius, 0)
    shape.lineTo(-outerRadius, legHeight)

    shape.absarc(
        0,
        legHeight,
        outerRadius,
        Math.PI,
        0,
        true
    )

    shape.lineTo(outerRadius, 0)
    shape.closePath()

    const hole = new THREE.Path()

    hole.moveTo(-innerRadius, 0.1)
    hole.lineTo(innerRadius, 0.1)
    hole.lineTo(innerRadius, innerLegHeight)

    hole.absarc(
        0,
        innerLegHeight,
        innerRadius,
        0,
        Math.PI,
        false
    )

    hole.closePath()

    shape.holes.push(hole)

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 3,
        curveSegments: 24,
    })

    geometry.center()

    // Turn the extrusion from Z into X.
    geometry.rotateY(Math.PI * 0.5)

    // Put the bottom of the arch back at local Y = 0.
    const totalHeight =
        legHeight + outerRadius

    geometry.translate(
        0,
        totalHeight * 0.5,
        0
    )

    return geometry
}