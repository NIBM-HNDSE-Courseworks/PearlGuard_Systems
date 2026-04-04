import React from 'react';
import { useSimulation } from '../store/useSimulation';
import { Brain, Wind } from 'lucide-react';

export default function AIWidget() {
  const aiPredictions = useSimulation(state => state.aiPredictions);
  const windDirection = useSimulation(state => state.windDirection);
  const windSpeedKnots = useSimulation(state => state.windSpeedKnots);
  const setWind = useSimulation(state => state.setWind);

  const spreadColor = aiPredictions.threatLevel === 'CRITICAL' ? 'var(--status-danger)' : 
                      (aiPredictions.threatLevel === 'CONTAINING' ? 'var(--brand-cyan)' :
                      (aiPredictions.threatLevel === 'MEDIUM' ? 'var(--status-warn)' : 'var(--status-safe)'));

  return (
    <div className="glass-panel widget widget-fixed">
      <div className="widget-header">
        <Brain size={18} />
        AI Analytics Engine
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Threat Level Display */}
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '16px', 
          borderRadius: '8px',
          border: `1px solid ${spreadColor}`,
          boxShadow: `0 0 10px ${spreadColor}22` 
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>PREDICTED THREAT</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: spreadColor, letterSpacing: '2px' }}>
            {aiPredictions.threatLevel}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Spread Radius:</span>
            <span className="font-mono">{(aiPredictions.spreadRadius / 1000).toFixed(1)} km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Coastal Impact Prob:</span>
            <span className="font-mono">{aiPredictions.probability}%</span>
          </div>
        </div>

        {/* Environmental Controls */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--brand-cyan)', marginBottom: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Wind size={12} /> Environmental Variables
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {['NW', 'N', 'NE'].map(dir => (
              <button 
                key={dir}
                onClick={() => setWind(dir, windSpeedKnots)}
                className={`glass-button ${windDirection === dir ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '6px' }}
              >
                {dir}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Wind Speed:</span>
            <span className="font-mono">{windSpeedKnots} kts</span>
          </div>
          <input 
            type="range" 
            min="0" max="40" 
            value={windSpeedKnots}
            onChange={(e) => setWind(windDirection, parseInt(e.target.value))}
            style={{ width: '100%', marginTop: '4px', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}
