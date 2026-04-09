import React, { useEffect } from 'react';
import { useSimulation } from '../store/useSimulation';
import { Play, AlertTriangle, ShieldAlert, Crosshair, Route } from 'lucide-react';

export default function ActionConsole() {
  const { scenario, setScenario, dronesDeployed, deployDrones, tick, rerouteTraffic, ships } = useSimulation();
  
  const isRerouting = ships && ships.some(s => s.status === 'REROUTING');
  const allSafe = ships && ships.every(s => s.status === 'SAFE');

  // Engine loop
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="glass-panel widget widget-fixed">
      <div className="widget-header">
        <Play size={18} />
        Simulation Center
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SCENARIO OVERRIDES</div>
        
        <button 
          className={`glass-button ${scenario === 'NORMAL' ? 'active' : ''}`}
          onClick={() => setScenario('NORMAL')}
        >
          Normal Patrol (Clear)
        </button>
        
        <button 
          className={`glass-button ${scenario === 'MINOR_LEAK' ? 'active' : ''}`}
          onClick={() => setScenario('MINOR_LEAK')}
          disabled={scenario === 'CATASTROPHIC'}
          style={{ 
            borderColor: scenario === 'MINOR_LEAK' ? 'var(--status-warn)' : undefined, 
            color: scenario === 'MINOR_LEAK' ? 'var(--status-warn)' : undefined,
            opacity: scenario === 'CATASTROPHIC' ? 0.4 : 1,
            cursor: scenario === 'CATASTROPHIC' ? 'not-allowed' : 'pointer'
          }}
        >
          <AlertTriangle size={16} /> Minor Leak
        </button>
        
        <button 
          className={`glass-button ${scenario === 'CATASTROPHIC' ? 'active danger emergency-glow' : ''}`}
          onClick={() => setScenario('CATASTROPHIC')}
          disabled={scenario === 'MINOR_LEAK'}
          style={{ 
            borderColor: scenario === 'CATASTROPHIC' ? 'var(--status-danger)' : undefined, 
            color: scenario === 'CATASTROPHIC' ? 'white' : 'var(--status-danger)',
            opacity: scenario === 'MINOR_LEAK' ? 0.4 : 1,
            cursor: scenario === 'MINOR_LEAK' ? 'not-allowed' : 'pointer'
          }}
        >
          <ShieldAlert size={16} /> Catastrophic Event
        </button>

        <div style={{ height: '1px', background: 'var(--border-glass)', margin: '8px 0' }}></div>

        <button 
          className="glass-button"
          onClick={deployDrones}
          disabled={dronesDeployed}
          style={{ 
            background: dronesDeployed ? 'var(--bg-glass)' : 'var(--brand-cyan)', 
            color: dronesDeployed ? 'var(--text-muted)' : 'black',
            justifyContent: 'center',
            opacity: dronesDeployed ? 0.5 : 1
          }}
        >
          <Crosshair size={16} />
          {dronesDeployed ? 'DRONES ACTIVE' : 'DEPLOY CLEANUP DRONES'}
        </button>

        <button 
          className={`glass-button ${isRerouting ? 'active' : ''}`}
          onClick={rerouteTraffic}
          disabled={isRerouting || allSafe}
          style={{ 
            marginTop: '4px',
            borderColor: isRerouting ? 'var(--status-warn)' : undefined, 
            color: isRerouting ? 'var(--status-warn)' : (allSafe ? '#10b981' : undefined),
            justifyContent: 'center',
            opacity: (isRerouting || allSafe) ? 0.7 : 1
          }}
        >
          <Route size={16} /> 
          {isRerouting ? 'DIVERTING TRAFFIC...' : (allSafe ? 'TRAFFIC SECURED' : 'REROUTE SHIPPING TRAFFIC')}
        </button>
      </div>
    </div>
  );
}
