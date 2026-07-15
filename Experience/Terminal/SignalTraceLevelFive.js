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
            col: 0,
            direction: "down"
        }

        this.target = {
            row: 5,
            col: 3,
            direction: "up"
        }

        this.relay = {
            row: 2,
            col: 3,
            direction: "right"
        }



        this.inventory = [
            {
            connections: ["up", "down"],
                count: 5,
                index: 0
            },
            {
            connections: ["up", "left"],
                count: 2,
                index: 1
            },
             {
            connections: ["down", "left"],
                count: 1,
                index: 2,

            },
             {
            connections: ["up", "right"],
                count: 2,
                index: 3
            },
            {
            connections: ["right", "left"],
                count: 1,
                index: 4
            },
            {
            connections: ["down", "right"],
                count: 1,
                index: 5
            },
            {
            connections: ["down", "left", "right"],
                count: 1,
                index: 6
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
