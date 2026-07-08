export default class SignalTraceLevelSix {
    constructor() {
        /**
         * Level display info.
         */
        this.title = "LEVEL 06 // RELAY LOCK"
        this.description = "Route the signal through the relay and repair the locked circuit chain."

        /**
         * Board size.
         */
        this.rows = 6
        this.cols = 6

        /**
         * Fixed signal endpoints.
         *
         * SRC only exits to the right.
         * RLY is touched from the left.
         * ARC is entered from the left.
         */
        this.source = {
            row: 0,
            col: 0
        }

        this.relay = {
            row: 2,
            col: 4
        }

        this.target = {
            row: 5,
            col: 5
        }

        /**
         * Exact inventory for the missing route.
         *
         * Intended path:
         * SRC → down/right into locked middle rail → RLY
         * then from RLY → down through locked bend → bottom rail → ARC.
         */
        this.inventory = [
            {
                connections: ["left", "down"],
                count: 1
            },
            {
                connections: ["up", "down"],
                count: 2
            },
            {
                connections: ["up", "right"],
                count: 2
            },
            {
                connections: ["down", "left", "right"],
                count: 1
            },
            {
                connections: ["down", "right"],
                count: 1
            },
            {
                connections: ["left", "right"],
                count: 1
            }
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
                { connections: ["left", "right"], locked: true },
                { connections: [] },
                { connections: ["left"] },
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
                { connections: ["up", "left"], locked: true },
                { connections: [] },
                { connections: [] }
            ],
            [
                { connections: [] },
                { connections: [] },
                { connections: [] },
                { connections: ["left", "right"], locked: true },
                { connections: [] },
                { connections: ["left"] }
            ]
        ]
    }
}