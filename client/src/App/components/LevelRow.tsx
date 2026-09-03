import React from 'react';
import { levelList } from '../../model/config';
import LinkToLevel from './LinkToLevel';

interface LevelRowProps {
  levelId: string;
  score?: string | number;
  highScore?: string | number;
  word?: string;
}

export default function LevelRow(props: LevelRowProps) {
  function getWord(): string {
    if (props.word) {
      return props.word;
    } else if (props.levelId) {
      const index = Number(props.levelId) - 1;
      return levelList[index] || 'dog';
    } else {
      return 'dog';
    }
  }

  return (
    <tr>
      <td>
        <LinkToLevel word={getWord()}>{props.levelId}</LinkToLevel>
      </td>
      <td className="has-text-right">{props.highScore}</td>
    </tr>
  );
}
