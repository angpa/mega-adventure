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

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.3; // Louder for battle
        this.musicGain.connect(this.ctx.destination);

        this.tempo = 140; // Evangelion style fast tempo
        this.nextNoteTime = this.ctx.currentTime;
        this.timerID = null;
        this.beatCount = 0;

        this.schedule();
    }

    schedule() {
        if (!this.musicPlaying) return;

        const secondsPerBeat = 60.0 / this.tempo;
        const lookahead = 0.1; // How far ahead to schedule audio (sec)

        while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
            this.playBeat(this.nextNoteTime, this.beatCount);
            this.nextNoteTime += secondsPerBeat / 4; // 16th notes
            this.beatCount++;
        }

        this.timerID = requestAnimationFrame(this.schedule.bind(this));
    }

    playBeat(time, beat) {
        // 16 step pattern (4 beats)
        const step = beat % 16;
        const measure = Math.floor(beat / 16) % 4; // 4 bar loop

        // DRUMS
        // Timpani / Kick: Heavy hits on 0, 3, 8, 11 (Timpani Roll feel)
        if (step === 0 || step === 3 || step === 8 || step === 11) {
            this.playDrum(time, 80, 0.2, 'timpani');
        }
        // Snare/Clap on 4 and 12
        if (step === 4 || step === 12) {
            this.playDrum(time, 200, 0.1, 'snare');
        }
        // Hi-hats every 2 steps
        if (step % 2 === 0) {
            this.playDrum(time, 1000, 0.05, 'hat');
        }

        // BASS (Driving Ostinato)
        // C2 - C2 - Eb2 - C2 pattern
        let note = 65.41; // C2
        if (step === 2 || step === 3) note = 77.78; // Eb2
        if (step % 2 === 0) {
            this.playSynth(time, note, 0.1, 'bass');
        }

        // BRASS STABS (Evangelion Style)
        // Dramatic chords at start of measure 0 and 2
        if (measure % 2 === 0 && step === 0) {
            // C Minor add9 (C - Eb - G - D)
            this.playSynth(time, 261.63, 0.5, 'brass'); // C4
            this.playSynth(time, 311.13, 0.5, 'brass'); // Eb4
            this.playSynth(time, 392.00, 0.5, 'brass'); // G4
            this.playSynth(time, 587.33, 0.5, 'brass'); // D5
        }
    }

    playDrum(time, freq, dur, type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.musicGain);

        if (type === 'timpani') {
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(10, time + dur);
            gain.gain.setValueAtTime(1.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            osc.type = 'triangle';
        } else if (type === 'snare') {
            osc.type = 'square'; // poor man's noise
            // ideally use a noise buffer, but square works for retro feel
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(100, time + dur);
        } else { // hat
            osc.type = 'square';
            osc.frequency.value = 2000;
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        }

        osc.start(time);
        osc.stop(time + dur + 0.1);
    }

    playSynth(time, freq, dur, type) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.frequency.value = freq;

        if (type === 'bass') {
            osc.type = 'sawtooth';
            filter.frequency.setValueAtTime(500, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + dur);
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
        } else { // brass
            osc.type = 'sawtooth';
            // Brass swell
            filter.frequency.setValueAtTime(800, time);
            filter.frequency.exponentialRampToValueAtTime(3000, time + 0.1);
            gain.gain.setValueAtTime(0.6, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
        }

        osc.start(time);
        osc.stop(time + dur + 0.1);
    }

    stopMusic() {
        if (!this.musicPlaying) return;
        this.musicPlaying = false;
        if (this.timerID) cancelAnimationFrame(this.timerID);
    }
}
