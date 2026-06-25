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
        return [
            [
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] }
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