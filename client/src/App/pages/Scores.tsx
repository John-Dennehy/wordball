import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import LinkToLevel from '../components/LinkToLevel';
import SubmitScore from '../components/SubmitScore';
import { FaHome, FaRedo, FaListOl, FaAward } from 'react-icons/fa';
import { ScoresLocationState } from '../../types/game';

export default function Scores() {
  const location = useLocation<ScoresLocationState>();

  const skillScore = Number(location.state?.skillScore || 0);
  const smartScore = Number(location.state?.smartScore || 0);
  const totalScore = Number(location.state?.totalScore || (skillScore + smartScore));
  const validWords = location.state?.validWords || [];

  return (
    <Layout>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem', color: 'white' }}>
        
        {/* Navigation Actions */}
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="button is-rounded is-primary is-outlined is-inverted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaHome /> Home
            </button>
          </Link>
          <LinkToLevel>
            <button className="button is-rounded is-primary is-outlined is-inverted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaRedo /> Play Again
            </button>
          </LinkToLevel>
          <Link to="/scoreboard" style={{ textDecoration: 'none' }}>
            <button className="button is-rounded is-primary is-outlined is-inverted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaListOl /> Scoreboard
            </button>
          </Link>
        </div>

        {/* Results Card */}
        <div style={{
          background: 'rgba(10, 14, 28, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}>
          <FaAward size={52} color="#ffd166" style={{ marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 1.5rem', letterSpacing: '1px' }}>
            FINAL SCORECARD
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1.2rem',
            borderRadius: '16px',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#90e0ef', textTransform: 'uppercase' }}>Ball Skill Phase</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#45b8ff' }}>{skillScore}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#90e0ef', textTransform: 'uppercase' }}>Word Crafting Phase</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#03fca1' }}>{smartScore}</div>
            </div>
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.8rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#ffd166', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Combined Grand Total
              </span>
              <div style={{ fontSize: '3.2rem', fontWeight: 900, color: '#ffd166', textShadow: '0 0 20px rgba(255, 209, 102, 0.4)' }}>
                {totalScore}
              </div>
            </div>
          </div>

          {/* Words discovered chip list */}
          {validWords.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: '0.5rem' }}>
                WORDS ASSEMBLED ({validWords.length}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                {validWords.map((w: string, idx: number) => (
                  <span key={idx} style={{
                    background: 'rgba(3, 252, 161, 0.15)',
                    border: '1px solid rgba(3, 252, 161, 0.4)',
                    color: '#03fca1',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit to leaderboard */}
          <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
            Save your score to the leaderboard:
          </span>
          <SubmitScore skillScore={skillScore} smartScore={smartScore} total={totalScore} />
        </div>

      </div>
    </Layout>
  );
}
