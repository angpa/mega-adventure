export default class Projectile {
    constructor(game, x, y, direction) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20; // Longer beam
        this.height = 4; // Thinner beam
        this.speed = 900; // Faster (was 600)
        this.direction = direction; // 1 or -1
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.speed * this.direction * dt;

        // Out of bounds check
        if (this.x > this.game.width || this.x < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#00ffff'; // Cyan Neon
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15; // Intense glow
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Core (white hot center)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x + 2, this.y + 1, this.width - 4, this.height - 2);

        ctx.restore();
    }
}
