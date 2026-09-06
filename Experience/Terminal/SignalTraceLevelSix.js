import Pipe from './Pipe.js'

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
        this.rows = 7
        this.cols = 7

        /**
         * Fixed signal nodes.
         */
        this.source = {
            row: 0,
            col: 0,
            direction: "right"
        }

        this.target = {
            row: 5,
            col: 5,
            direction: "left"
        }

        this.secondTarget = {
            row: 1,
            col: 1,
            direction: "left"
        }

        this.thirdTarget = {
            row: 5,
            col: 1,
            direction: "left"
        }

        this.fourthTarget = {
            row: 1,
            col: 5,
            direction: "left"
        }

        this.targets = [
            {
                row: this.target.row,
                col: this.target.col,
                direction: this.target.direction
            },
            {
                row: this.secondTarget.row,
                col: this.secondTarget.col,
                direction: this.secondTarget.direction
            },
            {
                row: this.thirdTarget.row,
                col: this.thirdTarget.col,
                direction: this.thirdTarget.direction
            },
            {
                row: this.fourthTarget.row,
                col: this.fourthTarget.col,
                direction: this.fourthTarget.direction
            }
        ]

        /**
         * Available inventory pipe counts.
         */
        this.pipeCount = {
            vertical: 1,
            cornerUpLeft: 1,
            cornerDownLeft: 3,
            cornerUpRight: 3,
            horizontal: 5,
            cornerDownRight: 2,
            splitDown: 0,
            splitUp: 1,
            splitRight: 2,
            splitLeft: 0
        }

        /**
         * Node pipes.
         */
        this.sourcePipe = new Pipe(
            null,
            [this.source.direction]
        )

        this.targetPipe = new Pipe(
            null,
            [this.target.direction]
        )

        this.secondTargetPipe = new Pipe(
            null,
            [this.secondTarget.direction]
        )

        this.thirdTargetPipe = new Pipe(
            null,
            [this.thirdTarget.direction]
        )

        this.fourthTargetPipe = new Pipe(
            null,
            [this.fourthTarget.direction]
        )


        this.lockedCornerPipe = new Pipe(
            "cornerUpRight",
            ["up", "right"]
        )

    }

    createGrid() {
        const grid = []

        /**
         * Create the empty Tile grid.
         */
        for (let row = 0; row < this.rows; row++) {
            const gridRow = []

            for (let col = 0; col < this.cols; col++) {
                const tile = {
                    row: row,
                    col: col,
                    pipe: null,
                    locked: false,
                    blocked: false
                }

                gridRow.push(tile)
            }

            grid.push(gridRow)
        }

        /**
         * Attach the fixed node pipes.
         */
        grid[this.source.row][this.source.col].pipe =
            this.sourcePipe

        grid[this.target.row][this.target.col].pipe =
            this.targetPipe

        grid[this.secondTarget.row][this.secondTarget.col].pipe =
            this.secondTargetPipe

        grid[this.thirdTarget.row][this.thirdTarget.col].pipe =
            this.thirdTargetPipe

        grid[this.fourthTarget.row][this.fourthTarget.col].pipe =
            this.fourthTargetPipe

        /**
         * Attach the locked pipes while preserving
         * the original Level Six layout.
         */
        grid[3][3].locked = true
        grid[3][4].locked = true

        return grid
    }
}
