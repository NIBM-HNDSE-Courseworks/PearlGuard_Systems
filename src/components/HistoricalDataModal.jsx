import React from 'react';
import { createPortal } from 'react-dom';
import { useSimulation } from '../store/useSimulation';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { X } from 'lucide-react';

export default function HistoricalDataModal({ sensorId, onClose }) {
  const sensorKey = Object.keys(useSimulation.getState().sensors).find(key => useSimulation.getState().sensors[key].id === sensorId) || sensorId;
  const sensorHistory = useSimulation(state => state.sensorHistory[sensorKey] || []);

  if (!sensorId) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '800px',
        padding: '24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main, #ffffff)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '50%',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Historical Data: <span style={{ color: 'var(--status-safe, #4ade80)' }}>{sensorId}</span>
        </h2>
        
        <div style={{ width: '100%', height: '400px', marginTop: '16px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorHistory} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <XAxis dataKey="time" stroke="var(--text-muted, #94a3b8)" fontSize={12} tickMargin={10} minTickGap={30} />
              <YAxis yAxisId="left" stroke="var(--status-safe, #4ade80)" fontSize={12} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={(value) => value.toFixed(2)} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--status-danger, #f87171)" fontSize={12} domain={['dataMin - 2', 'dataMax + 5']} tickFormatter={(value) => value.toFixed(1)} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px',
                  backdropFilter: 'blur(8px)',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => Number(value).toFixed(2)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line yAxisId="left" type="monotone" dataKey="pH" name="pH Level" stroke="var(--status-safe, #4ade80)" strokeWidth={3} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="toxicityPpm" name="Toxicity (ppm)" stroke="var(--status-danger, #f87171)" strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>,
    document.body
  );
}
