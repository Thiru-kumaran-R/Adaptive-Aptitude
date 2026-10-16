// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Base styling and design tokens
import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Fatal: Root container #root not found in document DOM.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
