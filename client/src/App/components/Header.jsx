import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GiThunderball } from "react-icons/gi";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { sound } from '../../model/audio.js';

export default function Header(props) {
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const headerStyle = {
    padding: '1.5rem 1rem 0.5rem',
    position: 'relative',
    color: 'white',
    userSelect: 'none'
  };

  const soundBtnStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1.5rem',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <header style={headerStyle}>
      <button 
        style={soundBtnStyle} 
        onClick={handleToggleSound}
        title={isMuted ? "Unmute Sound" : "Mute Sound"}
        aria-label="Toggle Sound"
      >
        {isMuted ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
      </button>

      <div className="has-text-centered">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1 style={{ 
            fontFamily: "'Faster One', cursive, sans-serif", 
            fontSize: '3.5rem', 
            margin: 0,
            textShadow: '0 0 15px rgba(255,255,255,0.6), 0 0 30px #d44afb',
            letterSpacing: '2px'
          }}>
            WordBall
          </h1>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '1.4rem', 
            fontWeight: 800,
            letterSpacing: '6px',
            color: '#03fca1',
            textShadow: '0 0 10px #03fca1'
          }}>
            <GiThunderball size={28} className="rotating-ball" />
            <span>XTREME</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
