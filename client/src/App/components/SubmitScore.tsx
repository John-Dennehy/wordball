import React, { useState, FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { FaPaperPlane } from 'react-icons/fa';
import { LeaderboardEntry } from '../../types/game';

interface SubmitScoreProps {
  skillScore?: number;
  smartScore?: number;
  total?: number;
}

export default function SubmitScore({ skillScore = 0, smartScore = 0, total = 0 }: SubmitScoreProps) {
  const history = useHistory();
  const [playerName, setPlayerName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const name = playerName.trim() || 'Player';
    const payload: LeaderboardEntry = {
      name,
      skillScore,
      smartScore,
      total: total || (skillScore + smartScore),
      date: new Date().toISOString(),
    };

    setSubmitting(true);

    try {
      // 1. Save to localStorage high scores cache
      const raw = localStorage.getItem('wordball_scores');
      const local: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      local.push(payload);
      local.sort((a, b) => (b.total || 0) - (a.total || 0));
      localStorage.setItem('wordball_scores', JSON.stringify(local.slice(0, 50)));

      // 2. Post to Express backend API
      await fetch('/api/getLeaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err: unknown) {
      console.warn('Network leaderboard save failed, local cache preserved:', err);
    } finally {
      setSubmitted(true);
      setSubmitting(false);
      setTimeout(() => {
        history.push('/scoreboard');
      }, 500);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '1.5rem auto', padding: '0 1rem' }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '0.6rem',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '0.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter player name"
          maxLength={20}
          disabled={submitting || submitted}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1rem',
            padding: '0.6rem 0.8rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={submitting || submitted}
          style={{
            background: submitted ? '#03fca1' : 'linear-gradient(135deg, #03fca1, #238be2)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 800,
            padding: '0.6rem 1.2rem',
            cursor: submitting || submitted ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s ease',
          }}
        >
          <FaPaperPlane size={14} />
          <span>{submitted ? 'Saved!' : submitting ? 'Saving...' : 'Submit'}</span>
        </button>
      </form>
    </div>
  );
}
