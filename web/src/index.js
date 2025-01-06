import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Handle FiveM's NUI lifecycle
const root = createRoot(document.getElementById('app'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Disable the right-click menu to prevent conflicts with FiveM
document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  return false;
});

// Prevent default keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Allow only when focusing input elements
  if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    if (
      (event.ctrlKey && ['s', 'b', 'i', 'u'].includes(event.key.toLowerCase())) || // Prevent formatting shortcuts
      event.key === 'F5' || // Prevent refresh
      (event.ctrlKey && event.key === 'r') // Prevent refresh
    ) {
      event.preventDefault();
      return false;
    }
  }
});

// Handle escape key to close UI
document.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    fetch('https://duckdb-handler/closeUI', {
      method: 'POST'
    });
  }
});
