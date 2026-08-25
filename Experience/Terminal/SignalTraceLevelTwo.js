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
            row: 1,
            col: 1,
            direction: "left"
        }

        this.target = {
            row: 0,
            col: 5,
            direction: "left"
        }


this.secondTarget = {
            row: 1,
            col: 4,
            direction: "right"
        }
        

        this.thirdTarget = {
            row: 2,
            col: 2,
            direction: "right"
        }

        this.fourthTarget = {
            row: 3,
            col: 3,
            direction: "left"
        }

         this.fifthTarget = {
            row: 4,
            col: 4,
            direction: "right"
        }

         this.sixthTarget = {
            row: 5,
            col: 5,
            direction: "left"
        }

        



        this.targets = [
        { row: this.target.row, col: this.target.col, direction: this.target.direction  },
        {  row: this.secondTarget.row, col: this.secondTarget.col, direction: this.secondTarget.direction },
        { row: this.thirdTarget.row, col: this.thirdTarget.col, direction: this.thirdTarget.direction  },
        {  row: this.fourthTarget.row, col: this.fourthTarget.col, direction: this.fourthTarget.direction },
        { row: this.fifthTarget.row, col: this.fifthTarget.col, direction: this.fifthTarget.direction  },
        {  row: this.sixthTarget.row, col: this.sixthTarget.col, direction: this.sixthTarget.direction }
        
]

        this.tile = {
            row: 0,
            col: 0,
            pipe: null,
            locked: false,
            blocked: false
        }

        this.pipeCount = {
            vertical: 5,
            cornerUpLeft: 1,
            cornerDownLeft: 2,
            cornerUpRight: 3,
            horizontal: 1,
            cornerDownRight: 1,
            splitDown: 1,
            splitRight: 1,
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
        this.fifthTargetPipe = new Pipe(
            null,
            [this.fifthTarget.direction]
        )
        this.sixthTargetPipe = new Pipe(
            null,
            [this.sixthTarget.direction]
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

        grid[this.thirdTarget.row][this.thirdTarget.col].pipe =
            this.thirdTargetPipe
        
        grid[this.fourthTarget.row][this.fourthTarget.col].pipe =
            this.fourthTargetPipe

        grid[this.fifthTarget.row][this.fifthTarget.col].pipe =
            this.fifthTargetPipe

        grid[this.sixthTarget.row][this.sixthTarget.col].pipe =
            this.sixthTargetPipe



        return grid
    }
}
