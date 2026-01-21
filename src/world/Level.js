export default class Level {
    constructor(game) {
        this.game = game;
        // Architectural rhythm: stepped plinths that lead the eye rightward toward a shrine/landmark.
        this.platforms = [
            // Ground plane
            { x: 0, y: 500, width: 820, height: 120 },
            // Low step (arrival)
            { x: 80, y: 430, width: 160, height: 18 },
            // Mid promenade
            { x: 240, y: 370, width: 180, height: 18 },
            // Overlook to shrine
            { x: 460, y: 320, width: 180, height: 18 },
            // Shrine plinth (highest point / landmark)
            { x: 660, y: 270, width: 120, height: 18 },
            // Prospect/Refuge: High observation deck (Safe Zone)
            { x: 50, y: 250, width: 100, height: 18 }
        ];

        // Reward: Ancient Statue (Heals player)
        this.statue = {
            x: 700,
            y: 230,
            width: 40,
            height: 40,
            active: true
        };

        // Procedural decoration (Trees)
        this.trees = [];
        for (let i = 0; i < 12; i++) {
            this.trees.push({
                x: i * 70 + Math.random() * 40,
                y: 500,
                height: 80 + Math.random() * 90,
                width: 16 + Math.random() * 18
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
            gradient.addColorStop(0, '#0a0f1e'); // Night-blue sky
            gradient.addColorStop(0.45, '#0f1f34'); // Mid haze
            gradient.addColorStop(1, '#1c3326'); // Greenish horizon
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Far silhouette hills (soft parallax)
        ctx.fillStyle = 'rgba(25, 55, 65, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, 430);
        ctx.quadraticCurveTo(200, 360, 420, 420);
        ctx.quadraticCurveTo(620, 340, 820, 420);
        ctx.lineTo(820, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fill();

        // Temple/Shrine landmark to anchor sightline on the right
        ctx.save();
        ctx.translate(700, 220);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(83, 243, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); // base
        ctx.rect(-40, 80, 80, 30);
        ctx.rect(-28, 50, 56, 30);
        ctx.rect(-18, 20, 36, 30);
        ctx.rect(-10, -10, 20, 30);
        ctx.rect(-4, -34, 8, 24);
        ctx.fill();
        ctx.stroke();
        ctx.stroke();
        ctx.restore();

        // Draw Ancient Statue (Reward)
        if (this.statue.active) {
            ctx.save();
            ctx.fillStyle = '#ffd700'; // Gold
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.fillRect(this.statue.x, this.statue.y, this.statue.width, this.statue.height);
            // Simple detail
            ctx.fillStyle = '#000';
            ctx.font = '20px serif';
            ctx.fillText('Ω', this.statue.x + 12, this.statue.y + 28);
            ctx.restore();
        }

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
