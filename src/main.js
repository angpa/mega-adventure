import './style.css'
import Game from './engine/Game.js'

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  // Set internal resolution


  const resizeContent = () => {
    // Keep 4:3 aspect ratio logic or just fill screen?
    // User requested "responsive canvas resizing", matching screen size is standard for mobile.
    // However, existing game might rely on 800x600 logical size.
    // We will scale visually but keep logical resolution if possible, or update logic.
    // For simplicity and robustness, we set canvas internal resolution to fixed 800x600 (or whatever)
    // and let CSS handle the display size, but we need to ensure clicks/input valid if mouse used.
    // Since we use keyboard/touch overlay, mouse coordinates on canvas might not be critical 
    // unless there is mouse aiming.
    // Checking Game.js... "Physics.js"... likely keyboard movement.
    // Let's stick to CSS scaling which we already added (width: 100%, height: 100% object-fit: contain).
    // So we just need to ensure the render resolution is set once or updated if we want crisp pixels.

    // For "crisp" pixel art look, we might want to keep logical low res.
    // The previous code fixed it at 800x600.
    canvas.width = 800;
    canvas.height = 600;
  };

  resizeContent();
  window.addEventListener('resize', resizeContent);

  const game = new Game(canvas);
  game.start();
});
