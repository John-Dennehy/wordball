import React, { CSSProperties } from 'react';
import { CANVAS_WIDTH } from '../../model/config';

interface GameOverlayProps {
  top?: number | string;
  right?: number | string;
}

export default function GameOverlay({ top, right }: GameOverlayProps) {
  const margin = CANVAS_WIDTH * 0.48;

  const overlayStyle: CSSProperties = {
    position: 'relative',
    textAlign: 'center',
    color: 'white',
    top: top,
    right: right,
    marginLeft: margin,
    marginRight: margin,
  };

  return (
    <div style={overlayStyle}>
      <div style={{ textAlign: 'center' }}>
        <span className="details">
          <span id="timer"></span>
          <span id="score"></span>
        </span>
      </div>
    </div>
  );
}
