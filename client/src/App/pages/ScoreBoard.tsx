import React from 'react';
import ScoreBoardTable from '../components/ScoreBoard';
import { Link } from 'react-router-dom';
import LinkToLevel from '../components/LinkToLevel';
import Layout from '../components/Layout';

export default function ScoreBoardPage() {
  return (
    <Layout>
      <div className="buttons is-centered">
        <p className="control">
          <LinkToLevel>
            <button className="button is-rounded is-primary is-outlined is-inverted">Play Now</button>
          </LinkToLevel>
        </p>
        <p className="control">
          <Link to="/">
            <button className="button is-rounded is-primary is-outlined is-inverted">Home</button>
          </Link>
        </p>
      </div>
      <ScoreBoardTable />
    </Layout>
  );
}
