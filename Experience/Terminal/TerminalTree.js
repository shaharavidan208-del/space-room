const TerminalTree = {
    start: {
        header: "ROOT DIRECTORY",
        aiText: "UNAUTHORIZED ACCESS DETECTED. ALL STATION PERSONNEL HAVE EVACUATED. STATE YOUR BUSINESS.",
        choices: [
            { text: "[ MY PROJECTS ]", nextId: "projects_menu" },
            { text: "[ ABOUT ME ]", nextId: "about_me" },
            { text: "[ CUSTOMER SUPPORT ]", nextId: "customer_support" },
            { text: "[ SYSTEM DIAGNOSTICS ]", nextId: "system_diagnostics" }
        ]
    },

    projects_menu: {
        header: "PROJECT ARCHIVE",
        aiText: "Available projects detected. Try not to act impressed too quickly. It makes the logs uncomfortable.",
        choices: [
            { text: "[ Interactive 3D Rubik's Cube ]", nextId: "project_rubiks_cube" },
            { text: "[ Portfolio Mainframe ]", nextId: "project_portfolio_mainframe" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    project_rubiks_cube: {
        header: "PROJECT FILE: INTERACTIVE 3D RUBIK'S CUBE",
        aiText: "A fully interactive 3D Rubik's Cube built with Three.js and raycasting. It includes mouse and mobile controls, stable layer rotations, custom input handling, and enough guardrails to survive a user behaving like a caffeinated goblin.",
        choices: [
            { text: "[ BACK TO PROJECT ARCHIVE ]", nextId: "projects_menu" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    project_portfolio_mainframe: {
        header: "PROJECT FILE: PORTFOLIO MAINFRAME",
        aiText: "An interactive WebGL portfolio environment built around a sci-fi station, terminal interface, cinematic viewport system, custom shader work, hotspot logic, and performance-focused scene architecture.",
        choices: [
            { text: "[ BACK TO PROJECT ARCHIVE ]", nextId: "projects_menu" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    about_me: {
        header: "PERSONNEL FILE: SHAHAR AVIDAN",
        aiText: "Hey, I'm Shahar. I'm a front-end and WebGL developer who specializes in building highly interactive, performance-driven 3D experiences.\n\nI'm a strong believer in learning by doing. Long before officially starting my Computer Science degree at the Holon Institute of Technology (HIT) this fall, I was already teaching myself how to bridge the gap between raw math and visual design.\n\nI had a lot of fun making this project. I've learned a lot by working on it, and it's given me a rock-solid technical foundation before I even step foot in my first Computer Science class this fall.",
        choices: [
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    customer_support: {
        header: "CUSTOMER SUPPORT",
        aiText: "Customer support is currently unavailable due to the minor inconvenience of a localized supernova outside the observation window. Your complaint has been filed directly into the nearest plasma vent.",
        choices: [
            { text: "[ Where am I? ]", nextId: "location_info" },
            { text: "[ Who are you? ]", nextId: "identity_info" },
            { text: "[ WHY IS THERE A GIANT EXPLODING STAR OUTSIDE THE WINDOW? ]", nextId: "supernova_info" },
            { text: "[ How do I solve the Rubik's Cube? ]", nextId: "cube_info" },
            { text: "[ I'm just looking for the projects. ]", nextId: "projects_menu" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    system_diagnostics: {
        header: "SYSTEM DIAGNOSTICS",
        aiText: "Station integrity: questionable.\nAI patience: critically low.\nSupernova proximity: professionally concerning.\nPortfolio systems: operational.\nRubik's Cube containment: stable.\nUser competence: pending further testing.",
        choices: [
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    location_info: {
        header: "LOCATION DATA",
        aiText: "You are aboard a severely overdesigned portfolio station positioned near an astrophysical disaster that, according to every safety manual ever written, should not be this close.",
        choices: [
            { text: "[ That seems unsafe. ]", nextId: "supernova_info" },
            { text: "[ RETURN TO CUSTOMER SUPPORT ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    identity_info: {
        header: "AI IDENTITY",
        aiText: "I am the station's remaining administrative intelligence. My duties include maintaining basic systems, preventing total structural collapse, and explaining obvious things to visitors who keep touching the interface.",
        choices: [
            { text: "[ Charming. ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    supernova_info: {
        header: "LOCALIZED SUPERNOVA EVENT",
        aiText: "That is a localized supernova. I am currently spending 98% of my processing power keeping the structural integrity fields from failing, and the remaining 2% explaining this to you.",
        choices: [
            { text: "[ I should probably let you focus, then. ]", nextId: "start" },
            { text: "[ What about the portfolio projects? ]", nextId: "projects_menu" }
        ]
    },

    cube_info: {
        header: "COGNITIVE CALIBRATION UNIT",
        aiText: "The Rubik's Cube is interactive. Drag across a face to rotate a layer. Drag across an empty space to rotate the whole cube. Try not to panic when the colored squares move. That is generally considered the point.",
        choices: [
            { text: "[ Show me the projects. ]", nextId: "projects_menu" },
            { text: "[ RETURN TO CUSTOMER SUPPORT ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    }
};

export default TerminalTree;