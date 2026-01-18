import Input from './Input.js';
import Physics from './Physics.js';
import AudioController from './Audio.js';
import Particle from './Particle.js';

import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Level from '../world/Level.js';
import { storyChapters } from '../data/story.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new Input();
        this.audio = new AudioController();
        this.level = new Level(this);
        this.player = new Player(this);
        this.projectiles = [];
        this.enemies = [
            new Enemy(this, 400, 300),
            new Enemy(this, 700, 200)
        ];
        this.particles = [];
        this.score = 0;
        this.lastTime = 0;
        this.running = false;

        this.gameOver = false;
        this.storyMode = true;
        this.currentChapter = 0;
        this.showingStory = false;

        // Progression
        this.kills = 0;
        this.killsTarget = 14; // Defeat 14 demons (Khara's first wave)
        this.bossSpawned = false;
        this.spawnTimer = 0;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));

        this.audio.startMusic();
        console.log('Game Started');
    }

    stop() {
        this.running = false;
    }

    loop(timestamp) {
        if (!this.running) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        // Test input
        if (this.input.isDown('Space')) {
            const startScreen = document.getElementById('start-screen');
            if (startScreen && !startScreen.classList.contains('hidden')) {
                startScreen.classList.add('hidden');
                this.showStory(0); // Show first chapter
            }
        }

        // Pause if Start Screen is visible
        const startScreen = document.getElementById('start-screen');
        if (startScreen && !startScreen.classList.contains('hidden')) {
            return;
        }

        if (this.showingStory) {
            if (this.input.isDown('Enter')) {
                this.hideStory();
            }
            return;
        }

        if (this.gameOver) {
            if (this.input.isDown('KeyR')) {
                window.location.reload();
            }
            return;
        }

        this.player.update(dt);

        // Spawner Logic
        if (!this.bossSpawned) {
            this.spawnTimer -= dt;
            // Spawner Logic
            if (this.currentChapter < 2 && !this.bossSpawned) { // Minions only in Chapter 1
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0 && this.enemies.length < 5) {
                    const x = Math.random() * (this.width - 100) + 50;
                    const y = 400;
                    console.log('Spawning enemy at', x, y);
                    this.enemies.push(new Enemy(this, x, y));
                    this.spawnTimer = 2.0;
                }
            } else if (this.currentChapter === 2 && this.enemies.length === 0) { // Chapter 2: Golden Deer
                // Spawn Golden Deer ONCE
                this.enemies.push(new Enemy(this, 600, 400, 'deer'));
            }
        }

        // Update Projectiles
        this.projectiles.forEach(p => p.update(dt));

        // Update Particles
        this.particles.forEach(p => p.update(dt));

        // Update Enemies & Collisions
        this.enemies.forEach(e => {
            e.update(dt);
            // Projectile vs Enemy
            this.projectiles.forEach(p => {
                if (!p.markedForDeletion && Physics.checkCollision(p, e)) {
                    p.markedForDeletion = true;

                    if (e.type === 'boss') {
                        e.health -= 10; // Projectile damage to boss
                        if (e.health <= 0) {
                            e.markedForDeletion = true;
                            this.score += 5000;
                            // BOSS DEFEATED logic could go here
                        }
                    } else {
                        e.markedForDeletion = true;
                        this.score += 100;
                        this.kills++;
                    }

                    document.getElementById('score-val').innerText = this.score;
                    this.audio.playExplosion();

                    // Spawn particles
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(this, e.x + e.width / 2, e.y + e.height / 2, '#ffaa00'));
                    }

                    // Check Win Condition (Defeat Minions to reach boss, defeat boss to win level)
                    if (this.kills >= this.killsTarget && this.currentChapter < 1 && !this.bossSpawned) {
                        this.bossSpawned = true;
                        this.enemies = []; // Clear minions
                        this.enemies.push(new Enemy(this, 600, 300, 'boss')); // Spawn Khara
                    } else if (e.type === 'boss' && e.markedForDeletion) {
                        this.currentChapter = 2; // Golden Deer Chapter
                        this.showStory(this.currentChapter);
                        this.bossSpawned = false; // Reset for next phase logic if needed, but mainly to stop minion spawn
                    } else if (e.type === 'deer' && e.markedForDeletion) {
                        this.currentChapter = 3; // Kidnapping
                        this.showStory(this.currentChapter);
                    }
                }
            });


            // Enemy vs Player
            if (!e.markedForDeletion &&
                this.player.invulnerableTimer <= 0 &&
                Physics.checkCollision(this.player, e)) {

                // NPC Interaction
                if (e.type === 'jatayu') {
                    if (this.currentChapter === 4) {
                        this.currentChapter = 5;
                        this.showStory(5); // El Noble Jatayu
                    }
                    return; // Don't damage player
                }

                this.audio.playHit();
                const damage = e.type === 'boss' ? 50 : 20;
                this.player.health -= damage;
                this.player.invulnerableTimer = 2; // 2 seconds invulnerability
                document.getElementById('health-val').innerText = this.player.health;

                // Knockback
                const dir = this.player.x < e.x ? -1 : 1;
                this.player.vx = dir * 500;
                this.player.vy = -300;

                if (this.player.health <= 0) {
                    this.gameOver = true;
                    document.getElementById('game-over-screen').classList.remove('hidden');
                }
            }

            // Cleanup enemies that fall off world
            if (e.y > this.height + 100) {
                e.markedForDeletion = true;
            }
        });

        // Cleanup
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.particles = this.particles.filter(p => !p.markedForDeletion);
    }

    draw() {
        // Draw Level (Background handling incorporated)
        this.level.draw(this.ctx);

        // Draw Player
        this.player.draw(this.ctx);

        // Draw Enemies
        this.enemies.forEach(e => e.draw(this.ctx));

        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));

        // Draw Particles
        this.particles.forEach(p => p.draw(this.ctx));

        // Draw Debug Text
        this.ctx.fillStyle = '#0ff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)} | Enemies: ${this.enemies.length} | Kills: ${this.kills}`, 10, 20);
    }
    showStory(index) {
        if (index >= storyChapters.length) return;

        const chapter = storyChapters[index];
        const screen = document.getElementById('story-screen');
        const title = document.getElementById('story-title');
        const text = document.getElementById('story-text');

        title.innerText = chapter.title;
        text.innerText = chapter.text;

        screen.classList.remove('hidden');
        this.showingStory = true;
    }

    hideStory() {
        const screen = document.getElementById('story-screen');
        screen.classList.add('hidden');
        this.showingStory = false;

        // Chained Story Logic
        if (this.currentChapter === 3) {
            // After Kidnapping, show Search intro
            this.currentChapter = 4;
            this.showStory(4); // La Búsqueda
        } else if (this.currentChapter === 4) {
            // Start Search Gameplay -> Spawn Jatayu
            this.enemies = [];
            this.enemies.push(new Enemy(this, 1200, 450, 'jatayu'));
        }
    }
}
