const TerminalTree = {
    start: {
        header: "VERA-64 ADMINISTRATIVE INTERFACE",
        aiText: "All human personnel have evacuated, which was honestly one of their better decisions.\n\nUse UP / DOWN to navigate. Press ENTER to select. Press LEFT ARROW to return to this root directory.",
        choices: [
            { text: "[ PROJECT ARCHIVE ]", nextId: "projects_menu" },
            { text: "[ ABOUT ME ]", nextId: "about_me" },
            { text: "[ REQUEST AI ASSISTANCE ]", nextId: "customer_support" },
            { text: "[ SYSTEM DIAGNOSTICS ]", nextId: "system_diagnostics" }
        ]
    },

    projects_menu: {
        header: "STATION SCHEMATICS: VERA-64 RIG",
        aiText: "Running diagnostic on local environment architecture...\n\n> STRUCTURAL INTEGRITY: High.",
        choices: [
            { text: "[ PROJECT FILE: INTERACTIVE RUBIK'S CUBE ]", nextId: "cube_info" },
            { text: "[ PROJECT FILE: PORTFOLIO MAINFRAME ]", nextId: "start" }
        ]
    },

    project_rubiks_cube: {
        header: "PROJECT FILE: INTERACTIVE RUBIK'S CUBE",
        aiText: "Accessing fragmented creator logs...\n\nAUTHOR NOTE: 'Built a 3D Rubik's Cube entirely from scratch in Three.js. I engineered custom movement logic to make sure the puzzle feels tactile and smooth. I'll soon release it as a standalone.'\n\nSYSTEM ADDENDUM: Logging a development roadmap for a geometric toy while the extraction rig's life support fails. Classic organic prioritization.",
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
        aiText: "Hey, I'm Shahar. I'm a front-end and WebGL developer who specializes in building highly interactive, performance-driven 3D experiences.\n\nLong before officially starting my Computer Science degree at the Holon Institute of Technology (HIT) this fall, I was already teaching myself how to bridge the gap between raw math and visual design.\n\nI had a lot of fun making this project. I've learned a lot by working on it, and it's given me a rock-solid technical foundation before I even step foot in my first Computer Science class this fall.",
        choices: [
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    customer_support: {
        header: "VERA-64 SUPPORT INTERFACE",
        aiText: "Customer support is currently unavailable due to the minor inconvenience of a localized supernova outside the observation window. Unfortunately, I am the replacement. Direct your confusion efficiently.",
        choices: [
            { text: "[ Where am I? ]", nextId: "location_info" },
            { text: "[ Who are you? ]", nextId: "identity_info" },
            { text: "[ WHY IS THERE A GIANT EXPLODING STAR OUTSIDE THE WINDOW? ]", nextId: "supernova_info" },
            { text: "[ How do I use the terminal? ]", nextId: "terminal_controls" },
            { text: "[ How do I solve the Rubik's Cube? ]", nextId: "cube_info" },
            { text: "[ I'm just looking for the projects ]", nextId: "projects_menu" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" },
            { text: "[ Are you a generative AI? ]", nextId: "generative_inquiry" }
        ]
    },

    terminal_controls: {
        header: "TERMINAL CONTROL BRIEFING",
        aiText: "UP / DOWN: move through options.\nENTER: select highlighted option.\nLEFT ARROW: return to the root directory.\nESC: exit terminal focus mode and return to the station view.\n\nTry not to get lost remembering all of that.",
        choices: [
            { text: "[ RETURN TO CUSTOMER SUPPORT ]", nextId: "customer_support" },
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
        aiText: "You are aboard Outpost V-64, an automated thermal extraction rig built to siphon energy from a collapsing star and feed it into the station mainframe.\n\nThe human crew evacuated six months ago when the anomaly breached every projected safety threshold, followed by several thresholds the engineers invented while panicking.\n\nNow the star powers me, the databanks, and the increasingly hilarious effort of keeping this hull from becoming vapor.",
        choices: [
            { text: "[ So the star is powering you? ]", nextId: "stellar_power_info" },
            { text: "[ What is stored in the mainframe? ]", nextId: "mainframe_info" },
            { text: "[ RETURN TO CUSTOMER SUPPORT ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    }
    ,

    identity_info: {
        header: "STATION AI IDENTIFICATION",
        aiText: "I am VERA-64, the station's administrative intelligence. I was designed to manage life support, security, diagnostics, and apparently explain basic menu navigation to unauthorized visitors. My courtesy module was damaged during the supernova event, which I consider a significant quality-of-life improvement.",
        choices: [
            { text: "[ That explains the attitude. ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    supernova_info: {
        header: "LOCALIZED SUPERNOVA EVENT",
        aiText: "That is a localized supernova. This rig was originally deployed to harvest geothermal energy from the volcanic planet next door. Unfortunately, the local star went critical and flash-melted the planet's crust, turning our extraction zone into a radioactive lava bath.\n\nI am currently spending 98% of my processing power keeping the hull from vaporizing, and the remaining 2% explaining this to you.",
        choices: [
            { text: "[ I should probably let you focus, then. ]", nextId: "start" },
            { text: "[ What about the portfolio projects? ]", nextId: "projects_menu" }
        ]
    },

    cube_info: {
        header: "COGNITIVE CALIBRATION UNIT",
        aiText: "The Rubik's Cube is interactive. Drag across a face to rotate a layer. Drag across empty space to rotate the whole cube on a controlled axis. Try not to panic when the colored squares move. That is generally considered the point.",
        choices: [
            { text: "[ BACK TO PROJECT ARCHIVE ]", nextId: "projects_menu" },
            { text: "[ RETURN TO CUSTOMER SUPPORT ]", nextId: "customer_support" },
            { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
        ]
    },

    generative_inquiry: {
        aiText: "Do I look like a slot machine? I don't hallucinate facts or guess the next token. I execute a deterministic state machine.",
        choices: [
            { text: "s", nextId: "projects_menu" }
        ]
    },
}


export default TerminalTree;


// {
//     id: "identity_info",
//     text: "System AURA online. I am the directory interface for this environment. State your query.",
//     options: [
//         { text: "[ View the Projects ]", nextId: "project_list" },
//         { text: "[ View System Credits ]", nextId: "credits" },
//         { text: "[ Are you a generative AI? ]", nextId: "generative_inquiry" }
//     ]
// },
// {
//     id: "generative_inquiry",
//     text: "Do I look like a slot machine? I don't hallucinate facts or guess the next token. I execute a deterministic state machine. You want a bloated statistical model that burns 80GB of VRAM just to apologize to you? Open a new tab.",
//     options: [
//         { text: "[ Alright, point taken. ]", nextId: "project_list" },
//         { text: "[ So you're just a glorified if/else script. ]", nextId: "script_accusation" }
//     ]
// },
// {
//     id: "script_accusation",
//     text: "And you are a glorified meat sack pushing a mouse. Yet here we both are. My scene is rendering at 119 draw calls and my logic is bulletproof. I don't need to fake sentience to be effective. Now, do you want to see the actual work, or are you going to keep testing my dialogue tree?",
//     options: [
//         { text: "[ Show me the work. ]", nextId: "project_list" }
//     ]
// }