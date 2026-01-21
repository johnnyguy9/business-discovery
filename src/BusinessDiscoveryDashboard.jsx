/**
 * Business Discovery Dashboard v2.1 - Production
 * ===============================================
 * Connects to FastAPI backend for real Google Places data.
 */
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const POLL_INTERVAL = 2000;

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    color: '#e2e8f0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  logo: {
    fontSize: '42px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '16px',
    marginTop: '8px',
    fontWeight: '400',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '32px',
    border: '1px solid #334155',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#cbd5e1',
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  button: {
    padding: '14px 32px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #334155',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#334155',
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '20px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  th: {
    textAlign: 'left',
    padding: '16px',
    backgroundColor: '#0f172a',
    fontWeight: '700',
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#94a3b8',
    borderBottom: '2px solid #334155',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #334155',
    fontSize: '14px',
    color: '#e2e8f0',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '700',
  },
  previewNote: {
    backgroundColor: '#1e3a5f',
    border: '1px solid #3b82f6',
    borderRadius: '10px',
    padding: '14px 18px',
    marginBottom: '20px',
    fontSize: '15px',
  },
  warningBanner: {
    backgroundColor: '#78350f',
    border: '1px solid #f59e0b',
    borderRadius: '10px',
    padding: '18px',
    marginBottom: '20px',
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    border: '1px solid #dc2626',
    borderRadius: '10px',
    padding: '14px 18px',
    color: '#fecaca',
    marginBottom: '20px',
    fontSize: '15px',
  },
  link: {
    color: '#818cf8',
    textDecoration: 'none',
  },
  stopReason: {
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '16px',
    fontSize: '13px',
  },
};

export default function BusinessDiscoveryDashboard() {
  const [keywords, setKeywords] = useState('');
  const [geographyMode, setGeographyMode] = useState('state');
  const [selectedState, setSelectedState] = useState('TX');
  const [selectedCities, setSelectedCities] = useState('');
  const [minResults, setMinResults] = useState(500);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend connectivity
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data.apiKeyConfigured ? 'ready' : 'no-api-key');
        } else {
          setBackendStatus('error');
        }
      } catch {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  // Poll for job results
  const pollResults = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`${API_BASE}/api/results/${jobId}?preview=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data);
      setJobStatus(data.status);
      if (data.status === 'completed' || data.status === 'failed') {
        setIsSearching(false);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;
    const interval = setInterval(pollResults, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, pollResults]);

  const handleSearch = async () => {
    if (!keywords.trim()) {
      setError('Please enter at least one keyword');
      return;
    }
    if (!selectedState) {
      setError('Please select a state');
      return;
    }
    if (geographyMode === 'city' && !selectedCities.trim()) {
      setError('Please enter at least one city');
      return;
    }
    if (backendStatus !== 'ready') {
      setError('Backend not ready. Check API configuration.');
      return;
    }

    setError(null);
    setIsSearching(true);
    setResults(null);
    setJobStatus('pending');

    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);

      const payload = {
        keywords: keywordList,
        geographyMode,
        state: selectedState,
        minResults: parseInt(minResults) || 500,
      };

      // Add cities if in city mode
      if (geographyMode === 'city' && selectedCities.trim()) {
        const cityList = selectedCities.split(',').map(c => c.trim()).filter(c => c);
        payload.cities = cityList;
      }

      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.jobId);
      setJobStatus('running');
    } catch (e) {
      setError(e.message);
      setIsSearching(false);
    }
  };

  const downloadCSV = () => {
    if (jobId && jobStatus === 'completed') {
      window.open(`${API_BASE}/api/results/${jobId}/csv`, '_blank');
    }
  };

  const renderBackendStatus = () => {
    if (backendStatus === 'ready') return null;

    const messages = {
      'checking': { bg: '#1e3a5f', border: '#3b82f6', text: '🔄 Checking backend connection...' },
      'offline': { bg: '#7f1d1d', border: '#dc2626', text: '❌ Backend offline. Start the server: python api_server.py' },
      'no-api-key': { bg: '#78350f', border: '#f59e0b', text: '⚠️ Backend running but GOOGLE_PLACES_API_KEY not configured.' },
      'error': { bg: '#7f1d1d', border: '#dc2626', text: '❌ Backend error. Check server logs.' },
    };

    const msg = messages[backendStatus] || messages['error'];
    return (
      <div style={{ backgroundColor: msg.bg, border: `1px solid ${msg.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px' }}>
        {msg.text}
      </div>
    );
  };

  const renderStats = () => {
    if (!results?.counts) return null;
    const c = results.counts;
    const items = [
      { value: results.totalValid || 0, label: 'Total Valid', color: '#6366f1' },
      { value: c.withPhone || 0, label: 'With Phone', color: '#10b981' },
      { value: c.withEmail || 0, label: 'With Email', color: '#f59e0b' },
      { value: c.withWebsite || 0, label: 'With Website', color: '#3b82f6' },
      { value: c.statesCovered || 0, label: 'States', color: '#ec4899' },
      { value: c.validationFailed || 0, label: 'Filtered Out', color: '#ef4444' },
    ];
    return (
      <div style={styles.statsGrid}>
        {items.map(({ value, label, color }) => (
          <div key={label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color }}>{value.toLocaleString()}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderProgress = () => {
    if (!isSearching && jobStatus !== 'running') return null;
    const progress = results?.progress || 0;
    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔍 Discovery in Progress</h3>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
          <span>
            {results?.currentKeyword && `Searching: "${results.currentKeyword}"`}
            {results?.currentCity && ` in ${results.currentCity}`}
          </span>
          <span>{progress}%</span>
        </div>
        {results?.counts && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#94a3b8' }}>
            Found: {results.totalValid || 0} valid / {results.counts.totalSearched || 0} searched
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!results?.preview || results.preview.length === 0) return null;
    const totalValid = results.totalValid || 0;
    const previewCount = results.previewCount || results.preview.length;

    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>📋 Results Preview</h3>
          {jobStatus === 'completed' && (
            <button onClick={downloadCSV} style={{ ...styles.button, ...styles.primaryButton }}>
              📥 Download Full CSV ({totalValid.toLocaleString()} rows)
            </button>
          )}
        </div>

        <div style={styles.previewNote}>
          <strong>Showing {previewCount} of {totalValid.toLocaleString()} valid businesses.</strong>
          {totalValid > previewCount && ' Download CSV for the complete dataset.'}
        </div>

        {results.lowResultWarning && (
          <div style={styles.warningBanner}>
            <div style={{ fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
              ⚠️ {results.lowResultWarning.message}
            </div>
            <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#fde68a', fontSize: '13px' }}>
              {results.lowResultWarning.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Business</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Website</th>
                <th style={styles.th}>Score</th>
              </tr>
            </thead>
            <tbody>
              {results.preview.map((b, i) => (
                <tr key={b.google_place_id || i}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{b.business_name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {b.city && b.state ? `${b.city}, ${b.state}` : (b.address?.slice(0, 40) || 'No address')}
                    </div>
                  </td>
                  <td style={styles.td}>{b.phone_number || '—'}</td>
                  <td style={styles.td}>
                    {b.email ? (
                      <a href={`mailto:${b.email}`} style={styles.link}>{b.email}</a>
                    ) : '—'}
                  </td>
                  <td style={styles.td}>
                    {b.website ? (
                      <a href={b.website} target="_blank" rel="noopener noreferrer" style={styles.link}>
                        {b.website.replace(/^https?:\/\//, '').slice(0, 25)}...
                      </a>
                    ) : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: b.data_completeness_score >= 3 ? '#065f46' : b.data_completeness_score >= 2 ? '#78350f' : '#7f1d1d',
                      color: '#fff'
                    }}>
                      {b.data_completeness_score}/4
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.stopReason && (
          <div style={styles.stopReason}>
            <strong>✅ Completed:</strong> {results.stopReasonDetail || results.stopReason}
          </div>
        )}
      </div>
    );
  };

  const renderDataQuality = () => {
    if (!results?.counts || jobStatus !== 'completed') return null;
    const c = results.counts;
    return (
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🛡️ Data Quality Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div>✅ Valid businesses: <strong>{results.totalValid?.toLocaleString()}</strong></div>
          <div>🔍 Total searched: <strong>{c.totalSearched?.toLocaleString()}</strong></div>
          <div>🔄 Duplicates removed: <strong>{c.duplicatesRemoved?.toLocaleString() || 0}</strong></div>
          <div>📞 Fake phones filtered: <strong>{c.fakePhonesFiltered?.toLocaleString() || 0}</strong></div>
          <div>📧 Fake emails filtered: <strong>{c.fakeEmailsFiltered?.toLocaleString() || 0}</strong></div>
          <div>❌ Validation failed: <strong>{c.validationFailed?.toLocaleString() || 0}</strong></div>
          <div>📧 Emails scraped: <strong>{c.emailsScraped?.toLocaleString() || 0}</strong></div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
          Validation: Business must have ≥2 of 4 contact fields. Fake 555 numbers and placeholder emails filtered.
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>PointWake Discovery</div>
        <div style={styles.subtitle}>Production Business Lead Generation</div>
      </div>

      {renderBackendStatus()}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🔍 Search Configuration</h3>

        {error && (
          <div style={styles.errorBanner}>❌ {error}</div>
        )}

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Keywords (comma-separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="party rental, bounce house, tent rental"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>State</label>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              style={styles.select}
            >
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Geography Mode</label>
            <select
              value={geographyMode}
              onChange={e => setGeographyMode(e.target.value)}
              style={styles.select}
            >
              <option value="state">Entire State (auto-coverage)</option>
              <option value="city">Specific Cities</option>
            </select>
          </div>

          {geographyMode === 'city' && (
            <div>
              <label style={styles.label}>Cities (comma-separated)</label>
              <input
                type="text"
                value={selectedCities}
                onChange={e => setSelectedCities(e.target.value)}
                placeholder="Houston, Dallas, Austin"
                style={styles.input}
              />
            </div>
          )}

          <div>
            <label style={styles.label}>Minimum Results Target</label>
            <input
              type="number"
              value={minResults}
              onChange={e => setMinResults(e.target.value)}
              min="1"
              max="5000"
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSearch}
            disabled={isSearching || backendStatus !== 'ready'}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: (isSearching || backendStatus !== 'ready') ? 0.5 : 1,
              cursor: (isSearching || backendStatus !== 'ready') ? 'not-allowed' : 'pointer',
            }}
          >
            {isSearching ? '⏳ Searching...' : '🚀 Run Search'}
          </button>
        </div>
      </div>

      {renderProgress()}

      {results?.counts && jobStatus === 'completed' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Results Summary</h3>
          {renderStats()}
        </div>
      )}

      {renderPreview()}
      {renderDataQuality()}
    </div>
  );
}
