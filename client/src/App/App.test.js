import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

it('renders without crashing and mounts Home page', () => {
  const { container } = render(<App />);
  expect(container.querySelector('#playbutton')).toBeTruthy();
  expect(container.textContent).toContain('WordBall');
});
