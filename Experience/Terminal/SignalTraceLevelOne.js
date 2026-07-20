export default class SignalTraceLevelOne {
    constructor() {
        /**
         * Level display info.
         * SignalTrace can use this text when drawing the terminal UI.
         */
        this.title = "LEVEL 01 // ARCHIVE HANDSHAKE"
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
         * Level 1 starting layout.
         *
         * This is a scrambled version of a simple path:
         *
         * SRC -> right -> up -> right -> right -> down -> right -> ARC
         *
         * The path tiles are intentionally rotated incorrectly,
         * so the level starts with SIGNAL LINK: BROKEN.
         */
        return [ // return a 2D array of tile objects, each with a connections array that lists the directions of the pipes in that tile
            [
                // this is the first row of the grid
                { connections: [] }, // connections: [] means no pipes in this tile
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] }
                // 5 columns for the first row, all empty tiles with no connections
            ],
            [
                { connections: [] },

                /**
                 * Intended solved state: ["down", "right"]
                 * Current state is rotated one step away.
                 */
                { connections: ["right", "up"] },

                /**
                 * Intended solved state: ["left", "right"]
                 * Current state is vertical, so it needs rotation.
                 */
                { connections: ["up", "down"] },

                /**
                 * Intended solved state: ["left", "down"]
                 * Current state is rotated one step away.
                 */
                { connections: ["down", "right"] },

                { connections: [] }
            ],
            [
                /**
                 * Source endpoint.
                 * It stays fixed and should not rotate.
                 */
                { connections: ["right"] },

                /**
                 * Intended solved state: ["left", "up"]
                 * Current state is rotated one step away.
                 */
                { connections: ["down", "left"] },

                { connections: [] },

                /**
                 * Intended solved state: ["up", "right"]
                 * Current state is rotated one step away.
                 */
                { connections: ["left", "up"] },

                /**
                 * Archive endpoint.
                 * It stays fixed and should not rotate.
                 */
                { connections: ["left"] }
            ],
            [
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] }
            ],
            [
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] }
            ]
        ]
    }
}