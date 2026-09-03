import React, { CSSProperties } from 'react';

interface EndGameProps {
  skillScore: number;
  smartScore: number;
}

export default function EndGame({ skillScore, smartScore }: EndGameProps) {
  const tableStyle: CSSProperties = {
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="table-container is-centered">
        <table style={tableStyle} className="table is-centered">
          <thead>
            <tr>
              <th className="has-text-center" style={tableStyle}>Skill Score</th>
              <th className="has-text-center" style={tableStyle}>Smart Score</th>
              <th className="has-text-center" style={tableStyle}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="has-text-right">{skillScore}</td>
              <td className="has-text-right">{smartScore}</td>
              <td className="has-text-right">{skillScore + smartScore}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
