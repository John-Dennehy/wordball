import React, { CSSProperties } from 'react';
import { FaGithub } from 'react-icons/fa';

export default function Footer() {
  const linkStyle: CSSProperties = {
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  };

  const paddingStyle: CSSProperties = {
    paddingRight: '1em',
  };

  const styleFooter: CSSProperties = {
    position: 'relative',
    bottom: 0,
    width: '100%',
  };

  return (
    <div style={styleFooter} className="section has-text-centered">
      <a
        style={linkStyle}
        className="button is-primary is-outline is-inverted"
        href="https://github.com/John-Dennehy/wordball"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span style={paddingStyle}>Visit us on GitHub</span>
        <br />
        <FaGithub />
      </a>
    </div>
  );
}
