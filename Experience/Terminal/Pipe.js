export default class Pipe {
    /**
     * Creates one individual pipe.
     *
     * @param {string | null} type
     * The pipe's inventory category, or null when it does not belong
     * to an inventory category.
     *
     * @param {string[]} connections
     * The directions this pipe connects to.
     */
    constructor(type, connections) {
        this.type = type
        this.connections = [...connections]
    }
}