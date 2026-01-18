export default class Projectile {
    constructor(game, x, y, direction) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.speed = 600;
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
        ctx.fillStyle = '#ffff00'; // Yellow bullet
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
