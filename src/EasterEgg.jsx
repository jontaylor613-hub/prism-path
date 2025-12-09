import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Play, RotateCcw } from 'lucide-react';

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
  
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const keyHistory = useRef([]);

  // Simple game state
  const gameState = useRef({
    player: { x: 50, y: 200, width: 30, height: 30, dy: 0, jumpForce: 12, grounded: true },
    obstacles: [],
    frames: 0,
    gameSpeed: 4
  });

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
    
    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 300;
  }, [isOpen]);

  // Game loop
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const groundHeight = Math.floor(canvas.height * 0.83); // 83% of canvas height
    const gravity = 0.6;
    let animationFrameId = null;

    const jump = () => {
      if (!gameActive) return;
      const p = gameState.current.player;
      if (p.grounded && p.y >= groundHeight - p.height) { 
        p.dy = -p.jumpForce;
        p.grounded = false;
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
      if (!gameActive || gameOver) return;

      const state = gameState.current;
      state.frames++;
      setScore(Math.floor(state.frames / 10));

      // Clear entire canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky background
      ctx.fillStyle = '#1a0a2e';
      ctx.fillRect(0, 0, canvas.width, groundHeight);
      
      // Ground
      ctx.fillStyle = '#2a2a3e';
      ctx.fillRect(0, groundHeight, canvas.width, canvas.height - groundHeight);

      // Ground line
      ctx.strokeStyle = '#3a3a4e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundHeight);
      ctx.lineTo(canvas.width, groundHeight);
      ctx.stroke();

      // Update player physics
      state.player.dy += gravity;
      state.player.y += state.player.dy;

      // Ground collision
      if (state.player.y >= groundHeight - state.player.height) {
        state.player.y = groundHeight - state.player.height;
        state.player.dy = 0;
        state.player.grounded = true;
      }

      // Draw player cube with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22d3ee';
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      ctx.shadowBlur = 0;

      // Spawn obstacles (every 120 frames, but increase frequency with score)
      const spawnRate = Math.max(60, 120 - Math.floor(state.frames / 500));
      if (state.frames % spawnRate === 0) {
        state.obstacles.push({
          x: canvas.width,
          y: groundHeight,
          width: 20,
          height: 30 + Math.floor(Math.random() * 20) // Vary height
        });
      }

      // Increase game speed gradually
      state.gameSpeed = 4 + Math.floor(state.frames / 1000) * 0.5;

      // Update and draw obstacles
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        let obs = state.obstacles[i];
        obs.x -= state.gameSpeed;

        // Draw obstacle with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height);
        ctx.shadowBlur = 0;

        // Improved collision detection (AABB)
        const playerRight = state.player.x + state.player.width;
        const playerBottom = state.player.y + state.player.height;
        const obsRight = obs.x + obs.width;
        const obsTop = obs.y - obs.height;

        if (
          state.player.x < obsRight &&
          playerRight > obs.x &&
          state.player.y < obs.y &&
          playerBottom > obsTop
        ) {
          setGameOver(true);
          setGameActive(false);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
          return;
        }

        // Remove off-screen obstacles
        if (obs.x + obs.width < 0) {
          state.obstacles.splice(i, 1);
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
    const groundHeight = canvas ? Math.floor(canvas.height * 0.83) : 250;
    
    gameState.current = {
      player: { 
        x: 50, 
        y: groundHeight - 30, 
        width: 30, 
        height: 30, 
        dy: 0, 
        jumpForce: 12, 
        grounded: true 
      },
      obstacles: [],
      frames: 0,
      gameSpeed: 4
    };
    setGameOver(false);
    setScore(0);
    setGameActive(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-[#1a0a2e] border-2 border-pink-500/50 rounded-2xl p-2 shadow-[0_0_50px_rgba(219,39,119,0.3)]">
        <div className="flex justify-between items-center px-4 py-2 border-b border-pink-500/20 mb-2">
          <span className="text-pink-400 font-black tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(219,39,119,0.5)' }}>Prism Runner</span>
          <button onClick={() => { setIsOpen(false); setGameActive(false); }} className="text-pink-400 hover:text-pink-300 transition-colors">
            <X />
          </button>
        </div>

        <div 
          className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden border border-pink-500/20 select-none cursor-pointer active:scale-[0.99] transition-transform"
          onMouseDown={e => { if(gameActive) e.preventDefault(); }}
        >
          <canvas ref={canvasRef} className="w-full h-full pointer-events-none" style={{ display: 'block' }} />

          <div className="absolute top-4 right-4 flex flex-col gap-2 text-mono font-bold font-mono">
            <div className="flex gap-4">
              <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>HI <span className="text-white">{highScore.toString().padStart(5, '0')}</span></div>
              <div className="text-pink-400/70" style={{ textShadow: '0 0 5px rgba(219,39,119,0.5)' }}>SCORE <span className="text-pink-300" style={{ textShadow: '0 0 8px rgba(219,39,119,0.8)' }}>{score.toString().padStart(5, '0')}</span></div>
            </div>
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
          Konami Code Accepted • Simple Cube Runner
        </div>
      </div>
    </div>
  );
};

export default EasterEgg;
