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
            this.health = 375; // Reduced by 25% (was 500)
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
        this.phase = 1;
        this.lightningTimer = 0;
        this.lightningBolts = [];
    }

    update(dt) {
        // Basic AI: Patrol back and forth
        if (this.type === 'boss' && this.phase === 2 && this.lightningBolts.length > 0) {
            // Stop moving while firing lightning
        } else {
            this.x += this.vx * this.direction * dt;
        }

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

        // Platform Collision
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

        // Boss Logic
        if (this.type === 'boss') {

            // Phase transformation
            if (this.health <= 188 && this.phase === 1) { // 50% of 375
                this.phase = 2;
                this.game.shakeScreen(1.0, 5); // Warning shake
                this.game.audio.playExplosion();
                // Speed up music? (Implied by previous boss mode, maybe make it even faster later)
            }

            // 1. Jump Logic (Phase 1 & 2)
            if (this.vy === 0 && Math.random() < 0.02) {
                this.vy = -800; // BIG JUMP
                this.grounded = false;
            }

            // 2. Quake Attack on Landing
            if (this.vy === 0 && !this.grounded) {
                this.grounded = true; // Just landed
                this.game.shakeScreen(0.5, 20);
                this.game.audio.playExplosion();

                // Quake Damage (Ground only)
                if (this.game.player.grounded && this.game.player.y > 450) {
                    this.damagePlayer(20);
                }
            } else if (this.vy !== 0) {
                this.grounded = false;
            }

            // 3. Contact Damage (Body Slam)
            if (this.checkCollision(this, this.game.player)) {
                this.damagePlayer(10);
            }

            // 4. Lightning Attack (Phase 2 Only)
            if (this.phase === 2) {
                this.lightningTimer -= dt;

                // Update active bolts
                for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
                    let bolt = this.lightningBolts[i];

                    if (bolt.warmup > 0) {
                        bolt.warmup -= dt;
                        if (bolt.warmup <= 0) {
                            bolt.active = true;
                            this.game.audio.playShoot(); // Zap!
                        }
                    } else {
                        // Active Bolt
                        bolt.life -= dt;
                        if (bolt.life <= 0) {
                            this.lightningBolts.splice(i, 1);
                        } else {
                            // Check collision with player
                            if (this.checkLineCircleCollision(bolt.x, bolt.y, bolt.endX, bolt.endY, this.game.player.x + 16, this.game.player.y + 16, 20)) {
                                this.damagePlayer(15);
                            }
                        }
                    }
                }

                // Fire new bolts
                if (this.lightningTimer <= 0) {
                    this.fireLightning();
                    this.lightningTimer = 3.0; // Every 3 seconds
                }
            }

            // Charge logic (Movement)
            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                if (Math.abs(this.game.player.x - this.x) < 300) {
                    this.vx = (this.phase === 2) ? 250 : 200; // Faster in Phase 2
                } else {
                    this.vx = 80;
                }
                this.shootTimer = 2.0;
            }
        }
    }

    fireLightning() {
        // Prepare bolts (don't play sound yet)
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / count) * i + Math.PI; // Fan upwards/outwards or towards player
            // Let's aim at player + random spread
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            const spread = (Math.random() - 0.5) * 1.5; // Wide spread

            const finalAngle = targetAngle + spread;
            const length = 1000;

            this.lightningBolts.push({
                x: this.x + 32,
                y: this.y + 32,
                endX: this.x + 32 + Math.cos(finalAngle) * length,
                endY: this.y + 32 + Math.sin(finalAngle) * length,
                life: 0.3, // Lasts 0.3s
                warmup: 0.6, // Warnings for 0.6s
                active: false,
                width: 5
            });
        }
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
    }

    // Helper for Lightning Collision
    checkLineCircleCollision(x1, y1, x2, y2, cx, cy, r) {
        // ... simple implementation or approximation
        // Vector from line start to circle center
        let v1x = cx - x1;
        let v1y = cy - y1;
        let v2x = x2 - x1;
        let v2y = y2 - y1;
        // Project v1 onto v2
        let dot = v1x * v2x + v1y * v2y;
        let lenSq = v2x * v2x + v2y * v2y;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * v2x;
            yy = y1 + param * v2y;
        }

        let dx = cx - xx;
        let dy = cy - yy;
        return (dx * dx + dy * dy) < (r * r);
    }

    damagePlayer(amount) {
        if (this.game.player.invulnerableTimer > 0) return;

        this.game.player.health -= amount;
        this.game.player.invulnerableTimer = 1;
        document.getElementById('health-val').innerText = this.game.player.health;

        // Knockback
        this.game.player.vy = -300;
        this.game.player.grounded = false;
        // Push away from boss
        if (this.game.player.x < this.x) this.game.player.x -= 20;
        else this.game.player.x += 20;

        if (this.game.player.health <= 0) {
            this.game.gameOver = true;
            document.getElementById('game-over-screen').classList.remove('hidden');
        }
    }

    draw(ctx) {
        if (this.type === 'boss') {
            // Body color changes in Phase 2
            ctx.fillStyle = (this.phase === 2 && Math.random() < 0.5) ? '#ff00ff' : '#440044';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Boss Eyes
            ctx.fillStyle = this.phase === 2 ? '#ff0000' : '#ffff00'; // Red eyes in Phase 2
            const eyeX = this.direction === 1 ? this.x + 40 : this.x + 10;
            ctx.fillRect(eyeX, this.y + 15, 12, 12);

            // Health Bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 10, this.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 375), 5);

            // Draw Lightning Bolts
            if (this.phase === 2) {
                ctx.save();
                this.lightningBolts.forEach(bolt => {
                    ctx.beginPath();
                    ctx.moveTo(bolt.x, bolt.y);
                    ctx.lineTo(bolt.endX, bolt.endY);

                    if (bolt.active) {
                        ctx.strokeStyle = '#00ffff';
                        ctx.lineWidth = 4;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#00ffff';
                    } else {
                        // Telegraph line
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.shadowBlur = 0;
                    }
                    ctx.stroke();
                });
                ctx.restore();
            }

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
