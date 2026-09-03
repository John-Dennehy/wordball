import React, { useState, useEffect, CSSProperties } from 'react';
import { LeaderboardEntry } from '../../types/game';

export default function ScoreBoard() {
  const tableStyle: CSSProperties = {
    color: 'white',
    backgroundColor: 'transparent',
  };

  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/getLeaderboard')
      .then((res) => res.json())
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          setScores(data as LeaderboardEntry[]);
        } else {
          // Fallback to local storage
          const raw = localStorage.getItem('wordball_scores');
          const local = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
          setScores(local);
        }
      })
      .catch((err: unknown) => {
        console.warn('API error, reading local scores:', err);
        const raw = localStorage.getItem('wordball_scores');
        const local = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
        setScores(local);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div className="table-container">
        <table style={tableStyle} className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th style={{ ...tableStyle, textAlign: 'left' }}>#</th>
              <th style={{ ...tableStyle, textAlign: 'left' }}>Player Name</th>
              <th style={{ ...tableStyle, textAlign: 'right' }}>Skill</th>
              <th style={{ ...tableStyle, textAlign: 'right' }}>Words</th>
              <th style={{ ...tableStyle, textAlign: 'right', color: '#ffd166' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ ...tableStyle, textAlign: 'center', padding: '2rem' }}>
                  Loading high scores...
                </td>
              </tr>
            ) : scores.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tableStyle, textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
                  No high scores recorded yet! Play a game and submit yours.
                </td>
              </tr>
            ) : (
              scores.slice(0, 20).map((score, index) => (
                <tr key={index}>
                  <td style={{ ...tableStyle, fontWeight: 700, color: index === 0 ? '#ffd166' : index === 1 ? '#e0e1dd' : index === 2 ? '#cd7f32' : 'white' }}>
                    {index + 1}
                  </td>
                  <td style={{ ...tableStyle, fontWeight: 600 }}>{score.name || 'Anonymous'}</td>
                  <td style={{ ...tableStyle, textAlign: 'right', color: '#45b8ff' }}>{score.skillScore ?? '-'}</td>
                  <td style={{ ...tableStyle, textAlign: 'right', color: '#03fca1' }}>{score.smartScore ?? '-'}</td>
                  <td style={{ ...tableStyle, textAlign: 'right', fontWeight: 900, color: '#ffd166' }}>{score.total ?? 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
