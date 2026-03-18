import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
//import './polyfills'
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Polyfill for simple-peer
if (typeof window !== 'undefined' && !window.process) {
  window.process = { nextTick: (cb) => setTimeout(cb, 0) };
}