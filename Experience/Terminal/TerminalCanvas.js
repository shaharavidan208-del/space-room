import * as THREE from 'three';

export default class TerminalCanvas {
    constructor() {
        // ==========================================
        // 1. OFF-SCREEN CANVAS SETUP
        // ==========================================

        // Creates the HTML element strictly in memory. Because we never use document.body.appendChild(), 
        // the browser's CSS/layout engine ignores it, keeping it invisible to the webpage.
        this.canvas = document.createElement('canvas');

        // Locks the internal pixel resolution of the canvas. This has nothing to do with the user's screen; 
        // it determines how crisp the text looks when the 3D camera zooms in on the monitor mesh.
        this.canvas.width = 1024;
        this.canvas.height = 1024;

        // Wakes up the browser's 2D rendering engine and grabs the "brush" object. 
        // We will use this 'ctx' object to execute all our pixel-drawing math.
        this.ctx = this.canvas.getContext('2d');
        // ==========================================
        // TEMPORARY VISUAL DEBUGGER
        // ==========================================
        // this.canvas.style.position = 'absolute';
        // this.canvas.style.top = '20px';
        // this.canvas.style.left = '20px';
        // this.canvas.style.border = '2px solid #FF0041'; // Red border so you know it's the debug window
        // this.canvas.style.zIndex = '9999';
        // this.canvas.style.background = '#00FF00'

        // // Scale it down by 50% so a 1024x1024 canvas doesn't cover your entire monitor
        // this.canvas.style.transform = 'scale(0.5)';
        // this.canvas.style.transformOrigin = 'top left';

        // // Actually attach it to the screen
        // document.body.appendChild(this.canvas);

        // ==========================================
        // 2. THE THREE.JS BRIDGE
        // ==========================================

        // Takes our in-memory 2D canvas and converts it into a standard WebGL texture object.
        this.texture = new THREE.CanvasTexture(this.canvas);

        // By default, Three.js tries to blend pixels when a texture is viewed at an angle or up close. 
        // LinearFilter disables that blurring, forcing the pixels to stay sharp and jagged for that retro terminal aesthetic.
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;


        // ==========================================
        // 3. STATE MACHINE DATA
        // ==========================================

        this.mode = 'menu'; // Tracks current phase ('menu', 'manual', 'npc')
        this.selectedIndex = 0; // Tracks which menu array index is currently highlighted

        this.menuItems = [
            'MY PROJECTS',
            'ABOUT ME',
            'MANUAL OVERRIDE',
            'SYSTEM DIAGNOSTICS'
        ];

        // ==========================================
        // 4. INIT
        // ==========================================
        this.setupHiddenInput();
        this.draw(); // Paints the initial frame so the screen isn't completely black on load
    }

    setupHiddenInput() {
        // Creates a standard text input field. We need this because the canvas can't natively capture typing.
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';

        // CSS manipulation via JS to completely hide the input field while keeping it active in the DOM.
        this.inputElement.style.position = 'absolute';
        this.inputElement.style.opacity = '0';

        // Shoves the element 10,000 pixels to the left. If we just used 'display: none', 
        // the browser would refuse to focus on it, breaking our ability to read keystrokes.
        this.inputElement.style.left = '-9999px';

        // Physically attaches the hidden input to the webpage so it can actually receive browser events.
        document.body.appendChild(this.inputElement); // The appendChild() method of the Node interface adds a node to the end of the list of children of a specified parent node.

        // Listens for global key presses and passes the event object to our logic handler.
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(event) {
        if (this.mode === 'menu') {
            if (event.key === 'ArrowDown') {
                // Standard modulo arithmetic to loop the cursor back to 0 if it goes past the bottom.
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                this.draw();
            } else if (event.key === 'ArrowUp') {
                // Adding the array length before the modulo prevents JavaScript's negative remainder bug,
                // ensuring the cursor correctly loops from the top (0) to the bottom index.
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                this.draw();
            } else if (event.key === 'Enter') {
                this.executeSelection();
            }
        }
    }
    executeSelection() {
        switch(this.selectedIndex) {
            case 0: // MY PROJECTS
                this.mode = 'projects';
                break;
            case 1: // ABOUT ME
                this.mode = 'about';
                break;
            case 2: // MANUAL OVERRIDE
                this.mode = 'override';
                break;
            case 3: // SYSTEM DIAGNOSTICS
                this.mode = 'diagnostics';
                break;
        }
        
        // Force the canvas to update immediately with the new mode
        this.draw(); 
    }



    draw() {
        // 1. WIPE THE CANVAS
        this.ctx.fillStyle = '#050505'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. SET FONT STYLING
        this.ctx.font = '30px monospace';
        this.ctx.textAlign = 'left';

        // 3. RENDER BASED ON CURRENT MODE
        switch(this.mode) {
            case 'menu':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('C:\\GUEST> SYSTEM BOOT SEQUENCE...', 50, 100);
                this.ctx.fillText('SELECT DIRECTORY:', 50, 180);

                // RENDER THE MENU LOOP
                this.menuItems.forEach((currString, index) => {
                    const yPos = 300 + (index * 80);

                    if (index === this.selectedIndex) {
                        // HIGHLIGHT STATE
                        this.ctx.fillStyle = '#00FF41';
                        this.ctx.fillRect(40, yPos - 50, 450, 70);
                        this.ctx.fillStyle = 'black';
                        this.ctx.fillText(`> ${currString}`, 50, yPos);
                    } else {
                        // NORMAL STATE
                        this.ctx.fillStyle = '#00FF41';
                        this.ctx.fillText(`  ${currString}`, 50, yPos);
                    }
                });
                break;

            case 'about':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('USER PROFILE: SHAHAR AVIDAN', 50, 100);
                this.ctx.fillText('---------------------------', 50, 130);
                this.ctx.fillText('> WebGL Developer', 50, 200);
                
                // Keep the back instruction near the bottom of the 1024x1024 canvas
                this.ctx.fillText('[PRESS ESC TO RETURN]', 50, 950); 
                break;

            case 'diagnostics':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('SYSTEM DIAGNOSTICS...', 50, 100);
                this.ctx.fillText('---------------------', 50, 130);
                this.ctx.fillText('CPU: AMD Ryzen 7 5700X3D ......... OK', 50, 200);
                this.ctx.fillText('GPU: Radeon RX 9070 XT ........... OK', 50, 260);
                
                this.ctx.fillText('[PRESS ESC TO RETURN]', 50, 950);
                break;
                
            // You can add cases for 'projects' and 'override' here
        }

        // 4. THE GPU TRIGGER (CRITICAL)
        this.texture.needsUpdate = true;
    }
}