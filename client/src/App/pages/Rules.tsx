import React, { CSSProperties } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import LinkToLevel from '../components/LinkToLevel';

export default function Rules() {
  const style: CSSProperties = {
    color: 'white',
  };

  return (
    <Layout>
      <div className="buttons is-centered">
        <p className="control">
          <Link to="/">
            <button className="button is-rounded is-primary is-outlined is-inverted">Home</button>
          </Link>
        </p>
        <p className="control">
          <LinkToLevel>
            <button className="button is-rounded is-primary is-outlined is-inverted">Play Now</button>
          </LinkToLevel>
        </p>
        <p className="control">
          <Link to="/scoreboard">
            <button className="button is-rounded is-primary is-outlined is-inverted">Scoreboard</button>
          </Link>
        </p>
      </div>
      <div style={style} className="container">
        <div className="container">
          <h1 style={style} className="title">Rules</h1>
        </div>
        <div className="container">
          <br />
          <p>Click, drag, or slingshot to fire the balls!</p>
          <br />
          <p>Wordball Extreme is two games in one: A game of skill, and a game of mental acuity.</p>
          <br />
          <p>The aim of the game is to score points using random letter balls. Each ball has a letter, and each letter has a Scrabble-style point value.</p>
          <br />
          <p>
            Pull UP to fire <strong>DOWN</strong> into the bottom Bank Zone (Word Hole) to save letters you like for the word building phase (up to 8 letters).
            Alternatively, pull DOWN to launch <strong>UP</strong> into the top bonus holes (x1, x2, x5) for high skill points without keeping the letter!
          </p>
          <br />
          <p>If you miss over the top or a ball comes to rest, the next ball becomes active immediately.</p>
          <br />
          <p>On the next screen you will be tasked with creating as many valid English words as possible from the balls you saved, so choose your letters well!</p>
          <br />
          <p>Points are calculated based on letter values and word length multipliers (3L = 1x, 4L = 1.5x, 5L = 2x, 6L+ = 3x). Full keyboard typing is supported!</p>
          <br />
          <p>Good luck!</p>
        </div>
      </div>
    </Layout>
  );
}
