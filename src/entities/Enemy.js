import Physics from '../engine/Physics.js';

export default class Enemy {
    constructor(game, x, y, type = 'minion') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;

        if (this.type === 'boss') {
            this.width = 64;
            this.height = 64;
            this.health = 500; // Strong!
            this.vx = 80;
        } else if (this.type === 'deer') {
            this.width = 40;
            this.height = 40;
            this.health = 500; // Hard to catch!
            this.vx = 250; // Very fast
        } else if (this.type === 'jatayu') {
            this.width = 80;
            this.height = 50;
            this.health = 1000; // NPC, basically invulnerable
            this.vx = 0; // Static
        } else {
            this.width = 32;
            this.height = 32;
            this.health = 30; // 1-2 hits
            this.vx = 100;
        }

        this.vy = 0;
        this.gravity = 1500;

        // Patrol logic
        this.startX = x;
        this.patrolRange = this.type === 'boss' ? 300 : 150;
        this.direction = 1;
        this.markedForDeletion = false;

        // Boss specific
        this.shootTimer = 0;
    }

    update(dt) {
        // Basic AI: Patrol back and forth
        this.x += this.vx * this.direction * dt;

        // Turn around logic (Standard patrol)
        if (this.type !== 'deer') {
            if (this.x > this.startX + this.patrolRange) {
                this.direction = -1;
            } else if (this.x < this.startX) {
                this.direction = 1;
            }
        } else {
            // Deer Logic: Run AWAY from player
            if (this.game.player.x < this.x) {
                this.direction = 1; // Run right
            } else {
                this.direction = -1; // Run left
            }

            // Keep in bounds
            if (this.x < 0) this.x = 0;
            if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
        }

        // Apply Gravity
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Platform Collision (Reuse basic logic or Physics helper)
        // Simplify for enemy: just floor collision for now
        let grounded = false;
        for (const platform of this.game.level.platforms) {
            if (this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + this.vy * dt + 10 &&
                this.vy >= 0) {

                this.y = platform.y - this.height;
                this.vy = 0;
                grounded = true;
            }
        }
        // Boss Attack (AI Logic)
        if (this.type === 'boss') {
            // Jump Logic
            if (this.vy === 0 && Math.random() < 0.02) { // Random chance to jump
                this.vy = -800; // BIG JUMP
                this.grounded = false;
            }

            // Quake Attack on Landing
            if (this.vy === 0 && !this.grounded) {
                // Just landed
                this.grounded = true;
                this.game.shakeScreen(0.5, 20); // 0.5s shake, 20px magnitude
                this.game.audio.playExplosion(); // SOUND EFFECT

                // Damage Player ONLY if they are on ground floor (not platforms)
                if (this.game.player.grounded && this.game.player.y > 450) {
                    this.game.player.health -= 20;
                    this.game.player.invulnerableTimer = 1;
                    document.getElementById('health-val').innerText = this.game.player.health;

                    // Knockup player
                    this.game.player.vy = -400;
                    this.game.player.grounded = false;

                    if (this.game.player.health <= 0) {
                        this.game.gameOver = true;
                        document.getElementById('game-over-screen').classList.remove('hidden');
                    }
                }
            } else if (this.vy !== 0) {
                this.grounded = false;
            }

            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                if (Math.abs(this.game.player.x - this.x) < 300) {
                    this.vx = 200; // Charge!
                } else {
                    this.vx = 80; // Normal patrol
                }
                this.shootTimer = 2.0;
            }
        }
    }

    draw(ctx) {
        if (this.type === 'boss') {
            ctx.fillStyle = '#440044'; // Dark Purple for Khara
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Boss Eyes
            ctx.fillStyle = '#ffff00'; // Yellow glowing eyes
            const eyeX = this.direction === 1 ? this.x + 40 : this.x + 10;
            ctx.fillRect(eyeX, this.y + 15, 12, 12);

            // Health Bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 10, this.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 500), 5);

        } else if (this.type === 'deer') {
            ctx.fillStyle = '#ffd700'; // GOLD
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Antlers / Ears
            ctx.fillStyle = '#c5a000';
            ctx.fillRect(this.x + 5, this.y - 10, 10, 10);
            ctx.fillRect(this.x + 25, this.y - 10, 10, 10);

            // Health Bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 15, this.width, 3);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(this.x, this.y - 15, this.width * (this.health / 500), 3);

        } else if (this.type === 'jatayu') {
            // Jatayu Body (Brown/Red)
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Wings broken
            ctx.fillStyle = '#5a2e0d';
            ctx.fillRect(this.x - 10, this.y + 10, 20, 30);

            // Head
            ctx.fillStyle = '#a0522d';
            ctx.fillRect(this.x + this.width, this.y - 10, 30, 30);

            // Beak
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width + 30, this.y);
            ctx.lineTo(this.x + this.width + 50, this.y + 10);
            ctx.lineTo(this.x + this.width + 30, this.y + 15);
            ctx.fill();

        } else {
            ctx.fillStyle = '#008800'; // Rakshasa Green
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Eyes to show direction
            ctx.fillStyle = '#ff0000'; // Red Eyes
            const eyeX = this.direction === 1 ? this.x + 20 : this.x + 4;
            ctx.fillRect(eyeX, this.y + 8, 8, 8);
        }
    }
}
