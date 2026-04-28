import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

const gui = new GUI()
const scene = new THREE.Scene()

// Perspective camera for real 3D depth
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.set(0, 0, 5)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Orbit controls so you can fly around
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Noise texture
const textureLoader = new THREE.TextureLoader()
const noiseTexture = textureLoader.load('/textures/noise.png')
noiseTexture.wrapS = THREE.RepeatWrapping
noiseTexture.wrapT = THREE.RepeatWrapping
noiseTexture.minFilter = THREE.LinearFilter
noiseTexture.magFilter = THREE.LinearFilter

// Uniforms
const uniforms = {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    iMouse: { value: new THREE.Vector2(0, 0) },
    iChannel0: { value: noiseTexture }
}

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    varying vec2 vUv;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform sampler2D iChannel0;
    
    #define DITHERING
    #define BACKGROUND
    
    #define pi 3.14159265
    #define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)
    
    float noise(in vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        vec2 uv = (p.xy + vec2(37.0, 17.0)*p.z) + f.xy;
        vec2 rg = texture2D(iChannel0, (uv + 0.5)/256.0).yx;
        return 1.0 - 0.82*mix(rg.x, rg.y, f.z);
    }
    
    float fbm(vec3 p) {
        return noise(p*.06125)*.5 + noise(p*.125)*.25 + noise(p*.25)*.125 + noise(p*.4)*.2;
    }
    
    float length2(vec2 p) {
        return sqrt(p.x*p.x + p.y*p.y);
    }
    
    float length8(vec2 p) {
        p = p*p; p = p*p; p = p*p;
        return pow(p.x + p.y, 1.0/8.0);
    }
    
    float Disk(vec3 p, vec3 t) {
        vec2 q = vec2(length2(p.xy) - t.x, p.z*0.5);
        return max(length8(q) - t.y, abs(p.z) - t.z);
    }
    
    const float nudge = 0.9;
    float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);
    
    float SpiralNoiseC(vec3 p) {
        float n = 0.0;
        float iter = 2.0;
        for (int i = 0; i < 8; i++) {
            n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;
            p.xy += vec2(p.y, -p.x) * nudge;
            p.xy *= normalizer;
            p.xz += vec2(p.z, -p.x) * nudge;
            p.xz *= normalizer;
            iter *= 1.733733;
        }
        return n;
    }
    
    float NebulaNoise(vec3 p) {
        float final = Disk(p.xzy, vec3(2.0, 1.8, 1.25));
        final += fbm(p*90.0);
        final += SpiralNoiseC(p.zxy*0.5123 + 100.0)*3.0;
        return final;
    }
    
    float map(vec3 p) {
        R(p.xz, iMouse.x*0.008*pi + iTime*0.1);
        float NebNoise = abs(NebulaNoise(p/0.5)*0.5);
        return NebNoise + 0.07;
    }
    
    vec3 computeColor(float density, float radius) {
        vec3 result = mix(vec3(1.0, 0.9, 0.8), vec3(0.4, 0.15, 0.1), density);
        vec3 colCenter = 7.0*vec3(0.8, 1.0, 1.0);
        vec3 colEdge = 1.5*vec3(0.48, 0.53, 0.5);
        result *= mix(colCenter, colEdge, min((radius + 0.05)/0.9, 1.15));
        return result;
    }
    
    bool RaySphereIntersect(vec3 org, vec3 dir, out float near, out float far) {
        float b = dot(dir, org);
        float c = dot(org, org) - 8.0;
        float delta = b*b - c;
        if (delta < 0.0) return false;
        float deltasqrt = sqrt(delta);
        near = -b - deltasqrt;
        far = -b + deltasqrt;
        return far > 0.0;
    }
    
    void main() {
        // Use square UV coordinates so nebula stays round regardless of plane/window size
        vec2 fragCoord = (vUv - 0.5) * 2.0;
        
        vec3 rd = normalize(vec3(fragCoord, 1.0));
        vec3 ro = vec3(0.0, 0.0, -6.0);
        
        float ld = 0.0, td = 0.0, w = 0.0;
        float d = 1.0, t = 0.0;
        
        const float h = 0.1;
        vec4 sum = vec4(0.0);
        float min_dist = 0.0, max_dist = 0.0;
        
        if (RaySphereIntersect(ro, rd, min_dist, max_dist)) {
            t = min_dist*step(t, min_dist);
            
            for (int i = 0; i < 64; i++) {
                vec3 pos = ro + t*rd;
                
                if (td > 0.9 || d < 0.1*t || t > 10.0 || sum.a > 0.99 || t > max_dist) break;
                
                float d = map(pos);
                d = max(d, 0.0);
                
                vec3 ldst = vec3(0.0) - pos;
                float lDist = max(length(ldst), 0.001);
                vec3 lightColor = vec3(1.0, 0.5, 0.25);
                
                sum.rgb += (vec3(0.67, 0.75, 1.00)/(lDist*lDist*10.0)/80.0);
                sum.rgb += (lightColor/exp(lDist*lDist*lDist*0.08)/30.0);
                
                if (d < h) {
                    ld = h - d;
                    w = (1.0 - td) * ld;
                    td += w + 1.0/200.0;
                    
                    vec4 col = vec4(computeColor(td, lDist), td);
                    sum += sum.a * vec4(sum.rgb, 0.0) * 0.2;
                    col.a *= 0.2;
                    col.rgb *= col.a;
                    sum = sum + col*(1.0 - sum.a);
                }
                
                td += 1.0/70.0;
                
                t += max(d * 0.1 * max(min(length(ldst), length(ro)), 1.0), 0.01);
            }
            
            sum *= 1.0 / exp(ld * 0.2) * 0.6;
            sum = clamp(sum, 0.0, 1.0);
            sum.xyz = sum.xyz*sum.xyz*(3.0 - 2.0*sum.xyz);
        }
        
        // Output transparent alpha so black areas don't block what's behind
        float alpha = max(max(sum.r, sum.g), sum.b);
        gl_FragColor = vec4(sum.xyz, alpha);
    }
`

const geometry = new THREE.PlaneGeometry(2, 2)
const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false
})

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// === GUI CONTROLS ===
const posFolder = gui.addFolder('Position')
posFolder.add(mesh.position, 'x', -500, 500, 0.5).name('X')
posFolder.add(mesh.position, 'y', -500, 500, 0.5).name('Y')
posFolder.add(mesh.position, 'z', -500, 500, 0.5).name('Z')
posFolder.open()

const scaleFolder = gui.addFolder('Scale')
const scaleSettings = { uniform: 1 }
scaleFolder.add(scaleSettings, 'uniform', 0.5, 100, 0.5).name('Uniform Scale').onChange((val) => {
    mesh.scale.setScalar(val)
})
scaleFolder.open()

const rotFolder = gui.addFolder('Rotation')
rotFolder.add(mesh.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotate X')
rotFolder.add(mesh.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotate Y')
rotFolder.add(mesh.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotate Z')

const billboardSettings = { billboard: false }
gui.add(billboardSettings, 'billboard').name('Face Camera (Billboard)')

const actions = {
    logValues: () => {
        console.log('%c--- Current Values ---', 'color: orange; font-weight: bold')
        console.log(`position: (${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z})`)
        console.log(`scale: ${mesh.scale.x}`)
        console.log(`rotation: (${mesh.rotation.x.toFixed(3)}, ${mesh.rotation.y.toFixed(3)}, ${mesh.rotation.z.toFixed(3)})`)
    }
}
gui.add(actions, 'logValues').name('📋 Log Values')

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    uniforms.iResolution.value.set(window.innerWidth, window.innerHeight)
})

// Mouse
window.addEventListener('mousemove', (e) => {
    uniforms.iMouse.value.set(e.clientX, e.clientY)
})

// Animation
const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    uniforms.iTime.value = clock.getElapsedTime()
    
    // Optional billboard behavior
    if (billboardSettings.billboard) {
        mesh.lookAt(camera.position)
    }
    
    controls.update()
    renderer.render(scene, camera)
}

animate()