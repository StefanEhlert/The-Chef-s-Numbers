import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.css';
import App from './App';

// Version-Info beim App-Start
const packageJson = require('../package.json');
const version = packageJson.version;
const buildDate = process.env.REACT_APP_BUILD_DATE || new Date().toISOString();
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
const hostingType = isLocal ? '🏠 Lokal gehostet' : '☁️ Cloud gehostet';

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       🍴 The Chef's Numbers - Rezeptverwaltung       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

📦 Version: ${version}
🏗️  Build: ${buildDate}
🌐 Hosting: ${hostingType} (${hostname})
📍 URL: ${window.location.href}

Entwickelt mit ❤️ für professionelle Küchenchefs
`);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 