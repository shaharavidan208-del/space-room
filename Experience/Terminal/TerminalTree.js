const TerminalTree = {
    start: {
        header: "PORTFOLIO TERMINAL",
        aiText: "Welcome. This terminal contains information about me, the experience you are currently exploring, and the systems running behind it.\n\nUse UP / DOWN to navigate. Press ENTER to select. Press LEFT ARROW to return to this directory.",
        choices: [
            { text: "[ ABOUT ME ]", nextId: "about_me" },
            { text: "[ THE PROJECT ]", nextId: "experience_menu" },
            { text: "[ CONTROLS ]", nextId: "controls" },
            { text: "[ SIGNAL TRACE ]", action: "startSignalTrace" }
        ]
    },

    about_me: {
        header: "ABOUT ME",
        aiText: "Hey, I'm Shahar. I build interactive web experiences, with a particular interest in Three.js, real-time 3D, and I'm beginning a Computer Science degree in October 2026. .\n\nThe process of making this project pulled me into programming, interaction design, optimization, and the mathematics behind movement in 3D space.",
        choices: [
            { text: "[ THE PROJECT ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_menu: {
        header: "THE PROJECT",
        aiText: "This portfolio is a real-time 3D space station built for the web. Instead of presenting the work through a conventional scrolling page, I wanted the portfolio itself to be the project: a place you can explore, operate, and inspect.\n\nThe sections below explain why I built it, what can be interacted with, and the technology holding it together.",
        choices: [
            { text: "[ WHY I BUILT IT ]", nextId: "experience_origin" },
            { text: "[ WHAT IS INTERACTIVE ]", nextId: "experience_interactions" },
            { text: "[ HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ TECHNOLOGY ]", nextId: "experience_technology" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_origin: {
        header: "WHY I BUILT IT",
        aiText: "I wanted to show off my work in something more than a simple webpage. Telling my story using a 3D scene was the perfect way to showcase both my skills and my hobbies in life.\n\nThe original idea was much smaller. Every feature exposed a new problem worth solving, so the station gradually became a complete interactive portfolio and the main project through which I learned real-time 3D development.",
        choices: [
            { text: "[ WHAT IS INTERACTIVE ]", nextId: "experience_interactions" },
            { text: "[ BACK TO EXPERIENCE OVERVIEW ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_interactions: {
        header: "WHAT IS INTERACTIVE",
        aiText: "The station is designed to be explored rather than passively viewed. You can move between points of interest, operate this terminal, manipulate a fully functional Rubik's Cube, and play Signal Trace directly through the monitor.\n\nThe interactions connect the Three.js scene to custom input systems, camera behavior, raycasting, canvas rendering, and state management.\n\nThe result is one continuous experience: the environment is the interface, and the portfolio information lives inside it.",
        choices: [
            { text: "[ VIEW CONTROLS ]", nextId: "controls" },
            { text: "[ BACK TO EXPERIENCE OVERVIEW ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_technology: {
        header: "TECHNOLOGY",
        aiText: "The experience is written in JavaScript and rendered with Three.js. Blender is used to prepare and adjust 3D assets, while GLSL shaders handle visual effects that need more control than standard materials provide.\n\nThe terminal and Signal Trace are rendered with the Canvas API, then used as a live texture inside the 3D scene. Raycasting connects pointer input on the monitor to exact positions on that canvas.\n\nThe project also uses custom HTML and CSS for the loading sequence and surrounding interface, plus a glTF-focused asset pipeline for getting the station into the browser without sacrificing its visual identity.",
        choices: [
            { text: "[ BACK TO EXPERIENCE OVERVIEW ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_menu: {
        header: "HOW I BUILT IT",
        aiText: "This project grew alongside my understanding of Three.js. AI helped bridge gaps in my knowledge and provided starting points, but I never treated its output as finished. I reviewed, tested, rewrote, and optimized the code as both the project and my understanding evolved.",
        choices: [
            { text: "[ 01: THE STARTING POINT ]", nextId: "build_start" },
            { text: "[ 02: BUILDING THE STATION ]", nextId: "build_station" },
            { text: "[ 03: MAKING IT INTERACTIVE ]", nextId: "build_interactions" },
            { text: "[ 04: OPTIMIZING THE RESULT ]", nextId: "build_optimization" },
            {text: "[ BACK TO EXPERIENCE OVERVIEW ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_start: {
        header: "HOW I BUILT IT: THE STARTING POINT",
        aiText: "At the start, I did not yet know how large the project would become. The first version was mainly a floating room made out of Blender primitives that could be viewed in the browser. Building it immediately forced me to learn the fundamentals of a real-time 3D scene: cameras, lighting, materials, textures, model loading, and organizing objects in 3D space.\n\n Every new concept I learned had an immediate purpose inside something I cared about finishing.",
        choices: [
            { text: "[ NEXT: BUILDING THE STATION ]", nextId: "build_station" },
            { text: "[ BACK TO HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_station: {
        header: "HOW I BUILT IT: BUILDING THE STATION",
        aiText: "The station was assembled from a mixture of prepared assets and work done in Blender. Importing a model was only the beginning: assets had to be rescaled, repositioned, repaired, relit, adjusted, and optimized until they looked like parts of one environment instead of unrelated objects placed in the same room.\n\nI gradually replaced temporary elements, rebuilt sections of the interior, baked materials that could not be exported directly, and developed a repeatable path from Blender to glTF and finally into Three.js. The visual direction evolved at the same time as the code.",
        choices: [
            { text: "[ NEXT: MAKING IT INTERACTIVE ]", nextId: "build_interactions" },
            { text: "[ PREVIOUS: THE STARTING POINT ]", nextId: "build_start" },
            { text: "[ BACK TO HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_interactions: {
    header: "HOW I BUILT IT: MAKING IT INTERACTIVE",
    aiText: "Once the room existed, simply looking around it was not enough. I wanted the station itself to function as the portfolio, so I began turning its objects into complete interactive systems.",
    choices: [
        { text: "[ THE RUBIK'S CUBE ]", nextId: "build_cube" },
        { text: "[ THE TERMINAL ]", nextId: "build_terminal" },
        { text: "[ SIGNAL TRACE ]", nextId: "build_signal_trace" },
        { text: "[ NEXT: OPTIMIZING THE RESULT ]", nextId: "build_optimization" },
        { text: "[ PREVIOUS: BUILDING THE STATION ]", nextId: "build_station" },
        { text: "[ BACK TO HOW I BUILT IT ]", nextId: "build_menu" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},

build_cube: {
    header: "MAKING IT INTERACTIVE: THE RUBIK'S CUBE",
    aiText: "It was built from 27 separate cubies and 54 interactive stickers, then created the layer-selection, dragging, rotation, snapping, and undo systems from scratch. One of the most difficult challenges I faced in this project was making the rotation of the selected layer consistent regardless of camera angle. I won't go into the full technical breakdown here, but the solution involved temporary groups, world axes, and using the cube's local coordinates rather than world position.",
    choices: [
        { text: "[ NEXT: THE TERMINAL ]", nextId: "build_terminal" },
        { text: "[ BACK TO MAKING IT INTERACTIVE ]", nextId: "build_interactions" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},

build_terminal: {
    header: "MAKING IT INTERACTIVE: THE TERMINAL",
    aiText: "The station monitor was originally just another part of the environment. I turned it into a working terminal rendered through a 2D Canvas and displayed directly on the monitor as a live texture.\n\nTo make it interactive, I connected Three.js raycasting to the canvas interface. A selected point on the 3D monitor is converted from UV coordinates into the exact canvas pixel that was pressed. This allowed the terminal to remain physically embedded in the station while behaving like a complete 2D interface.",
    choices: [
        { text: "[ NEXT: SIGNAL TRACE ]", nextId: "build_signal_trace" },
        { text: "[ PREVIOUS: THE RUBIK'S CUBE ]", nextId: "build_cube" },
        { text: "[ BACK TO MAKING IT INTERACTIVE ]", nextId: "build_interactions" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},

build_signal_trace: {
    header: "MAKING IT INTERACTIVE: SIGNAL TRACE",
    aiText: "Once the terminal could support accurate input, I wanted it to contain something more substantial than portfolio text and navigation menus.\n\nThat idea became Signal Trace, a complete connection puzzle built inside the terminal. It grew from a single experimental grid into a multi-level game with limited pipe inventories, different node types, locked tiles, animations, solve detection, and its own menu and progression systems.\n\nSignal Trace turned the terminal from an interface for reading about the project into another interactive part of the project itself.",
    choices: [
        { text: "[ NEXT: Optimizing the result ]", nextId: "build_optimization" },
        { text: "[ PREVIOUS: THE TERMINAL ]", nextId: "build_terminal" },
        { text: "[ BACK TO MAKING IT INTERACTIVE ]", nextId: "build_interactions" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},


    build_optimization: {
        header: "HOW I BUILT IT: OPTIMIZING THE RESULT",
        aiText: "As the station became more detailed, performance started to dip, especially on lower-end devices. High draw call count, detailed models, high-res textures, shadows, canvas rendering, post-processing, and shader effects all competed for the same frame budget.\n\nI tested the project on different devices, inspected where time and memory were being spent, and optimized the expensive parts. That included cleaning and compressing assets, reusing geometry, limiting shadow cost, controlling pixel density, reducing unnecessary raycasting, and avoiding work that would not affect the final image.",
        choices: [
            { text: "[ PREVIOUS: Signal Trace ]", nextId: "build_signal_trace" },
            { text: "[ BACK TO HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },


    controls: {
        header: "CONTROLS",
        aiText: "Choose an interaction system for its controls.\n\nESC exits the current focus mode and returns to the station view.",
        choices: [
            { text: "[ STATION NAVIGATION ]", nextId: "controls_station" },
            { text: "[ TERMINAL ]", nextId: "controls_terminal" },
            { text: "[ RUBIK'S CUBE ]", nextId: "controls_cube" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    controls_station: {
        header: "CONTROLS: STATION NAVIGATION",
        aiText: "MOVE POINTER: inspect the station and reveal interactive hotspots.\nSELECT HOTSPOT: move the camera to that area and enter its interaction mode.\nESC: leave the current interaction and return to the station view.",
        choices: [
            { text: "[ BACK TO CONTROLS ]", nextId: "controls" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    controls_terminal: {
        header: "CONTROLS: TERMINAL",
        aiText: "UP / DOWN: move through the available options.\nENTER: select the highlighted option.\nLEFT ARROW: return to the main terminal directory.\nF: toggle terminal fullscreen mode.\nESC: exit terminal focus mode and return to the station view.\n\nThe terminal also supports direct pointer input.",
        choices: [
            { text: "[ BACK TO CONTROLS ]", nextId: "controls" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    controls_cube: {
        header: "CONTROLS: RUBIK'S CUBE",
        aiText: "LEFT-DRAG A CUBE FACE: rotate the selected layer.\nRIGHT-DRAG: rotate the entire cube relative to the camera.\nTOUCH-DRAG: rotate a layer or the entire cube depending on where the drag begins.\nUNDO: reverse the most recent layer move.\nESC: leave the cube and return to the station view.",
        choices: [
            { text: "[ BACK TO CONTROLS ]", nextId: "controls" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    }
}

export default TerminalTree
