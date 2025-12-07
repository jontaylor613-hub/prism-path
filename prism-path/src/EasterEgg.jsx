import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
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
      player: { x: 50, y: 220, width: 30, height: 30, dy: 0, jumpForce: 13, grounded: true, color: '#22d3ee' },
      obstacles: [],
      frames: 0,
      gameSpeed: 5,
      scoreCount: 0
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

  const startMusic = () => {
      if (!audioCtxRef.current) initAudio();
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
      if (!soundRef.current) return;

      const ctx = audioCtxRef.current;
      let noteIndex = 0;
      const bassline = [65.41, 65.41, 77.78, 87.31]; 

      const playNote = () => {
          if (!soundRef.current) return; // Double check inside interval
          const t = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = 'sawtooth';
          osc.frequency.value = bassline[noteIndex % bassline.length];
          filter.type = 'lowpass';
          filter.frequency.value = 800;
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.2);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
          noteIndex++;
      };
      playNote();
      musicIntervalRef.current = setInterval(playNote, 250);
  };

  const stopMusic = () => {
      if (musicIntervalRef.current) {
          clearInterval(musicIntervalRef.current);
          musicIntervalRef.current = null;
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

        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ground
        ctx.beginPath();
        ctx.moveTo(0, groundHeight);
        ctx.lineTo(canvas.width, groundHeight);
        ctx.strokeStyle = isDark ? '#f0abfc' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Player
        state.player.dy += gravity;
        state.player.y += state.player.dy;

        if (state.player.y > groundHeight - state.player.height) {
            state.player.y = groundHeight - state.player.height;
            state.player.dy = 0;
            state.player.grounded = true;
        }

        ctx.fillStyle = state.player.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = state.player.color;
        ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
        ctx.shadowBlur = 0;

        // Obstacles
        if (state.frames % 100 === 0 || (state.frames % 60 === 0 && Math.random() > 0.6 && state.gameSpeed > 8)) {
            state.obstacles.push({
                x: canvas.width,
                y: groundHeight - 30,
                width: 20,
                height: Math.random() > 0.5 ? 30 : 50,
                color: '#d946ef'
            });
        }

        for (let i = 0; i < state.obstacles.length; i++) {
            let obs = state.obstacles[i];
            obs.x -= state.gameSpeed;

            ctx.fillStyle = obs.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = obs.color;
            ctx.fillRect(obs.x, obs.y - (obs.height - 30), obs.width, obs.height);
            ctx.shadowBlur = 0;

            if (
                state.player.x < obs.x + obs.width &&
                state.player.x + state.player.width > obs.x &&
                state.player.y < obs.y + 30 &&
                state.player.y + state.player.height > obs.y - (obs.height - 30)
            ) {
                setGameOver(true);
                setGameActive(false);
                playCrashSound();
                stopMusic();
                return;
            }

            if (obs.x + obs.width < 0) {
                state.obstacles.shift();
                i--;
            }
        }

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
          player: { x: 50, y: 220, width: 30, height: 30, dy: 0, jumpForce: 13, grounded: true, color: '#22d3ee' },
          obstacles: [],
          frames: 0,
          gameSpeed: 5,
          scoreCount: 0
      };
      setGameOver(false);
      setScore(0);
      setGameActive(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-2 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-fuchsia-500 font-black tracking-widest uppercase">Prism Runner</span>
                    <button 
                        onClick={toggleSound} 
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${isSoundOn ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                    >
                        {isSoundOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Sound
                    </button>
                </div>
                <button onClick={() => { setIsOpen(false); setGameActive(false); stopMusic(); }} className="text-slate-400 hover:text-white transition-colors">
                    <X />
                </button>
            </div>

            <div 
                className="relative w-full h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-white/5 select-none cursor-pointer active:scale-[0.99] transition-transform"
                onMouseDown={e => { if(gameActive) e.preventDefault(); }}
            >
                <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-contain pointer-events-none" />

                <div className="absolute top-4 right-4 flex gap-4 text-mono font-bold font-mono">
                    <div className="text-slate-400">HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
                    <div className="text-slate-400">SCORE <span className="text-cyan-400">{score.toString().padStart(5, '0')}</span></div>
                </div>

                {!gameActive && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">PRISM RUNNER</h1>
                        <p className="text-cyan-400 mb-6 font-mono text-sm">TAP or SPACE to JUMP</p>
                        <button onClick={startGame} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95">
                            <Play fill="white" size={18}/> START GAME
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in zoom-in duration-200">
                        <h2 className="text-red-500 font-black text-3xl mb-2">SYSTEM CRASH</h2>
                        <div className="text-xl text-white font-mono mb-6">Score: {score}</div>
                        {score >= highScore && score > 0 && <div className="flex items-center gap-2 text-yellow-400 font-bold mb-6 animate-bounce"><Trophy size={20} /> NEW HIGH SCORE!</div>}
                        <button onClick={startGame} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95">
                            <RotateCcw size={18}/> RESTART
                        </button>
                    </div>
                )}
            </div>
            
            <div className="text-center mt-2 text-[10px] text-slate-500 uppercase tracking-widest">
                Konami Code Accepted • God Mode Disabled
            </div>
        </div>
    </div>
  );
};

export default EasterEgg;
