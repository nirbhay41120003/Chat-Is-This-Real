import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class AppErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('The study app could not start:', error);
  }

  render() {
    if (this.state.failed) {
      return <main role="alert" style={{ fontFamily: 'system-ui, sans-serif', margin: '12vh auto', maxWidth: 560, padding: 24, color: '#202124' }}>
        <h1>The study space could not load</h1>
        <p>Reload the page. If it still does not work, clear this site’s stored data and reload.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload page</button>
      </main>;
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) createRoot(root).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
