// DialogueTree.js

const DialogueTree = {
    'start': { // This object represents a single "room" in the conversation. 
    // It groups the two things that always belong together: what the AI is currently saying (aiText), and the options the player has.
        aiText: "UNAUTHORIZED ACCESS DETECTED. ALL STATION PERSONNEL HAVE EVACUATED. STATE YOUR BUSINESS.",
        choices: [ // An array that holds the choices for the player
            { text: "[ Where am I? ]", nextId: 'location_info' }, // pairs the visual label (text) directly to the destination address (nextId).
            { text: "[ Who are you? ]", nextId: 'identity_info' },
            { text: "[ WHY IS THERE A GIANT EXPLODING STAR OUTSIDE THE WINDOW? ]", nextId: 'supernova_info'},
            { text: "[ How do I solve the Rubik's Cube? ]", nextId: 'cube_info'},
            { text: "[ I'm just looking for the projects. ]", nextId: 'projects_info' }

        ]
    },

    'supernova_info': {
        aiText: "That is a localized supernova. I am currently spending 98% of my processing power keeping the structural integrity fields from failing, and the remaining 2% explaining this to you.",
        choices: [
            // This choice sends them right back to the first menu!
            { text: "[ I should probably let you focus, then. ]", nextId: 'start' }, 
            
            // This choice sends them deeper into the tree
            { text: "[ What about the portfolio projects? ]", nextId: 'projects_info' }
        ]
    }
    // Add your other nodes here...
};

export default DialogueTree;