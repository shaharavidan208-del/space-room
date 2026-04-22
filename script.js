import Experience from './Experience/Experience.js';

// תופס את הקנבס מה-DOM
const canvas = document.querySelector('canvas.webgl');

// מתניע את מנוע התלת-ממד
const experience = new Experience(canvas);