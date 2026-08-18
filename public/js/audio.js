// js/audio.js - Web Audio API Sound Synth Engine with Realistic Sound FX
// Reduced master volume by 50% per user request

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterVolume = 0.5; // Master volume set to 50%
        this.masterGain = null;
    }

    init() {
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch (e) { }
        }
        if (!this.ctx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
                this.setupMasterGain();
            } catch (e) {
                console.warn('Web Audio API not supported');
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
    }

    setupMasterGain() {
        if (this.ctx && !this.masterGain) {
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
        }
    }

    getDestination() {
        if (!this.ctx) return null;
        this.setupMasterGain();
        return this.masterGain || this.ctx.destination;
    }

    getContext() {
        if (!this.ctx) this.init();
        return this.ctx;
    }

    ensureContext() {
        if (this.muted) return false;
        if (!this.ctx) {
            this.init();
        }
        if (!this.ctx) return false;
        return this.ctx.state === 'running';
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

        gain.gain.setValueAtTime(isPlayer ? 0.175 : 0.125, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        hitGain.gain.setValueAtTime(0.7, now);
        hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        hitOsc.connect(hitGain);
        hitGain.connect(this.getDestination());
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
            noiseGain.gain.setValueAtTime(0.8, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.getDestination());

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) {
            console.log(e);
        }
    }

    playExplode() {
        this.playExplosion();
    }

    playPause() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.getDestination());
        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Beehive Shatter & Angry Bee Swarm Buzzing Sound FX (Tiếng tổ ong vỡ & ong bay vo ve)
    playBeeSwarm() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Hive Shatter Crack / Honey POP Sound
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(650, now);
        popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

        popGain.gain.setValueAtTime(0.35, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        popOsc.connect(popGain);
        popGain.connect(this.getDestination());
        popOsc.start(now);
        popOsc.stop(now + 0.12);

        // 2. Swarm Buzzing Vibrato (Tiếng ong vo ve dồn dập 1.2s)
        const buzzOsc = this.ctx.createOscillator();
        const buzzGain = this.ctx.createGain();
        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();

        // Sawtooth wave for buzzing insect sound
        buzzOsc.type = 'sawtooth';
        buzzOsc.frequency.setValueAtTime(240, now); // Base bee frequency ~240Hz
        buzzOsc.frequency.linearRampToValueAtTime(320, now + 0.6);
        buzzOsc.frequency.linearRampToValueAtTime(220, now + 1.2);

        // Fast Vibrato (28Hz pitch modulation = buzzing wings)
        vibrato.frequency.setValueAtTime(28, now);
        vibratoGain.gain.setValueAtTime(38, now); // Pitch modulation range
        vibrato.connect(buzzOsc.frequency);

        buzzGain.gain.setValueAtTime(0.2, now);
        buzzGain.gain.linearRampToValueAtTime(0.28, now + 0.4);
        buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        buzzOsc.connect(buzzGain);
        buzzGain.connect(this.getDestination());

        vibrato.start(now);
        buzzOsc.start(now);

        vibrato.stop(now + 1.2);
        buzzOsc.stop(now + 1.2);
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

        gain.gain.setValueAtTime(0.175, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        gain.gain.setValueAtTime(0.005, now);
        gain.gain.linearRampToValueAtTime(0.175, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.getDestination());
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

        subGain.gain.setValueAtTime(0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        subOsc.connect(subGain);
        subGain.connect(this.getDestination());
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
            noiseGain.gain.setValueAtTime(0.75, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.getDestination());

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

        gain.gain.setValueAtTime(0.175, now);
        gain.gain.setValueAtTime(0.175, now + duration - 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.getDestination());
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
                gain.gain.setValueAtTime(0.075, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(this.getDestination());
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.35);
            });
        } catch (e) { }
    }

    playLoseVoice() {
        // Disabled / Removed lose sound
    }

    // ----------------------------------------------------
    // --- 45S IDLE EASTER EGG SYNTHESIZED SOUND EFFECTS ---
    // ----------------------------------------------------

    // 1. Heavy Tank Engine Tread Rumble Sound
    playTankEngineRumble() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const duration = 0.4;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(55, now);
            osc.frequency.linearRampToValueAtTime(75, now + 0.2);
            osc.frequency.linearRampToValueAtTime(45, now + duration);

            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + duration);
        } catch (e) { }
    }

    // 2. Giant Super Cannon Blast Firing Sound
    playSuperCannonBlast() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const duration = 0.8;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + duration);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + duration);

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
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(30, now + duration);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.getDestination());

            noise.start(now);
            noise.stop(now + duration);
        } catch (e) { }
    }

    // 3. Metallic Title Letter Knockdown Crash Impact Sound
    playTitleCrash() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const duration = 1.0;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + duration);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + duration);

            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            noise.connect(noiseGain);
            noiseGain.connect(this.getDestination());
            noise.start(now);
            noise.stop(now + 0.5);
        } catch (e) { }
    }

    // 4. Repairmen Footsteps Running Sound
    playRepairmenFootsteps() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) { }
    }

    // 5. Electric Plasma Welding Sizzle & Spark Sound
    playWeldingSizzle() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const duration = 0.15;

            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(3000, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.075, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.getDestination());
            noise.start(now);
            noise.stop(now + duration);
        } catch (e) { }
    }

    // 6. Hammer Strike Metallic Clink Sound
    playHammerHit() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

            gain.gain.setValueAtTime(0.125, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) { }
    }

    // 7. Comic Speech Bubble Pop Sound
    playPopBubble() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + 0.08);
        } catch (e) { }
    }

    // 8. Triumphant Title Repaired Victory Chime
    // 8. Triumphant Title Repaired Victory Chime
    playTitleRepairedChime() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);

                gain.gain.setValueAtTime(0.09, now + i * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

                osc.connect(gain);
                gain.connect(this.getDestination());
                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + 0.3);
            });
        } catch (e) { }
    }

    // 9. Blizzard Preparation Warning Alarm Chime ("Tiếng chuẩn bị có bão tuyết")
    playBlizzardWarning() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            [0, 0.14, 0.28, 0.42].forEach((delay) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(920, now + delay);
                osc.frequency.exponentialRampToValueAtTime(460, now + delay + 0.11);

                gain.gain.setValueAtTime(0.12, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.11);

                osc.connect(gain);
                gain.connect(this.getDestination());
                osc.start(now + delay);
                osc.stop(now + delay + 0.12);
            });
        } catch (e) { }
    }

    // 10. Howling Snowstorm Wind Blowing Sound Effect ("Tiếng bão tuyết gió thổi vù vù")
    startBlizzardWind() {
        if (!this.ensureContext()) return;
        if (this.windNoiseNode) return; // Already blowing

        try {
            const now = this.ctx.currentTime;

            // Loop 3s white/pink noise buffer
            const bufferSize = this.ctx.sampleRate * 3;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            this.windNoiseNode = this.ctx.createBufferSource();
            this.windNoiseNode.buffer = buffer;
            this.windNoiseNode.loop = true;

            // Bandpass filter for resonant wind howl
            this.windFilter = this.ctx.createBiquadFilter();
            this.windFilter.type = 'bandpass';
            this.windFilter.frequency.setValueAtTime(450, now);
            this.windFilter.Q.setValueAtTime(3.2, now);

            // Low frequency oscillator for 0.7Hz "vù... vù..." howl modulation
            this.windLfo = this.ctx.createOscillator();
            this.windLfo.type = 'sine';
            this.windLfo.frequency.setValueAtTime(0.7, now);

            this.windLfoGain = this.ctx.createGain();
            this.windLfoGain.gain.setValueAtTime(350, now);

            this.windLfo.connect(this.windLfoGain);
            this.windLfoGain.connect(this.windFilter.frequency);

            // Master Gain node for wind volume (+25% volume boost: 0.20 -> 0.25)
            this.windGain = this.ctx.createGain();
            this.windGain.gain.setValueAtTime(0.001, now);
            this.windGain.gain.linearRampToValueAtTime(0.25, now + 0.6);

            this.windNoiseNode.connect(this.windFilter);
            this.windFilter.connect(this.windGain);
            this.windGain.connect(this.getDestination());

            this.windNoiseNode.start(now);
            this.windLfo.start(now);
        } catch (e) { }
    }

    stopBlizzardWind() {
        if (!this.windNoiseNode || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            if (this.windGain) {
                this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
                this.windGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
            }
            const oldNoise = this.windNoiseNode;
            const oldLfo = this.windLfo;
            setTimeout(() => {
                try { oldNoise.stop(); oldNoise.disconnect(); } catch (e) { }
                try { oldLfo.stop(); oldLfo.disconnect(); } catch (e) { }
            }, 550);
        } catch (e) { }

        this.windNoiseNode = null;
        this.windFilter = null;
        this.windLfo = null;
        this.windGain = null;
    }

    // 11. Thunder Strike & Electric Charging Sound ("Tiếng mây sấm sét giật điện")
    playElectricThunder() {
        if (!this.ensureContext()) return;
        try {
            const now = this.ctx.currentTime;
            // 1. Crackle strike
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.getDestination());
            osc.start(now);
            osc.stop(now + 0.35);

            // 2. Thunder rumble noise
            const bufferSize = this.ctx.sampleRate * 0.8;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(150, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.getDestination());
            noise.start(now);
            noise.stop(now + 0.8);
        } catch (e) { }
    }

    // 12. Active Electric Grid Continuous Plasma Hum Sound ("Tiếng rít tường điện laser")
    startElectricHum() {
        if (!this.ensureContext()) return;
        if (this.humOscNode) return;

        try {
            const now = this.ctx.currentTime;
            this.humOscNode = this.ctx.createOscillator();
            this.humOscNode.type = 'sawtooth';
            this.humOscNode.frequency.setValueAtTime(120, now);

            this.humFilter = this.ctx.createBiquadFilter();
            this.humFilter.type = 'lowpass';
            this.humFilter.frequency.setValueAtTime(600, now);

            this.humGain = this.ctx.createGain();
            this.humGain.gain.setValueAtTime(0.001, now);
            this.humGain.gain.linearRampToValueAtTime(0.09, now + 0.4);

            this.humOscNode.connect(this.humFilter);
            this.humFilter.connect(this.humGain);
            this.humGain.connect(this.getDestination());

            this.humOscNode.start(now);
        } catch (e) { }
    }

    stopElectricHum() {
        if (!this.humOscNode || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            if (this.humGain) {
                this.humGain.gain.setValueAtTime(this.humGain.gain.value, now);
                this.humGain.gain.linearRampToValueAtTime(0.001, now + 0.4);
            }
            const oldOsc = this.humOscNode;
            setTimeout(() => {
                try { oldOsc.stop(); oldOsc.disconnect(); } catch (e) { }
            }, 450);
        } catch (e) { }

        this.humOscNode = null;
        this.humFilter = null;
        this.humGain = null;
    }
}

const audio = new SoundEngine();
