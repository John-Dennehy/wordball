import React, { ReactNode } from 'react';

interface ButtonProps {
  children?: ReactNode;
}

export default function Button({ children }: ButtonProps) {
  return (
    <button className="button is-rounded is-primary is-outlined is-inverted">
      {children}
    </button>
  );
}
