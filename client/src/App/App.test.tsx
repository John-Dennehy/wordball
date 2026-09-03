import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

it('renders without crashing and mounts Home page', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  expect(container.querySelector('#playbutton')).toBeTruthy();
  expect(container.textContent).toContain('WordBall');
});
