import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import LayoutGame from '../components/LayoutGame';
import { sound } from '../../model/audio.js';
import { isValidWord, calculateWordScore, findPossibleWords } from '../../model/dictionary.js';
import { letterGroups, LetterColours } from '../../model/config.js';
import { FaBackspace, FaRandom, FaCheck, FaTimes, FaTrophy } from 'react-icons/fa';

export default function SmartGame() {
  const history = useHistory();
  const location = useLocation();

  // Extract carried over state
  const skillScore = Number(location.state?.skillScore || 0);
  const rawLetters = location.state?.bankedLetters || ['W', 'O', 'R', 'D', 'B', 'A', 'L', 'L', 'S'];
  const targetWord = location.state?.targetWord || 'wordball';

  // Banked letters list
  const [bankedLetters, setBankedLetters] = useState(rawLetters.map(l => l.toUpperCase()));
  const [currentWord, setCurrentWord] = useState('');
  const [usedIndices, setUsedIndices] = useState([]); // indices in bankedLetters currently in currentWord
  const [validWords, setValidWords] = useState([]); // array of { word, score, multiplier }
  const [smartScore, setSmartScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: '' }
  const [isFinished, setIsFinished] = useState(false);

  // Compute all possible anagrams once
  const possibleWords = useMemo(() => {
    return findPossibleWords(bankedLetters);
  }, [bankedLetters]);

  // Sound helper for letters
  const getLetterScore = (char) => {
    for (const group in letterGroups) {
      if (group.includes(char)) return letterGroups[group];
    }
    return 1;
  };

  const getLetterColour = (char) => {
    for (const group in LetterColours) {
      if (group.includes(char)) return LetterColours[group];
    }
    return '#03fca1';
  };

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishGame();
          return 0;
        }
        if (prev <= 6) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished]);

  const finishGame = () => {
    setIsFinished(true);
    sound.playGameOver();
  };

  // Add letter tile to word
  const addLetter = (char, index) => {
    if (isFinished) return;
    if (usedIndices.includes(index)) return;

    sound.playTileClick();
    setCurrentWord((prev) => prev + char);
    setUsedIndices((prev) => [...prev, index]);
    setFeedback(null);
  };

  // Backspace / remove last letter
  const removeLastLetter = () => {
    if (isFinished || usedIndices.length === 0) return;
    sound.playTileRemove();
    setCurrentWord((prev) => prev.slice(0, -1));
    setUsedIndices((prev) => prev.slice(0, -1));
    setFeedback(null);
  };

  // Clear current word
  const clearWord = () => {
    if (isFinished) return;
    sound.playTileRemove();
    setCurrentWord('');
    setUsedIndices([]);
    setFeedback(null);
  };

  // Shuffle un-used banked letters
  const shuffleLetters = () => {
    if (isFinished) return;
    sound.playTileClick();
    clearWord();
    setBankedLetters((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  // Submit word
  const handleSubmitWord = () => {
    if (isFinished) return;
    const word = currentWord.trim().toUpperCase();

    if (word.length < 3) {
      sound.playWordInvalid();
      setFeedback({ type: 'error', message: 'Minimum 3 letters required!' });
      return;
    }

    if (validWords.some((entry) => entry.word === word)) {
      sound.playWordInvalid();
      setFeedback({ type: 'error', message: `"${word}" already found!` });
      return;
    }

    if (!isValidWord(word)) {
      sound.playWordInvalid();
      setFeedback({ type: 'error', message: `"${word}" is not in dictionary` });
      return;
    }

    // Valid word!
    const { totalScore, multiplier } = calculateWordScore(word);
    sound.playWordValid(totalScore);

    setValidWords((prev) => [{ word, score: totalScore, multiplier }, ...prev]);
    setSmartScore((prev) => prev + totalScore);
    setFeedback({ type: 'success', message: `+${totalScore} pts! (${multiplier}x)` });

    setCurrentWord('');
    setUsedIndices([]);
  };

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFinished) return;

      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        e.preventDefault();
        handleSubmitWord();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        removeLastLetter();
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        clearWord();
      } else if (key === ' ' || key === 'TAB') {
        e.preventDefault();
        shuffleLetters();
      } else if (/^[A-Z]$/.test(key)) {
        // Find first available index matching this letter
        const matchIdx = bankedLetters.findIndex(
          (char, idx) => char === key && !usedIndices.includes(idx)
        );
        if (matchIdx !== -1) {
          addLetter(key, matchIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bankedLetters, usedIndices, currentWord, isFinished, validWords]);

  const handleProceedToScores = () => {
    history.push('/score', {
      skillScore,
      smartScore,
      totalScore: skillScore + smartScore,
      validWords: validWords.map((v) => v.word),
    });
  };

  return (
    <LayoutGame>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0.5rem', color: 'white' }}>
        
        {/* Top HUD */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '0.8rem 1.4rem',
          marginBottom: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', textTransform: 'uppercase' }}>Skill Points</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#45b8ff' }}>{skillScore}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', textTransform: 'uppercase' }}>Word Score</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#03fca1' }}>{smartScore}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#90e0ef', textTransform: 'uppercase' }}>Time</span>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: timeLeft <= 10 ? '#ff3333' : '#ffd166',
            }}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Word Construction Display */}
        <div style={{
          background: 'rgba(10, 14, 28, 0.8)',
          borderRadius: '16px',
          padding: '1.5rem 1rem',
          textAlign: 'center',
          marginBottom: '1rem',
          border: feedback?.type === 'error' ? '2px solid #ff3333' : '2px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
          transition: 'border-color 0.2s ease',
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            letterSpacing: '8px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            textShadow: '0 0 15px rgba(255,255,255,0.8)',
          }}>
            {currentWord || <span style={{ opacity: 0.2, letterSpacing: '4px' }}>TYPE OR CLICK</span>}
            <span style={{ animation: 'blink 1s infinite', opacity: 0.7, marginLeft: '4px' }}>_</span>
          </div>

          {/* Feedback banner */}
          <div style={{ minHeight: '24px', fontSize: '0.95rem', fontWeight: 600 }}>
            {feedback && (
              <span style={{ color: feedback.type === 'success' ? '#03fca1' : '#ff5555' }}>
                {feedback.message}
              </span>
            )}
          </div>
        </div>

        {/* Banked Letter Tiles */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          justifyContent: 'center',
          marginBottom: '1.2rem',
        }}>
          {bankedLetters.map((char, idx) => {
            const isUsed = usedIndices.includes(idx);
            const score = getLetterScore(char);
            const colour = getLetterColour(char);

            return (
              <button
                key={idx}
                onClick={() => addLetter(char, idx)}
                disabled={isUsed || isFinished}
                style={{
                  position: 'relative',
                  width: '54px',
                  height: '58px',
                  borderRadius: '12px',
                  background: isUsed ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                  border: isUsed ? '1px dashed rgba(255, 255, 255, 0.2)' : `2px solid ${colour}`,
                  color: isUsed ? 'rgba(255, 255, 255, 0.2)' : '#111',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  cursor: isUsed || isFinished ? 'default' : 'pointer',
                  transform: isUsed ? 'scale(0.92)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: isUsed ? 'none' : `0 4px 12px rgba(0,0,0,0.3), 0 0 10px ${colour}66`,
                }}
              >
                {char}
                <span style={{
                  position: 'absolute',
                  bottom: '3px',
                  right: '5px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isUsed ? 'rgba(255,255,255,0.2)' : '#444',
                }}>
                  {score}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={removeLastLetter}
            disabled={usedIndices.length === 0 || isFinished}
            style={{
              padding: '0.7rem 1.2rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: usedIndices.length === 0 ? 'not-allowed' : 'pointer',
              opacity: usedIndices.length === 0 ? 0.4 : 1,
            }}
          >
            <FaBackspace /> Undo
          </button>

          <button
            onClick={shuffleLetters}
            disabled={isFinished}
            style={{
              padding: '0.7rem 1.2rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isFinished ? 'default' : 'pointer',
            }}
          >
            <FaRandom /> Shuffle
          </button>

          <button
            onClick={handleSubmitWord}
            disabled={currentWord.length < 3 || isFinished}
            style={{
              padding: '0.7rem 2rem',
              borderRadius: '10px',
              background: currentWord.length >= 3 ? '#03fca1' : 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: currentWord.length >= 3 ? '#000' : 'rgba(255, 255, 255, 0.4)',
              fontWeight: 900,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: currentWord.length >= 3 ? 'pointer' : 'not-allowed',
              boxShadow: currentWord.length >= 3 ? '0 0 15px #03fca1' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <FaCheck /> SUBMIT
          </button>
        </div>

        {/* Words Found Tally */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#90e0ef', fontWeight: 700 }}>
              WORDS FOUND ({validWords.length})
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              {possibleWords.length} possible anagrams
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            maxHeight: '120px',
            overflowY: 'auto',
          }}>
            {validWords.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                Form 3+ letter words to earn points! Longer words award up to 3x multiplier.
              </span>
            ) : (
              validWords.map((entry, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(3, 252, 161, 0.2)',
                    border: '1px solid #03fca1',
                    borderRadius: '8px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {entry.word}
                  <small style={{ color: '#03fca1' }}>+{entry.score}</small>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Game Over Modal */}
        {isFinished && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              background: '#161b2e',
              border: '2px solid #03fca1',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(3, 252, 161, 0.3)',
            }}>
              <FaTrophy size={48} color="#ffd166" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, color: '#fff' }}>ROUND OVER!</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                margin: '1.5rem 0',
                background: 'rgba(0,0,0,0.3)',
                padding: '1rem',
                borderRadius: '12px',
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#90e0ef' }}>SKILL SCORE</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#45b8ff' }}>{skillScore}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#90e0ef' }}>WORD SCORE</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#03fca1' }}>{smartScore}</div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#ffd166' }}>COMBINED TOTAL</span>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffd166' }}>{skillScore + smartScore}</div>
                </div>
              </div>

              {/* Missed words teaser */}
              {possibleWords.length > validWords.length && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.4rem' }}>
                    SOME WORDS YOU MISSED:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '60px', overflowY: 'hidden' }}>
                    {possibleWords
                      .filter((w) => !validWords.some((v) => v.word === w))
                      .slice(0, 8)
                      .map((w, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          padding: '0.1rem 0.4rem',
                          fontSize: '0.75rem',
                          color: '#ccc',
                        }}>
                          {w}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleProceedToScores}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(90deg, #03fca1, #238be2)',
                  border: 'none',
                  color: '#000',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(3, 252, 161, 0.4)',
                }}
              >
                PROCEED TO SCOREBOARD →
              </button>
            </div>
          </div>
        )}

      </div>
    </LayoutGame>
  );
}
