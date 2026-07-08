export default class SignalTraceLevelThree {
    constructor() {
        /**
         * Level display info.
         * SignalTrace can use this text when drawing the terminal UI.
         */
        this.title = "LEVEL 02 // ARCHIVE HANDSHAKE"
        this.description = "Restore a basic signal route from SRC to ARC."

        /**
         * Board size for this level.
         */
        this.rows = 6
        this.cols = 6

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
            row: 5,
            col: 3
        }

        this.relay = {
            row: 2,
            col: 3
        }
        this.inventory = [
            {
            connections: ["up", "down"],
                count: 5
            },
            {
            connections: ["up", "left"],
                count: 2
            },
             {
            connections: ["down", "left"],
                count: 1
            },
             {
            connections: ["up", "right"],
                count: 2
            },
            {
            connections: ["right", "left"],
                count: 1
            },
            {
            connections: ["down", "right"],
                count: 1
            },
            {
            connections: ["down", "left", "right"],
                count: 1
            },
        ]

    }

    createGrid() {
        return [
             [
                { connections: ["down"] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: [] },
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
                { connections: ["right"] },
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
                { connections: []},
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
