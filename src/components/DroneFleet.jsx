import React from 'react';
import { useSimulation } from '../store/useSimulation';
import { Battery, BatteryCharging, BatteryWarning, Navigation, Activity, Crosshair } from 'lucide-react';

export default function DroneFleet() {
  const { dronePositions, dronesDeployed } = useSimulation();

  const getBatteryIcon = (battery) => {
    if (battery > 50) return <Battery size={16} color="var(--status-safe)" />;
    if (battery > 20) return <BatteryCharging size={16} color="var(--status-warn)" />;
    return <BatteryWarning size={16} color="var(--status-danger)" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IDLE': return 'var(--text-muted)';
      case 'EN ROUTE': return 'var(--brand-cyan)';
      case 'CLEANING': return 'var(--status-warn)';
      default: return 'var(--text-main)';
    }
  };

  return (
    <div className="glass-panel widget">
      <div className="widget-header">
        <Activity size={18} />
        Swarm Controller
      </div>

      <div className="content-scrollable" style={{ gap: '12px' }}>
        {dronePositions.map((drone) => (
          <div key={drone.id} style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            borderLeft: `3px solid ${getStatusColor(drone.status)}`,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{drone.name}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                {getBatteryIcon(drone.battery)}
                {Math.round(drone.battery)}%
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {drone.status === 'CLEANING' ? <Activity size={14} color="var(--status-warn)" /> : <Navigation size={14} />}
              <span style={{ color: getStatusColor(drone.status) }}>{drone.status}</span>
              {drone.targetBuoy && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  <Crosshair size={12} /> {drone.targetBuoy}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
