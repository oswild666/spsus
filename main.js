// Wait for the DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');

    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');

    // --- Canvas and Drawing Setup ---

    // Set canvas size
    function resizeCanvas() {
        // Make canvas responsive, fitting within a certain aspect ratio
        const aspectRatio = 16 / 9;
        let newWidth = window.innerWidth * 0.9;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > window.innerHeight * 0.8) {
            newHeight = window.innerHeight * 0.8;
            newWidth = newHeight * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
    }

    // Initial resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);


    // --- Asset Loading ---
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = "Anonymous"; // Handle potential CORS issue
    const backgroundImageUrl = 'https://proyectoidis.org/wp-content/uploads/2022/11/lsd-dream-emulator.png';
    let isBackgroundLoaded = false;

    backgroundImage.onload = () => {
        isBackgroundLoaded = true;
        console.log("Background image loaded successfully.");
    };
    backgroundImage.onerror = () => {
        console.error("Failed to load background image. A fallback will be used.");
    };
    backgroundImage.src = backgroundImageUrl;

    const gucciLogoImage = new Image();
    let isGucciLogoLoaded = false;
    const gucciSvgString = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="25" viewBox="0 0 100 50"><path d="M75,25 a20,20 0 1,0 0,1 M60,25 h-10" fill="none" stroke="#D4AF37" stroke-width="8"/><path d="M25,25 a20,20 0 1,1 0,-1 M40,25 h10" fill="none" stroke="#D4AF37" stroke-width="8"/></svg>`;
    gucciLogoImage.onload = () => {
        isGucciLogoLoaded = true;
        console.log("Gucci logo loaded.");
    };
    gucciLogoImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(gucciSvgString)}`;


    // --- Graphics and Characters ---

    // Simple particle system for psychedelic effect
    let particles = [];
    function initParticles() {
        const numParticles = 75; // Increased particle count for more density
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                size: Math.random() * 1.5 + 0.5,
                // Store color as an object for easier manipulation
                color: {
                    r: Math.floor(Math.random() * 255),
                    g: Math.floor(Math.random() * 255),
                    b: Math.floor(Math.random() * 255)
                }
            });
        }
    }

    function drawParticles() {
        // Update particle positions
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        });

        // Draw lines between nearby particles for a web/fractal effect
        particles.forEach((p1, i) => {
            // Find the 2 nearest neighbors
            let neighbors = [];
            for (let j = 0; j < particles.length; j++) {
                if (i === j) continue;
                const p2 = particles[j];
                const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
                neighbors.push({ particle: p2, dist: dist });
            }

            neighbors.sort((a, b) => a.dist - b.dist);

            for (let k = 0; k < 2; k++) { // Connect to 2 nearest
                const neighbor = neighbors[k];
                // Only draw lines if they are reasonably close
                if (neighbor.dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(neighbor.particle.x, neighbor.particle.y);
                    const alpha = 1 - (neighbor.dist / 120); // Fade with distance
                    ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha * 0.5})`;
                    ctx.lineWidth = 0.75;
                    ctx.stroke();
                }
            }

            // Also draw the particle itself
            ctx.fillStyle = `rgb(${p1.color.r}, ${p1.color.g}, ${p1.color.b})`;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawPyramids() {
        // Left Pyramid
        ctx.beginPath();
        const grad1 = ctx.createLinearGradient(0, canvas.height, canvas.width * 0.3, canvas.height * 0.2);
        grad1.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
        grad1.addColorStop(1, 'rgba(0, 255, 255, 0.4)');
        ctx.fillStyle = grad1;
        ctx.moveTo(canvas.width * 0.05, canvas.height);
        ctx.lineTo(canvas.width * 0.25, canvas.height * 0.4);
        ctx.lineTo(canvas.width * 0.45, canvas.height);
        ctx.fill();

        // Right Pyramid
        ctx.beginPath();
        const grad2 = ctx.createLinearGradient(canvas.width, canvas.height, canvas.width * 0.7, canvas.height * 0.3);
        grad2.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
        grad2.addColorStop(1, 'rgba(255, 0, 0, 0.4)');
        ctx.fillStyle = grad2;
        ctx.moveTo(canvas.width * 0.55, canvas.height);
        ctx.lineTo(canvas.width * 0.75, canvas.height * 0.4);
        ctx.lineTo(canvas.width * 0.95, canvas.height);
        ctx.fill();
    }

    // Character Class
    class Character {
        constructor(x, y, id) {
            this.id = id;
            this.baseX = x;
            this.baseY = y;
            this.width = canvas.width / 8;
            this.height = canvas.height / 2;

            // Animation state
            this.headSize = 1.0; // multiplier
            this.targetHeadSize = 1.0;
            this.mouthOpen = 0.0; // 0 to 1
            this.targetMouthOpen = 0.0;
            this.isActive = false;
        }

        drawBody(x, y) {
            const bodyWidth = this.width * 0.8;
            const bodyHeight = this.height * 0.9;
            const kimonoX = x - bodyWidth / 2;
            const kimonoY = y;

            // Kimono (body)
            if (this.id === 1) {
                ctx.fillStyle = '#1a1a1a'; // Dark grey/black for Gucci
            } else {
                ctx.fillStyle = `hsl(${(this.id * 90)}, 80%, 50%)`;
            }
            ctx.fillRect(kimonoX, kimonoY, bodyWidth, bodyHeight);

            // "Psychedelic patterns" or Gucci logo
            if (this.id === 1 && isGucciLogoLoaded) {
                // Draw Gucci pattern
                ctx.save();
                ctx.rect(kimonoX, kimonoY, bodyWidth, bodyHeight);
                ctx.clip(); // Clip to the kimono area
                for (let row = -10; row < bodyHeight; row += 25) {
                    for (let col = -20; col < bodyWidth; col += 55) {
                        ctx.drawImage(gucciLogoImage, kimonoX + col, kimonoY + row);
                    }
                }
                ctx.restore();
            } else if (this.id !== 1) {
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = `hsl(${(this.id * 90 + i * 40) % 360}, 100%, 70%)`;
                    ctx.beginPath();
                    ctx.arc(x + (Math.random() - 0.5) * bodyWidth * 0.7, y + Math.random() * bodyHeight, Math.random() * 5 + 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Clasped hands
            ctx.fillStyle = '#333';
            ctx.fillRect(x - bodyWidth * 0.2, y + bodyHeight * 0.3, bodyWidth * 0.4, bodyHeight * 0.2);
        }

        drawHead(x, y) {
            const headRadius = (this.width / 3) * this.headSize;

            ctx.save();
            ctx.translate(x, y - headRadius * 1.2);

            // Face
            ctx.fillStyle = '#00ff00'; // Bright green
            ctx.beginPath();
            ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
            ctx.fill();

            // Butterfly ears
            ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(-headRadius, -headRadius * 0.2);
            ctx.bezierCurveTo(-headRadius * 1.8, -headRadius * 1.2, -headRadius * 1.8, headRadius * 0.2, -headRadius, headRadius * 0.5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(headRadius, -headRadius * 0.2);
            ctx.bezierCurveTo(headRadius * 1.8, -headRadius * 1.2, headRadius * 1.8, headRadius * 0.2, headRadius, headRadius * 0.5);
            ctx.fill();

            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-headRadius * 0.4, -headRadius * 0.2, headRadius * 0.2, 0, Math.PI * 2);
            ctx.arc(headRadius * 0.4, -headRadius * 0.2, headRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(-headRadius * 0.4, -headRadius * 0.2, headRadius * 0.1, 0, Math.PI * 2);
            ctx.arc(headRadius * 0.4, -headRadius * 0.2, headRadius * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Nose
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -headRadius * 0.1);
            ctx.lineTo(-headRadius * 0.1, headRadius * 0.2);
            ctx.lineTo(headRadius * 0.1, headRadius * 0.2);
            ctx.stroke();

            // Mouth
            ctx.fillStyle = 'black';
            const mouthHeight = headRadius * 0.3 * this.mouthOpen;
            ctx.fillRect(-headRadius * 0.3, headRadius * 0.3, headRadius * 0.6, mouthHeight);

            // Forehead circles
            if (this.isActive) {
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    ctx.beginPath();
                    ctx.arc(0, -headRadius * (0.8 + i * 0.1), Math.random() * 5 + 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        update() {
            // Smooth animation using easing
            const ease = 0.05;
            this.headSize += (this.targetHeadSize - this.headSize) * ease;
            this.mouthOpen += (this.targetMouthOpen - this.mouthOpen) * ease;

            if (this.isActive && Math.abs(this.targetHeadSize - this.headSize) < 0.01) {
                // Add subtle psychedelic pulsing when active and fully grown
                this.headSize += Math.sin(Date.now() * 0.01) * 0.02;
            }
        }

        draw() {
            const x = this.baseX;
            const y = this.baseY;
            this.drawBody(x, y);
            this.drawHead(x, y);
        }

        contains(px, py) {
            const x = this.baseX;
            const y = this.baseY;
            const headRadius = (this.width / 3) * this.headSize;
            // Check click on head
            const headCenterY = y - headRadius * 1.2;
            const dist = Math.sqrt((px - x) ** 2 + (py - headCenterY) ** 2);
            if (dist < headRadius) return true;
            // Check click on body
            const bodyWidth = this.width * 0.8;
            const bodyHeight = this.height * 0.9;
            return (px > x - bodyWidth / 2 && px < x + bodyWidth / 2 && py > y && py < y + bodyHeight);
        }

        activate() {
            this.isActive = true;
            this.targetHeadSize = 2.0;
            this.targetMouthOpen = 1.0;

            // Clear any existing timeout to prevent weird overlaps
            if (this.deactivateTimeout) {
                clearTimeout(this.deactivateTimeout);
            }

            // Deactivate after 30 seconds
            this.deactivateTimeout = setTimeout(() => this.deactivate(), 30000);
        }

        deactivate() {
            this.isActive = false;
            this.targetHeadSize = 1.0;
            this.targetMouthOpen = 0.0;
            if (this.deactivateTimeout) {
                clearTimeout(this.deactivateTimeout);
            }
        }
    }

    const characters = [];
    function initCharacters() {
        const numChars = 4;
        const spacing = canvas.width / numChars;
        for (let i = 0; i < numChars; i++) {
            const x = spacing / 2 + i * spacing;
            const y = canvas.height * 0.45;
            characters.push(new Character(x, y, i));
        }
    }


    // --- Main Loop ---

    function gameLoop() {
        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (isBackgroundLoaded) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback gradient
            const fallbackGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            fallbackGrad.addColorStop(0, "#1a0d29");
            fallbackGrad.addColorStop(1, "#4f2b5c");
            ctx.fillStyle = fallbackGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw scene elements
        drawPyramids();
        drawParticles();

        // Update and draw characters
        characters.forEach(char => {
            char.update();
            char.draw();
        });

        // Request the next frame
        requestAnimationFrame(gameLoop);
    }


    // --- Audio Engine ---

    let audioContext;
    let isAudioInitialized = false;
    let soundManager;

    // --- Note and Scale Generation ---
    const PENTATONIC_SCALE_INTERVALS = [0, 2, 4, 7, 9]; // Major pentatonic scale intervals

    function mtof(midi) {
        return Math.pow(2, (midi - 69) / 12) * 440;
    }

    function generateScale(baseMidi) {
        return PENTATONIC_SCALE_INTERVALS.map(interval => mtof(baseMidi + interval));
    }

    class SoundManager {
        constructor(audioCtx) {
            this.ctx = audioCtx;
            this.masterLimiter = this.ctx.createDynamicsCompressor();
            this.masterLimiter.threshold.setValueAtTime(-10, this.ctx.currentTime);
            this.masterLimiter.knee.setValueAtTime(0, this.ctx.currentTime);
            this.masterLimiter.ratio.setValueAtTime(20, this.ctx.currentTime);
            this.masterLimiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
            this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime);
            this.masterLimiter.connect(this.ctx.destination);

            this.synths = [
                new JawHarpSynth(this.ctx, this.masterLimiter),
                new ThroatSynth(this.ctx, this.masterLimiter),
                new AmbientPadSynth(this.ctx, this.masterLimiter),
                new NatureSynth(this.ctx, this.masterLimiter)
            ];

            this.isCycleActive = false;
            this.scale = [];
            this.pattern = [];
        }

        startNewCycle() {
            console.log("Starting new musical cycle.");
            this.isCycleActive = true;
            const baseNote = Math.floor(Math.random() * 12) + 48; // Random base note from C3 to B3
            this.scale = generateScale(baseNote);

            // Generate a master pattern of notes from the scale
            this.pattern = [];
            for (let i = 0; i < 6; i++) {
                this.pattern.push(this.scale[Math.floor(Math.random() * this.scale.length)]);
            }
        }

        playCharacter(charId) {
            if (!this.isCycleActive) {
                this.startNewCycle();
            }

            const synth = this.synths[charId];
            const now = this.ctx.currentTime;
            const duration = 30; // 30 seconds

            // Generate a random number of notes (2-6) for this specific character
            const numNotes = Math.floor(Math.random() * 5) + 2;
            let lastTime = 0;

            for (let i = 0; i < numNotes; i++) {
                // Get a note from the master pattern
                const noteFreq = this.pattern[Math.floor(Math.random() * this.pattern.length)];

                // Randomize timing
                const playTime = now + lastTime;
                const noteLength = (duration / numNotes) * (Math.random() * 0.5 + 0.5); // Vary length
                lastTime += (duration / numNotes) * (Math.random() * 0.8 + 0.7);

                if (playTime < now + duration) {
                    synth.play(noteFreq, playTime, noteLength);
                }
            }
        }

        stopCharacter(charId) {
            if (this.synths[charId]) {
                this.synths[charId].stop();
            }
        }

        stopAll() {
            this.synths.forEach(synth => synth.stop());
            this.isCycleActive = false;
            console.log("All sounds stopped, cycle reset.");
        }
    }

    class BaseSynth {
        constructor(ctx, destination) {
            this.ctx = ctx;
            this.destination = destination;
            this.activeNodes = [];
        }

        play(freq, time, duration) {
            // To be implemented by subclasses
        }

        stop() {
            this.activeNodes.forEach(node => {
                try {
                    node.stop(this.ctx.currentTime);
                } catch (e) {
                    // Node might already be stopped or disconnected
                }
            });
            this.activeNodes = [];
        }
    }

    // --- SYNTH DEFINITIONS ---

    class JawHarpSynth extends BaseSynth {
        play(freq, time, duration) {
            const now = this.ctx.currentTime;

            // Limiter for this synth voice
            const limiter = this.ctx.createDynamicsCompressor();
            limiter.threshold.setValueAtTime(-3, now);
            limiter.connect(this.destination);

            // Drone Oscillator
            const drone = this.ctx.createOscillator();
            drone.type = 'sawtooth';
            drone.frequency.setValueAtTime(freq / 2, time); // Drone at lower octave

            // Filter section
            const filter1 = this.ctx.createBiquadFilter();
            filter1.type = 'bandpass';
            filter1.Q.value = 10;
            const filter2 = this.ctx.createBiquadFilter();
            filter2.type = 'bandpass';
            filter2.Q.value = 15;

            // LFO to modulate filters
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(Math.random() * 2 + 1, time);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(800, time);
            lfo.connect(lfoGain);
            lfoGain.connect(filter1.frequency);
            lfoGain.connect(filter2.frequency);

            filter1.frequency.setValueAtTime(freq * 4, time);
            filter2.frequency.setValueAtTime(freq * 6, time);

            // Saturation
            const waveshaper = this.ctx.createWaveShaper();
            const curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = i * 2 / 255 - 1;
                curve[i] = Math.tanh(x * 1.5);
            }
            waveshaper.curve = curve;

            // Main Gain for Envelope
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.05); // Attack
            gain.gain.setValueAtTime(0.2, time + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, time + duration); // Release

            // Routing
            drone.connect(filter1);
            filter1.connect(filter2);
            filter2.connect(waveshaper);
            waveshaper.connect(gain);
            gain.connect(limiter);

            drone.start(time);
            lfo.start(time);
            drone.stop(time + duration);
            lfo.stop(time + duration);

            this.activeNodes.push(drone, lfo);
        }
    }

    class ThroatSynth extends BaseSynth {
        play(freq, time, duration) {
            const limiter = this.ctx.createDynamicsCompressor();
            limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
            limiter.connect(this.destination);

            // Carrier (fundamental drone)
            const carrier = this.ctx.createOscillator();
            carrier.type = 'triangle';
            carrier.frequency.setValueAtTime(freq, time);

            // Modulator (for FM)
            const modulator = this.ctx.createOscillator();
            modulator.type = 'sine';
            modulator.frequency.setValueAtTime(freq * (Math.random() * 2 + 2), time); // 2x-4x carrier

            // Modulator Gain (FM Index)
            const fmGain = this.ctx.createGain();
            const fmIndex = freq * 3; // Make it rich
            fmGain.gain.setValueAtTime(fmIndex, time);

            modulator.connect(fmGain);
            fmGain.connect(carrier.frequency); // FM connection

            // Formant Filters
            const f1 = this.ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 12;
            const f2 = this.ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 15;

            f1.frequency.setValueAtTime(1200, time);
            f2.frequency.setValueAtTime(2200, time);

            // LFO to move formants
            const lfo = this.ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.2, time);
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(400, time);
            lfo.connect(lfoGain);
            lfoGain.connect(f1.frequency);
            lfoGain.connect(f2.detune);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.25, time + 0.2);
            gain.gain.setValueAtTime(0.25, time + duration - 0.5);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            carrier.connect(f1);
            f1.connect(f2);
            f2.connect(gain);
            gain.connect(limiter);

            carrier.start(time);
            modulator.start(time);
            lfo.start(time);
            carrier.stop(time + duration);
            modulator.stop(time + duration);
            lfo.stop(time + duration);
            this.activeNodes.push(carrier, modulator, lfo);
        }
    }

    class AmbientPadSynth extends BaseSynth {
        play(freq, time, duration) {
            const limiter = this.ctx.createDynamicsCompressor();
            limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
            limiter.connect(this.destination);

            const panner = this.ctx.createStereoPanner();
            panner.pan.setValueAtTime((Math.random() - 0.5) * 2, time);

            const gain = this.ctx.createGain();
            const peakGain = 0.15 * 0.6; // 60% volume
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(peakGain, time + 1.5); // Slow attack
            gain.gain.setValueAtTime(peakGain, time + duration - 2.0);
            gain.gain.linearRampToValueAtTime(0, time + duration + 3.0); // Long release

            // Lowpass filter for occasional sweep
            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(freq * 16, time);
            if (Math.random() < 0.25) { // 25% chance of a sweep
                lowpass.frequency.linearRampToValueAtTime(freq * 2, time + 4);
                lowpass.frequency.linearRampToValueAtTime(freq * 16, time + duration);
            }

            // Create a chord
            const intervals = [0, 4, 7]; // Major chord
            intervals.forEach(interval => {
                const osc = this.ctx.createOscillator();
                osc.type = 'sine';
                const noteFreq = freq * Math.pow(2, interval / 12);
                osc.frequency.setValueAtTime(noteFreq, time);
                osc.detune.setValueAtTime((Math.random() - 0.5) * 10, time); // Detune for richness

                osc.connect(lowpass);
                osc.start(time);
                osc.stop(time + duration + 3.5);
                this.activeNodes.push(osc);
            });

            lowpass.connect(panner);
            panner.connect(gain);
            gain.connect(limiter);
        }
    }

    class NatureSynth extends BaseSynth {
        play(freq, time, duration) {
            const limiter = this.ctx.createDynamicsCompressor();
            limiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
            limiter.connect(this.destination);

            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1; // White noise
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            // Filter to make it sound like wind/rustling
            const highpass = this.ctx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.setValueAtTime(1000, time); // Remove low rumble

            // LFO to modulate gain for "wind" effect
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(Math.random() * 0.5 + 0.1, time);

            const lfoGain = this.ctx.createGain();
            lfoGain.gain.setValueAtTime(0.1, time); // Amount of gain modulation
            lfo.connect(lfoGain);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, time); // Start at 0 base gain
            lfoGain.connect(gain.gain); // LFO controls the gain value

            const peakGain = 0.15 * 0.6; // 60% volume
            // Envelope on top
            gain.gain.linearRampToValueAtTime(peakGain, time + 0.5);
            gain.gain.setValueAtTime(peakGain, time + duration - 0.5);
            gain.gain.linearRampToValueAtTime(0, time + duration);

            noise.connect(highpass);
            highpass.connect(gain);
            gain.connect(limiter);

            noise.start(time);
            lfo.start(time);
            noise.stop(time + duration);
            lfo.stop(time + duration);
            this.activeNodes.push(noise, lfo);
        }
    }


    playButton.addEventListener('click', () => {
        if (!isAudioInitialized) {
            console.log("Initializing Audio...");
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            soundManager = new SoundManager(audioContext);
            isAudioInitialized = true;
            playButton.textContent = "Audio Active";
            playButton.disabled = true;
            console.log("Audio Context is now", audioContext.state);
        }
    });

    stopButton.addEventListener('click', () => {
        if (soundManager) {
            soundManager.stopAll();
        }
        // Also reset character visual state
        characters.forEach(char => char.deactivate());
    });


    // --- Event Listeners ---
    canvas.addEventListener('click', (event) => {
        if (!isAudioInitialized) {
            console.warn("Audio not initialized. Please click 'Play Audio' first.");
            // Optionally, we could trigger a visual cue here
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Find which character was clicked
        const clickedChar = characters.find(char => char.contains(x, y));

        if (clickedChar) {
            if (!clickedChar.isActive) {
                // Character is not active, so activate it.
                console.log(`Activating character ${clickedChar.id}!`);
                clickedChar.activate();
                if (soundManager) {
                    soundManager.playCharacter(clickedChar.id);
                }
            } else {
                // Character is already active, so deactivate it.
                console.log(`Deactivating character ${clickedChar.id}.`);
                clickedChar.deactivate();
                if (soundManager) {
                    soundManager.stopCharacter(clickedChar.id);
                }
            }
        }
    });


    // --- Start the application ---
    console.log("Psychedelic Ninja Choir initialized.");
    // Initialize graphical elements
    initParticles();
    initCharacters();
    // Start the main loop
    requestAnimationFrame(gameLoop);
});
