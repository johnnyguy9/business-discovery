/**
 * Diagnostic component to show what API URL is compiled into the build
 */
export default function DiagnosticInfo() {
  const apiUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';
  const mode = (import.meta as any).env.MODE;
  const dev = (import.meta as any).env.DEV;
  const prod = (import.meta as any).env.PROD;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: '#00ff00',
      padding: '8px 12px',
      fontSize: '11px',
      fontFamily: 'monospace',
      borderTopLeftRadius: '4px',
      zIndex: 9999,
      maxWidth: '400px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔍 Build Diagnostics</div>
      <div>API URL: <strong>{apiUrl}</strong></div>
      <div>Mode: {mode}</div>
      <div>Dev: {dev ? 'true' : 'false'}</div>
      <div>Prod: {prod ? 'true' : 'false'}</div>
      <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.7 }}>
        This shows the value compiled into this build
      </div>
    </div>
  );
}
