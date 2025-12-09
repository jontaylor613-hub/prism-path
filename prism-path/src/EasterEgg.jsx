import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw, Zap, Shield, Star, Clock } from 'lucide-react';

const EasterEgg = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('prism_runner_hiscore') || '0'));
  const [activePowerups, setActivePowerups] = useState({});
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const keyHistory = useRef([]);
  const audioContextRef = useRef(null);

  // Simple game state - Geometry Jump style
  const gameState = useRef({
    player: { x: 50, y: 200, width: 40, height: 40, dy: 0, jumpForce: 15, grounded: true },
    obstacles: [],
    powerups: [],
    frames: 0,
    gameSpeed: 5,
    powerupEffects: {
      shield: { active: false, frames: 0 },
      speedBoost: { active: false, frames: 0 },
      scoreMultiplier: { active: false, frames: 0, multiplier: 1 },
      slowMotion: { active: false, frames: 0 }
    }
  });

  // Initialize audio context for 8-bit sounds
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, []);

  // 8-bit style sound effects
  const playSound = (type) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Early arcade game sound patterns
    switch(type) {
      case 'jump':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case 'powerup':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
      case 'crash':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;
      case 'score':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.05);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
    }
  };

  // Konami code detection
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

  // Setup canvas size
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 300;
  }, [isOpen]);

  // Game loop - Simple and smooth like Geometry Jump
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const groundHeight = Math.floor(canvas.height * 0.85);
    const gravity = 0.8;
    let animationFrameId = null;

    const jump = () => {
      if (!gameActive) return;
      const p = gameState.current.player;
      if (p.grounded && p.y >= groundHeight - p.height) { 
        p.dy = -p.jumpForce;
        p.grounded = false;
        playSound('jump');
      }
    };

    const handleInput = (e) => {
      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w') {
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
      if (!gameActive || gameOver) return;

      const state = gameState.current;
      state.frames++;
      
      // Update powerup effects
      const effects = state.powerupEffects;
      const powerupStatus = {};
      if (effects.shield.active) {
        effects.shield.frames--;
        if (effects.shield.frames <= 0) effects.shield.active = false;
        else powerupStatus.shield = true;
      }
      if (effects.speedBoost.active) {
        effects.speedBoost.frames--;
        if (effects.speedBoost.frames <= 0) effects.speedBoost.active = false;
        else powerupStatus.speedBoost = true;
      }
      if (effects.scoreMultiplier.active) {
        effects.scoreMultiplier.frames--;
        if (effects.scoreMultiplier.frames <= 0) {
          effects.scoreMultiplier.active = false;
          effects.scoreMultiplier.multiplier = 1;
        } else powerupStatus.scoreMultiplier = true;
      }
      if (effects.slowMotion.active) {
        effects.slowMotion.frames--;
        if (effects.slowMotion.frames <= 0) effects.slowMotion.active = false;
        else powerupStatus.slowMotion = true;
      }
      setActivePowerups(powerupStatus);
      
      // Calculate score with multiplier
      const baseScore = Math.floor(state.frames / 10);
      const multiplier = effects.scoreMultiplier.multiplier;
      setScore(Math.floor(baseScore * multiplier));

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simple gradient background - Geometry Jump style
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0a0a');
      bgGradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground - simple line
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundHeight);
      ctx.lineTo(canvas.width, groundHeight);
      ctx.stroke();

      // Player physics - smooth and responsive
      state.player.dy += gravity;
      state.player.y += state.player.dy;

      // Ground collision
      if (state.player.y >= groundHeight - state.player.height) {
        state.player.y = groundHeight - state.player.height;
        state.player.dy = 0;
        state.player.grounded = true;
      }

      // Draw player - simple geometric shape (Geometry Jump style)
      // Shield effect visual
      if (state.powerupEffects.shield.active) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
          state.player.x + state.player.width / 2,
          state.player.y + state.player.height / 2,
          state.player.width / 2 + 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      
      // Simple outline for visibility
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(state.player.x, state.player.y, state.player.width, state.player.height);

      // Spawn obstacles - simple blocks
      const spawnRate = Math.max(80, 150 - Math.floor(state.frames / 300));
      if (state.frames % spawnRate === 0) {
        const height = 30 + Math.floor(Math.random() * 40);
        state.obstacles.push({
          x: canvas.width,
          y: groundHeight - height,
          width: 25,
          height: height
        });
      }

      // Spawn powerups (less frequently)
      if (state.frames % 400 === 0 && Math.random() < 0.3) {
        const powerupTypes = ['shield', 'speedBoost', 'scoreMultiplier', 'slowMotion'];
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        state.powerups.push({
          x: canvas.width,
          y: groundHeight - 30,
          width: 20,
          height: 20,
          type: type,
          rotation: 0
        });
      }

      // Gradually increase speed (unless slow motion is active)
      const baseSpeed = 5 + Math.floor(state.frames / 500) * 0.3;
      state.gameSpeed = state.powerupEffects.slowMotion.active 
        ? baseSpeed * 0.5 
        : (state.powerupEffects.speedBoost.active ? baseSpeed * 1.5 : baseSpeed);

      // Update and draw powerups
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        let pwr = state.powerups[i];
        pwr.x -= state.gameSpeed;
        pwr.rotation += 0.1;

        // Draw powerup with rotation effect
        ctx.save();
        ctx.translate(pwr.x + pwr.width / 2, pwr.y + pwr.height / 2);
        ctx.rotate(pwr.rotation);
        
        // Different colors for different powerups
        const colors = {
          shield: '#fbbf24',
          speedBoost: '#3b82f6',
          scoreMultiplier: '#10b981',
          slowMotion: '#8b5cf6'
        };
        ctx.fillStyle = colors[pwr.type] || '#ffffff';
        ctx.fillRect(-pwr.width / 2, -pwr.height / 2, pwr.width, pwr.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-pwr.width / 2, -pwr.height / 2, pwr.width, pwr.height);
        ctx.restore();

        // Powerup collision detection
        if (
          state.player.x < pwr.x + pwr.width &&
          state.player.x + state.player.width > pwr.x &&
          state.player.y < pwr.y + pwr.height &&
          state.player.y + state.player.height > pwr.y
        ) {
          playSound('powerup');
          
          // Apply powerup effect
          switch(pwr.type) {
            case 'shield':
              effects.shield.active = true;
              effects.shield.frames = 300; // 5 seconds at 60fps
              break;
            case 'speedBoost':
              effects.speedBoost.active = true;
              effects.speedBoost.frames = 240; // 4 seconds
              break;
            case 'scoreMultiplier':
              effects.scoreMultiplier.active = true;
              effects.scoreMultiplier.frames = 300; // 5 seconds
              effects.scoreMultiplier.multiplier = 2;
              break;
            case 'slowMotion':
              effects.slowMotion.active = true;
              effects.slowMotion.frames = 180; // 3 seconds
              break;
          }
          
          state.powerups.splice(i, 1);
        }

        // Remove off-screen powerups
        if (pwr.x + pwr.width < 0) {
          state.powerups.splice(i, 1);
        }
      }

      // Update and draw obstacles - simple blocks
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        let obs = state.obstacles[i];
        obs.x -= state.gameSpeed;

        // Draw obstacle - simple block
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        // Simple collision detection (skip if shield is active)
        if (!state.powerupEffects.shield.active &&
          state.player.x < obs.x + obs.width &&
          state.player.x + state.player.width > obs.x &&
          state.player.y < obs.y + obs.height &&
          state.player.y + state.player.height > obs.y
        ) {
          playSound('crash');
          setGameOver(true);
          setGameActive(false);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          return;
        }

        // Remove off-screen obstacles (score point)
        if (obs.x + obs.width < 0) {
          state.obstacles.splice(i, 1);
          // Play score sound occasionally to avoid too many sounds
          if (state.frames % 50 === 0) {
            playSound('score');
          }
        }
      }

      if (gameActive && !gameOver) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (gameActive && !gameOver) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('keydown', handleInput);
      window.removeEventListener('mousedown', handleInput);
      window.removeEventListener('touchstart', handleInput);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, gameActive, gameOver, isDark]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('prism_runner_hiscore', score.toString());
    }
  }, [gameOver, score, highScore]);

  const startGame = (e) => {
    if (e) e.stopPropagation();
    const canvas = canvasRef.current;
    const groundHeight = canvas ? Math.floor(canvas.height * 0.85) : 250;
    
    gameState.current = {
      player: { 
        x: 50, 
        y: groundHeight - 40, 
        width: 40, 
        height: 40, 
        dy: 0, 
        jumpForce: 15, 
        grounded: true 
      },
      obstacles: [],
      powerups: [],
      frames: 0,
      gameSpeed: 5,
      powerupEffects: {
        shield: { active: false, frames: 0 },
        speedBoost: { active: false, frames: 0 },
        scoreMultiplier: { active: false, frames: 0, multiplier: 1 },
        slowMotion: { active: false, frames: 0 }
      }
    };
    setGameOver(false);
    setScore(0);
    setActivePowerups({});
    setGameActive(true);
    playSound('jump'); // Start sound
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#1a0a2e] border-2 border-pink-500/50 rounded-2xl p-2 shadow-[0_0_50px_rgba(219,39,119,0.3)]">
        <div className="flex justify-between items-center px-4 py-2 border-b border-pink-500/20 mb-2">
          <span className="text-pink-400 font-black tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(219,39,119,0.5)' }}>Prism Jump</span>
          <button onClick={() => { setIsOpen(false); setGameActive(false); }} className="text-pink-400 hover:text-pink-300 transition-colors">
            <X />
          </button>
        </div>

        <div 
          className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden border border-pink-500/20 select-none cursor-pointer"
          onMouseDown={e => { if(gameActive) e.preventDefault(); }}
        >
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" style={{ display: 'block' }} />

          <div className="absolute top-4 right-4 flex flex-col gap-2 text-mono font-bold font-mono">
            <div className="flex gap-4">
              <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
              <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>SCORE <span className="text-pink-300" style={{ textShadow: '0 0 8px rgba(219,39,119,0.8)' }}>{score.toString().padStart(5, '0')}</span></div>
            </div>
            {/* Active Powerups Display */}
            {gameActive && Object.keys(activePowerups).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {activePowerups.shield && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 text-xs animate-pulse">
                    <Shield size={12} /> SHIELD
                  </div>
                )}
                {activePowerups.speedBoost && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs animate-pulse">
                    <Zap size={12} /> SPEED
                  </div>
                )}
                {activePowerups.scoreMultiplier && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-xs animate-pulse">
                    <Star size={12} /> 2X
                  </div>
                )}
                {activePowerups.slowMotion && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 text-xs animate-pulse">
                    <Clock size={12} /> SLOW
                  </div>
                )}
              </div>
            )}
          </div>

          {!gameActive && !gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter" style={{ textShadow: '0 0 20px rgba(219,39,119,0.8), 0 0 40px rgba(219,39,119,0.4)' }}>PRISM JUMP</h1>
              <p className="text-pink-300 mb-6 font-mono text-sm" style={{ textShadow: '0 0 10px rgba(219,39,119,0.6)' }}>TAP or SPACE to JUMP</p>
              <button onClick={startGame} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(219,39,119,0.5)]">
                <Play fill="white" size={18}/> START GAME
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
              <h2 className="text-red-400 font-black text-3xl mb-2" style={{ textShadow: '0 0 15px rgba(239,68,68,0.8)' }}>GAME OVER</h2>
              <div className="text-xl text-white font-mono mb-6" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>Score: {score}</div>
              {score >= highScore && score > 0 && <div className="flex items-center gap-2 text-yellow-400 font-bold mb-6 animate-bounce" style={{ textShadow: '0 0 15px rgba(250,204,21,0.8)' }}><Trophy size={20} /> NEW HIGH SCORE!</div>}
              <button onClick={startGame} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(219,39,119,0.5)]">
                <RotateCcw size={18}/> RESTART
              </button>
            </div>
          )}
        </div>
        
        <div className="text-center mt-2 text-[10px] text-pink-400/60 uppercase tracking-widest">
          Konami Code Accepted • Geometry Jump Style
        </div>
      </div>
    </div>
  );
};

export default EasterEgg;
