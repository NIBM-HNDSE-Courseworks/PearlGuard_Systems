import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      onLogin();
    } else {
      setError('Invalid Access Token');
    }
  };

  return (
    <div className="login-overlay">
      <div className="glass-panel login-card">
        <div className="brand-title" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <Shield size={32} color="var(--brand-cyan)" />
          PearlGuard
        </div>
        
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
          Secure Command Center Access
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-cyan)' }} />
            <input 
              type="password" 
              placeholder="Enter Security Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
            />
          </div>

          {error && <div className="text-danger" style={{ fontSize: '12px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className="glass-button active" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            Authorize Access
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          ENTERPRISE SECURITY LAYER v4.2.0
        </div>
      </div>
    </div>
  );
}
