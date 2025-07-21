import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode></React.StrictMode> 
  // This causes 2 connections because React 18 in development mode intentionally runs effects twice to help you catch bugs:
  // Component mounts → useEffect runs (creates WebSocket #1)
  // React Strict Mode triggers → useEffect cleanup runs → useEffect runs again (creates WebSocket #2)
  // Result: Two connections from one tab!

  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
