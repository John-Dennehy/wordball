import React, { ReactNode, CSSProperties } from 'react';

interface LayoutGameProps {
  children?: ReactNode;
}

export default function LayoutGame({ children }: LayoutGameProps) {
  const containerStyle: CSSProperties = {
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle}>
      {children}
    </div>
  );
}
