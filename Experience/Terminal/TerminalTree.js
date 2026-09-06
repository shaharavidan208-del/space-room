const TerminalTree = {
    start: {
        header: "PORTFOLIO TERMINAL",
        aiText: "Welcome. This terminal contains information about me, the experience you are currently exploring, and the systems running behind it.\n\nKEYBOARD: UP / DOWN, ENTER, LEFT ARROW. TOUCH: TAP AN OPTION; USE BACK TO RETURN.",
        choices: [
            { text: "[ ABOUT ME ]", nextId: "about_me" },
            { text: "[ THE PROJECT ]", nextId: "experience_menu" },
            { text: "[ CONTROLS ]", nextId: "controls" },
            { text: "[ CONTACT ]", nextId: "contact" },
            { text: "[ SIGNAL TRACE ]", action: "startSignalTrace" }
        ]
    },

    contact: {
        header: "CONTACT",
        aiText: "Want to get in touch or inspect more of my work?",
        choices: [
            {
                text: "[ COPY EMAIL ]",
                action: "copyText",
                value: "shaharavidan208@gmail.com"
            },
            {
                text: "[ OPEN GITHUB ]",
                action: "openUrl",
                url: "https://github.com/shaharavidan208-del"
            },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    about_me: {
        header: "ABOUT ME",
        aiText: "Hey, I'm Shahar. I build interactive web experiences, with a particular interest in Three.js, real-time 3D. I'm beginning a Computer Science degree in October 2026.\n\nThe process of making this project pulled me into programming, interaction design, optimization, and the mathematics behind movement in 3D space.",
        choices: [
            { text: "[ THE PROJECT ]", nextId: "experience_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_menu: {
        header: "THE PROJECT",
        aiText: "I wanted the portfolio itself to be the project: a place you can explore, operate, and inspect.\n\nThe sections below explain why I built it, what can be interacted with, and the systems holding it together.",
        choices: [
            { text: "[ WHY I BUILT IT ]", nextId: "experience_origin" },
            { text: "[ HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ TECHNOLOGY ]", nextId: "experience_technology" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_origin: {
        header: "WHY I BUILT IT",
        aiText: "I wanted to show off my work through something more memorable than a simple webpage. Building it as a 3D scene gave me a way to tell my story while sharpening my skills in graphics programming, object-oriented design, and JavaScript.\n\nThe original idea was much smaller. Every feature exposed a new problem worth solving, so the station gradually became a complete interactive portfolio and the project that taught me real-time 3D development.",
        choices: [
            { text: "[ HOW I BUILT IT ]", nextId: "build_menu" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    experience_technology: {
        header: "TECHNOLOGY",
        aiText: "The experience is written in JavaScript and rendered with Three.js. Blender is used to prepare and adjust 3D assets, while GLSL shaders handle visual effects that need more control than standard materials provide.\n\nThe terminal and Signal Trace are rendered with the Canvas API, then used as a live texture inside the 3D scene. Raycasting connects pointer input on the monitor to exact positions on that canvas.\n\nThe project also uses custom HTML and CSS for the loading sequence and surrounding interface, plus a glTF-focused asset pipeline for getting the station into the browser without sacrificing its visual identity.",
        choices: [
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_menu: {
        header: "HOW I BUILT IT",
        aiText: "This project grew alongside my understanding of Three.js. AI helped bridge gaps in my knowledge and provided starting points, but I never treated its output as finished. I reviewed, tested, rewrote, and optimized the code as both the project and my understanding evolved.",
        choices: [
            { text: "[ 01: THE STARTING POINT ]", nextId: "build_start" },
            { text: "[ 02: MAKING IT INTERACTIVE ]", nextId: "build_cube" },
            { text: "[ 03: BUILDING THE STATION ]", nextId: "build_station" },
            { text: "[ 04: OPTIMIZING THE RESULT ]", nextId: "build_optimization" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_start: {
        header: "HOW I BUILT IT: THE STARTING POINT",
        aiText: "After initializing the scene in Three.js, I used Blender to build a basic placeholder environment.\n\nThis phase taught me a lot about modeling, texturing, lighting, materials, and exporting files from Blender to Three.js.",
        choices: [
            { text: "[ NEXT: MAKING IT INTERACTIVE ]", nextId: "build_cube" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    build_station: {
        header: "HOW I BUILT IT: BUILDING THE STATION",
        aiText: "Once I had interactions in the scene, I wanted the room to look more like it belonged in space and less like a floating interior. To make it feel like a remnant of a larger facility, I purchased sci-fi modular parts made by professional 3D artists. Their futuristic design complemented the supernova in the background and established the exact atmosphere I was aiming for. Importing the models was only the beginning: assets had to be relit, adjusted, and optimized until they looked like parts of one environment instead of unrelated objects placed in the same room.\n\nI gradually replaced temporary elements, rebuilt sections of the interior, baked materials that could not be exported directly, and developed a repeatable path from Blender to glTF and finally into Three.js. The visual direction evolved at the same time as the code.",
        choices: [
            { text: "[ NEXT: OPTIMIZING THE RESULT ]", nextId: "build_optimization" },
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

build_cube: {
    header: "MAKING IT INTERACTIVE: THE RUBIK'S CUBE",
    aiText: "Once I had a functional prototype of the room, the first thing I wanted to do was make it interactive. As someone who likes puzzles, the Rubik's Cube was the perfect choice. I built it from 27 separate cubies and 54 interactive stickers, then created the layer-selection, dragging, rotation, snapping, and undo systems from scratch. One of the most difficult challenges I faced in this project was making the rotation of selected layers consistent regardless of camera angle. I won't go into the full technical breakdown here, but the solution involved temporary groups, world axes, and using the cube's local coordinates rather than world position.",
    choices: [
        { text: "[ NEXT: THE TERMINAL ]", nextId: "build_terminal" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},

build_terminal: {
    header: "MAKING IT INTERACTIVE: THE TERMINAL",
    aiText: "The station monitor was originally just another part of the environment. I turned it into a working terminal rendered through a 2D Canvas and displayed directly on the monitor as a live texture.\n\nTo make it interactive, I connected Three.js raycasting to the canvas interface. A point selected on the 3D monitor is converted from UV coordinates into its exact position on the canvas.\n\nTo make the interaction feel natural for touch users, I designed a separate full-screen mode for mobile.\n\nIf you're wondering why it looks so different on mobile, it's because you're viewing the canvas directly, with the 3D renderer and its effects completely turned off.",
    choices: [
        { text: "[ NEXT: SIGNAL TRACE ]", nextId: "build_signal_trace" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},

build_signal_trace: {
    header: "MAKING IT INTERACTIVE: SIGNAL TRACE",
    aiText: "Once the terminal could support accurate input, I wanted it to contain something more substantial than portfolio text and navigation menus.\n\nThat idea became Signal Trace, a complete connection puzzle game built inside the terminal. It grew from a single experimental grid into a multi-level game with limited pipe inventories, different node types, locked tiles, solve detection, and its own menu and progression systems.",
    choices: [
        { text: "[ NEXT: BUILDING THE STATION ]", nextId: "build_station" },
        { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
    ]
},


    build_optimization: {
        header: "HOW I BUILT IT: OPTIMIZING THE RESULT",
        aiText: "As the station became more detailed, performance started to dip, especially on lower-end devices. High draw call count, detailed models, high-res textures, shadows, canvas rendering, post-processing, and shader effects all competed for the same frame budget.\n\nI tested the project on different devices, inspected where time and memory were being spent, and optimized the expensive parts. That included cleaning and compressing assets, reusing geometry, limiting shadow cost, controlling pixel density, reducing unnecessary raycasting, and avoiding work that would not affect the final image.",
        choices: [
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
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    controls_terminal: {
        header: "CONTROLS: TERMINAL",
        aiText: "KEYBOARD\nUP / DOWN: move through the available options.\nENTER: select the highlighted option.\nLEFT ARROW: return to the previous dialogue screen.\nESC: exit terminal focus mode and return to the station view.\n\nTOUCH\nTap any terminal option directly. Use BACK to return to the previous dialogue screen or leave Signal Trace. Use EXIT to return to the station.",
        choices: [
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    },

    controls_cube: {
        header: "CONTROLS: RUBIK'S CUBE",
        aiText: "LEFT-DRAG A CUBE FACE: rotate the selected layer.\nRIGHT-DRAG: rotate the entire cube relative to the camera.\nTOUCH-DRAG: rotate a layer or the entire cube depending on where the drag begins.\nUNDO: reverse the most recent layer move.\nESC: leave the cube and return to the station view.",
        choices: [
            { text: "[ RETURN TO MAIN DIRECTORY ]", nextId: "start" }
        ]
    }
}

export default TerminalTree
