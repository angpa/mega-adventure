import './style.css'
import Game from './engine/Game.js'

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  // Set internal resolution
  canvas.width = 800;
  canvas.height = 600;

  const game = new Game(canvas);
  game.start();
});
