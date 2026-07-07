export default class SignalTraceLevelTwo {
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
        this.source = {
            row: 0,
            col: 0
        }

        this.target = {
            row: 4,
            col: 3
        }
        this.inventory = [
            {
                label: "V-LINE",
                connections: ["up", "down"],
                count: 5
            },
            {
                label: "CORNER RD",
                connections: ["right", "down"],
                count: 1
            },
            {
            connections: ["left", "down"],
                count: 2
            },
            {
            connections: ["up", "right"],
                count: 1
            },
             {
            connections: ["up", "left"],
                count: 1
            },

        ]

    }

    createGrid() {
        return [
             [
                { connections: ["right"] },
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
                { connections: [] },
                { connections: [] }
            ],
            [
                { connections: [] },
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
                { connections: [] },
                { connections: [] }
            ],
            [
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: ["up"] },
                { connections: [] },
                { connections: [] }
            ]
        ]
    }
}
