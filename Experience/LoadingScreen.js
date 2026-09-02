import * as THREE from 'three'
import gsap from 'gsap'

export default class LoadingScreen {
    /**
     * Creates and manages the entire loading-screen system.
     *
     * @param {Object} options 
     * @param {THREE.Scene} options.scene 
     * The Three.js scene containing the black WebGL overlay.
     *
     * @param {Function} options.onSceneReady
     * Called after the user presses Enter Station and both
     * loading-screen overlays finish fading.
     */
    constructor({
        scene,
        onAnimationFinished,
        onSceneReady
    }) {
        this.scene = scene
        this.onAnimationFinished = onAnimationFinished
        this.onSceneReady = onSceneReady
        this.update = this.updateLetterAnimation
        // ---------------------------------------------------------
        // LOADING TITLE
        // ---------------------------------------------------------

        this.loadingTitleText =
            'WELCOME TO MY PORTFOLIO'

        this.loadingLetters = []

        // ---------------------------------------------------------
        // LOADING STATE
        // ---------------------------------------------------------

        /**
         * Real progress reported by THREE.LoadingManager.
         */
        this.targetLoadingProgress = 0

        /**
         * Smoothed progress displayed to the user.
         * prevents huge progress spikes
         */
        this.displayedLoadingProgress = 0

        /**
         * Becomes true once every registered asset has loaded.
         */
        this.loadingFinished = false

        /**
         * Prevents the button reveal from being scheduled
         * repeatedly by update().
         */
        this.enterButtonRevealScheduled = false

        /**
         * Prevents the entry transition from running twice.
         */
        this.enteringStation = false

        /**
 * Index of the next letter waiting to launch.
 */
        this.nextLetterIndex = 0

        /**
         * Time accumulated since the previous letter launch.
         */
        this.letterLaunchTimer = 0

        /**
         * Prevents the title animation from starting inside
         * the constructor before the browser renders the
         * letters in their initial positions.
         */
        this.letterAnimationStarted = false

        /**
         * Becomes true after the final letter finishes moving.
         */
        this.titleAnimationFinished = false

        /**
         * Time between launching consecutive letters.
         */
        this.LETTER_LAUNCH_INTERVAL = 0.1

        /**
         * Duration of each letter's CSS transition.
         * This must match your CSS transition duration.
         */
        this.LETTER_TRAVEL_DURATION = 0.3

        /**
         * How quickly the visual loading progress moves.
         *
         * A value of 0.25 means a completely uninterrupted
         * journey from 0 to 1 takes roughly four seconds.
         */
        this.LOADING_PROGRESS_SPEED = 0.5

        /**
         * Prevents a long frame or asset-parsing freeze from
         * teleporting the displayed loading progress forward.
         */
        this.MAX_LOADING_ANIMATION_DELTA = 0.05

        this.findDomElements()
        this.createOverlay()
        this.createLoadingTitle()
        this.createLoadingManager()
        this.setupEnterButton()
        this.logColorDebugInformation()
    }

    /**
     * Finds the existing loading-screen HTML elements.
     */
    findDomElements() {
        this.loadingScreenElement =
            document.querySelector('.loading-screen')

        this.loadingTitleElement =
            document.querySelector('#loading-title')

        this.loadingPercentElement =
            document.querySelector('#loading-percent')

        this.loadingBarFillElement =
            document.querySelector('#loading-bar-fill')

        this.enterButton =
            document.querySelector('#enter-button')
    }

    /**
     * Creates the fullscreen black WebGL overlay that hides
     * the station beneath the HTML loading screen.
     */
    createOverlay() {
        this.overlayGeometry =
            new THREE.PlaneGeometry(2, 2)

        this.overlayMaterial =
            new THREE.ShaderMaterial({
                transparent: true,

                uniforms: {
                    uAlpha: {
                        value: 1
                    }
                },

                vertexShader: `
                    void main()
                    {
                        gl_Position = vec4(position, 1.0);
                    }
                `,

                fragmentShader: `
                    uniform float uAlpha;

                    void main()
                    {
                        gl_FragColor =
                            vec4(0.0, 0.0, 0.0, uAlpha);
                    }
                `
            })

        this.overlay =
            new THREE.Mesh(
                this.overlayGeometry,
                this.overlayMaterial
            )

        this.scene.add(this.overlay)
    }

    /**
 * Creates one span for every letter and space in the title.
 *
 * Letter elements are stored in loadingLetters so they
 * can be animated individually.
 *
 * Space elements are added to preserve word spacing,
 * but are not stored in the animated letters array.
 */
    createLoadingTitle() {
        const titleCharacters =
            [...this.loadingTitleText]

        const titleCenter =
            (titleCharacters.length - 1) / 2 // we need the center of the title to calculate the distance from the center for each letter

        titleCharacters.forEach(
            (character, index) => {
                const characterElement =
                    document.createElement('span')

                /**
                 * Preserve spaces without treating them as
                 * loadable animated characters.
                 */
                if (character === ' ') {
                    characterElement.classList.add(
                        'loading-space'
                    )

                    this.loadingTitleElement.appendChild(
                        characterElement
                    ) // add the space to the title, but do not add it to the animated letters array

                    return
                }

                characterElement.classList.add(
                    'loading-letter'
                )

                characterElement.textContent =
                    character // attach the letter to the span so it can be animated

                /**
                 * Characters on the left start farther left.
                 * Characters on the right start farther right.
                 */
                const distanceFromCenter =
                    index - titleCenter

                const startX =
                    distanceFromCenter * 18

                /**
                 * Alternate between arriving from above and
                 * below so the letters do not all perform
                 * exactly the same movement.
                 */
                let startY = -60
                let startRotation = -5

                if (index % 2 !== 0) {
                    startY = 60
                    startRotation = 5
                }

                characterElement.style.setProperty(
                    '--start-x',
                    `${startX}px`
                )

                characterElement.style.setProperty(
                    '--start-y',
                    `${startY}px`
                )

                characterElement.style.setProperty(
                    '--start-rotation',
                    `${startRotation}deg`
                )

                this.loadingTitleElement.appendChild(
                    characterElement
                ) // add the letter to the title element inside the actual DOM

                this.loadingLetters.push(
                    characterElement
                )
            }
        )
    }

    /**
     * Creates the LoadingManager used by every asset loader
     * inside Experience.
     */
    createLoadingManager() {
        this.loadingManager =
            new THREE.LoadingManager(
                /**
                 * All registered assets finished loading.
                 */
                () => {
                    this.targetLoadingProgress = 1
                    this.loadingFinished = true
                },

                /**
                 * One registered asset finished loading.
                 */
                (
                    itemUrl,
                    itemsLoaded,
                    itemsTotal
                ) => {
                    this.targetLoadingProgress =
                        itemsLoaded / itemsTotal
                },

                /**
                 * A registered asset failed to load.
                 */
                (itemUrl) => {
                    console.error(
                        `Failed to load asset: ${itemUrl}`
                    )
                }
            )
    }

    /**
     * Reveals title letters according to displayed progress.
     *
     * @param {number} progress
     * A loading-progress value between 0 and 1.
     */
    /**
 * Launches the next waiting letter.
 *
 * Once a letter receives the loaded class, CSS handles
 * its complete journey into position independently.
 */
    launchNextLetter() {
        if (this.nextLetterIndex >= this.loadingLetters.length) {
            return
        }

        const nextLetter =
            this.loadingLetters[
            this.nextLetterIndex // starts at zero and increments each time a letter is launched
            ]

        nextLetter.classList.add('loaded')

        this.nextLetterIndex++

        /**
         * The final letter has now started travelling.
         *
         * Wait for its CSS transition to finish before marking
         * the complete title animation as finished.
         */
        if (
            this.nextLetterIndex ===
            this.loadingLetters.length
        ) {
            gsap.delayedCall(
                this.LETTER_TRAVEL_DURATION,
                () => {
                    this.titleAnimationFinished = true
                }
            )
        }
    }

    /**
     * Launches letters on a controlled timeline that is
     * completely independent of asset-loading progress.
     * @param {number} delta
     * Time since the previous rendered frame.
     */
    updateLetterAnimation(delta) {
        if (this.titleAnimationFinished) {
            this.update = this.updateLoadingProgress
            this.onAnimationFinished() // tell Experience to start updating the loading progress bar
            return
        }


        /**
         * Launch the W during the first rendered frame.
         *
         * Doing this here instead of inside the constructor
         * gives the browser time to render its displaced
         * starting position first.
         */
        if (!this.letterAnimationStarted) {
            this.letterAnimationStarted = true
            this.launchNextLetter()

            return
        }

        /**
         * Prevent a long frame from causing several letters
         * to launch simultaneously when rendering resumes.
         */
        const animationDelta =
            Math.min(
                delta,
                this.MAX_LOADING_ANIMATION_DELTA
            )

        this.letterLaunchTimer += animationDelta

        if (this.letterLaunchTimer >=this.LETTER_LAUNCH_INTERVAL) {
            this.letterLaunchTimer -=
                this.LETTER_LAUNCH_INTERVAL

            this.launchNextLetter()
        }
    }

    updateLoadingProgress(delta) {
         /**
         * The progress bar still follows real asset progress.
         */
        // Use Math.min so the loading animation stays linear
        const loadingAnimationDelta =
            Math.min(
                delta,
                this.MAX_LOADING_ANIMATION_DELTA
            )

        if (
            this.displayedLoadingProgress <
            this.targetLoadingProgress
        ) {
            this.displayedLoadingProgress +=
                loadingAnimationDelta *
                this.LOADING_PROGRESS_SPEED

            if (
                this.displayedLoadingProgress >
                this.targetLoadingProgress
            ) {
                this.displayedLoadingProgress =
                    this.targetLoadingProgress
            }
        }

        // the actual loading percentage shown to the user 
        // use math.floor to avoid decimals 
        const loadingPercentage =
            Math.floor(
                this.displayedLoadingProgress * 100
            )

        /**
         * String(loadingPercentage) turns it into String because padStart() is a String method
         * padStart(3, 0) means:
         * Make this string at least 3 characters long. If it is too short, add zeroes to the beginning.
         * So first value is the max amount of characters, and the second one is the the String you add a certain amount of times
         * ${"073"}% concatenates the String
         */
        this.loadingPercentElement.textContent =
            `${String(loadingPercentage).padStart(3, '0')}%`

        /**
         * scaleX() controls the element’s width visually along the horizontal axis:
         */
        this.loadingBarFillElement.style.transform =
            `scaleX(${this.displayedLoadingProgress})`

        /**
         * The button appears only when:
         * 1. Every real asset has loaded.
         * 2. The displayed bar has reached 100%.
         * 3. The final title letter has finished travelling.
         */
        if (
            this.loadingFinished &&
            this.displayedLoadingProgress === 1 &&
            this.titleAnimationFinished &&
            !this.enterButtonRevealScheduled
        ) {
            this.enterButtonRevealScheduled = true

            this.enterButton.disabled = false

            this.enterButton.classList.add(
                'visible'
            )
        }
    }

    /**
     * Connects the entry button to the transition that
     * reveals the station.
     */
    setupEnterButton() {
        this.enterButton.addEventListener(
            'click',
            () => {
                this.enterStation()
            }
        )
    }

    /**
     * Fades away the HTML screen and the WebGL overlay.
     */
    enterStation() {
        if (
            this.enterButton.disabled ||
            this.enteringStation
        ) {
            return
        }

        this.enteringStation = true
        this.enterButton.disabled = true

        /**
         * Fade out the HTML loading interface.
         */
        gsap.to(
            this.loadingScreenElement,
            {
                opacity: 0,
                duration: 1.5,
                ease: 'power2.inOut'
            }
        )

        /**
         * Fade the WebGL black overlay at the same time,
         * gradually revealing the station underneath.
         */
        gsap.to(
            this.overlayMaterial.uniforms.uAlpha,
            {
                value: 0,
                duration: 1.5,
                ease: 'power2.inOut',

                onComplete: () => {
                    this.loadingScreenElement.remove()

                    this.scene.remove(
                        this.overlay
                    )

                    this.overlayGeometry.dispose()
                    this.overlayMaterial.dispose()

                    /**
                     * Tell Experience that the station can
                     * now display hotspots and interaction.
                     */
                    this.onSceneReady()
                }
            }
        )
    }

    /**
     * Temporary debug information for detecting browser
     * forced-color behavior.
     */
    logColorDebugInformation() {
        console.log({
            forcedColors:
                window
                    .matchMedia(
                        '(forced-colors: active)'
                    )
                    .matches,

            background:
                getComputedStyle(
                    this.loadingScreenElement
                ).backgroundImage,

            letterColor:
                getComputedStyle(
                    this.loadingLetters[0]
                ).color
        })
    }
}