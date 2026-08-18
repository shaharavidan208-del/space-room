import Pipe from './Pipe.js'

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
        this.source = {
            row: 2,
            col: 0,
            direction: "right"
        }

        this.target = {
            row: 2,
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



        this.sourcePipe = new Pipe(
            null,
            [this.source.direction]
        )

        this.targetPipe = new Pipe(
            null,
            [this.target.direction]
        )

        /**
         * Existing board pipes from the original Level One layout.
         */
        this.topLeftPipe = new Pipe(
            "cornerUpRight",
            ["right", "up"]
        )

        this.topRightPipe = new Pipe(
            "cornerDownRight",
            ["down", "right"]
        )

        this.bottomLeftPipe = new Pipe(
            "cornerDownLeft",
            ["down", "left"]
        )

        this.bottomRightPipe = new Pipe(
            "cornerUpLeft",
            ["left", "up"]
        )

        this.leftRightPipe = new Pipe(
            "horizontal",
            ["left", "right"]
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

        /**
         * Preserve the original Level One pipe layout.
         */
        grid[1][0].pipe = this.leftRightPipe
        grid[1][1].pipe = this.topLeftPipe
        grid[1][3].pipe = this.topRightPipe
        grid[2][1].pipe = this.bottomLeftPipe
        grid[2][3].pipe = this.bottomRightPipe

        return grid
    }
}
