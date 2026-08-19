import Pipe from './Pipe.js'

export default class SignalTraceLevelFour {
    constructor() {
        /**
         * Level display info.
         * SignalTrace can use this text when drawing the terminal UI.
         */
        this.title = "LEVEL 04 // BRANCH PROTOCOL"
this.description =
    "Route the primary signal while maintaining the auxiliary relay link."

this.rows = 6
this.cols = 6

this.source = {
    row: 0,
    col: 0,
    direction: "down"
}

this.relay = {
    row: 1,
    col: 5,
    direction: "down"
}

this.target = {
    row: 5,
    col: 5,
    direction: "left"
}

this.pipeCount = {
    vertical: 3,
    horizontal: 3,

    cornerUpLeft: 2,
    cornerDownLeft: 1,
    cornerUpRight: 2,
    cornerDownRight: 2,

    splitUp: 1
}

        this.sourcePipe = new Pipe(
            null,
            [this.source.direction]
        )

        this.targetPipe = new Pipe(
            null,
            [this.target.direction]
        )

        this.relayPipe = new Pipe(
            null,
            [this.relay.direction]
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

        grid[this.relay.row][this.relay.col].pipe = this.relayPipe

        grid[2][3].locked = true
grid[4][5].locked = true
grid[5][3].locked = true

        return grid
    }
}
