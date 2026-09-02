import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure global setActiveTab is always defined to prevent runtime TypeError
if (typeof window !== 'undefined') {
  const defaultTabHandler = (tab: string) => {
    try {
      (window as any).activeTab = tab;
      if (typeof (window as any).__handleSetActiveTab === 'function') {
        (window as any).__handleSetActiveTab(tab);
      }
    } catch (e) {
      console.error(e);
    }
  };
  (window as any).setActiveTab = (window as any).setActiveTab || defaultTabHandler;
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).setActiveTab = (window as any).setActiveTab;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

