import * as THREE from 'three';

export default class TerminalCanvas {
    constructor() {
        // ==========================================
        // 1. OFF-SCREEN CANVAS SETUP (THE DISPLAY)
        // ==========================================
        
        // We create an HTML canvas element, but we deliberately DO NOT attach it to the document.body.
        // It exists purely in the computer's RAM. The browser's layout engine ignores it.
        this.canvas = document.createElement('canvas');
        
        // This is the internal pixel resolution of our invisible canvas. 
        // 1024x1024 gives us enough pixels so the text looks crisp when the 3D camera zooms in on the monitor.
        this.canvas.width = 1024;
        this.canvas.height = 1024;
        
        // We grab the 2D "brush" from the canvas. We will use this 'ctx' (context) object 
        // to mathematically draw our text and green rectangles later.
        this.ctx = this.canvas.getContext('2d');

        // ==========================================
        // 2. THE THREE.JS BRIDGE (THE GRAPHICS CARD)
        // ==========================================

        // CanvasTexture is a special Three.js tool. It looks at our invisible 2D HTML canvas 
        // and translates those raw pixels into a 3D material texture.
        this.texture = new THREE.CanvasTexture(this.canvas);
        
        // By default, 3D engines blur textures to make them look smooth. 
        // LinearFilter forces the engine to disable blurring, keeping our green text perfectly sharp and retro.
        this.texture.minFilter = THREE.LinearFilter;
        this.texture.magFilter = THREE.LinearFilter;

        // ==========================================
        // 3. STATE MACHINE DATA (THE BRAIN)
        // ==========================================

        // 'mode' tracks which screen the user is currently looking at.
        this.mode = 'menu'; 
        // 'selectedIndex' tracks which menu item the cursor (>) is currently hovering over.
        this.selectedIndex = 0;

        // The master list of our root directory menus.
        this.menuItems = [
            'MY PROJECTS',
            'ABOUT ME',
            'MANUAL OVERRIDE',
            'SYSTEM DIAGNOSTICS'
        ];

        // The data that will populate the 'projects' screen.
        this.projects = [ // an array that holds each project as an object
            { name: 'Interactive 3D Rubik\'s Cube', tech: 'Three.js, Raycasting' },
            { name: 'Portfolio Mainframe', tech: 'WebGL, GLSL Shaders' }
        ];

        // 'currentInput' holds the string of text the user is actively typing.
        this.currentInput = '';
        
        // 'chatHistory' stores an array of objects. Each object is one message (either from the user or the AI).
        this.chatHistory = [ // an array that holds each message as an object
            { sender: 'SYS', text: 'UNAUTHORIZED ACCESS DETECTED.' },
            { sender: 'SYS', text: 'COGNITIVE CALIBRATION REQUIRED.' }
        ];

        // Initialize our keyboard wiretap and draw the very first frame of the screen.
        this.setupHiddenInput();
        this.draw();
    }

    // ==========================================
    // 4. KEYBOARD INTERCEPTION (THE INPUT)
    // ==========================================
    setupHiddenInput() {
        // A 2D canvas cannot natively accept typing. To fix this, we create a real HTML text input.
        this.inputElement = document.createElement('input'); // create a brand new HTML tag <input>
        // The <input> HTML element is used to create interactive controls for web-based forms in order to accept data from the user
        this.inputElement.type = 'text'; // Makes this a standard text box that accepts letters and numbers
        // This updates your invisible tag from <input> to <input type="text">.
        
        // We make the input completely invisible and shove it off the screen.
        // We can't use 'display: none' or the browser won't let us type in it.
        this.inputElement.style.position = 'absolute'; // Normally, browsers stack HTML elements like building blocks (this is called the "Document Flow"). If you add a new <input>, it pushes everything else down to make room for itself. position: absolute rips the element completely out of that physical flow. It becomes a ghost that floats freely over (or under) your other elements without affecting their layout.
        this.inputElement.style.opacity = '0';
        this.inputElement.style.left = '-9999px'; // this hides the invisible text box by moving it away from the screen
        
        // We attach this hidden input to the actual webpage so it can receive browser events.
        // document.body.appendChild(this.inputElement); // leave this for now, to-do for when we make this work for mobile

        // We set up a global wiretap. Any time a key is pressed anywhere on the website, 
        // it triggers our custom 'handleKeyDown' function.
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    // --- CANVAS TEXT WRAPPER UTILITY ---
    // The native 2D canvas is stupid; it will draw text in one infinite line off the screen.
    // This function measures the width of words and forces them down a line if they hit the edge.
    wrapText(fullMessage, startX, startY, maxPixelWidth, lineDropDistance) {
        const wordsArray = fullMessage.split(' '); 
        let finalizedLine = '';
        let currentBrushY = startY;

        for (let i = 0; i < wordsArray.length; i++) {
            
            // Build a temporary string with the next word included
            const testLine = finalizedLine + wordsArray[i] + ' ';
            
            // Measure the exact pixel width of this temporary string
            const metrics = this.ctx.measureText(testLine); 
            const pixelWidth = metrics.width;

            // If adding this word makes the line too wide (and it's not the very first word)
            if (pixelWidth > maxPixelWidth && i > 0) {
                
                // 1. Physically paint the finalized line to the canvas
                this.ctx.fillText(finalizedLine, startX, currentBrushY); 
                
                // 2. Start a brand new line using the word that caused the overflow
                finalizedLine = wordsArray[i] + ' '; 
                
                // 3. Move the brush down for the next loop
                currentBrushY += lineDropDistance; 

            } else {
                // The word fits perfectly! Make it the new finalized line and keep going.
                finalizedLine = testLine; 
            }
        }
        
        // The loop finished, but we still have the very last line sitting in memory. Paint it.
        this.ctx.fillText(finalizedLine, startX, currentBrushY);
        
        // Return the final Y position so the next AI message doesn't draw on top of this one
        return currentBrushY + lineDropDistance; 
    }

    // This is where all the logic for our "Operating System" lives.
    handleKeyDown(event) {
        // GLOBAL ESCAPE HATCH: If they press Esc and aren't on the menu, take them back to the menu.
        if (event.key === 'ArrowLeft' && this.mode !== 'menu') {
            this.mode = 'menu';
            this.draw();
            return;
        }

        // MENU LOGIC: Move the cursor up and down
        if (this.mode === 'menu') {
            if (event.key === 'ArrowDown') {
                // Modulo (%) forces the index to loop back to 0 if it goes past the bottom of the array
                this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
                this.draw(); // Redraw the screen to show the cursor moved
            } else if (event.key === 'ArrowUp') {
                // Adding the array length before modulo prevents JS from breaking on negative numbers
                this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
                this.draw();
            } else if (event.key === 'Enter') {
                this.executeSelection(); // Trigger the menu item they selected
            }
        } 
        
        // MANUAL OVERRIDE LOGIC: Hijack the keys to type a message
        else if (this.mode === 'override') {
            if (event.key === 'Backspace') {
                // Remove the last character of the string
                this.currentInput = this.currentInput.slice(0, -1);
                this.draw();
            } else if (event.key === 'Enter') {
                // Only send the message if it isn't empty space
                if (this.currentInput.trim() !== '') {
                    
                    // 1. Push the user's message into the chat history array
                    this.chatHistory.push({ sender: 'GUEST', text: this.currentInput });
                    
                    // 2. Save what they typed in lowercase so the AI can easily read it
                    const cachedInput = this.currentInput.toLowerCase();
                    
                    // 3. Clear the input bar
                    this.currentInput = '';
                    this.draw();

                    // 4. Set a 600ms delay to make it feel like the AI is "thinking" before it responds
                    setTimeout(() => this.triggerAIResponse(cachedInput), 600);
                }
            } else if (event.key.length === 1) { 
                // If it's a single printable character (A, B, 1, etc.), add it to the string in uppercase
                this.currentInput += event.key.toUpperCase();
                this.draw();
            }
        }
    }

    // A simple router. Changes the screen based on which index the cursor was on when they pressed Enter.
    executeSelection() {
        switch(this.selectedIndex) {
            case 0: this.mode = 'projects'; break;
            case 1: this.mode = 'about'; break;
            case 2: this.mode = 'override'; break;
            case 3: this.mode = 'diagnostics'; break;
        }
        this.draw(); // Instantly wipe and redraw the screen to show the new mode
    }

    // The logic block for the fake AI.
    triggerAIResponse(input) {
        // This is a placeholder for wherever you decide to build your AI logic later.
        let response = "COMMAND UNRECOGNIZED. STOP TYPING AND FIX YOUR CSS.";

        // Redraw the screen to show the AI's new message
        this.draw();
    }

    // ==========================================
    // 5. THE RENDER ENGINE
    // ==========================================
    // Every time a single letter changes, this entire function runs to rebuild the 1024x1024 image.
    draw() {
        // 1. WIPE THE CANVAS
        // We must paint a giant black box over the entire canvas first, or the new text will just 
        // draw directly on top of the old text, creating a blurry, unreadable mess.
        this.ctx.fillStyle = '#050505'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. SET FONT STYLING
        this.ctx.font = '30px monospace';
        this.ctx.textAlign = 'left';

        // 3. RENDER BASED ON CURRENT MODE
        // We use a switch statement to ask the State Machine what we should be drawing right now.
        switch(this.mode) {
            case 'menu':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('C:\\GUEST> SYSTEM BOOT SEQUENCE...', 50, 100);
                this.ctx.fillText('SELECT DIRECTORY:', 50, 180);

                // Loop through our array of menus and draw them one by one
                this.menuItems.forEach((currString, index) => {
                    const yPos = 300 + (index * 80); // Move down 80 pixels for each item

                    if (index === this.selectedIndex) {
                        // HIGHLIGHT STATE: If this is the active item, draw a green box behind it
                        this.ctx.fillStyle = '#00FF41';
                        this.ctx.fillRect(40, yPos - 50, 450, 70);
                        this.ctx.fillStyle = 'black'; // Change text to black so it's readable on the green box
                        this.ctx.fillText(`> ${currString}`, 50, yPos);
                    } else {
                        // NORMAL STATE: Just draw green text
                        this.ctx.fillStyle = '#00FF41';
                        this.ctx.fillText(`  ${currString}`, 50, yPos);
                    }
                });
                break;

            case 'projects':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('ACTIVE DEPLOYMENTS:', 50, 100);
                this.ctx.fillText('-------------------', 50, 130);
                
                this.projects.forEach((proj, index) => {
                    this.ctx.fillText(`[ ${proj.name} ]`, 50, 220 + (index * 120));
                    this.ctx.fillStyle = '#008F11'; // Use a darker green for the tech stack text
                    this.ctx.fillText(`SYS.REQ: ${proj.tech}`, 80, 260 + (index * 120));
                    this.ctx.fillStyle = '#00FF41'; // Reset brush to bright green for the next loop
                });

                this.ctx.fillText('[PRESS ESC TO RETURN]', 50, 950);
                break;

            case 'override':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('MANUAL OVERRIDE TERMINAL', 50, 80);
                this.ctx.fillText('------------------------', 50, 110);

                let chatY = 180; // The starting Y position for the first message
                
                // Draw Chat History
                this.chatHistory.forEach(msg => {
                    // Turn the brush Blue if the user sent it, Green if the system sent it
                    this.ctx.fillStyle = msg.sender === 'SYS' ? '#00FF41' : '#00AAFF'; 
                    const prefix = `${msg.sender}> `;
                    
                    // Use our custom wrapText function so long roasts don't run off the screen.
                    // wrapText returns the new Y coordinate, which we save back into chatY.
                    chatY = this.wrapText(prefix + msg.text, 50, chatY, 900, 40) + 20; 
                });

                // Draw the live typing input bar at the very bottom
                this.ctx.fillStyle = '#00AAFF';
                
                // MATH TRICK: Divide the current time by 500ms. If it's even, draw an underscore. 
                // If it's odd, draw a blank space. This creates a perfect blinking cursor without animation loops.
                const cursor = Math.floor(Date.now() / 500) % 2 === 0 ? '_' : ' ';
                
                this.wrapText(`GUEST> ${this.currentInput}${cursor}`, 50, chatY + 20, 900, 40);

                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('[PRESS ESC TO RETURN]', 50, 950);
                break;

            case 'about':
                this.ctx.fillStyle = '#00FF41';
                this.ctx.fillText('USER PROFILE: SHAHAR AVIDAN', 50, 100);
                this.ctx.fillText('---------------------------', 50, 130);
                this.ctx.fillText('> WebGL Developer', 50, 200);
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
        }

        // ==========================================
        // 6. THE GPU TRIGGER (CRITICAL)
        // ==========================================
        // The 3D graphics card (GPU) has no idea that we just changed pixels on the 2D canvas in RAM.
        // If we do not set this flag to true, the monitor in your 3D room will never update.
        // This line tells Three.js: "Hey, the canvas changed. Upload the new frame to the GPU immediately."
        this.texture.needsUpdate = true;
    }
}