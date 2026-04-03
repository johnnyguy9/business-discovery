/**
 * Free Business Lead Scraper — Powered by PointWake
 * ==================================================
 * Production lead generation tool with PointWake branding.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const POLL_INTERVAL = 2000;
const MAX_RESULTS = 250;

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

const CITY_COORDS = {
  TX: [
    { city: "Houston", lat: 29.7604, lng: -95.3698 },
    { city: "San Antonio", lat: 29.4241, lng: -98.4936 },
    { city: "Dallas", lat: 32.7767, lng: -96.7970 },
    { city: "Austin", lat: 30.2672, lng: -97.7431 },
    { city: "Fort Worth", lat: 32.7555, lng: -97.3308 },
    { city: "El Paso", lat: 31.7619, lng: -106.4850 },
    { city: "Arlington", lat: 32.7357, lng: -97.1081 },
    { city: "Corpus Christi", lat: 27.8006, lng: -97.3964 },
    { city: "Plano", lat: 33.0198, lng: -96.6989 },
    { city: "Lubbock", lat: 33.5779, lng: -101.8552 },
  ],
  CA: [
    { city: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { city: "San Diego", lat: 32.7157, lng: -117.1611 },
    { city: "San Jose", lat: 37.3382, lng: -121.8863 },
    { city: "San Francisco", lat: 37.7749, lng: -122.4194 },
    { city: "Fresno", lat: 36.7378, lng: -119.7871 },
    { city: "Sacramento", lat: 38.5816, lng: -121.4944 },
    { city: "Long Beach", lat: 33.7701, lng: -118.1937 },
  ],
  FL: [
    { city: "Jacksonville", lat: 30.3322, lng: -81.6557 },
    { city: "Miami", lat: 25.7617, lng: -80.1918 },
    { city: "Tampa", lat: 27.9506, lng: -82.4572 },
    { city: "Orlando", lat: 28.5383, lng: -81.3792 },
    { city: "St. Petersburg", lat: 27.7676, lng: -82.6403 },
  ],
  NY: [
    { city: "New York City", lat: 40.7128, lng: -74.0060 },
    { city: "Buffalo", lat: 42.8864, lng: -78.8784 },
    { city: "Rochester", lat: 43.1566, lng: -77.6088 },
    { city: "Yonkers", lat: 40.9312, lng: -73.8987 },
  ],
  IL: [
    { city: "Chicago", lat: 41.8781, lng: -87.6298 },
    { city: "Aurora", lat: 41.7606, lng: -88.3201 },
    { city: "Naperville", lat: 41.7508, lng: -88.1535 },
  ],
  PA: [
    { city: "Philadelphia", lat: 39.9526, lng: -75.1652 },
    { city: "Pittsburgh", lat: 40.4406, lng: -79.9959 },
    { city: "Allentown", lat: 40.6084, lng: -75.4902 },
  ],
  OH: [
    { city: "Columbus", lat: 39.9612, lng: -82.9988 },
    { city: "Cleveland", lat: 41.4993, lng: -81.6944 },
    { city: "Cincinnati", lat: 39.1031, lng: -84.5120 },
  ],
  GA: [
    { city: "Atlanta", lat: 33.7490, lng: -84.3880 },
    { city: "Augusta", lat: 33.4735, lng: -82.0105 },
    { city: "Columbus", lat: 32.4610, lng: -84.9877 },
  ],
  NC: [
    { city: "Charlotte", lat: 35.2271, lng: -80.8431 },
    { city: "Raleigh", lat: 35.7796, lng: -78.6382 },
    { city: "Greensboro", lat: 36.0726, lng: -79.7920 },
  ],
  MI: [
    { city: "Detroit", lat: 42.3314, lng: -83.0458 },
    { city: "Grand Rapids", lat: 42.9634, lng: -85.6681 },
    { city: "Warren", lat: 42.5145, lng: -83.0147 },
  ],
  NJ: [
    { city: "Newark", lat: 40.7357, lng: -74.1724 },
    { city: "Jersey City", lat: 40.7178, lng: -74.0431 },
    { city: "Paterson", lat: 40.9168, lng: -74.1718 },
  ],
  VA: [
    { city: "Virginia Beach", lat: 36.8529, lng: -75.9780 },
    { city: "Norfolk", lat: 36.8508, lng: -76.2859 },
    { city: "Chesapeake", lat: 36.7682, lng: -76.2875 },
  ],
  WA: [
    { city: "Seattle", lat: 47.6062, lng: -122.3321 },
    { city: "Spokane", lat: 47.6588, lng: -117.4260 },
    { city: "Tacoma", lat: 47.2529, lng: -122.4443 },
  ],
  AZ: [
    { city: "Phoenix", lat: 33.4484, lng: -112.0740 },
    { city: "Tucson", lat: 32.2226, lng: -110.9747 },
    { city: "Mesa", lat: 33.4152, lng: -111.8315 },
  ],
  MA: [
    { city: "Boston", lat: 42.3601, lng: -71.0589 },
    { city: "Worcester", lat: 42.2626, lng: -71.8023 },
    { city: "Springfield", lat: 42.1015, lng: -72.5898 },
  ],
  TN: [
    { city: "Nashville", lat: 36.1627, lng: -86.7816 },
    { city: "Memphis", lat: 35.1495, lng: -90.0490 },
    { city: "Knoxville", lat: 35.9606, lng: -83.9207 },
  ],
  IN: [
    { city: "Indianapolis", lat: 39.7684, lng: -86.1581 },
    { city: "Fort Wayne", lat: 41.0793, lng: -85.1394 },
  ],
  MO: [
    { city: "Kansas City", lat: 39.0997, lng: -94.5786 },
    { city: "St. Louis", lat: 38.6270, lng: -90.1994 },
  ],
  MD: [
    { city: "Baltimore", lat: 39.2904, lng: -76.6122 },
    { city: "Columbia", lat: 39.2037, lng: -76.8610 },
  ],
  CO: [
    { city: "Denver", lat: 39.7392, lng: -104.9903 },
    { city: "Colorado Springs", lat: 38.8339, lng: -104.8214 },
  ],
  MN: [
    { city: "Minneapolis", lat: 44.9778, lng: -93.2650 },
    { city: "St. Paul", lat: 44.9537, lng: -93.0900 },
  ],
  WI: [
    { city: "Milwaukee", lat: 43.0389, lng: -87.9065 },
    { city: "Madison", lat: 43.0731, lng: -89.4012 },
  ],
  SC: [
    { city: "Charleston", lat: 32.7765, lng: -79.9311 },
    { city: "Columbia", lat: 34.0007, lng: -81.0348 },
  ],
  AL: [{ city: "Birmingham", lat: 33.5207, lng: -86.8025 }],
  AK: [{ city: "Anchorage", lat: 61.2181, lng: -149.9003 }],
  AR: [{ city: "Little Rock", lat: 34.7465, lng: -92.2896 }],
  CT: [{ city: "Bridgeport", lat: 41.1865, lng: -73.1952 }],
  DE: [{ city: "Wilmington", lat: 39.7391, lng: -75.5398 }],
  DC: [{ city: "Washington", lat: 38.9072, lng: -77.0369 }],
  HI: [{ city: "Honolulu", lat: 21.3069, lng: -157.8583 }],
  ID: [{ city: "Boise", lat: 43.6150, lng: -116.2023 }],
  IA: [{ city: "Des Moines", lat: 41.5868, lng: -93.6250 }],
  KS: [{ city: "Wichita", lat: 37.6872, lng: -97.3301 }],
  KY: [{ city: "Louisville", lat: 38.2527, lng: -85.7585 }],
  LA: [{ city: "New Orleans", lat: 29.9511, lng: -90.0715 }],
  ME: [{ city: "Portland", lat: 43.6591, lng: -70.2568 }],
  MS: [{ city: "Jackson", lat: 32.2988, lng: -90.1848 }],
  MT: [{ city: "Billings", lat: 45.7833, lng: -108.5007 }],
  NE: [{ city: "Omaha", lat: 41.2565, lng: -95.9345 }],
  NV: [{ city: "Las Vegas", lat: 36.1699, lng: -115.1398 }],
  NH: [{ city: "Manchester", lat: 42.9956, lng: -71.4548 }],
  NM: [{ city: "Albuquerque", lat: 35.0844, lng: -106.6504 }],
  ND: [{ city: "Fargo", lat: 46.8772, lng: -96.7898 }],
  OK: [{ city: "Oklahoma City", lat: 35.4676, lng: -97.5164 }],
  OR: [{ city: "Portland", lat: 45.5152, lng: -122.6784 }],
  RI: [{ city: "Providence", lat: 41.8240, lng: -71.4128 }],
  SD: [{ city: "Sioux Falls", lat: 43.5446, lng: -96.7311 }],
  UT: [{ city: "Salt Lake City", lat: 40.7608, lng: -111.8910 }],
  VT: [{ city: "Burlington", lat: 44.4759, lng: -73.2121 }],
  WV: [{ city: "Charleston", lat: 38.3498, lng: -81.6326 }],
  WY: [{ city: "Cheyenne", lat: 41.1400, lng: -104.8202 }],
};

// PointWake brand colors
const brand = {
  orange: '#D4871C',
  orangeLight: '#E8A33C',
  orangeDark: '#B8720F',
  orangeGlow: 'rgba(212, 135, 28, 0.3)',
  dark: '#0f172a',
  darkCard: '#1e293b',
  darkInput: '#0f172a',
  border: '#334155',
  borderHover: '#D4871C',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textLight: '#cbd5e1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
    backgroundColor: brand.dark,
    minHeight: '100vh',
    color: brand.text,
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  logo: {
    fontSize: '46px',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${brand.orange}, ${brand.orangeLight})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: brand.textMuted,
    fontSize: '18px',
    marginTop: '8px',
    fontWeight: '400',
    maxWidth: '600px',
    margin: '8px auto 0',
    lineHeight: '1.5',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    background: `linear-gradient(135deg, ${brand.orange}, ${brand.orangeLight})`,
    color: '#fff',
    marginTop: '16px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: brand.darkCard,
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '32px',
    border: `1px solid ${brand.border}`,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    transition: 'border-color 0.2s',
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
    color: brand.textLight,
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${brand.border}`,
    backgroundColor: brand.darkInput,
    color: brand.text,
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${brand.border}`,
    backgroundColor: brand.darkInput,
    color: brand.text,
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
    background: `linear-gradient(135deg, ${brand.orange}, ${brand.orangeLight})`,
    color: 'white',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: brand.darkInput,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    border: `1px solid ${brand.border}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '12px',
    color: brand.textMuted,
    marginTop: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  progressBar: {
    height: '10px',
    backgroundColor: brand.border,
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '20px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${brand.orange}, ${brand.orangeLight})`,
    transition: 'width 0.3s ease',
    boxShadow: `0 0 10px ${brand.orangeGlow}`,
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
    backgroundColor: brand.darkInput,
    fontWeight: '700',
    fontSize: '12px',
    textTransform: 'uppercase',
    color: brand.textMuted,
    borderBottom: `2px solid ${brand.border}`,
    letterSpacing: '0.5px',
  },
  td: {
    padding: '16px',
    borderBottom: `1px solid ${brand.border}`,
    fontSize: '14px',
    color: brand.text,
  },
  scoreBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '14px',
    fontSize: '12px',
    fontWeight: '700',
  },
  previewNote: {
    backgroundColor: '#1e3a5f',
    border: `1px solid ${brand.info}`,
    borderRadius: '10px',
    padding: '14px 18px',
    marginBottom: '20px',
    fontSize: '15px',
  },
  warningBanner: {
    backgroundColor: '#78350f',
    border: `1px solid ${brand.warning}`,
    borderRadius: '10px',
    padding: '18px',
    marginBottom: '20px',
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    border: `1px solid ${brand.error}`,
    borderRadius: '10px',
    padding: '14px 18px',
    color: '#fecaca',
    marginBottom: '20px',
    fontSize: '15px',
  },
  link: {
    color: brand.orangeLight,
    textDecoration: 'none',
  },
  stopReason: {
    backgroundColor: brand.darkInput,
    border: `1px solid ${brand.border}`,
    borderRadius: '8px',
    padding: '12px',
    marginTop: '16px',
    fontSize: '13px',
  },
  // PointWake CTA section
  ctaSection: {
    background: `linear-gradient(135deg, ${brand.darkCard}, #1a2744)`,
    borderRadius: '20px',
    padding: '48px 40px',
    marginTop: '48px',
    border: `1px solid ${brand.border}`,
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `radial-gradient(ellipse at center, ${brand.orangeGlow} 0%, transparent 70%)`,
    opacity: 0.3,
    pointerEvents: 'none',
  },
  ctaTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '16px',
    position: 'relative',
    zIndex: 1,
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: brand.textMuted,
    maxWidth: '600px',
    margin: '0 auto 32px',
    lineHeight: '1.6',
    position: 'relative',
    zIndex: 1,
  },
  ctaFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    maxWidth: '700px',
    margin: '0 auto 36px',
    position: 'relative',
    zIndex: 1,
  },
  ctaFeature: {
    fontSize: '15px',
    color: brand.textLight,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '16px 40px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '700',
    fontSize: '16px',
    cursor: 'pointer',
    background: `linear-gradient(135deg, ${brand.orange}, ${brand.orangeLight})`,
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 20px ${brand.orangeGlow}`,
    position: 'relative',
    zIndex: 1,
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    padding: '20px 0',
    borderTop: `1px solid ${brand.border}`,
    fontSize: '13px',
    color: brand.textMuted,
  },
};

const GHL_FORM_URL = 'https://login.pointwake.com/widget/form/7aax5V2tvVuk2hZPqO3T';
const FREE_PREVIEW_COUNT = 10;

// Email validation — filters out garbage like image filenames, placeholder text, etc.
const INVALID_EMAIL_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff|pdf|doc|docx|xls|xlsx|zip|rar)$/i;
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  // Must match basic email format: something@domain.tld
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  // Reject if the domain part looks like an image filename (e.g., 1.2x-300x238.jpg)
  if (INVALID_EMAIL_EXTENSIONS.test(trimmed)) return false;
  // Reject if domain contains resolution patterns like 1.2x, 300x238, @2x, etc.
  const domain = trimmed.split('@')[1];
  if (/\d+x\d+/.test(domain) || /\d+\.\d+x/.test(domain)) return false;
  // Reject common placeholder/noreply-style garbage
  if (/^(noreply|no-reply|donotreply|test|example|admin|info|support)@/.test(trimmed) === false) {
    // These are fine, keep going
  }
  return true;
}

export default function BusinessDiscoveryDashboard() {
  const [keywords, setKeywords] = useState('');
  const [geographyMode, setGeographyMode] = useState('state');
  const [selectedState, setSelectedState] = useState('TX');
  const [selectedCities, setSelectedCities] = useState('');
  const [minResults, setMinResults] = useState(MAX_RESULTS);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [modalOpenedAt, setModalOpenedAt] = useState(null);
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const modalOpenedAtRef = useRef(null); // tracks when modal opened (avoids stale closure)

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
      setError('Please enter at least one city name');
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
        minResults: Math.min(parseInt(minResults) || MAX_RESULTS, MAX_RESULTS),
      };

      if (geographyMode === 'city' && selectedCities.trim()) {
        const cityNames = selectedCities.split(',').map(c => c.trim()).filter(c => c);
        const stateCities = CITY_COORDS[selectedState] || [];
        const cityObjects = [];
        const notFound = [];
        for (const name of cityNames) {
          const match = stateCities.find(sc => sc.city.toLowerCase() === name.toLowerCase());
          if (match) {
            cityObjects.push(match);
          } else {
            notFound.push(name);
          }
        }
        if (notFound.length > 0) {
          const available = stateCities.map(c => c.city).join(', ');
          setError('City not found for ' + selectedState + ': ' + notFound.join(', ') + '. Available: ' + (available || 'none'));
          setIsSearching(false);
          return;
        }
        payload.cities = cityObjects;
      }

      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.detail)
            ? errData.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ')
            : (typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail || ''));
        throw new Error(msg || `HTTP ${res.status}`);
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
    if (!jobId || jobStatus !== 'completed') return;
    if (!isUnlocked) {
      const now = Date.now();
      setShowUnlockModal(true);
      setModalOpenedAt(now);
      modalOpenedAtRef.current = now;
      setFallbackVisible(false);
      return;
    }
    window.open(`${API_BASE}/api/results/${jobId}/csv`, '_blank');
  };

  // Listen for GHL form submission (form posts a message when submitted)
  // IMPORTANT: GHL iframes send postMessage on load too, so we must ignore
  // messages that arrive within the first 3 seconds of the modal opening.
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://login.pointwake.com') return;
      // Ignore if modal hasn't been open long enough (iframe load fires instantly)
      const openedAt = modalOpenedAtRef.current;
      if (!openedAt || (Date.now() - openedAt) < 3000) return;
      // Passed timing gate — treat as genuine form submission
      setIsUnlocked(true);
      setShowUnlockModal(false);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fallback: show a small "I already submitted" link after 45s in case postMessage doesn't fire
  useEffect(() => {
    if (!showUnlockModal || !modalOpenedAt) return;
    const timer = setTimeout(() => setFallbackVisible(true), 45000);
    return () => clearTimeout(timer);
  }, [showUnlockModal, modalOpenedAt]);

  const renderUnlockModal = () => {
    if (!showUnlockModal) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          backgroundColor: brand.darkCard, borderRadius: '20px',
          padding: '32px', maxWidth: '520px', width: '100%',
          border: `1px solid ${brand.border}`, position: 'relative',
          boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${brand.orangeGlow}`,
        }}>
          <button
            onClick={() => setShowUnlockModal(false)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', color: brand.textMuted,
              fontSize: '24px', cursor: 'pointer', lineHeight: 1,
            }}
          >
            &#10005;
          </button>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>&#128274;</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              Unlock Your Full Lead List
            </h2>
            <p style={{ fontSize: '15px', color: brand.textMuted, lineHeight: '1.5' }}>
              Fill out the form below to download all {results?.totalValid ? Math.min(results.totalValid, MAX_RESULTS).toLocaleString() : ''} leads as a CSV file — completely free.
            </p>
          </div>

          <iframe
            src={GHL_FORM_URL}
            style={{
              width: '100%', height: '480px', border: 'none', borderRadius: '12px',
              backgroundColor: '#fff',
            }}
            title="Unlock leads form"
          />

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ fontSize: '14px', color: brand.textMuted, marginBottom: '8px' }}>
              &#9432; Submit the form above — your download will start automatically.
            </p>
            {fallbackVisible && (
              <button
                onClick={() => { setIsUnlocked(true); setShowUnlockModal(false); }}
                style={{
                  background: 'none', border: 'none', color: brand.textMuted,
                  fontSize: '12px', cursor: 'pointer', textDecoration: 'underline',
                  padding: '4px', marginTop: '4px',
                }}
              >
                I already submitted but nothing happened
              </button>
            )}
            <p style={{ fontSize: '12px', color: brand.textMuted, marginTop: '10px' }}>
              By PointWake &bull; We respect your privacy. No spam.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderBackendStatus = () => {
    if (backendStatus === 'ready') return null;

    const messages = {
      'checking': { bg: '#1e3a5f', border: brand.info, text: 'Checking connection to lead database...' },
      'offline': { bg: '#7f1d1d', border: brand.error, text: 'Lead database is temporarily unavailable. Please try again in a few minutes.' },
      'no-api-key': { bg: '#78350f', border: brand.warning, text: 'Service is being configured. Please check back shortly.' },
      'error': { bg: '#7f1d1d', border: brand.error, text: 'Something went wrong. Please refresh and try again.' },
    };

    const msg = messages[backendStatus] || messages['error'];
    return (
      <div style={{ backgroundColor: msg.bg, border: `1px solid ${msg.border}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
        {msg.text}
      </div>
    );
  };

  const renderStats = () => {
    if (!results?.counts) return null;
    const c = results.counts;
    const items = [
      { value: Math.min(results.totalValid || 0, MAX_RESULTS), label: 'Total Leads', color: brand.orange },
      { value: c.withPhone || 0, label: 'With Phone', color: brand.success },
      { value: c.withEmail || 0, label: 'With Email', color: brand.warning },
      { value: c.withWebsite || 0, label: 'With Website', color: brand.info },
      { value: c.statesCovered || 0, label: 'Regions', color: '#ec4899' },
      { value: c.validationFailed || 0, label: 'Filtered Out', color: brand.error },
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
        <h3 style={styles.cardTitle}>Searching for Leads...</h3>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: brand.textMuted }}>
          <span>
            {results?.currentKeyword && `Looking for: "${results.currentKeyword}"`}
            {results?.currentCity && ` in ${results.currentCity}`}
          </span>
          <span>{progress}%</span>
        </div>
        {results?.counts && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: brand.textMuted }}>
            Found: {Math.min(results.totalValid || 0, MAX_RESULTS)} leads / {results.counts.totalSearched || 0} searched
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!results?.preview || results.preview.length === 0) return null;
    const totalValid = Math.min(results.totalValid || 0, MAX_RESULTS);
    const previewCount = results.previewCount || results.preview.length;
    const visibleRows = results.preview.slice(0, FREE_PREVIEW_COUNT);
    const hasMoreResults = totalValid > FREE_PREVIEW_COUNT;
    const showGate = hasMoreResults && !isUnlocked && jobStatus === 'completed';

    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Lead Results</h3>
          {jobStatus === 'completed' && (
            <button onClick={downloadCSV} style={{ ...styles.button, ...styles.primaryButton }}>
              {isUnlocked ? `Download CSV (${totalValid.toLocaleString()} leads)` : `Unlock & Download All ${totalValid.toLocaleString()} Leads`}
            </button>
          )}
        </div>

        <div style={styles.previewNote}>
          {isUnlocked ? (
            <strong>Showing {previewCount} of {totalValid.toLocaleString()} verified leads. Your CSV is ready to download.</strong>
          ) : (
            <>
              <strong>Preview: {Math.min(FREE_PREVIEW_COUNT, previewCount)} of {totalValid.toLocaleString()} verified leads.</strong>
              {hasMoreResults && ' Enter your email to download the full list as CSV.'}
            </>
          )}
        </div>

        {results.lowResultWarning && (
          <div style={styles.warningBanner}>
            <div style={{ fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
              {results.lowResultWarning.message}
            </div>
            <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#fde68a', fontSize: '13px' }}>
              {results.lowResultWarning.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div style={{ overflowX: 'auto', position: 'relative' }}>
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
              {visibleRows.map((b, i) => (
                <tr key={b.google_place_id || i}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{b.business_name || 'N/A'}</div>
                    <div style={{ fontSize: '11px', color: brand.textMuted }}>
                      {b.city && b.state ? `${b.city}, ${b.state}` : (b.address?.slice(0, 40) || 'No address')}
                    </div>
                  </td>
                  <td style={styles.td}>{b.phone_number || '—'}</td>
                  <td style={styles.td}>
                    {b.email && isValidEmail(b.email) ? (
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
                      ...styles.scoreBadge,
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

          {/* Blurred gate overlay for locked results */}
          {showGate && (
            <div style={{
              position: 'relative', marginTop: '-2px',
              background: `linear-gradient(180deg, transparent 0%, ${brand.darkCard} 40%)`,
              padding: '60px 20px 40px', textAlign: 'center',
              borderRadius: '0 0 12px 12px',
            }}>
              <div style={{
                display: 'inline-block', padding: '8px 20px', borderRadius: '20px',
                background: `linear-gradient(135deg, ${brand.orange}, ${brand.orangeLight})`,
                color: '#fff', fontSize: '14px', fontWeight: '700', marginBottom: '16px',
              }}>
                +{(totalValid - FREE_PREVIEW_COUNT).toLocaleString()} more leads available
              </div>
              <p style={{ color: brand.textMuted, fontSize: '15px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
                Enter your info to unlock the full lead list and download as CSV — completely free.
              </p>
              <button
                onClick={() => { const now = Date.now(); setShowUnlockModal(true); setModalOpenedAt(now); modalOpenedAtRef.current = now; setFallbackVisible(false); }}
                style={{
                  ...styles.button, ...styles.primaryButton,
                  fontSize: '16px', padding: '16px 40px',
                  boxShadow: `0 4px 20px ${brand.orangeGlow}`,
                }}
              >
                Unlock All Results &#8594;
              </button>
            </div>
          )}
        </div>

        {results.stopReason && (
          <div style={styles.stopReason}>
            <strong>Completed:</strong> {results.stopReasonDetail || results.stopReason}
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
        <h3 style={styles.cardTitle}>Data Quality Report</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div>Verified leads: <strong>{Math.min(results.totalValid || 0, MAX_RESULTS).toLocaleString()}</strong></div>
          <div>Total searched: <strong>{c.totalSearched?.toLocaleString()}</strong></div>
          <div>Duplicates removed: <strong>{c.duplicatesRemoved?.toLocaleString() || 0}</strong></div>
          <div>Fake phones filtered: <strong>{c.fakePhonesFiltered?.toLocaleString() || 0}</strong></div>
          <div>Fake emails filtered: <strong>{c.fakeEmailsFiltered?.toLocaleString() || 0}</strong></div>
          <div>Validation failed: <strong>{c.validationFailed?.toLocaleString() || 0}</strong></div>
          <div>Emails found: <strong>{c.emailsScraped?.toLocaleString() || 0}</strong></div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
          Every lead is validated — must have at least 2 of 4 contact fields. Fake numbers and placeholder emails are automatically filtered.
        </div>
      </div>
    );
  };

  const renderPointWakeCTA = () => (
    <div style={styles.ctaSection}>
      <div style={styles.ctaGlow} />
      <h2 style={styles.ctaTitle}>Got Your Leads. Now What?</h2>
      <p style={styles.ctaSubtitle}>
        Finding leads is step one. Converting them is where the money is. PointWake builds the systems that turn cold leads into booked jobs — automatically.
      </p>
      <div style={styles.ctaFeatures}>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> Automated follow-up sequences
        </div>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> CRM setup &amp; management
        </div>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> AI-powered lead qualification
        </div>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> Operations workflow design
        </div>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> Speed-to-lead optimization
        </div>
        <div style={styles.ctaFeature}>
          <span style={{ color: brand.orange }}>&#10003;</span> Full automation builds
        </div>
      </div>
      <a
        href="https://pointwake.com?utm_source=leadscraper&utm_medium=cta&utm_campaign=free_tool"
        target="_blank"
        rel="noopener noreferrer"
        style={styles.ctaButton}
      >
        Get My Growth Plan &rarr;
      </a>
      <div style={{ marginTop: '16px', fontSize: '13px', color: brand.textMuted, position: 'relative', zIndex: 1 }}>
        Free consultation &bull; No commitment &bull; (830) 302-3193
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Free Business Lead Scraper</h1>
        <p style={styles.subtitle}>
          Search any industry in any U.S. state or city. Get names, phone numbers, emails, and websites — export to CSV instantly.
        </p>
        <div style={styles.badge}>100% Free &bull; No Credit Card Required</div>
      </header>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <a href="https://pointwake.com" target="_blank" rel="noopener noreferrer" style={{ color: brand.textMuted, fontSize: '13px', textDecoration: 'none' }}>
          Powered by <span style={{ color: brand.orangeLight, fontWeight: '600' }}>PointWake</span>
        </a>
      </div>

      {renderBackendStatus()}

      {/* Search Form */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Search for Leads</h2>

        {error && (
          <div style={styles.errorBanner}>{error}</div>
        )}

        <div style={styles.formGrid}>
          <div>
            <label style={styles.label}>Industry Keywords (comma-separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="e.g. plumber, roofing, landscaping"
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
                placeholder="e.g. Houston, Dallas, Austin"
                style={styles.input}
              />
            </div>
          )}

          <div>
            <label style={styles.label}>Maximum Results (up to {MAX_RESULTS})</label>
            <input
              type="number"
              value={minResults}
              onChange={e => setMinResults(Math.min(parseInt(e.target.value) || MAX_RESULTS, MAX_RESULTS))}
              min="1"
              max={MAX_RESULTS}
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
              fontSize: '16px',
              padding: '16px 40px',
            }}
          >
            {isSearching ? 'Searching...' : 'Find Leads'}
          </button>
        </div>
      </div>

      {renderProgress()}

      {results?.counts && jobStatus === 'completed' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Results Summary</h3>
          {renderStats()}
        </div>
      )}

      {renderPreview()}
      {renderDataQuality()}

      {/* Unlock Modal */}
      {renderUnlockModal()}

      {/* PointWake CTA */}
      {renderPointWakeCTA()}

      {/* Footer */}
      <footer style={styles.footer}>
        <div>
          <a href="https://pointwake.com" target="_blank" rel="noopener noreferrer" style={{ ...styles.link, fontWeight: '600' }}>
            PointWake
          </a>
          {' '}&bull; Operations Consulting &amp; Automation for Service Businesses
        </div>
        <div style={{ marginTop: '8px' }}>
          Canyon Lake, Texas &bull; (830) 302-3193 &bull; info@pointwake.com
        </div>
      </footer>
    </div>
  );
}
