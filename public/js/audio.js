// js/audio.js - Web Audio API Sound Synth Engine with Realistic Sound FX

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot(isPlayer = true) {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        const startFreq = isPlayer ? 380 : 260;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
        
        gain.gain.setValueAtTime(isPlayer ? 0.35 : 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playBounce() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.07);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playExpire() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // Heavy Tank Hit & Destruction Blast Sound FX
    playExplosion() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 1.1;

        // Layer 1: Metal Armor Piercing & High-Impact Crack (380Hz -> 30Hz)
        const hitOsc = this.ctx.createOscillator();
        const hitGain = this.ctx.createGain();
        hitOsc.type = 'sawtooth';
        hitOsc.frequency.setValueAtTime(380, now);
        hitOsc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

        hitGain.gain.setValueAtTime(1.4, now);
        hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        hitOsc.connect(hitGain);
        hitGain.connect(this.ctx.destination);
        hitOsc.start(now);
        hitOsc.stop(now + 0.6);

        // Layer 2: Heavy Low-Pass Filtered Tank Explosion Blast Rumble
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(20, now + duration);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(1.6, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.log(e);
        }
    }

    playPause() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Tiger Roar Sound FX
    playTigerRoar() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.4);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Trap Stun Squelch Sound FX
    playTrapStun() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Heavy Jet Engine Flyover Roar Sound FX
    playJetPass() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 2.8;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(320, now + 1.2);
        osc.frequency.linearRampToValueAtTime(70, now + duration);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    // Massive Atomic / Nuclear Bomb Explosion Sound FX
    playBombDetonate() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 2.5; // 2.5s long nuclear rumble decay

        // Layer 1: Heavy Sub-Bass Blast Shockwave (260Hz -> 12Hz)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(260, now);
        subOsc.frequency.exponentialRampToValueAtTime(12, now + duration);

        subGain.gain.setValueAtTime(1.8, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + duration);

        // Layer 2: White Noise Blast Crackle & Mushroom Cloud Rumble
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            // Lowpass filter for deep nuclear atomic thud & rumble
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(40, now + duration);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(1.5, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.log(e);
        }
    }

    // Authentic Police Car Siren Sound FX (Wee-Woo Police Siren)
    playPoliceSiren() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = 2.2;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';

        // 2-tone alternating police car siren oscillation (Wee-Woo Wee-Woo)
        const sirenSteps = 8;
        const stepTime = duration / sirenSteps;
        for (let i = 0; i < sirenSteps; i++) {
            const t = now + i * stepTime;
            const freq = (i % 2 === 0) ? 950 : 650;
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.linearRampToValueAtTime((i % 2 === 0) ? 650 : 950, t + stepTime);
        }

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + duration - 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    playPoliceEMP() {
        this.playPoliceSiren();
    }

    // Voice announcements disabled
    playVoice(text, isLose = false) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    playWinVoice() {
        if (this.muted) return;
        try {
            const ctx = this.getContext();
            const now = ctx.currentTime;
            // Clean Web Audio victory synth chime
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.35);
            });
        } catch (e) {}
    }

    playLoseVoice() {
        // Disabled / Removed lose sound
    }
}

const audio = new SoundEngine();
