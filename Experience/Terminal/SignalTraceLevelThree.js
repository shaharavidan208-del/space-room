import Pipe from './Pipe.js'

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
        this.rows = 5
        this.cols = 5

        /**
         * Fixed signal endpoints.
         * SRC is the signal source.
         * ARC is the archive target.
         */
        this.source = {
            row: 0,
            col: 0,
            direction: "right"
        }

        this.target = {
            row: 4,
            col: 4,
            direction: "left"
        }

        this.tile = {
            row: 0,
            col: 0,
            pipe: null,
            locked: false,
            blocked: false
        }

        this.pipeCount = {
    vertical: 1,
    horizontal: 3,

    cornerUpLeft: 3,
    cornerDownLeft: 1,
    cornerUpRight: 1,
    cornerDownRight: 2,

    splitDown: 0,
    splitRight: 0
}

        this.sourcePipe = new Pipe(
            null,
            [this.source.direction]
        )

        this.targetPipe = new Pipe(
            null,
            [this.target.direction]
        )
    }

    createGrid() {
        const grid = []

        for (let row = 0; row < this.rows; row++) {
            const gridRow = []

            for (let col = 0; col < this.cols; col++) {
                const newTile = {
                    ...this.tile,
                    row: row,
                    col: col
                }

                gridRow.push(newTile)
            }

            grid.push(gridRow)
        }

        grid[this.source.row][this.source.col].pipe =
            this.sourcePipe

        grid[this.target.row][this.target.col].pipe =
            this.targetPipe

        // Part of the intended path, but their purpose isn't immediately obvious.
grid[2][2].pipe = new Pipe(
    "vertical",
    ["up", "down"]
)
grid[2][2].locked = true

grid[3][1].pipe = new Pipe(
    "horizontal",
    ["left", "right"]
)
grid[3][1].locked = true

        return grid
    }
}
