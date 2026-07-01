import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/chrome-extension';
import { App } from './App';
import { AuthGate } from '../../components/AuthGate';
import '../../styles/global.css';

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY ?? '';
const SYNC_HOST = import.meta.env.WXT_SYNC_HOST ?? 'http://localhost:3000';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <AuthGate>
        <App />
      </AuthGate>
    </ClerkProvider>
  </React.StrictMode>,
);
