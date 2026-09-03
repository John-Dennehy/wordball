import React, { CSSProperties } from 'react';
import { LeaderboardEntry } from '../../types/game';

interface HighScoreProps extends Partial<LeaderboardEntry> {
  total?: number;
}

export default function HighScore(props: HighScoreProps) {
  const scoreStyle: CSSProperties = {
    backgroundColor: 'rgba(0, 0, 0, 0)',
  };

  const playerName = props.name || 'The Mysterious Stranger';
  const smartScore = props.smartScore ?? 0;
  const skillScore = props.skillScore ?? 0;
  const totalScore = props.total ?? (skillScore + smartScore);

  return (
    <tr className="highscore" style={scoreStyle}>
      <td>{playerName}</td>
      <td className="has-text-right">{skillScore}</td>
      <td className="has-text-right">{smartScore}</td>
      <td className="has-text-right">{totalScore}</td>
    </tr>
  );
}
