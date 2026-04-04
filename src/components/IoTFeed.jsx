import React from 'react';
import { useSimulation } from '../store/useSimulation';
import { Activity, Droplets } from 'lucide-react';

export default function IoTFeed() {
  const sensors = useSimulation(state => state.sensors);
  const timeElapsed = useSimulation(state => state.timeElapsed);

  return (
    <div className="glass-panel widget">
      <div className="widget-header">
        <Activity size={18} />
        Real-Time IoT Sensors
      </div>
      
      <div className="content-scrollable">
        {Object.values(sensors).map(sensor => (
          <div key={sensor.id} style={{
            background: 'var(--bg-glass-bright)',
            padding: '12px',
            borderRadius: '8px',
            borderLeft: `4px solid ${sensor.status === 'SAFE' ? 'var(--status-safe)' : (sensor.status === 'WARN' ? 'var(--status-warn)' : 'var(--status-danger)')}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>{sensor.id}</span>
              <span className={`font-mono ${sensor.status === 'SAFE' ? 'text-safe' : (sensor.status === 'WARN' ? 'text-warn' : 'text-danger')}`} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                {sensor.status}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplets size={12} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>pH:</span>
                <span className="font-mono">{sensor.pH.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Tox:</span>
                <span className="font-mono">{sensor.toxicityPpm.toFixed(1)} ppm</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto' }}>
        Live Feed Active • Tick: {timeElapsed}
      </div>
    </div>
  );
}
