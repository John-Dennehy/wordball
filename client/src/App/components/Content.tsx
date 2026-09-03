import React, { ReactNode } from 'react';

interface ContentProps {
  children?: ReactNode;
}

export default function Content({ children }: ContentProps) {
  return (
    <div className="section has-text-centered">
      {children}
    </div>
  );
}
