import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import LayoutGame from '../components/LayoutGame';
import { sound } from '../../model/audio.js';
import Seed from '../../model/seed.js';
import Level from '../../model/level.js';
import Ball from '../../model/ball.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, levelList } from '../../model/config.js';

export default function SkillGame() {
  const history = useHistory();
  const location = useLocation();

  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentBallIdx, setCurrentBallIdx] = useState(0);
  const [bankedLetters, setBankedLetters] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Fallback if accessed directly without LinkToLevel
  const levelRef = useRef(null);
  const ballsRef = useRef([]);
  const particlesRef = useRef([]);
  const floatingTextsRef = useRef([]);

  // Slingshot drag state
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const stateRef = useRef({
    score: 0,
    currentBallIdx: 0,
    bankedLetters: [],
    gameOver: false,
  });

  useEffect(() => {
    // Initialize Level & Balls
    let gameLevel = location.state?.level || location.playGame?.level;
    if (!gameLevel) {
      const defaultWord = levelList[Math.floor(Math.random() * levelList.length)];
      const seed = new Seed(defaultWord);
      gameLevel = new Level(seed, 14);
    }
    levelRef.current = gameLevel;

    const canvas = canvasRef.current;
    const initialBalls = gameLevel.letters.map((letter, i) => {
      return new Ball(250, 750, 16, letter, canvas);
    });
    ballsRef.current = initialBalls;

    // Countdown timer
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          finishGame();
          return 0;
        }
        if (prev <= 6) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const finishGame = () => {
    if (stateRef.current.gameOver) return;
    stateRef.current.gameOver = true;
    setGameOver(true);
    sound.playGameOver();

    setTimeout(() => {
      const currentBanked = stateRef.current.bankedLetters.length > 0
        ? stateRef.current.bankedLetters
        : ballsRef.current.slice(0, 8).map(b => b.letter); // Graceful fallback
      history.push('/smartgame', {
        bankedLetters: currentBanked,
        skillScore: stateRef.current.score,
        targetWord: levelRef.current?.seed?.word || 'word',
      });
    }, 1500);
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const holes = levelRef.current?.holes || [
      { xPos: 200, yPos: 180, score: 1, radius: 36 },
      { xPos: 300, yPos: 180, score: 1, radius: 36 },
      { xPos: 120, yPos: 100, score: 2, radius: 30 },
      { xPos: 380, yPos: 100, score: 2, radius: 30 },
      { xPos: 250, yPos: 55, score: 5, radius: 22 },
    ];

    const foulLineY = 620;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background Grid & Arena Glow
      ctx.fillStyle = 'rgba(10, 14, 28, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Arena border
      ctx.strokeStyle = '#45b8ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

      // Draw Foul Line
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, foulLineY);
      ctx.lineTo(CANVAS_WIDTH, foulLineY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH ZONE', CANVAS_WIDTH / 2, foulLineY + 20);

      // Draw Target Holes
      holes.forEach((hole) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(hole.xPos, hole.yPos, hole.radius, 0, Math.PI * 2);
        
        if (hole.score >= 5) {
          ctx.fillStyle = '#ffb703';
          ctx.shadowColor = '#fb8500';
          ctx.shadowBlur = 20;
        } else if (hole.score === 2) {
          ctx.fillStyle = '#023e8a';
          ctx.shadowColor = '#0077b6';
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = '#14213d';
          ctx.shadowColor = '#45b8ff';
          ctx.shadowBlur = 8;
        }
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = hole.score >= 5 ? '#ffd166' : '#90e0ef';
        ctx.stroke();

        // Hole Multiplier text
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`x${hole.score}`, hole.xPos, hole.yPos + 5);
        ctx.restore();
      });

      // Banked Letters Tray at Bottom
      const trayY = 820;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(20, trayY, CANVAS_WIDTH - 40, 65);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(20, trayY, CANVAS_WIDTH - 40, 65);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BANKED LETTERS:', 30, trayY + 16);

      // Draw collected banked letters
      stateRef.current.bankedLetters.forEach((char, idx) => {
        const bx = 45 + idx * 30;
        const by = trayY + 40;
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#03fca1';
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(char, bx, by + 4);
      });

      // Draw Current Active Ball
      const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
      if (activeBall && !activeBall.isDone) {
        // Physics update
        const prevVelX = activeBall.xVel;
        const prevVelY = activeBall.yVel;

        activeBall.position();

        // Detect bounce sound
        if ((activeBall.xVel * prevVelX < 0 || activeBall.yVel * prevVelY < 0) && activeBall.speed() > 2) {
          sound.playBounce();
        }

        // Check Hole Sinks
        holes.forEach((hole) => {
          const dx = activeBall.xPos - hole.xPos;
          const dy = activeBall.yPos - hole.yPos;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < hole.radius + 2 && !activeBall.isDone) {
            activeBall.done();
            const points = (activeBall.score || 1) * hole.score * 10;
            stateRef.current.score += points;
            setScore(stateRef.current.score);

            // Bank the letter
            stateRef.current.bankedLetters.push(activeBall.letter);
            setBankedLetters([...stateRef.current.bankedLetters]);

            sound.playHoleSink(hole.score);

            // Spawn Particles
            for (let i = 0; i < 22; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 5;
              particlesRef.current.push({
                x: hole.xPos,
                y: hole.yPos,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: hole.score >= 5 ? '#ffd166' : activeBall.colour || '#03fca1',
                radius: 2 + Math.random() * 3,
                alpha: 1,
              });
            }

            // Spawn Floating Score
            floatingTextsRef.current.push({
              text: `+${points}`,
              x: hole.xPos,
              y: hole.yPos - 10,
              alpha: 1,
              color: hole.score >= 5 ? '#ffd166' : '#03fca1',
            });

            // Move to next ball
            advanceBall();
          }
        });

        // Check if ball stopped moving after launch
        if (activeBall.isClicked && activeBall.speed() < 2) {
          activeBall.done();
          // Still bank the letter even on miss!
          stateRef.current.bankedLetters.push(activeBall.letter);
          setBankedLetters([...stateRef.current.bankedLetters]);
          advanceBall();
        }

        // Render Active Ball
        ctx.save();
        ctx.beginPath();
        ctx.arc(activeBall.xPos, activeBall.yPos, activeBall.radius, 0, Math.PI * 2);
        ctx.fillStyle = activeBall.colour || '#03fca1';
        ctx.shadowColor = activeBall.colour || '#03fca1';
        ctx.shadowBlur = activeBall.isClicked ? 10 : 15;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(activeBall.letter, activeBall.xPos, activeBall.yPos + 5);
        ctx.restore();

        // Slingshot Trajectory Line while dragging
        if (dragRef.current.isDragging && !activeBall.isClicked) {
          const pullDx = dragRef.current.currentX - dragRef.current.startX;
          const pullDy = dragRef.current.currentY - dragRef.current.startY;

          // Pullback line (elastic band)
          ctx.beginPath();
          ctx.moveTo(activeBall.xPos, activeBall.yPos);
          ctx.lineTo(dragRef.current.currentX, dragRef.current.currentY);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Projected Aim Dots (opposite direction)
          const aimVx = -pullDx * 1.8;
          const aimVy = -pullDy * 1.8;

          for (let i = 1; i <= 6; i++) {
            const dotX = activeBall.xPos + (aimVx * i * 0.08);
            const dotY = activeBall.yPos + (aimVy * i * 0.08);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4 - i * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(3, 252, 161, ${1 - i * 0.15})`;
            ctx.fill();
          }
        }
      }

      // Render & Update Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render & Update Floating Texts
      floatingTextsRef.current.forEach((ft, idx) => {
        ft.y -= 1.2;
        ft.alpha -= 0.02;
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(idx, 1);
          return;
        }
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const advanceBall = () => {
    const nextIdx = stateRef.current.currentBallIdx + 1;
    stateRef.current.currentBallIdx = nextIdx;
    setCurrentBallIdx(nextIdx);

    if (nextIdx >= ballsRef.current.length) {
      finishGame();
    }
  };

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
    if (!activeBall || activeBall.isClicked) return;

    // Only allow pulling from below or near the ball
    const dist = Math.sqrt(Math.pow(x - activeBall.xPos, 2) + Math.pow(y - activeBall.yPos, 2));
    if (dist < 50 || y > 600) {
      dragRef.current = {
        isDragging: true,
        startX: activeBall.xPos,
        startY: activeBall.yPos,
        currentX: x,
        currentY: y,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);

    dragRef.current.currentX = x;
    dragRef.current.currentY = y;
  };

  const handlePointerUp = () => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;

    const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
    if (!activeBall || activeBall.isClicked) return;

    // Pullback direction: drag vector is (currentX - startX)
    // Launch impulse is in the opposite direction!
    const pullX = dragRef.current.currentX - dragRef.current.startX;
    const pullY = dragRef.current.currentY - dragRef.current.startY;

    if (Math.abs(pullX) > 5 || Math.abs(pullY) > 5) {
      sound.playLaunch();
      activeBall.giveVelocity(
        dragRef.current.currentX,
        dragRef.current.currentY,
        dragRef.current.startX,
        dragRef.current.startY
      );
    }
  };

  return (
    <LayoutGame>
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '0.5rem' }}>
        {/* HUD Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '0.6rem 1.2rem',
          marginBottom: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#90e0ef', display: 'block' }}>SCORE</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#03fca1' }}>{score}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#90e0ef', display: 'block' }}>BALLS</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {Math.max(0, ballsRef.current.length - currentBallIdx)} / {ballsRef.current.length}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#90e0ef', display: 'block' }}>TIMER</span>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: timeLeft <= 10 ? '#ff3333' : '#ffd166',
            }}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Canvas Arena Container */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(69, 184, 255, 0.2)',
          touchAction: 'none',
        }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              cursor: 'crosshair',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {gameOver && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backdropFilter: 'blur(6px)',
            }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#03fca1' }}>SKILL PHASE COMPLETE!</h2>
              <p style={{ fontSize: '1.2rem', margin: '0.5rem 0 1.5rem' }}>Skill Points: <strong>{score}</strong></p>
              <p style={{ color: '#90e0ef' }}>Advancing to Word Building Phase...</p>
            </div>
          )}
        </div>

        {/* Instructions pill */}
        <p style={{
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: '0.5rem',
        }}>
          🎯 <strong>Drag ball back & release</strong> to launch. Aim for x2 and x5 holes!
        </p>
      </div>
    </LayoutGame>
  );
}
