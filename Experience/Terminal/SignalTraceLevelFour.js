import Pipe from './Pipe.js'

export default class SignalTraceLevelFour {
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
            vertical: 8,
            cornerUpLeft: 1,
            cornerDownLeft: 1,
            cornerUpRight: 1,
            horizontal: 1,
            cornerDownRight: 1,
            splitDown: 0
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

        return grid
    }
}
