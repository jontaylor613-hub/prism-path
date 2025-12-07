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
  const [inputHistory, setInputHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('prism_runner_hiscore') || '0'));
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const theme = getTheme(isDark);

  // --- 1. THE LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // If game is open, handle game controls
      if (isOpen) {
          if (e.code === 'Space' || e.key === 'ArrowUp') {
              e.preventDefault(); // Stop scrolling
              // Jump logic handled in game loop via ref, but we can trigger state here if needed
          }
          return;
      }

      // If game is closed, listen for Konami Code
      setInputHistory((prev) => {
        const newHistory = [...prev, e.key];
        if (newHistory.length > KONAMI_CODE.length) {
          newHistory.shift();
        }
        
        // Check Sequence
        if (JSON.stringify(newHistory) === JSON.stringify(KONAMI_CODE)) {
          setIsOpen(true); // ACTIVATE MATRIX
          return [];
        }
        return newHistory;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // --- 2. THE GAME ENGINE ---
  useEffect(() => {
    if (!isOpen || !gameActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Game Variables
    let frames = 0;
    let gameSpeed = 5;
    let scoreCount = 0;
    
    // Player (The Brain)
    const player = {
        x: 50,
        y: 200,
        width: 30,
        height: 30,
        dy: 0,
        jumpForce: 12,
        grounded: false,
        color: '#f0abfc' // Fuchsia
    };

    // Obstacles
    let obstacles = [];

    // Physics
    const gravity = 0.6;
    const groundHeight = 250;

    const loop = () => {
        frames++;
        scoreCount++;
        setScore(Math.floor(scoreCount / 10));

        // Speed up
        if (frames % 1000 === 0) gameSpeed += 1;

        // Clear Screen
        ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Ground Line
        ctx.beginPath();
        ctx.moveTo(0, groundHeight);
        ctx.lineTo(canvas.width, groundHeight);
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- PLAYER LOGIC ---
        // Gravity
        if (player.y < groundHeight - player.height) {
            player.dy += gravity;
            player.grounded = false;
        } else {
            player.dy = 0;
            player.grounded = true;
            player.y = groundHeight - player.height;
        }
        
        player.y += player.dy;

        // Draw Player (Simple Box for now, could be an image)
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.shadowBlur = 0;

        // --- OBSTACLE LOGIC ---
        // Spawn
        if (frames % 100 === 0 || (frames % 60 === 0 && Math.random() > 0.7 && gameSpeed > 8)) {
            obstacles.push({
                x: canvas.width,
                y: groundHeight - 30, // standard height
                width: 20,
                height: Math.random() > 0.5 ? 30 : 50, // variable height
                color: '#22d3ee' // Cyan
            });
        }

        // Update Obstacles
        for (let i = 0; i < obstacles.length; i++) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            // Draw Obstacle
            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y - (obs.height - 30), obs.width, obs.height);

            // Collision Detection
            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + 30 && // approximate height adjustment
                player.y + player.height > obs.y - (obs.height - 30)
            ) {
                // GAME OVER
                setGameOver(true);
                setGameActive(false);
                cancelAnimationFrame(requestRef.current);
                return;
            }

            // Remove off-screen
            if (obs.x + obs.width < 0) {
                obstacles.shift();
                i--;
            }
        }

        requestRef.current = requestAnimationFrame(loop);
    };

    // Input Handler inside loop context
    const handleJump = (e) => {
        if ((e.code === 'Space' || e.key === 'ArrowUp') && player.grounded) {
            player.dy = -player.jumpForce;
        }
    };

    window.addEventListener('keydown', handleJump);
    requestRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('keydown', handleJump);
        cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, gameActive, isDark]);

  // Handle High Score
  useEffect(() => {
      if (gameOver) {
          if (score > highScore) {
              setHighScore(score);
              localStorage.setItem('prism_runner_hiscore', score.toString());
          }
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

            {/* Game Canvas Container */}
            <div className="relative w-full h-[300px] bg-slate-950 rounded-lg overflow-hidden border border-white/5">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={300} 
                    className="w-full h-full object-contain"
                />

                {/* UI Overlay */}
                <div className="absolute top-4 right-4 flex gap-4 text-mono font-bold">
                    <div className="text-slate-400">HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
                    <div className="text-slate-400">SCORE <span className="text-cyan-400">{score.toString().padStart(5, '0')}</span></div>
                </div>

                {/* Start Screen */}
                {!gameActive && !gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">PRISM RUNNER</h1>
                        <p className="text-cyan-400 mb-6 font-mono text-sm">PRESS SPACE TO JUMP</p>
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
                        {score >= highScore && score > 0 && (
                            <div className="flex items-center gap-2 text-yellow-400 font-bold mb-6 animate-bounce">
                                <Trophy size={20} /> NEW HIGH SCORE!
                            </div>
                        )}
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
