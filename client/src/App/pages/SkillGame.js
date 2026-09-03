import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import LayoutGame from '../components/LayoutGame';
import { sound } from '../../model/audio.js';
import Seed from '../../model/seed.js';
import Level from '../../model/level.js';
import Ball from '../../model/ball.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, levelList } from '../../model/config.js';
import { FaInbox, FaArrowUp } from 'react-icons/fa';

const MAX_BANKED = 8;

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

  useEffect(() => {
    // Initialize Level & Balls
    let gameLevel = location.state?.level || location.playGame?.level;
    if (!gameLevel) {
      const defaultWord = levelList[Math.floor(Math.random() * levelList.length)];
      const seed = new Seed(defaultWord);
      gameLevel = new Level(seed, 16);
    }
    levelRef.current = gameLevel;

    const canvas = canvasRef.current;
    const initialBalls = gameLevel.letters.map((letter) => {
      return new Ball(250, 710, 16, letter, canvas);
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
      let finalBanked = stateRef.current.bankedLetters;
      // If player banked fewer than 3 letters, ensure they have at least 3 so word phase is playable
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

  const advanceBall = (delayMs = 250) => {
    if (stateRef.current.isAdvancing) return;
    stateRef.current.isAdvancing = true;

    setTimeout(() => {
      const nextIdx = stateRef.current.currentBallIdx + 1;
      stateRef.current.currentBallIdx = nextIdx;
      stateRef.current.isAdvancing = false;
      setCurrentBallIdx(nextIdx);

      // Reset position of new ball
      if (nextIdx < ballsRef.current.length) {
        const nextBall = ballsRef.current[nextIdx];
        nextBall.xPos = 250;
        nextBall.yPos = 710;
        nextBall.xVel = 0;
        nextBall.yVel = 0;
        nextBall.isClicked = false;
        nextBall.isDone = false;
      } else {
        finishGame();
      }
    }, delayMs);
  };

  // Player chooses to bank the current letter
  const handleBankCurrentLetter = () => {
    if (stateRef.current.gameOver || stateRef.current.isAdvancing) return;
    const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
    if (!activeBall || activeBall.isClicked) return;

    if (stateRef.current.bankedLetters.length >= MAX_BANKED) {
      floatingTextsRef.current.push({
        text: 'BANK FULL (MAX 8)!',
        x: 250,
        y: 660,
        alpha: 1,
        color: '#ff5555',
      });
      return;
    }

    activeBall.done();
    sound.playTileClick();

    // Bank the letter
    stateRef.current.bankedLetters.push(activeBall.letter);
    setBankedLetters([...stateRef.current.bankedLetters]);

    // Particles on bank
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3;
      particlesRef.current.push({
        x: activeBall.xPos,
        y: activeBall.yPos,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: '#03fca1',
        radius: 2 + Math.random() * 3,
        alpha: 1,
      });
    }

    floatingTextsRef.current.push({
      text: `BANKED [${activeBall.letter}]!`,
      x: 250,
      y: 670,
      alpha: 1,
      color: '#03fca1',
    });

    if (stateRef.current.bankedLetters.length >= MAX_BANKED) {
      setTimeout(() => finishGame(), 600);
    } else {
      advanceBall(150);
    }
  };

  // Keyboard shortcut: 'B' to bank
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'b' || e.key === 'B' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleBankCurrentLetter();
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

    const holes = levelRef.current?.holes || [
      { xPos: 200, yPos: 180, score: 1, radius: 36 },
      { xPos: 300, yPos: 180, score: 1, radius: 36 },
      { xPos: 120, yPos: 100, score: 2, radius: 30 },
      { xPos: 380, yPos: 100, score: 2, radius: 30 },
      { xPos: 250, yPos: 55, score: 5, radius: 22 },
    ];

    const foulLineY = 600;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Arena background
      ctx.fillStyle = 'rgba(10, 14, 28, 0.75)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Arena border
      ctx.strokeStyle = '#45b8ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

      // Draw Foul Line
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, foulLineY);
      ctx.lineTo(CANVAS_WIDTH, foulLineY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH PAD (DRAG BACK TO AIM)', CANVAS_WIDTH / 2, foulLineY + 20);

      // Draw Target Holes (Only award bonus points, don't bank letters)
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

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`+${hole.score * 10}pts`, hole.xPos, hole.yPos + 5);
        ctx.restore();
      });

      // Bottom Bank Tray
      const trayY = 780;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(16, trayY, CANVAS_WIDTH - 32, 80);
      ctx.strokeStyle = 'rgba(3, 252, 161, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, trayY, CANVAS_WIDTH - 32, 80);

      ctx.fillStyle = '#90e0ef';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`BANKED FOR WORDS (${stateRef.current.bankedLetters.length}/${MAX_BANKED}):`, 26, trayY + 18);

      // Draw collected banked letters in the tray
      stateRef.current.bankedLetters.forEach((char, idx) => {
        const bx = 45 + idx * 36;
        const by = trayY + 48;
        ctx.beginPath();
        ctx.arc(bx, by, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#03fca1';
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(char, bx, by + 5);
      });

      // Active Ball
      const activeBall = ballsRef.current[stateRef.current.currentBallIdx];
      if (activeBall && !activeBall.isDone) {
        const prevVelX = activeBall.xVel;
        const prevVelY = activeBall.yVel;

        activeBall.position();

        // Detect bounce sound
        if ((activeBall.xVel * prevVelX < 0 || activeBall.yVel * prevVelY < 0) && activeBall.speed() > 2) {
          sound.playBounce();
        }

        // 1. Check if Ball Flew Over the Edge at the Top (Abyss miss)
        if (activeBall.yPos < -activeBall.radius && !activeBall.isDone) {
          activeBall.done();
          floatingTextsRef.current.push({
            text: 'OVER THE TOP (MISSED)!',
            x: 250,
            y: 350,
            alpha: 1,
            color: '#ff6b6b',
          });
          advanceBall();
        }

        // 2. Check Target Hole Sinks (Bonus Points, NOT Banked)
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

            // Advance immediately to new ball
            advanceBall();
          }
        });

        // 3. Check if Ball Stopped Moving (Missed shot)
        if (activeBall.isClicked && activeBall.speed() < 1.8 && !activeBall.isDone) {
          activeBall.done();
          floatingTextsRef.current.push({
            text: 'BALL STOPPED!',
            x: activeBall.xPos,
            y: activeBall.yPos - 20,
            alpha: 1,
            color: '#ffaa00',
          });
          advanceBall();
        }

        // Render Active Ball
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

        // Slingshot Aiming Line & Trajectory Dots while dragging
        if (dragRef.current.isDragging && !activeBall.isClicked) {
          const pullDx = dragRef.current.currentX - dragRef.current.startX;
          const pullDy = dragRef.current.currentY - dragRef.current.startY;

          // Elastic band
          ctx.beginPath();
          ctx.moveTo(activeBall.xPos, activeBall.yPos);
          ctx.lineTo(dragRef.current.currentX, dragRef.current.currentY);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Projected trajectory dots
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

      // Render Particles
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

  // Pointer Drag Handlers
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
    if (dist < 60 || y > 600) {
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
    }
  };

  const activeBall = ballsRef.current[currentBallIdx];

  return (
    <LayoutGame>
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '0.5rem' }}>
        
        {/* Top HUD */}
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
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', display: 'block' }}>BONUS SCORE</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#03fca1' }}>{score}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', display: 'block' }}>BANKED LETTERS</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: bankedLetters.length >= 3 ? '#03fca1' : '#ffd166' }}>
              {bankedLetters.length} / {MAX_BANKED}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', display: 'block' }}>TIME</span>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: timeLeft <= 10 ? '#ff3333' : '#ffd166',
            }}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Choice Bar: Bank vs Launch */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10, 14, 28, 0.85)',
          padding: '0.6rem 1rem',
          borderRadius: '12px',
          marginBottom: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
            <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Current Ball:</span>
            {activeBall ? (
              <span style={{
                background: activeBall.colour || '#03fca1',
                color: '#000',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
              }}>
                {activeBall.letter}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleBankCurrentLetter}
              disabled={!activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED}
              style={{
                background: 'linear-gradient(135deg, #03fca1, #00b4d8)',
                border: 'none',
                color: '#000',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: !activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED ? 'not-allowed' : 'pointer',
                opacity: !activeBall || activeBall.isClicked || bankedLetters.length >= MAX_BANKED ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 10px rgba(3, 252, 161, 0.3)',
              }}
              title="Save this letter to spell words in the next round"
            >
              <FaInbox /> BANK LETTER (B)
            </button>
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
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              backdropFilter: 'blur(6px)',
              padding: '1.5rem',
              textAlign: 'center',
            }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#03fca1', margin: 0 }}>
                SKILL PHASE COMPLETE!
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

        {/* Controls hint */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: '0.5rem',
          padding: '0 0.5rem',
        }}>
          <span>📥 <strong>Bank</strong>: Keep letter for words</span>
          <span>🎯 <strong>Launch</strong>: Shoot holes for bonus pts</span>
        </div>

      </div>
    </LayoutGame>
  );
}
