import React, { ReactNode } from 'react';
import { MAX_LETTERS, levelList } from '../../model/config';
import { Link } from 'react-router-dom';
import Seed from '../../model/seed';
import Level from '../../model/level';
import Game from '../../model/SkillGame';

interface LinkToLevelProps {
  word?: string;
  children?: ReactNode;
}

export default function LinkToLevel(props: LinkToLevelProps) {
  function getWord(): string {
    return levelList[Math.floor(Math.random() * levelList.length)];
  }

  const getSeed = (): Seed => {
    if (props.word) {
      return new Seed(props.word);
    } else {
      return new Seed(getWord());
    }
  };

  const getLevel = (): Level => {
    return new Level(getSeed(), MAX_LETTERS);
  };

  const getGame = (): Game => {
    return new Game(getLevel());
  };

  return (
    <Link to={{
      pathname: '/skillgame',
      state: { playGame: getGame() },
    }}>
      {props.children}
    </Link>
  );
}
