import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw } from 'lucide-react';
import { getTheme } from './utils';

// The Sacred Code
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
  'b', 'a', 'Enter'
];

const EasterEgg = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputHistory, setInputHistory] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('prism_runner_hiscore') || '0'));
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // GAME STATE REF
  // We use a ref so the event listener always sees the current position/grounded state
  const gameState = useRef({
      player: {
          x: 50,
          y: 220, // Start ON THE GROUND (250 - 30 height) to fix jump bug
          width: 30,
          height: 30,
          dy: 0,
          jumpForce: 12,
          grounded: true, // Start grounded
          color: '#22d3ee' // Cyan
      },
      obstacles: [],
      frames: 0,
      gameSpeed: 5,
      scoreCount: 0
  });

  // --- 1. KONAMI LISTENER (With Safety Check) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // SAFETY CHECK: Ignore input fields so users don't trigger it accidentally
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // If game is open, prevent scrolling but don't handle game logic here
      if (isOpen) {
          if (e.code === 'Space' || e.key === 'ArrowUp') {
              e.preventDefault(); 
          }
          return;
      }

      setInputHistory((prev) => {
        const newHistory = [...prev, e.key];
        if (newHistory.length > KONAMI_CODE.length) {
          newHistory.shift();
        }
        
        if (JSON.stringify(newHistory) === JSON.stringify(KONAMI_CODE)) {
          setIsOpen(true); 
          return [];
        }
        return newHistory;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // --- 2. GAME INPUT HANDLER (Separate Effect) ---
  useEffect(() => {
      if (!isOpen || !gameActive) return;

      const handleGameInput = (e) => {
          if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
              e.preventDefault(); // Stop scrolling
              const p = gameState.current.player;
              
              // Only jump if strictly grounded
              if (p.grounded) {
                  p.dy = -p.jumpForce;
                  p.grounded = false;
              }
          }
      };

      window.addEventListener('keydown', handleGameInput);
      return () => window.removeEventListener('keydown', handleGameInput);
  }, [isOpen, gameActive]);

  // --- 3. GAME LOOP ENGINE ---
  useEffect(() => {
    if (!isOpen || !gameActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const groundHeight = 250;
    const gravity = 0.6;

    // Reset State on Start
    gameState.current = {
        player: { 
            x: 50, 
            y: 220, // 250 (ground) - 30 (height)
            width: 30, 
            height: 30, 
            dy: 0, 
            jumpForce: 12, 
            grounded: true, 
            color: '#22d3ee' 
        },
        obstacles: [],
        frames: 0,
        gameSpeed: 5,
        scoreCount: 0
    };

    const loop = () => {
        const state = gameState.current;
        state.frames++;
        state.scoreCount++;
        setScore(Math.floor(state.scoreCount / 10));

        if (state.frames % 1000 === 0) state.gameSpeed += 1; 

        // Clear
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ground
        ctx.beginPath();
        ctx.moveTo(0, groundHeight);
        ctx.lineTo(canvas.width, groundHeight);
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- PLAYER PHYSICS ---
        // Apply Gravity
        if (state.player.y < groundHeight - state.player.height) {
            state.player.dy += gravity;
            state.player.grounded = false;
        } else {
            // Hit Ground
            state.player.dy = 0;
            state.player.grounded = true;
            state.player.y = groundHeight - state.player.height;
        }
        
        state.player.y += state.player.dy;

        // Draw Player
        ctx.fillStyle = state.player.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = state.player.color;
        ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
        ctx.shadowBlur = 0;

        // --- OBSTACLES ---
        if (state.frames % 100 === 0 || (state.frames % 60 === 0 && Math.random() > 0.7 && state.gameSpeed > 8)) {
            state.obstacles.push({
                x: canvas.width,
                y: groundHeight - 30,
                width: 20,
                height: Math.random() > 0.5 ? 30 : 50,
                color: '#d946ef' // Fuchsia
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

            // Collision
            if (
                state.player.x < obs.x + obs.width &&
                state.player.x + state.player.width > obs.x &&
                state.player.y < obs.y + 30 &&
                state.player.y + state.player.height > obs.y - (obs.height - 30)
            ) {
                setGameOver(true);
                setGameActive(false);
                cancelAnimationFrame(requestRef.current);
                return;
            }

            if (obs.x + obs.width < 0) {
                state.obstacles.shift();
                i--;
            }
        }

        requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
        cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, gameActive, isDark]);

  // High Score Logic
  useEffect(() => {
      if (gameOver && score > highScore) {
          setHighScore(score);
          localStorage.setItem('prism_runner_hiscore', score.toString());
      }
  }, [gameOver, score, highScore]);

  const startGame = () => {
      setGameActive(true);
      setGameOver(false);
      setScore(0);
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
            <div className="relative w-full h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-white/5">
                <canvas ref={canvasRef} width={800} height={300} className="w-full h-full object-contain" />

                <div className="absolute top-4 right-4 flex gap-4 text-mono font-bold font-mono">
                    <div className="text-slate-400">HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
                    <div className="text-slate-400">SCORE <span className="text-cyan-400">{score.toString().padStart(5, '0')}</span></div>
                </div>

                {!gameActive && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">PRISM RUNNER</h1>
                        <p className="text-cyan-400 mb-6 font-mono text-sm">PRESS SPACE TO JUMP</p>
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
