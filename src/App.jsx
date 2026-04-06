import React from 'react';
import 'leaflet/dist/leaflet.css';
import './index.css';

import MapComponent from './components/MapComponent';
import IoTFeed from './components/IoTFeed';
import AIWidget from './components/AIWidget';
import BlockchainLog from './components/BlockchainLog';
import ActionConsole from './components/ActionConsole';
import DroneFleet from './components/DroneFleet';

import { Anchor } from 'lucide-react';

import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <>
      <header className="glass-panel app-header" style={{ marginBottom: '16px' }}>
        <div className="brand-title">
          <Anchor size={28} color="var(--brand-cyan)" />
          PearlGuard Command Center
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Role: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Port Authority Admin</span></div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-safe)', boxShadow: '0 0 10px var(--status-safe)' }}></div>
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Left Panel */}
        <section className="side-panel">
          <IoTFeed />
          <AIWidget />
        </section>

        {/* Center Panel (Map) */}
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <MapComponent />
        </section>

        {/* Right Panel */}
        <section className="side-panel">
          <ActionConsole />
          <DroneFleet />
          <BlockchainLog />
        </section>
      </main>
    </>
  );
}

export default App;
