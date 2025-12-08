import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw, Volume2, VolumeX, Zap, Shield, Star } from 'lucide-react';
import { getTheme } from './utils';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
  'b', 'a', 'Enter'
];

const EasterEgg = ({ isDark }) => {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('prism_runner_hiscore') || '0'));
  
  // Sound State (Visual)
  const [isSoundOn, setIsSoundOn] = useState(true); // Default ON

  // Refs
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const audioCtxRef = useRef(null);
  const musicIntervalRef = useRef(null);
  
  // KEY FIX: Sound Ref ensures the game loop sees the live value
  const soundRef = useRef(true); 
  const keyHistory = useRef([]);

  // Game State Ref
  const gameState = useRef({
      player: { x: 50, y: 180, width: 35, height: 50, dy: 0, jumpForce: 15, grounded: true, color: '#22d3ee', invincible: 0, speedBoost: 0 },
      obstacles: [],
      powerUps: [],
      particles: [],
      frames: 0,
      gameSpeed: 5,
      scoreCount: 0,
      combo: 0
  });

  // Sync State to Ref
  const toggleSound = () => {
      const newState = !isSoundOn;
      setIsSoundOn(newState);
      soundRef.current = newState; // Update Ref for game loop
  };

  // --- 1. KONAMI CODE ENGINE ---
  useEffect(() => {
    const secretCode = [
        'arrowup', 'arrowup', 
        'arrowdown', 'arrowdown', 
        'arrowleft', 'arrowright', 
        'arrowleft', 'arrowright', 
        'b', 'a', 'enter'
    ];

    const handleCodeEntry = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (isOpen) return; 

      const key = e.key.toLowerCase();
      keyHistory.current = [...keyHistory.current, key].slice(-11);

      if (JSON.stringify(keyHistory.current) === JSON.stringify(secretCode)) {
          setIsOpen(true);
          keyHistory.current = []; 
      }
    };

    window.addEventListener('keydown', handleCodeEntry);
    return () => window.removeEventListener('keydown', handleCodeEntry);
  }, [isOpen]);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
      if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }
  };

  const playJumpSound = () => {
      if (!soundRef.current || !audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
  };

  const playCrashSound = () => {
      if (!soundRef.current || !audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
  };

  const playPowerUpSound = () => {
      if (!soundRef.current || !audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, t + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + i * 0.1);
          osc.stop(t + i * 0.1 + 0.3);
      });
  };

  const createParticles = (x, y, color, count = 10) => {
      for (let i = 0; i < count; i++) {
          gameState.current.particles.push({
              x, y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 30,
              color: color || '#22d3ee',
              size: Math.random() * 4 + 2
          });
      }
  };

  const startMusic = () => {
      if (!audioCtxRef.current) initAudio();
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
      if (!soundRef.current) return;

      const ctx = audioCtxRef.current;
      let beatIndex = 0;
      
      // Stranger Things style - droning bass and atmospheric pads
      const bassFreq = 55; // Low A, continuous drone
      const padFreqs = [220, 261.63, 329.63]; // Am chord
      const leadFreq = 440; // A4, occasional melody

      // Deep bassy drone (not ring-like)
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();
      const bassLFO = ctx.createOscillator();
      const bassLFOGain = ctx.createGain();
      
      // Use triangle wave for smoother, less ring-like sound
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = bassFreq;
      
      // Heavy lowpass filter for deep bass
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 150;
      bassFilter.Q.value = 1; // Low Q to avoid resonance/ringing
      
      // Subtle LFO for slight movement (not too much)
      bassLFO.type = 'sine';
      bassLFO.frequency.value = 0.5; // Very slow modulation
      bassLFOGain.gain.value = 2; // Small frequency variation
      
      bassLFO.connect(bassLFOGain);
      bassLFOGain.connect(bassOsc.frequency);
      
      bassGain.gain.value = 0.2;
      
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(ctx.destination);
      
      bassOsc.start();
      bassLFO.start();
      
      // Store references to stop later
      if (!audioCtxRef.current.bassOscRef) {
          audioCtxRef.current.bassOscRef = bassOsc;
          audioCtxRef.current.bassLFORef = bassLFO;
      }

      // Atmospheric pad chords (continuous, slow attack)
      padFreqs.forEach((freq, i) => {
          const padOsc = ctx.createOscillator();
          const padGain = ctx.createGain();
          const padFilter = ctx.createBiquadFilter();
          padOsc.type = 'sawtooth';
          padOsc.frequency.value = freq;
          padFilter.type = 'lowpass';
          padFilter.frequency.value = 1200;
          padFilter.Q.value = 1;
          padGain.gain.setValueAtTime(0, ctx.currentTime);
          padGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
          padOsc.connect(padFilter);
          padFilter.connect(padGain);
          padGain.connect(ctx.destination);
          padOsc.start();
          
          if (!audioCtxRef.current.padOscRefs) {
              audioCtxRef.current.padOscRefs = [];
          }
          audioCtxRef.current.padOscRefs.push(padOsc);
      });

      // Occasional lead melody (sparse, atmospheric)
      const playLead = () => {
          if (!soundRef.current) return;
          const t = ctx.currentTime;
          const beat = beatIndex % 32;
          
          // Play lead note every 8 beats (sparse)
          if (beat % 8 === 0 && Math.random() > 0.3) {
              const leadOsc = ctx.createOscillator();
              const leadGain = ctx.createGain();
              const leadFilter = ctx.createBiquadFilter();
              leadOsc.type = 'square';
              leadOsc.frequency.value = leadFreq;
              leadFilter.type = 'lowpass';
              leadFilter.frequency.value = 2500;
              leadFilter.Q.value = 8;
              leadGain.gain.setValueAtTime(0, t);
              leadGain.gain.linearRampToValueAtTime(0.12, t + 0.3);
              leadGain.gain.linearRampToValueAtTime(0, t + 1.5);
              leadOsc.connect(leadFilter);
              leadFilter.connect(leadGain);
              leadGain.connect(ctx.destination);
              leadOsc.start(t);
              leadOsc.stop(t + 1.5);
          }
          
          // Very subtle pulse/rhythm (minimal)
          if (beat % 16 === 0) {
              const pulseOsc = ctx.createOscillator();
              const pulseGain = ctx.createGain();
              pulseOsc.type = 'sine';
              pulseOsc.frequency.value = 60;
              pulseGain.gain.setValueAtTime(0.1, t);
              pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
              pulseOsc.connect(pulseGain);
              pulseGain.connect(ctx.destination);
              pulseOsc.start(t);
              pulseOsc.stop(t + 0.2);
          }
          
          beatIndex++;
      };
      
      playLead();
      musicIntervalRef.current = setInterval(playLead, 250); // Slow, atmospheric tempo
  };

  const stopMusic = () => {
      if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current);
          musicIntervalRef.current = null;
      }
      // Stop continuous oscillators
      if (audioCtxRef.current) {
          if (audioCtxRef.current.bassOscRef) {
              try {
                  audioCtxRef.current.bassOscRef.stop();
              } catch (e) {}
              audioCtxRef.current.bassOscRef = null;
          }
          if (audioCtxRef.current.bassLFORef) {
              try {
                  audioCtxRef.current.bassLFORef.stop();
              } catch (e) {}
              audioCtxRef.current.bassLFORef = null;
          }
          if (audioCtxRef.current.padOscRefs) {
              audioCtxRef.current.padOscRefs.forEach(osc => {
                  try {
                      osc.stop();
                  } catch (e) {}
              });
              audioCtxRef.current.padOscRefs = [];
          }
      }
  };

  // Watch for toggle changes while game is running
  useEffect(() => {
      if (gameActive && isSoundOn) startMusic();
      else stopMusic();
  }, [isSoundOn, gameActive]);

  // --- GAME ENGINE ---
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const groundHeight = 250;
    const gravity = 0.7;

    const jump = () => {
        if (!gameActive) return;
        const p = gameState.current.player;
        if (p.y >= groundHeight - p.height - 5) { 
            p.dy = -p.jumpForce;
            p.grounded = false;
            playJumpSound();
        }
    };

    const handleInput = (e) => {
        if (e.type === 'keydown') {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!gameActive && !gameOver) startGame();
                else jump();
            }
        }
        if (e.type === 'mousedown' || e.type === 'touchstart') {
            if (e.target.closest('button')) return;
            e.preventDefault();
            if (!gameActive && !gameOver) startGame();
            else jump();
        }
    };

    window.addEventListener('keydown', handleInput);
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });

    const loop = () => {
        if (!gameActive) return;

        const state = gameState.current;
        state.frames++;
        state.scoreCount++;
        setScore(Math.floor(state.scoreCount / 10));

        if (state.frames % 1000 === 0) state.gameSpeed += 1;

        // Dark purple hazy night sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, groundHeight);
        skyGradient.addColorStop(0, '#1a0a2e'); // Very dark purple
        skyGradient.addColorStop(0.5, '#2d1b4e'); // Dark purple
        skyGradient.addColorStop(1, '#3d2b5e'); // Slightly lighter purple at horizon
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, groundHeight);
        
        // Hazy/fog effect
        ctx.fillStyle = 'rgba(138, 43, 226, 0.15)';
        for (let i = 0; i < 5; i++) {
            const fogY = groundHeight * 0.3 + i * 30;
            const fogGradient = ctx.createLinearGradient(0, fogY, 0, fogY + 40);
            fogGradient.addColorStop(0, 'rgba(138, 43, 226, 0.2)');
            fogGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.1)');
            fogGradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = fogGradient;
            ctx.fillRect(0, fogY, canvas.width, 40);
        }
        
        // Subtle stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % canvas.width;
            const y = (i * 23) % (groundHeight * 0.7);
            ctx.fillRect(x, y, 1, 1);
        }
        
        ctx.globalAlpha = 1;

        // 8-bit road - simple pixelated road
        const pixelSize = 8; // 8-bit pixel size
        
        // Dark road base
        ctx.fillStyle = '#1a1a2e'; // Dark gray-purple
        ctx.fillRect(0, groundHeight, canvas.width, canvas.height - groundHeight);
        
        // Road center line (yellow, pixelated)
        ctx.fillStyle = '#ffd700'; // Yellow
        const centerX = canvas.width / 2;
        const roadSpeed = state.frames * 0.5;
        
        for (let y = groundHeight; y < canvas.height; y += pixelSize * 2) {
            const offsetY = (y - groundHeight + roadSpeed) % (pixelSize * 4);
            if (offsetY < pixelSize * 2) {
                // Draw pixelated center line segment
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(
                        centerX - pixelSize + i * pixelSize,
                        Math.floor(y / pixelSize) * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
        
        // Road edges (white, pixelated)
        ctx.fillStyle = '#ffffff';
        const roadWidth = canvas.width * 0.6;
        const leftEdge = (canvas.width - roadWidth) / 2;
        const rightEdge = leftEdge + roadWidth;
        
        // Left edge
        for (let y = groundHeight; y < canvas.height; y += pixelSize) {
            ctx.fillRect(
                Math.floor(leftEdge / pixelSize) * pixelSize,
                Math.floor(y / pixelSize) * pixelSize,
                pixelSize,
                pixelSize
            );
        }
        
        // Right edge
        for (let y = groundHeight; y < canvas.height; y += pixelSize) {
            ctx.fillRect(
                Math.floor(rightEdge / pixelSize) * pixelSize,
                Math.floor(y / pixelSize) * pixelSize,
                pixelSize,
                pixelSize
            );
        }
        
        // Road surface texture (subtle pixelation)
        ctx.fillStyle = '#2a2a3e';
        for (let x = 0; x < canvas.width; x += pixelSize) {
            for (let y = groundHeight; y < canvas.height; y += pixelSize) {
                const seed = (x * 7 + y * 11) % 10;
                if (seed > 7 && x > leftEdge && x < rightEdge) {
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            }
        }

        // Player
        state.player.dy += gravity;
        state.player.y += state.player.dy;
        if (state.player.invincible > 0) state.player.invincible--;
        if (state.player.speedBoost > 0) state.player.speedBoost--;

        if (state.player.y > groundHeight - state.player.height) {
            state.player.y = groundHeight - state.player.height;
            state.player.dy = 0;
            state.player.grounded = true;
        }

        // Draw runner silhouette with chromatic aberration (smooth, polished)
        ctx.save();
        const playerCenterX = state.player.x + state.player.width / 2;
        const headY = state.player.y - 10;
        const baseColor = '#4a9eff'; // Bright blue, stands out against dark background
        
        // Invincibility flash effect
        if (state.player.invincible > 0 && Math.floor(state.frames / 5) % 2) {
            ctx.globalAlpha = 0.6;
        }
        
        // Draw runner silhouette (smooth, polished runner shape)
        const drawRunner = (offsetX, offsetY, color, alpha = 1) => {
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
            const px = state.player.x + offsetX;
            const py = state.player.y + offsetY;
            
            // Head (smooth circle)
            ctx.beginPath();
            ctx.arc(playerCenterX + offsetX, headY + offsetY + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Body (torso) - rounded rectangle for smoother look
            const torsoX = px + 11;
            const torsoY = py;
            const torsoW = state.player.width - 22;
            const torsoH = state.player.height * 0.55;
            const radius = 4;
            ctx.beginPath();
            ctx.moveTo(torsoX + radius, torsoY);
            ctx.lineTo(torsoX + torsoW - radius, torsoY);
            ctx.quadraticCurveTo(torsoX + torsoW, torsoY, torsoX + torsoW, torsoY + radius);
            ctx.lineTo(torsoX + torsoW, torsoY + torsoH - radius);
            ctx.quadraticCurveTo(torsoX + torsoW, torsoY + torsoH, torsoX + torsoW - radius, torsoY + torsoH);
            ctx.lineTo(torsoX + radius, torsoY + torsoH);
            ctx.quadraticCurveTo(torsoX, torsoY + torsoH, torsoX, torsoY + torsoH - radius);
            ctx.lineTo(torsoX, torsoY + radius);
            ctx.quadraticCurveTo(torsoX, torsoY, torsoX + radius, torsoY);
            ctx.closePath();
            ctx.fill();
            
            // Arms (swinging animation) - smoother movement
            const armSwing = state.player.grounded ? Math.sin(state.frames * 0.18) * 12 : 0;
            const armY = py + 8;
            const armW = 7;
            const armH = 18;
            
            // Left arm (back) - single smooth rectangle
            ctx.fillRect(px + 5, armY + Math.floor(armSwing * 0.7), armW, armH);
            
            // Right arm (forward) - single smooth rectangle
            ctx.fillRect(px + state.player.width - 12, armY - Math.floor(armSwing * 0.7), armW, armH);
            
            // Legs (running animation) - smoother movement
            const legSwing = state.player.grounded ? Math.sin(state.frames * 0.22) * 10 : 0;
            const torsoBottom = py + state.player.height * 0.55;
            const legW = 9;
            const legH = state.player.height * 0.45;
            
            // Left leg - single smooth rectangle
            ctx.fillRect(px + 13, torsoBottom, legW, legH + Math.floor(legSwing));
            
            // Right leg - single smooth rectangle
            ctx.fillRect(px + state.player.width - 22, torsoBottom, legW, legH - Math.floor(legSwing));
        };
        
        // Chromatic aberration - draw runner 3 times with color offsets
        // Red channel offset (left) - more subtle
        drawRunner(-1.5, -0.5, '#ff0000', 0.4);
        // Cyan channel offset (right) - more subtle
        drawRunner(1.5, 0.5, '#00ffff', 0.4);
        // Main dark silhouette
        drawRunner(0, 0, baseColor, 1);
        
        // Add bright outline for better visibility against dark background
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#4a9eff';
        // Outline head
        ctx.beginPath();
        ctx.arc(playerCenterX, headY + 8, 8, 0, Math.PI * 2);
        ctx.stroke();
        // Outline body
        const torsoX = state.player.x + 11;
        const torsoY = state.player.y;
        const torsoW = state.player.width - 22;
        const torsoH = state.player.height * 0.55;
        ctx.strokeRect(torsoX, torsoY, torsoW, torsoH);
        ctx.shadowBlur = 0;
        
        // Invincibility glow
        if (state.player.invincible > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffff00';
            ctx.fillRect(state.player.x - 8, state.player.y - 18, state.player.width + 16, state.player.height + 28);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
        ctx.globalAlpha = 1;

        // Obstacles (varied types) - all neon blue
        if (state.frames % 100 === 0 || (state.frames % 60 === 0 && Math.random() > 0.6 && state.gameSpeed > 8)) {
            const obstacleType = Math.random();
            if (obstacleType < 0.4) {
                // Ground obstacle
                state.obstacles.push({
                    x: canvas.width,
                    y: groundHeight - 30,
                    width: 20,
                    height: Math.random() > 0.5 ? 30 : 50,
                    color: '#00ffff', // Neon blue
                    type: 'ground'
                });
            } else if (obstacleType < 0.7) {
                // Flying obstacle
                state.obstacles.push({
                    x: canvas.width,
                    y: groundHeight - 100 - Math.random() * 50,
                    width: 25,
                    height: 20,
                    color: '#00ffff', // Neon blue
                    type: 'flying'
                });
            } else {
                // Low spike
                state.obstacles.push({
                    x: canvas.width,
                    y: groundHeight - 15,
                    width: 30,
                    height: 15,
                    color: '#00ffff', // Neon blue
                    type: 'spike'
                });
            }
        }

        // Power-ups (spawn occasionally) - all gold
        if (state.frames % 300 === 0 && Math.random() > 0.7) {
            const powerType = Math.random() < 0.5 ? 'shield' : 'speed';
            state.powerUps.push({
                x: canvas.width,
                y: groundHeight - 60,
                width: 20,
                height: 20,
                type: powerType,
                color: '#ffd700', // Gold
                rotation: 0
            });
        }

        // Update and draw obstacles (clean, visible style)
        for (let i = 0; i < state.obstacles.length; i++) {
            let obs = state.obstacles[i];
            obs.x -= state.gameSpeed + (state.player.speedBoost > 0 ? 2 : 0);

            // Draw obstacle with glow effect (neon blue)
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = obs.color;
            
            const drawObstacle = (offsetX, offsetY, color, alpha = 1) => {
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                const px = obs.x + offsetX;
                const py = obs.y + offsetY;
                
                if (obs.type === 'spike') {
                    // Triangle spike
                    ctx.beginPath();
                    ctx.moveTo(px + obs.width / 2, py - obs.height - 10);
                    ctx.lineTo(px, py);
                    ctx.lineTo(px + obs.width, py);
                    ctx.closePath();
                    ctx.fill();
                } else if (obs.type === 'flying') {
                    // Rectangle flying obstacle
                    ctx.fillRect(px, py - obs.height, obs.width, obs.height);
                } else {
                    // Rectangle ground obstacle
                    ctx.fillRect(px, py - (obs.height - 30), obs.width, obs.height);
                }
            };
            
            // Chromatic aberration on obstacles (subtle for neon blue)
            drawObstacle(-1, -1, '#00aaff', 0.4);
            drawObstacle(1, 1, '#00ffff', 0.4);
            drawObstacle(0, 0, obs.color, 1);
            
            ctx.restore();
            ctx.globalAlpha = 1;

            // Collision detection - improved for different obstacle types
            let hitBox;
            if (obs.type === 'spike') {
                // Spike hitbox - triangular area (taller)
                hitBox = {
                    x: obs.x,
                    y: obs.y - obs.height - 10,
                    width: obs.width,
                    height: obs.height + 10,
                    isTriangle: true
                };
            } else if (obs.type === 'flying') {
                // Flying obstacles - lower position
                hitBox = {
                    x: obs.x,
                    y: obs.y - obs.height,
                    width: obs.width,
                    height: obs.height
                };
            } else {
                hitBox = {
                    x: obs.x,
                    y: obs.y - (obs.height - 30),
                    width: obs.width,
                    height: obs.height
                };
            }

            // Improved collision detection
            let collided = false;
            if (hitBox.isTriangle) {
                // Triangle collision (spike) - check if player overlaps with spike triangle
                const playerBottom = state.player.y + state.player.height;
                const playerLeft = state.player.x;
                const playerRight = state.player.x + state.player.width;
                
                // Check if player's bottom overlaps with spike area
                if (playerBottom > hitBox.y + hitBox.height &&
                    playerLeft < hitBox.x + hitBox.width &&
                    playerRight > hitBox.x &&
                    state.player.y < hitBox.y + hitBox.height) {
                    collided = true;
                }
            } else {
                // Rectangle collision
                collided = (
                    state.player.x < hitBox.x + hitBox.width &&
                    state.player.x + state.player.width > hitBox.x &&
                    state.player.y < hitBox.y + hitBox.height &&
                    state.player.y + state.player.height > hitBox.y
                );
            }

            if (collided) {
                if (state.player.invincible > 0) {
                    // Destroy obstacle with invincibility
                    createParticles(hitBox.x + hitBox.width / 2, hitBox.y + hitBox.height / 2, obs.color, 15);
                    state.obstacles.splice(i, 1);
                    state.combo++;
                    setScore(Math.floor(state.scoreCount / 10) + state.combo * 5); // Bonus points for combo
                    i--;
                    continue;
                } else {
                    state.combo = 0; // Reset combo on hit
                    createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, '#ef4444', 20);
                    setGameOver(true);
                    setGameActive(false);
                    playCrashSound();
                    stopMusic();
                    return;
                }
            }

            if (obs.x + obs.width < 0) {
                state.obstacles.shift();
                i--;
            }
        }

        // Update and draw power-ups (clean, visible style) - gold with glow
        for (let i = 0; i < state.powerUps.length; i++) {
            let power = state.powerUps[i];
            power.x -= state.gameSpeed;
            power.rotation += 0.15;

            // Draw power-up with rotation and glow effect (gold)
            ctx.save();
            const centerX = power.x + power.width / 2;
            const centerY = power.y + power.height / 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = power.color;
            
            const drawPowerUp = (offsetX, offsetY, color, alpha = 1) => {
                ctx.save();
                ctx.translate(centerX + offsetX, centerY + offsetY);
                ctx.rotate(power.rotation);
                ctx.fillStyle = color;
                ctx.globalAlpha = alpha;
                // Draw diamond/rotated square
                ctx.beginPath();
                ctx.moveTo(0, -power.height / 2);
                ctx.lineTo(power.width / 2, 0);
                ctx.lineTo(0, power.height / 2);
                ctx.lineTo(-power.width / 2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            };
            
            // Chromatic aberration on power-ups (subtle for gold)
            drawPowerUp(-1, -1, '#ffed4e', 0.4);
            drawPowerUp(1, 1, '#ffd700', 0.4);
            drawPowerUp(0, 0, power.color, 1);
            
            ctx.restore();
            ctx.globalAlpha = 1;

            // Collision with power-up
            if (
                state.player.x < power.x + power.width &&
                state.player.x + state.player.width > power.x &&
                state.player.y < power.y + power.height &&
                state.player.y + state.player.height > power.y
            ) {
                if (power.type === 'shield') {
                    state.player.invincible = 180; // 3 seconds at 60fps
                } else if (power.type === 'speed') {
                    state.player.speedBoost = 300; // 5 seconds
                }
                createParticles(power.x + power.width / 2, power.y + power.height / 2, power.color, 20);
                playPowerUpSound();
                state.powerUps.splice(i, 1);
                i--;
            }

            if (power.x + power.width < 0) {
                state.powerUps.shift();
                i--;
            }
        }

        // Update and draw particles (visible, glowing)
        for (let i = state.particles.length - 1; i >= 0; i--) {
            let p = state.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.vx *= 0.95;
            p.vy *= 0.95;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            // Draw glowing particle
            ctx.shadowBlur = 5;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.shadowBlur = 0;

            if (p.life <= 0) {
                state.particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1;

        requestRef.current = requestAnimationFrame(loop);
    };

    if (gameActive) requestRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('keydown', handleInput);
        window.removeEventListener('mousedown', handleInput);
        window.removeEventListener('touchstart', handleInput);
        cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, gameActive, isDark]);

  useEffect(() => {
      if (gameOver && score > highScore) {
          setHighScore(score);
          localStorage.setItem('prism_runner_hiscore', score.toString());
      }
  }, [gameOver]);

  const startGame = (e) => {
      if (e) e.stopPropagation();
      initAudio(); // Audio must resume on a user click
      gameState.current = {
          player: { x: 50, y: 220, width: 30, height: 30, dy: 0, jumpForce: 13, grounded: true, color: '#22d3ee', invincible: 0, speedBoost: 0 },
          obstacles: [],
          powerUps: [],
          particles: [],
          frames: 0,
          gameSpeed: 5,
          scoreCount: 0,
          combo: 0
      };
      setGameOver(false);
      setScore(0);
      setGameActive(true);
      gameState.current.combo = 0; // Reset combo
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="relative w-full max-w-3xl bg-[#1a0a2e] border-2 border-pink-500/50 rounded-2xl p-2 shadow-[0_0_50px_rgba(219,39,119,0.3)]">
            
            <div className="flex justify-between items-center px-4 py-2 border-b border-pink-500/20 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-pink-400 font-black tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(219,39,119,0.5)' }}>Prism Runner</span>
                    <button 
                        onClick={toggleSound} 
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${isSoundOn ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                    >
                        {isSoundOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound
                    </button>
                </div>
                <button onClick={() => { setIsOpen(false); setGameActive(false); stopMusic(); }} className="text-pink-400 hover:text-pink-300 transition-colors">
                    <X />
                </button>
            </div>

            <div 
                className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden border border-pink-500/20 select-none cursor-pointer active:scale-[0.99] transition-transform"
                onMouseDown={e => { if(gameActive) e.preventDefault(); }}
            >
                <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-contain pointer-events-none" style={{ imageRendering: 'pixelated' }} />

                <div className="absolute top-4 right-4 flex flex-col gap-2 text-mono font-bold font-mono">
                    <div className="flex gap-4">
                        <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
                        <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>SCORE <span className="text-pink-300" style={{ textShadow: '0 0 8px rgba(219,39,119,0.8)' }}>{score.toString().padStart(5, '0')}</span></div>
                    </div>
                    {gameState.current.combo > 0 && (
                        <div className="text-yellow-400 animate-pulse" style={{ textShadow: '0 0 10px rgba(250,204,21,0.8)' }}>COMBO x{gameState.current.combo}</div>
                    )}
                    {gameState.current.player.invincible > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 animate-pulse" style={{ textShadow: '0 0 10px rgba(250,204,21,0.8)' }}>
                            <Shield size={14} /> INVINCIBLE
                        </div>
                    )}
                    {gameState.current.player.speedBoost > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400 animate-pulse" style={{ textShadow: '0 0 10px rgba(250,204,21,0.8)' }}>
                            <Zap size={14} /> SPEED BOOST
                        </div>
                    )}
                </div>

                {!gameActive && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter" style={{ textShadow: '0 0 20px rgba(219,39,119,0.8), 0 0 40px rgba(219,39,119,0.4)' }}>PRISM RUNNER</h1>
                        <p className="text-pink-300 mb-6 font-mono text-sm" style={{ textShadow: '0 0 10px rgba(219,39,119,0.6)' }}>TAP or SPACE to JUMP</p>
                        <button onClick={startGame} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(219,39,119,0.5)]">
                            <Play fill="white" size={18}/> START GAME
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
                        <h2 className="text-red-400 font-black text-3xl mb-2" style={{ textShadow: '0 0 15px rgba(239,68,68,0.8)' }}>SYSTEM CRASH</h2>
                        <div className="text-xl text-white font-mono mb-6" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>Score: {score}</div>
                        {score >= highScore && score > 0 && <div className="flex items-center gap-2 text-yellow-400 font-bold mb-6 animate-bounce" style={{ textShadow: '0 0 15px rgba(250,204,21,0.8)' }}><Trophy size={20} /> NEW HIGH SCORE!</div>}
                        <button onClick={startGame} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(219,39,119,0.5)]">
                            <RotateCcw size={18}/> RESTART
                        </button>
                    </div>
                )}
            </div>
            
            <div className="text-center mt-2 text-[10px] text-pink-400/60 uppercase tracking-widest">
                Konami Code Accepted • God Mode Disabled
            </div>
        </div>
    </div>
  );
};

export default EasterEgg;
