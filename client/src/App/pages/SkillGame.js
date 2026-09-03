import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import LayoutGame from '../components/LayoutGame';
import { sound } from '../../model/audio.js';
import Seed from '../../model/seed.js';
import Level from '../../model/level.js';
import Ball from '../../model/ball.js';
import { levelList, letterGroups, LetterColours } from '../../model/config.js';
import { FaInbox, FaStopwatch } from 'react-icons/fa';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 800;
const MAX_BANKED = 8;
const FOUL_LINE_Y = 520;
const BANK_ZONE_Y = 660;

export default function SkillGame() {
  const history = useHistory();
  const location = useLocation();

  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [currentBallIdx, setCurrentBallIdx] = useState(0);
  const [bankedLetters, setBankedLetters] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  const levelRef = useRef(null);
  const ballsRef = useRef([]);
  const particlesRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const watchdogTimerRef = useRef(null);

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
    isAdvancing: false,
  });

  // Sound & color helpers
  const getLetterScore = (char) => {
    for (const group in letterGroups) {
      if (group.includes(char)) return letterGroups[group];
    }
    return 1;
  };

  useEffect(() => {
    let gameLevel = location.state?.level || location.playGame?.level;
    if (!gameLevel) {
      const defaultWord = levelList[Math.floor(Math.random() * levelList.length)];
      const seed = new Seed(defaultWord);
      gameLevel = new Level(seed, 16);
    }
    levelRef.current = gameLevel;

    const canvas = canvasRef.current;
    const initialBalls = gameLevel.letters.map((letter) => {
      return new Ball(250, FOUL_LINE_Y, 16, letter, canvas);
    });
    ballsRef.current = initialBalls;

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

    return () => {
      clearInterval(timerInterval);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, []);

  const finishGame = () => {
    if (stateRef.current.gameOver) return;
    stateRef.current.gameOver = true;
    setGameOver(true);
    sound.playGameOver();

    setTimeout(() => {
      let finalBanked = stateRef.current.bankedLetters;
      if (finalBanked.length < 3) {
        const unused = ballsRef.current.map(b => b.letter).filter(l => !finalBanked.includes(l));
        while (finalBanked.length < 3 && unused.length > 0) {
          finalBanked.push(unused.shift());
        }
      }

      history.push('/smartgame', {
        bankedLetters: finalBanked,
        skillScore: stateRef.current.score,
        targetWord: levelRef.current?.seed?.word || 'word',
      });
    }, 1500);
  };

  const advanceBall = (delayMs = 200) => {
    if (stateRef.current.isAdvancing || stateRef.current.gameOver) return;
    stateRef.current.isAdvancing = true;

    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    setTimeout(() => {
      const nextIdx = stateRef.current.currentBallIdx + 1;
      stateRef.current.currentBallIdx = nextIdx;
      stateRef.current.isAdvancing = false;
      setCurrentBallIdx(nextIdx);

      if (nextIdx < ballsRef.current.length) {
        const nextBall = ballsRef.current[nextIdx];
        nextBall.xPos = 250;
        nextBall.yPos = FOUL_LINE_Y;
        nextBall.xVel = 0;
        nextBall.yVel = 0;
        nextBall.isClicked = false;
        nextBall.isDone = false;
      } else {
        finishGame();
      }
    }, delayMs);
  };

  // Bank the active letter
  const bankLetter = (char) => {
    if (stateRef.current.bankedLetters.length >= MAX_BANKED) {
      floatingTextsRef.current.push({
        text: 'BANK FULL (MAX 8)!',
        x: 250,
        y: 600,
        alpha: 1,
        color: '#ff5555',
      });
      return;
    }

    sound.playTileClick();
    stateRef.current.bankedLetters.push(char);
    setBankedLetters([...stateRef.current.bankedLetters]);

    // Green particle explosion in bank tray
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 3.5;
      particlesRef.current.push({
        x: 250,
        y: 720,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: '#03fca1',
        radius: 2 + Math.random() * 3,
        alpha: 1,
      });
    }

    floatingTextsRef.current.push({
      text: `BANKED [${char}]!`,
      x: 250,
      y: 700,
      alpha: 1,
      color: '#03fca1',
    });

    if (stateRef.current.bankedLetters.length >= MAX_BANKED) {
      setTimeout(() => finishGame(), 500);
    } else {
      advanceBall(200);
    }
  };

  const handleQuickBank = () => {
    if (stateRef.current.gameOver || stateRef.current.isAdvancing) return;
    const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
    if (!activeBall || activeBall.isClicked) return;
    activeBall.done();
    bankLetter(activeBall.letter);
  };

  // Keyboard shortcut: 'B' or Down to bank
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleQuickBank();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const holes = [
      { xPos: 180, yPos: 180, score: 1, radius: 36 },
      { xPos: 320, yPos: 180, score: 1, radius: 36 },
      { xPos: 110, yPos: 100, score: 2, radius: 30 },
      { xPos: 390, yPos: 100, score: 2, radius: 30 },
      { xPos: 250, yPos: 55, score: 5, radius: 24 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Arena background
      ctx.fillStyle = 'rgba(10, 14, 28, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Outer border
      ctx.strokeStyle = '#45b8ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

      // 1. TOP BONUS ZONE
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = 'rgba(69, 184, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('⬆️ BONUS HOLES (SHOOT UP FOR POINTS) ⬆️', CANVAS_WIDTH / 2, 22);

      // Draw Target Holes
      holes.forEach((hole) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(hole.xPos, hole.yPos, hole.radius, 0, Math.PI * 2);
        
        if (hole.score >= 5) {
          ctx.fillStyle = '#ffb703';
          ctx.shadowColor = '#fb8500';
          ctx.shadowBlur = 18;
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

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`+${hole.score * 10}pts`, hole.xPos, hole.yPos + 5);
        ctx.restore();
      });

      // 2. MID FOUL / LAUNCH LINE
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FOUL_LINE_Y);
      ctx.lineTo(CANVAS_WIDTH, FOUL_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH PAD (AIM UP FOR POINTS  •  AIM DOWN TO BANK)', CANVAS_WIDTH / 2, FOUL_LINE_Y - 12);

      // 3. BOTTOM BANK ZONE / WORD HOLE
      ctx.save();
      ctx.fillStyle = 'rgba(3, 252, 161, 0.08)';
      ctx.fillRect(16, BANK_ZONE_Y, CANVAS_WIDTH - 32, CANVAS_HEIGHT - BANK_ZONE_Y - 16);
      ctx.strokeStyle = '#03fca1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(16, BANK_ZONE_Y, CANVAS_WIDTH - 32, CANVAS_HEIGHT - BANK_ZONE_Y - 16);
      ctx.setLineDash([]);

      ctx.fillStyle = '#03fca1';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⬇️ BANK ZONE (LAUNCH DOWN TO BANK LETTER) ⬇️`, CANVAS_WIDTH / 2, BANK_ZONE_Y + 22);

      // Render Banked Letters Inside Tray
      const trayLetters = stateRef.current.bankedLetters;
      trayLetters.forEach((char, idx) => {
        const bx = 50 + (idx % 8) * 55;
        const by = BANK_ZONE_Y + 65;
        ctx.beginPath();
        ctx.arc(bx, by, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#03fca1';
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(char, bx, by + 5);
      });
      ctx.restore();

      // 4. ACTIVE BALL LOGIC & PHYSICS
      const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
      if (activeBall) {
        if (activeBall.isClicked && !activeBall.isDone) {
          const prevVelX = activeBall.xVel;
          const prevVelY = activeBall.yVel;

          activeBall.position();

          // Wall bounce sound
          if ((activeBall.xVel * prevVelX < 0 || activeBall.yVel * prevVelY < 0) && activeBall.speed() > 2) {
            sound.playBounce();
          }

          // Case A: Landed in the BOTTOM BANK ZONE!
          if (activeBall.yPos >= BANK_ZONE_Y + 10 && !activeBall.isDone) {
            activeBall.done();
            bankLetter(activeBall.letter);
          }

          // Case B: Landed in a TOP SCORE HOLE!
          holes.forEach((hole) => {
            const dx = activeBall.xPos - hole.xPos;
            const dy = activeBall.yPos - hole.yPos;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < hole.radius + 2 && !activeBall.isDone) {
              activeBall.done();
              const points = (activeBall.score || 1) * hole.score * 10;
              stateRef.current.score += points;
              setScore(stateRef.current.score);

              sound.playHoleSink(hole.score);

              // Particle explosion
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

              floatingTextsRef.current.push({
                text: `+${points} BONUS!`,
                x: hole.xPos,
                y: hole.yPos - 10,
                alpha: 1,
                color: hole.score >= 5 ? '#ffd166' : '#03fca1',
              });

              advanceBall(250);
            }
          });

          // Case C: Flew over the top edge (missed)
          if (activeBall.yPos < -activeBall.radius && !activeBall.isDone) {
            activeBall.done();
            floatingTextsRef.current.push({
              text: 'OVER THE TOP (MISSED)!',
              x: 250,
              y: 280,
              alpha: 1,
              color: '#ff6b6b',
            });
            advanceBall(250);
          }
        }

        // Case D: Ball stopped moving OR was marked done!
        if (activeBall.isClicked && (activeBall.isDone || activeBall.speed() < 4) && !stateRef.current.isAdvancing) {
          activeBall.done();
          if (activeBall.yPos >= BANK_ZONE_Y) {
            bankLetter(activeBall.letter);
          } else {
            floatingTextsRef.current.push({
              text: 'STOPPED (NO POINTS)',
              x: activeBall.xPos,
              y: activeBall.yPos - 20,
              alpha: 1,
              color: '#ffaa00',
            });
            advanceBall(250);
          }
        }

        // Draw the Ball
        if (!activeBall.isDone || !stateRef.current.isAdvancing) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(activeBall.xPos, activeBall.yPos, activeBall.radius, 0, Math.PI * 2);
          ctx.fillStyle = activeBall.colour || '#03fca1';
          ctx.shadowColor = activeBall.colour || '#03fca1';
          ctx.shadowBlur = activeBall.isClicked ? 10 : 16;
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
        }

        // Slingshot Aim Line & Predicted Trajectory
        if (dragRef.current.isDragging && !activeBall.isClicked) {
          const pullDx = dragRef.current.currentX - dragRef.current.startX;
          const pullDy = dragRef.current.currentY - dragRef.current.startY;

          ctx.beginPath();
          ctx.moveTo(activeBall.xPos, activeBall.yPos);
          ctx.lineTo(dragRef.current.currentX, dragRef.current.currentY);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4;
          ctx.stroke();

          const aimVx = -pullDx * 1.8;
          const aimVy = -pullDy * 1.8;
          const isAimingDown = aimVy > 0;

          for (let i = 1; i <= 6; i++) {
            const dotX = activeBall.xPos + (aimVx * i * 0.08);
            const dotY = activeBall.yPos + (aimVy * i * 0.08);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 4.5 - i * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = isAimingDown 
              ? `rgba(3, 252, 161, ${1 - i * 0.15})` 
              : `rgba(69, 184, 255, ${1 - i * 0.15})`;
            ctx.fill();
          }
        }
      }

      // Render Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
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

      // Render Floating Texts
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
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Pointer drag event handlers
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

    const dist = Math.sqrt(Math.pow(x - activeBall.xPos, 2) + Math.pow(y - activeBall.yPos, 2));
    if (dist < 70) {
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

      // Watchdog safety timer: force advance after 4.5s so ball NEVER gets stuck
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        if (!stateRef.current.isAdvancing) {
          advanceBall(100);
        }
      }, 4500);
    }
  };

  const activeBall = ballsRef.current[currentBallIdx];

  return (
    <LayoutGame>
      {/* Responsive Widescreen Layout (Fits in viewport without vertical scrolling!) */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.2rem 1rem',
        height: 'calc(100vh - 10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}>
        
        {/* Main 3-Column Arena Container */}
        <div style={{
          display: 'flex',
          gap: '1.2rem',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: 0,
        }}>

          {/* LEFT PANEL: Current Ball & Instructions */}
          <div style={{
            flex: '0 0 240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: 'white',
          }} className="is-hidden-touch">
            
            {/* Active Ball Preview Card */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#90e0ef', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CURRENT LETTER
              </span>
              
              <div style={{ margin: '1rem auto' }}>
                {activeBall ? (
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: activeBall.colour || '#03fca1',
                    color: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: `0 0 20px ${activeBall.colour || '#03fca1'}`,
                    fontWeight: 900,
                    fontSize: '2rem',
                    position: 'relative',
                  }}>
                    {activeBall.letter}
                    <span style={{ fontSize: '0.75rem', position: 'absolute', bottom: '4px', right: '12px' }}>
                      {getLetterScore(activeBall.letter)}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>Ready</span>
                )}
              </div>

              <button
                onClick={handleQuickBank}
                disabled={!activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #03fca1, #00b4d8)',
                  border: 'none',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  padding: '0.7rem 0.5rem',
                  borderRadius: '10px',
                  cursor: !activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED ? 'not-allowed' : 'pointer',
                  opacity: !activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(3, 252, 161, 0.3)',
                }}
              >
                <FaInbox /> QUICK BANK (B)
              </button>
            </div>

            {/* How to Play Guide */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '1rem',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 800, color: '#ffd166', marginBottom: '0.5rem' }}>
                HOW TO AIM & PLAY:
              </div>
              <p style={{ margin: '0 0 0.5rem' }}>
                🎯 <strong>Drag ball back</strong> to load slingshot tension.
              </p>
              <p style={{ margin: '0 0 0.5rem', color: '#03fca1' }}>
                ⬇️ <strong>Launch DOWN</strong> into the Bank Zone to keep letter for spelling!
              </p>
              <p style={{ margin: 0, color: '#45b8ff' }}>
                ⬆️ <strong>Launch UP</strong> into the upper holes for bonus score!
              </p>
            </div>
          </div>

          {/* CENTER: Canvas Arena (Scaled to fit viewport perfectly without scrolling) */}
          <div style={{
            position: 'relative',
            height: 'min(82vh, 740px)',
            aspectRatio: '500 / 800',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6), 0 0 25px rgba(69, 184, 255, 0.25)',
            touchAction: 'none',
            flexShrink: 0,
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                width: '100%',
                height: '100%',
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

            {/* Game Over Transition Screen */}
            {gameOver && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                backdropFilter: 'blur(8px)',
                padding: '1.5rem',
                textAlign: 'center',
              }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#03fca1', margin: 0 }}>
                  SKILL ROUND OVER!
                </h2>
                <p style={{ fontSize: '1.2rem', margin: '0.8rem 0' }}>
                  Bonus Points: <strong style={{ color: '#45b8ff' }}>{score}</strong>
                </p>
                <p style={{ fontSize: '1.1rem', margin: '0 0 1.2rem' }}>
                  Banked Letters: <strong style={{ color: '#03fca1' }}>{bankedLetters.join(' ')}</strong>
                </p>
                <p style={{ color: '#90e0ef' }}>Advancing to Word Crafting Phase...</p>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Score, Timer & Banked Letters Rack */}
          <div style={{
            flex: '0 0 240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            color: 'white',
          }} className="is-hidden-touch">
            
            {/* Score & Timer Card */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#90e0ef', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SKILL SCORE
                </span>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#45b8ff', lineHeight: 1.1 }}>
                  {score}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#90e0ef', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <FaStopwatch /> TIME REMAINING
                </span>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: timeLeft <= 10 ? '#ff3333' : '#ffd166',
                  lineHeight: 1.1,
                }}>
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Banked Tray Preview Card */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.85)',
              border: '1px solid rgba(3, 252, 161, 0.3)',
              borderRadius: '16px',
              padding: '1.2rem',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#03fca1', fontWeight: 800 }}>
                  BANKED LETTERS
                </span>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {bankedLetters.length} / {MAX_BANKED}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
                minHeight: '80px',
              }}>
                {Array.from({ length: MAX_BANKED }).map((_, i) => {
                  const letter = bankedLetters[i];
                  return (
                    <div key={i} style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      background: letter ? 'rgba(3, 252, 161, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: letter ? '1px solid #03fca1' : '1px dashed rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.2rem',
                      color: letter ? '#fff' : 'transparent',
                    }}>
                      {letter || ''}
                    </div>
                  );
                })}
              </div>

              <span style={{
                fontSize: '0.75rem',
                color: bankedLetters.length >= 3 ? '#03fca1' : '#ffd166',
                display: 'block',
                marginTop: '0.6rem',
                textAlign: 'center',
              }}>
                {bankedLetters.length >= 3
                  ? '✓ Enough letters for word phase!'
                  : `Need at least ${3 - bankedLetters.length} more!`}
              </span>
            </div>

            {/* Balls Remaining Rack */}
            <div style={{
              background: 'rgba(10, 14, 28, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '0.8rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Balls Remaining:</span>
              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                {Math.max(0, ballsRef.current.length - currentBallIdx)}
              </strong>
            </div>

          </div>

        </div>

      </div>
    </LayoutGame>
  );
}
