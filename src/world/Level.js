export default class Level {
    constructor(game) {
        this.game = game;
        this.platforms = [
            // Floor
            { x: 0, y: 500, width: 2000, height: 100 },
            // Platforms
            { x: 300, y: 400, width: 200, height: 20 },
            { x: 600, y: 300, width: 200, height: 20 },
            { x: 100, y: 250, width: 100, height: 20 }
        ];

        // Procedural decoration (Trees)
        this.trees = [];
        for (let i = 0; i < 10; i++) {
            this.trees.push({
                x: i * 150 + Math.random() * 50,
                y: 500,
                height: 100 + Math.random() * 100,
                width: 20 + Math.random() * 20
            });
        }
    }

    draw(ctx) {
        // Sky Gradient (Dandakaranya Forest look)
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);

        if (this.game.bossSpawned) {
            // Boss Atmosphere: Dark Red/Black
            gradient.addColorStop(0, '#0f0000'); // Blood sky
            gradient.addColorStop(1, '#2d0a0a'); // Dark ground mist
        } else {
            // Normal Atmosphere
            gradient.addColorStop(0, '#1a0e0e'); // Dark forest sky
            gradient.addColorStop(1, '#2d4b2d'); // Greenish horizon
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Draw Background Trees (Parallax effect simulated by being drawn first)
        ctx.fillStyle = '#1e331e';
        for (const t of this.trees) {
            // Trunk
            ctx.fillRect(t.x, t.y - t.height, t.width, t.height);
            // Foliage
            ctx.beginPath();
            ctx.arc(t.x + t.width / 2, t.y - t.height, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Platforms (Textured look)
        for (const p of this.platforms) {
            // Main block
            ctx.fillStyle = '#3a2e26'; // Earthy brown
            ctx.fillRect(p.x, p.y, p.width, p.height);

            // Grass top
            ctx.fillStyle = '#2d882d'; // Grass green
            ctx.fillRect(p.x, p.y, p.width, 10);

            // Highlights
            ctx.fillStyle = '#4aa34a';
            ctx.fillRect(p.x, p.y, p.width, 3);
        }
    }
}
