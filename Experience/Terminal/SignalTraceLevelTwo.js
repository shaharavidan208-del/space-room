import Pipe from './Pipe.js'

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
            row: 1,
            col: 3,
            direction: "left"
        }


this.secondTarget = {
            row: 4,
            col: 3,
            direction: "left"
        }
        

        



        this.targets = [
        { row: this.target.row, col: this.target.col, direction: this.target.direction  },
        {  row: this.secondTarget.row, col: this.secondTarget.col, direction: this.secondTarget.direction },
        
]

        this.tile = {
            row: 0,
            col: 0,
            pipe: null,
            locked: false,
            blocked: false
        }

        this.pipeCount = {
            vertical: 2,
            cornerUpRight: 1,
            horizontal: 4,
            splitRight: 1,
        }

        

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

        grid[this.secondTarget.row][this.secondTarget.col].pipe =
            this.secondTargetPipe




        return grid
    }
}
