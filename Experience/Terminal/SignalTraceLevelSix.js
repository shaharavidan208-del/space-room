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
        this.rows = 6
        this.cols = 6

        /**
         * Fixed signal nodes.
         */
        this.source = {
            row: 0,
            col: 0,
            direction: "right"
        }

        this.relay = {
            row: 1,
            col: 4,
            direction: "left"
        }

        this.target = {
            row: 5,
            col: 5,
            direction: "left"
        }

        /**
         * Available inventory pipe counts.
         */
        this.pipeCount = {
            vertical: 2,
            cornerUpLeft: 1,
            cornerDownLeft: 1,
            cornerUpRight: 3,
            horizontal: 2,
            cornerDownRight: 1,
            splitRight: 1
        }

        /**
         * Node pipes.
         */
        this.sourcePipe = new Pipe(
            null,
            [this.source.direction]
        )

        this.relayPipe = new Pipe(
            null,
            [this.relay.direction]
        )

        this.targetPipe = new Pipe(
            null,
            [this.target.direction]
        )

        /**
         * Locked board pipes.
         */
        this.lockedMiddlePipe = new Pipe(
            "horizontal",
            ["left", "right"]
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

        grid[this.relay.row][this.relay.col].pipe =
            this.relayPipe

        grid[this.target.row][this.target.col].pipe =
            this.targetPipe

        /**
         * Attach the locked pipes while preserving
         * the original Level Six layout.
         */
        grid[2][2].pipe = this.lockedMiddlePipe
        grid[2][2].locked = true
        grid[3][3].locked = true
        grid[3][4].locked = true
        
        return grid
    }
}