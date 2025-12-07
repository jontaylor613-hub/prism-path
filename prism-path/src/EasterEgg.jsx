import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw } from 'lucide-react';
import { getTheme } from './utils';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
  'b', 'a', 'Enter'
];

const EasterEgg = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('prism_runner_hiscore') || '0'));
  
  // Track inputs for the code
  const [inputHistory, setInputHistory] = useState([]);

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // --- GAME STATE REF ---
  // Stores all game variables in a mutable object that doesn't trigger re-renders
  const gameState = useRef({
      player: {
          x: 50,
          y: 220,
          width: 30,
          height: 30,
          dy: 0,
          jumpForce: 13, // Increased slightly
          grounded: true,
          color: '#22d3ee' 
      },
      obstacles: [],
      frames: 0,
      gameSpeed: 5,
      scoreCount: 0
  });

  // --- 1. KONAMI CODE LISTENER ---
  useEffect(() => {
    const handleCodeEntry = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (isOpen) return; // Don't track code if game is open

      setInputHistory((prev) => {
        const newHistory = [...prev, e.key];
        if (newHistory.length > KONAMI_CODE.length) newHistory.shift();
        
        if (JSON.stringify(newHistory) === JSON.stringify(KONAMI_CODE)) {
          setIsOpen(true);
          return [];
        }
        return newHistory;
      });
    };

    window.addEventListener('keydown', handleCodeEntry);
    return () => window.removeEventListener('keydown', handleCodeEntry);
  }, [isOpen]);

  // --- 2. GAME ENGINE & INPUTS ---
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const groundHeight = 250;
    const gravity = 0.7;

    // --- INPUT HANDLING (Inside Effect to access current Ref) ---
    const jump = () => {
        if (!gameActive) return;
        const p = gameState.current.player;
        // Simple check: If near ground, allow jump
        if (p.y >= groundHeight - p.height - 5) { 
            p.dy = -p.jumpForce;
            p.grounded = false;
        }
    };

    const handleInput = (e) => {
        // Space or Arrow Up
        if (e.type === 'keydown') {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!gameActive && !gameOver) {
                    startGame(); // Space to start
                } else {
                    jump();
                }
            }
        }
        // Click or Tap
        if (e.type === 'mousedown' || e.type === 'touchstart') {
            // Check if clicking close button
            if (e.target.closest('button')) return; 
            
            e.preventDefault();
            jump();
        }
    };

    // Attach Global Listeners when game is open
    window.addEventListener('keydown', handleInput);
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, { passive: false });

    // --- MAIN LOOP ---
    const loop = () => {
        if (!gameActive) return;

        const state = gameState.current;
        state.frames++;
        state.scoreCount++;
        setScore(Math.floor(state.scoreCount / 10));

        // Speed Progression
        if (state.frames % 1000 === 0) state.gameSpeed += 1;

        // 1. Draw Background
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Ground
        ctx.beginPath();
        ctx.moveTo(0, groundHeight);
        ctx.lineTo(canvas.width, groundHeight);
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Player Physics
        state.player.dy += gravity;
        state.player.y += state.player.dy;

        // Ground Collision
        if (state.player.y > groundHeight - state.player.height) {
            state.player.y = groundHeight - state.player.height;
            state.player.dy = 0;
            state.player.grounded = true;
        }

        // Draw Player
        ctx.fillStyle = state.player.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = state.player.color;
        ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
        ctx.shadowBlur = 0;

        // 4. Obstacle Logic
        // Spawn Rate
        if (state.frames % 100 === 0 || (state.frames % 60 === 0 && Math.random() > 0.6 && state.gameSpeed > 8)) {
            state.obstacles.push({
                x: canvas.width,
                y: groundHeight - 30,
                width: 20,
                height: Math.random() > 0.5 ? 30 : 50,
                color: '#d946ef' // Fuchsia
            });
        }

        // Move & Draw Obstacles
        for (let i = 0; i < state.obstacles.length; i++) {
            let obs = state.obstacles[i];
            obs.x -= state.gameSpeed;

            ctx.fillStyle = obs.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = obs.color;
            ctx.fillRect(obs.x, obs.y - (obs.height - 30), obs.width, obs.height);
            ctx.shadowBlur = 0;

            // Collision Check (AABB)
            if (
                state.player.x < obs.x + obs.width &&
                state.player.x + state.player.width > obs.x &&
                state.player.y < obs.y + 30 &&
                state.player.y + state.player.height > obs.y - (obs.height - 30)
            ) {
                setGameOver(true);
                setGameActive(false);
                return; // Stop Loop
            }

            // Despawn
            if (obs.x + obs.width < 0) {
                state.obstacles.shift();
                i--;
            }
        }

        requestRef.current = requestAnimationFrame(loop);
    };

    if (gameActive) {
        requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
        window.removeEventListener('keydown', handleInput);
        window.removeEventListener('mousedown', handleInput);
        window.removeEventListener('touchstart', handleInput);
        cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, gameActive, isDark]);

  // High Score Logic
  useEffect(() => {
      if (gameOver && score > highScore) {
          setHighScore(score);
          localStorage.setItem('prism_runner_hiscore', score.toString());
      }
  }, [gameOver]);

  const startGame = () => {
      // Reset Ref Data
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
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-fuchsia-500 font-black tracking-widest uppercase">Prism Runner</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">Dev Mode</span>
                </div>
                <button onClick={() => { setIsOpen(false); setGameActive(false); }} className="text-slate-400 hover:text-white transition-colors">
                    <X />
                </button>
            </div>

            {/* Game Canvas */}
            <div className="relative w-full h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-white/5 select-none cursor-pointer">
                <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-contain pointer-events-none" />

                {/* Score UI */}
                <div className="absolute top-4 right-4 flex gap-4 text-mono font-bold font-mono">
                    <div className="text-slate-400">HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
                    <div className="text-slate-400">SCORE <span className="text-cyan-400">{score.toString().padStart(5, '0')}</span></div>
                </div>

                {/* Start Screen */}
                {!gameActive && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">PRISM RUNNER</h1>
                        <p className="text-cyan-400 mb-6 font-mono text-sm">PRESS SPACE OR CLICK TO JUMP</p>
                        <button onClick={startGame} className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95">
                            <Play fill="white" size={18}/> START GAME
                        </button>
                    </div>
                )}

                {/* Game Over Screen */}
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
