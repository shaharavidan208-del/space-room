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
        this.rows = 4
        this.cols = 4

        /**
         * Fixed signal endpoints.
         * SRC is the signal source.
         * ARC is the archive target.
         */
        this.source = {
            row: 0,
            direction: "right"
        }

        this.target = {
            row: 0,
            direction: "left"
        }
        this.inventory = [
            {
                label: "H-LINE",
                connections: ["left", "right"],
                count: 2
            },
            {
                label: "V-LINE",
                connections: ["up", "down"],
                count: 1
            },
            {
                label: "CORNER RD",
                connections: ["right", "down"],
                count: 1
            }
        ]

    }

    createGrid() {
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
