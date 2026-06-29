export default class SignalTraceLevelThree {
    constructor() {
        /**
         * Level display info.
         * SignalTrace can use this text when drawing the terminal UI.
         */
        this.title = "LEVEL 03 // ARCHIVE HANDSHAKE"
        this.description = "Restore a basic signal route from SRC to ARC."

        /**
         * Board size for this level.
         */
        this.rows = 5
        this.cols = 5

        /**
         * Fixed signal endpoints.
         * SRC is the signal source.
         * ARC is the archive target.
         */
        this.source = { row: 2, col: 0 }
        this.target = { row: 2, col: 4 }
    }

    /**
     * Create the initial grid layout for this level.
     * @returns {Array<Array<{connections: Array<string>}>>} 2D array of tile objects, each with a connections array that lists the directions of the pipes in that tile
     */
    createGrid() {
        /**
         * Level 3 starting layout.
         *
         * This is a scrambled version of a simple path:
         *
         * SRC -> right -> up -> right -> right -> down -> right -> ARC
         *
         * The path tiles are intentionally rotated incorrectly,
         * so the level starts with SIGNAL LINK: BROKEN.
         */
        return [ // return a 2D array of tile objects, each with a connections array that lists the directions of the pipes in that tile
            // first row
            [
                // this is the first row of the grid
                { connections: ["down","right"] }, // [0,0]
                { connections: ["left","right"] }, // [0,1]
                { connections: ["left","down"] }, // [0,2]
                { connections: ["left","right"] }, // [0,3]
                { connections: [] }
                // 5 columns for the first row, all empty tiles with no connections
            ],


            // second row
            [
                { connections: ["up", "right", "down"] },

                /**
                 * Intended solved state: ["down", "right"]
                 * Current state is rotated one step away.
                 */
                { connections: [] },

                /**
                 * Intended solved state: ["left", "right"]
                 * Current state is vertical, so it needs rotation.
                 */
                { connections: ["up", "down"] },

                /**
                 * Intended solved state: ["left", "down"]
                 * Current state is rotated one step away.
                 */
                { connections: ["up", "right"] },

                { connections: ["left", "up"] }
            ],

            // third row
            [
                /**
                 * Source endpoint.
                 * It stays fixed and should not rotate.
                 */
                { connections: ["up", "down"] },

                /**
                 * Intended solved state: ["left", "up"]
                 * Current state is rotated one step away.
                 */
                { connections: [] },

                { connections: ["up", "down"] },

                /**
                 * Intended solved state: ["up", "right"]
                 * Current state is rotated one step away.
                 */
                { connections: ["up", "right", "left"] },

                { connections: [] }
            ],
            [
                { connections: ["up", "right"] },
                { connections: ["left", "up", "down"] },
                { connections: ["down", "right"] },
                { connections: ["left", "up"] },
                { connections: [] }
            ],
            [
                { connections: ["right"] },
                { connections: ["up", "right"] },
                { connections: [] },
                { connections: ["up"] },
                { connections: [] }
            ]
        ]
    }
}