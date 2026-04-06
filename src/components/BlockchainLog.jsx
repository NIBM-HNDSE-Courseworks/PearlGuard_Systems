import React from 'react';
import { useSimulation } from '../store/useSimulation';
import { Link, Download } from 'lucide-react';

export default function BlockchainLog() {
  const blockchainLog = useSimulation(state => state.blockchainLog);

  const exportToCSV = () => {
    const headers = ['Hash', 'Timestamp', 'Event Type', 'Details'];
    const rows = blockchainLog.map(log => [
      log.hash,
      new Date(log.timestamp).toLocaleString(),
      log.eventType,
      log.details.replace(/,/g, ';') // Avoid CSV break
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "pearlguard_audit_log.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel widget">
      <div className="widget-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link size={18} />
          Immutable Audit Log
        </div>
        <button
          onClick={exportToCSV}
          className="glass-button"
          style={{ padding: '4px 8px', fontSize: '11px' }}
          title="Download Audit Ledger"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      <div className="content-scrollable" style={{ paddingRight: '4px', maxHeight: '100%' }}>
        {blockchainLog.map((log, idx) => {
          const isCritical = log.eventType === 'CRITICAL_HAZARD';
          const isWarn = log.eventType === 'EMERGENCY_ACTION' || log.eventType.includes('WARNING');

          return (
            <div key={`${log.hash}-${idx}`} className="log-entry" style={{
              background: 'var(--bg-glass-bright)',
              padding: '10px',
              borderRadius: '6px',
              borderLeft: `2px solid ${isCritical ? 'var(--status-danger)' : (isWarn ? 'var(--status-warn)' : 'var(--brand-cyan)')}`,
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span className="font-mono" style={{ color: 'var(--brand-blue)' }}>{log.hash}</span>
                <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: isCritical ? 'var(--status-danger)' : 'var(--text-main)' }}>
                [{log.eventType}]
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {log.details}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--status-safe)', textAlign: 'center', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-safe)', boxShadow: '0 0 5px var(--status-safe)' }}></div>
        Blockchain Sync Active
      </div>
    </div>
  );
}
