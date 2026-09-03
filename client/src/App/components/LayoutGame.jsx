import React from 'react';

export default function LayoutGame({ children }) {
  const containerStyle = {
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
