export default class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playTone(freq, type, duration) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        this.playTone(400, 'square', 0.1);
    }

    playShoot() {
        this.playTone(800, 'sawtooth', 0.1);
    }

    playExplosion() {
        this.playTone(100, 'sawtooth', 0.3);
    }

    playHit() {
        this.playTone(200, 'square', 0.2);
    }
    startMusic() {
        if (this.musicPlaying) return;
        this.musicPlaying = true;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Master Gain for Music
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.15; // Low volume background
        this.musicGain.connect(this.ctx.destination);

        // Tanpura Drone frequencies (Sa - Pa - Sa')
        // Base C#3 approx 138.59 Hz
        const baseFreq = 138.59;
        const fifthFreq = baseFreq * 1.5; // Pa
        const octaveFreq = baseFreq * 2; // Sa'

        this.oscillators = [];

        // Create 4 strings simulation
        // 1. Pa (Fifth)
        this.createString(fifthFreq, 0.5, 4);
        // 2. Sa' (High Octave)
        this.createString(octaveFreq, 1.5, 4.1);
        // 3. Sa' (High Octave)
        this.createString(octaveFreq, 2.5, 4.2);
        // 4. Sa (Base)
        this.createString(baseFreq, 3.5, 4.3);
    }

    createString(freq, delay, loopTime) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.value = freq;
        osc.type = 'sawtooth'; // Richer harmonics for Tanpura

        // Filter to soften the sawtooth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        // LFO for amplitude modulation (strumming effect)
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 1 / loopTime; // Slow cycle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; // Modulation depth

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        // Base gain
        gain.gain.value = 0.2;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start();
        lfo.start();

        this.oscillators.push({ osc, lfo, gain });
    }

    stopMusic() {
        if (!this.musicPlaying) return;
        this.musicPlaying = false;

        this.oscillators.forEach(o => {
            try {
                o.osc.stop();
                o.lfo.stop();
            } catch (e) { }
        });
        this.oscillators = [];
    }
}
