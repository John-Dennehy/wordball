import React, { ReactNode, CSSProperties } from 'react';
import Header from './Header';
import Footer from './Footer';
import Content from './Content';
import '../../style/App.css';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const layoutStyle: CSSProperties = {
    minHeight: '100vh',
    minWidth: '100vw',
  };

  return (
    <div className="section is-centered" style={layoutStyle}>
      <Header />
      <Content>
        {children}
      </Content>
      <Footer />
    </div>
  );
}
