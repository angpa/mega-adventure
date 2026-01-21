import Physics from '../engine/Physics.js';
import Projectile from './Projectile.js';
import Particle from '../engine/Particle.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 52;
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

        // Game Feel: Input Buffering & Coyote Time
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.particleTimer = 0; // For running dust

        // Dash properties
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTime = 0;

        // Rama visual (cropped from Lord_Rama_with_arrows.jpg)
        this.sprite = new Image();
        this.spriteLoaded = false;
        this.sprite.src = new URL('../../Lord_Rama_with_arrows.jpg', import.meta.url).href;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
    }

    update(dt) {
        // Invulnerability
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        // Dash Logic
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.isDashing) {
            this.dashTime -= dt;
            this.vx = this.facing * 600; // Dash speed
            this.vy = 0; // Anti-gravity during dash
            this.invulnerableTimer = 0.1; // Invulnerable while dashing

            if (this.dashTime <= 0) {
                this.isDashing = false;
                this.dashCooldown = 1.0; // 1 second cooldown
                this.vy = 0; // Stop vertical momentum after dash
            }
            // Skip other movement logic while dashing
            this.x += this.vx * dt;

            // Screen bounds
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
            return;
        }

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

        // Trigger Dash
        if ((this.game.input.isDown('ShiftLeft') || this.game.input.isDown('ShiftRight')) && this.dashCooldown <= 0 && this.vx !== 0) {
            this.isDashing = true;
            this.dashTime = 0.2; // 0.2s duration
            this.game.audio.playJump(); // Reuse jump sound for now
            this.state = 'jump'; // Visual reuse
        }

        // Run Dust Particles
        if (this.state === 'run' && this.grounded) {
            this.particleTimer -= dt;
            if (this.particleTimer <= 0) {
                this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height, '#8b4513'));
                this.particleTimer = 0.1;
            }
        }

        this.x += this.vx * dt;

        // Shooting
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (this.game.input.isDown('Space') && this.shootTimer <= 0) {
            const bx = this.facing === 1 ? this.x + this.width : this.x - 10;
            const by = this.y + this.height / 2 - 5;
            this.game.projectiles.push(new Projectile(this.game, bx, by, this.facing));
            this.shootTimer = this.shootInterval;
            this.game.audio.playShoot();
        }

        // Jumping Logic (Game Feel)
        // 1. Jump Buffering: Remember input for a short time
        if (this.game.input.isDown('ArrowUp')) {
            this.jumpBufferTimer = 0.1; // 100ms buffer
        } else {
            if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;
        }

        // 2. Coyote Time: Allow jump shortly after falling
        if (this.grounded) {
            this.coyoteTimer = 0.15; // 150ms gracetime
        } else {
            if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
        }

        // Execute Jump
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.coyoteTimer = 0; // Consume coyote time
            this.jumpBufferTimer = 0; // Consume buffer
            this.state = 'jump';
            this.game.audio.playJump();

            // Jump Dust
            for (let i = 0; i < 5; i++) {
                this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height, '#fff'));
            }
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

                    if (!this.grounded) { // Just landed
                        // Landing Dust
                        for (let i = 0; i < 8; i++) {
                            this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height, '#8b4513'));
                        }
                    }
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

        if (this.spriteLoaded) {
            const sW = this.sprite.naturalWidth;
            const sH = this.sprite.naturalHeight;
            const targetRatio = this.width / this.height;

            // Center-crop to preserve Lord Rama proportions without squashing
            let srcW = sW;
            let srcH = Math.round(srcW / targetRatio);
            if (srcH > sH) {
                srcH = sH;
                srcW = Math.round(srcH * targetRatio);
            }
            const sx = (sW - srcW) / 2;
            const sy = (sH - srcH) / 2;

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y);
            ctx.scale(this.facing, 1);
            ctx.drawImage(this.sprite, sx, sy, srcW, srcH, -this.width / 2, 0, this.width, this.height);
            ctx.restore();

            // Soft aura/glow around the avatar
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#53f3ff';
            ctx.filter = 'blur(6px)';
            ctx.fillRect(this.x - 4, this.y + 4, this.width + 8, this.height + 6);
            ctx.restore();
        } else {
            // Fallback if image not ready
            ctx.fillStyle = '#0000ff';
            if (this.state === 'run') ctx.fillStyle = '#0055ff';
            if (this.state === 'jump') ctx.fillStyle = '#00aaff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
