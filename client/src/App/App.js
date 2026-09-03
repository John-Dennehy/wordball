import React from 'react';
import { Route, Switch } from 'react-router-dom';
import '../style/App.css';
import '../style/bulma.css';
import Home from './pages/Home';
import SkillGame from './pages/SkillGame';
import SmartGame from './pages/SmartGame';
import Scores from './pages/Scores';
import Words from './pages/Words';
import Rules from './pages/Rules';
import ScoreBoard from './pages/ScoreBoard';
import Levels from './pages/Levels';

export default function App() {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    margin: '0 auto',
    background: 'linear-gradient(318deg, #180928 0%, #0d1b3e 50%, #2a0b38 100%)',
    backgroundAttachment: 'fixed',
  };

  return (
    <div style={containerStyle}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/levels" component={Levels} />
        <Route path="/skillgame" component={SkillGame} />
        <Route path="/smartgame" component={SmartGame} />
        <Route path="/score" component={Scores} />
        <Route path="/scoreboard" component={ScoreBoard} />
        <Route path="/extreme" component={Words} />
        <Route path="/rules" component={Rules} />
      </Switch>
    </div>
  );
}
