export default class SignalTraceLevelTwo {
    constructor() {
        /**
         * Level display info.
         * SignalTrace can draw this in the terminal UI.
         */
        this.title = "LEVEL 02 // ROUTE CONTAMINATION"
        this.description = "Recover the archive signal through corrupted relay noise."

        /**
         * Board size for this level.
         */
        this.rows = 5
        this.cols = 5

        /**
         * Fixed endpoints.
         *
         * This level moves SRC and ARC away from the simple
         * left-to-right tutorial layout.
         */
        this.source = { row: 4, col: 0 }
        this.target = { row: 0, col: 4 }
    }

    createGrid() {
        /**
         * Level 2 starting layout.
         *
         * Intended solved route:
         *
         * SRC at (4,0)
         * -> (4,1)
         * -> (3,1)
         * -> (2,1)
         * -> (2,2)
         * -> (1,2)
         * -> (1,3)
         * -> (2,3)
         * -> (3,3)
         * -> (3,4)
         * -> (2,4)
         * -> (1,4)
         * -> ARC at (0,4)
         *
         * Several extra modules are decoys.
         * They are there to make the board harder to read,
         * not because they are required for the solution.
         */
        return [
            [
                /**
                 * Decoy route noise.
                 */
                { connections: ["right", "down"] },

                /**
                 * Decoy route noise.
                 */
                { connections: ["left", "right"] },

                /**
                 * Decoy route noise.
                 */
                { connections: ["left", "down"] },

                /**
                 * Decoy T-junction near the archive.
                 * Looks suspicious, but is not part of the required path.
                 */
                { connections: ["left", "down", "right"] },

                /**
                 * Archive endpoint.
                 * Intended solved state: ["down"]
                 *
                 * Target is fixed and should not rotate.
                 */
                { connections: ["down"] }
            ],
            [
                { connections: [] },

                /**
                 * Decoy corner.
                 */
                { connections: ["right", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["down", "right"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["up", "left"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["left", "down"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["up", "left"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["up", "down"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["left", "right"] }
            ],
            [
                /**
                 * Decoy T-junction.
                 */
                { connections: ["up", "right", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["down", "right"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["left", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["left", "up"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["right", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["up", "down"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["left", "right"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["up", "down"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["left", "right"] }
            ],
            [
                /**
                 * Decoy corner near the source.
                 */
                { connections: ["right", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["up", "down"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["left", "right"] },

                /**
                 * Decoy T-junction.
                 */
                { connections: ["up", "left", "right"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["up", "right"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["right", "down"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["left", "up"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["down", "left"] }
            ],
            [
                /**
                 * Source endpoint.
                 * Intended solved state: ["right"]
                 *
                 * Source is fixed and should not rotate.
                 */
                { connections: ["right"] },

                /**
                 * Required path tile.
                 * Intended solved state: ["left", "up"]
                 *
                 * Current state is scrambled.
                 */
                { connections: ["up", "right"] },

                /**
                 * Decoy straight module.
                 */
                { connections: ["left", "right"] },

                { connections: [] },

                /**
                 * Decoy endpoint.
                 */
                { connections: ["up"] }
            ]
        ]
    }
}