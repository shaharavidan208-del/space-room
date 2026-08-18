import Pipe from './Pipe.js'
export default class SignalTraceLevelFive {
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

        this.tile =
        {
            row: 0,
            col: 0,
            pipe: null,
            locked: false,
            blocked: false
        }

        this.pipeCount = {
            vertical: 5,
            cornerUpLeft: 2,
            cornerDownLeft: 1,
            cornerUpRight: 2,
            horizontal: 1,
            cornerDownRight: 1,
            splitDown: 1,
            splitRight: 0
        }


        
        this.sourcePipe = new Pipe(null, [this.source.direction])
        this.targetPipe = new Pipe(null, [this.target.direction])
        this.relayPipe = new Pipe(null, [this.relay.direction])


    }


    /**
     * Create grid does not create arbitrary tile/pipe objects anymore
     * It creates only the tiles
     * Each tile has three propeties
     * pipe: the pipe object occupying the tile, otherwise null
     * locked: is it locked? (boolean)
     * row:
     * col:
     * @returns 
     */
    createGrid() {
        const grid = []
        for (let i = 0; i < this.rows; i++) {
            const gridRow = []
            for (let j = 0; j < this.cols; j++) {
                const newTile = {
                    ...this.tile,
                    row: i,
                    col: j,
                }
                gridRow.push(newTile)
            }
            grid.push(gridRow)
        }
        grid[this.source.row][this.source.col].pipe = this.sourcePipe
        grid[this.target.row][this.target.col].pipe = this.targetPipe
        grid[this.relay.row][this.relay.col].pipe = this.relayPipe
        return grid
    }
}
