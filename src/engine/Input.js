export default class Input {
    constructor() {
        this.keys = new Set();
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        // Touch controls
        const touchButtons = document.querySelectorAll('#touch-controls button');
        touchButtons.forEach(btn => {
            const key = btn.dataset.key;

            const handleStart = (e) => {
                e.preventDefault(); // prevent scrolling/selection
                this.keys.add(key);
            };

            const handleEnd = (e) => {
                e.preventDefault();
                this.keys.delete(key);
            };

            btn.addEventListener('touchstart', handleStart, { passive: false });
            btn.addEventListener('touchend', handleEnd);
            btn.addEventListener('mousedown', handleStart);
            btn.addEventListener('mouseup', handleEnd);
            btn.addEventListener('mouseleave', handleEnd);
        });
    }

    isDown(code) {
        return this.keys.has(code);
    }
}
