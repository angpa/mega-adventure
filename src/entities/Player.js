import Physics from '../engine/Physics.js';
import Projectile from './Projectile.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 32;
        this.height = 32;
        this.x = 100;
        this.y = 400;
        this.vx = 0;
        this.vy = 0;

        this.speed = 300;
        this.jumpForce = -600;
        this.gravity = 1500;
        this.grounded = false;

        // States: idle, run, jump
        this.state = 'idle';
        this.facing = 1; // 1 right, -1 left
        this.shootTimer = 0;
        this.shootInterval = 0.2;
        this.health = 100;
        this.invulnerableTimer = 0;
    }

    update(dt) {
        // Horizontal Movement
        if (this.game.input.isDown('ArrowRight')) {
            this.vx = this.speed;
            this.state = 'run';
            this.facing = 1;
        } else if (this.game.input.isDown('ArrowLeft')) {
            this.vx = -this.speed;
            this.state = 'run';
            this.facing = -1;
        } else {
            this.vx = 0;
            this.state = 'idle';
        }

        this.x += this.vx * dt;

        // Invulnerability
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        // Shooting
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (this.game.input.isDown('KeyZ') && this.shootTimer <= 0) {
            const bx = this.facing === 1 ? this.x + this.width : this.x - 10;
            const by = this.y + this.height / 2 - 5;
            this.game.projectiles.push(new Projectile(this.game, bx, by, this.facing));
            this.shootTimer = this.shootInterval;
            this.game.audio.playShoot();
        }

        // Jumping
        if (this.game.input.isDown('ArrowUp') && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.state = 'jump';
            this.game.audio.playJump();
        }

        // Apply Gravity
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Platform Collision
        this.grounded = false;

        // Check all platforms
        for (const platform of this.game.level.platforms) {
            // Simple AABB for feet (detect landing)
            // Check if player is falling and within X bounds
            if (this.vy >= 0 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) {

                // Check Y - feet range
                if (this.y + this.height >= platform.y &&
                    this.y + this.height <= platform.y + this.vy * dt + 10) { // Small buffer

                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    this.state = this.vx !== 0 ? 'run' : 'idle';
                }
            }
        }

        // In air check
        if (!this.grounded && this.state !== 'jump') {
            // Just falling
        }

        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
    }

    draw(ctx) {
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

        ctx.fillStyle = '#0000ff'; // Rama Blue
        if (this.state === 'run') ctx.fillStyle = '#0055ff'; // Lighter Blue running
        if (this.state === 'jump') ctx.fillStyle = '#00aaff'; // Cyan jumping

        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Debug outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Face direction indicator
        ctx.fillStyle = '#fff';
        const eyeX = this.facing === 1 ? this.x + 24 : this.x + 4;
        ctx.fillRect(eyeX, this.y + 6, 4, 4);
    }
}
