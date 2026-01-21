export default class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4; // Larger voxels
        this.speedX = Math.random() * 400 - 200;
        this.speedY = Math.random() * 400 - 200;
        this.color = color;
        this.life = 1.0;
        this.markedForDeletion = false;

        // Physics
        this.gravity = 800;
        this.angle = 0;
        this.va = Math.random() * 0.4 - 0.2; // Angular velocity
        this.bounced = 0;
    }

    update(dt) {
        this.speedY += this.gravity * dt;
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
        this.angle += this.va;
        this.life -= dt * 1.5;

        // Ground Bounce
        if (this.y + this.size > 500) { // Using ground level 500
            this.y = 500 - this.size;
            this.speedY *= -0.6; // Bounce
            this.speedX *= 0.8; // Friction
        }

        if (this.life <= 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.life;

        ctx.fillStyle = this.color;
        // Neon Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Wireframe overlay for "tech" look
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }
}
