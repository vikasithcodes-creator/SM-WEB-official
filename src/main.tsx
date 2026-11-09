// Guard against read-only getter error for global fetch in iframe sandboxes
try {
  const _raw = window.fetch;
  let _current = typeof _raw === 'function' ? _raw.bind(window) : _raw;
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'fetch', {
      get: () => _current,
      set: (fn) => {
        _current = fn;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore if already patched or restricted
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
