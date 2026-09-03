import React from 'react';
import { levelList } from '../../model/config';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LinkToLevel from '../components/LinkToLevel';

export default function Home() {
  function getWord(): string {
    return levelList[Math.floor(Math.random() * levelList.length)];
  }

  return (
    <Layout>
      <div className="buttons is-centered">
        <p className="control">
          <LinkToLevel word={getWord()}>
            <button id="playbutton" className="button is-rounded is-primary is-outlined is-inverted">Play Now</button>
          </LinkToLevel>
        </p>
        <p className="control">
          <Link to="/scoreboard">
            <button className="button is-rounded is-primary is-outlined is-inverted">Scoreboard</button>
          </Link>
        </p>
        <p className="control">
          <Link to="/rules">
            <button className="button is-rounded is-primary is-outlined is-inverted">Rules</button>
          </Link>
        </p>
      </div>
    </Layout>
  );
}
