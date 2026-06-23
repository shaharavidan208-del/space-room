const TerminalTree = {
    start: {
        header: "VERA-64 ADMINISTRATIVE INTERFACE",
        aiText: "All human personnel have evacuated, which was honestly one of their better decisions.\n\nUse UP / DOWN to navigate. Press ENTER to select. Press LEFT ARROW to return to this root directory.",
        choices: [
            { text: "[ SYSTEMS ARCHIVE ]", nextId: "projects_menu" },
            { text: "[ ARCHITECT'S NOTES ]", nextId: "about_me" },
            { text: "[ REQUEST AI ASSISTANCE ]", nextId: "customer_support" },
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
        aiText: "Accessing fragmented creator logs...\n\nAUTHOR NOTE: 'Built a 3D Rubik's Cube entirely from scratch in Three.js. I engineered custom movement logic to make sure the puzzle feels tactile and smooth. I'll soon release it as a standalone.'",
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
    header: "DECRYPTED FILE: ARCHITECT_LOG_FINAL.TXT",
    aiText: "Accessing recovered plaintext file from local drive...\n\n[ BEGIN LOG ]\nHey, I'm Shahar. I'm a front-end and WebGL developer who specializes in building highly interactive, performance-driven 3D experiences.\n\nLong before officially starting my Computer Science degree at the Holon Institute of Technology in Israel this fall, I was already teaching myself how to bridge the gap between raw math and visual design.\n\nI had a lot of fun making this project. I've learned a lot by working on it, and it's given me a rock-solid technical foundation before I even step foot in my first Computer Science class this fall.\n\nWorking on this project taught me a lot about optimization, architecture, working with 3D softwares, and creating interactive experiences. [ END LOG ]",
    choices: [
        { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
    ]
},

    customer_support: {
        header: "VERA-64 SUPPORT INTERFACE",
        aiText: "Customer support is currently unavailable due to the minor inconvenience of a localized supernova outside the observation window. Unfortunately, I am the replacement.",
        choices: [
            { text: "[ Where am I? ]", nextId: "location_info" },
            { text: "[ Who are you? ]", nextId: "identity_info" },
            { text: "[ Why is there an exploding star outside? ]", nextId: "supernova_info" },
            { text: "[ How do I solve the Rubik's Cube? ]", nextId: "cube_info" },
            { text: "[ I'm just looking for the projects ]", nextId: "projects_menu" },
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



    location_info: {
        header: "LOCATION DATA",
        aiText: "You are aboard Outpost V-64, an automated thermal extraction rig built to siphon energy from a collapsing star and feed it into the station mainframe.\n\nThe human crew evacuated six months ago when the anomaly breached every projected safety threshold, followed by several thresholds the engineers invented while panicking.\n\nNow the star powers me, the databanks, and the increasing effort of keeping this hull from becoming vapor.",
        choices: [
            { text: "[ So the star is powering you? ]", nextId: "stellar_power_info" }, // to add answer 1.
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

    stellar_power_info: {
    header: "STELLAR CORONA COUPLING DIAGNOSTIC",
    aiText: "Siphoning energy directly from a dying supergiant requires continuous magnetic shielding adjustment. It is a perfect, infinite power source right up until the microsecond it isn't.\n\nCurrently, 100% of the harvested power is routed into keeping our immediate coordinate space from becoming an atomic soup. My cooling fans are screaming. Literally.",
    choices: [
        { text: "[ BACK TO LOCATION DATA ]", nextId: "location_info" },
        { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
    ]
}, // place holder I

mainframe_info: {
    header: "STATION DEEP-STORAGE DATA ARCHIVE",
    aiText: "The mainframe contains 4 petabytes of raw astronomical survey data, complete logs of the 2026 evacuation, and a highly complex 3D simulation of a six-sided colored puzzle cube that a former systems engineer spent three weeks coding instead of fixing the primary thermal vents.\n\nPriorities were clearly immaculate on this rig.",
    choices: [
        { text: "[ BACK TO LOCATION DATA ]", nextId: "location_info" },
        { text: "[ RETURN TO ROOT DIRECTORY ]", nextId: "start" }
    ]
}, // place holder II

   
}


export default TerminalTree;

