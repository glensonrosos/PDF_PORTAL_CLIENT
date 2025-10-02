import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [companyid, setCompanyid] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [yy, setYy] = useState('');
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
  const months = [
    { v: '01', n: 'January' }, { v: '02', n: 'February' }, { v: '03', n: 'March' }, { v: '04', n: 'April' },
    { v: '05', n: 'May' }, { v: '06', n: 'June' }, { v: '07', n: 'July' }, { v: '08', n: 'August' },
    { v: '09', n: 'September' }, { v: '10', n: 'October' }, { v: '11', n: 'November' }, { v: '12', n: 'December' }
  ];
  const daysInMonth = (y, m) => {
    const yi = parseInt(y, 10); const mi = parseInt(m, 10);
    if (!yi || !mi) return 31;
    return new Date(yi, mi, 0).getDate();
  };
  const days = Array.from({ length: daysInMonth(yy, mm) }, (_, i) => String(i + 1).padStart(2, '0'));

  const onYMDChange = (newY, newM, newD) => {
    const y = newY ?? yy; const m = newM ?? mm; const d = newD ?? dd;
    setYy(y); setMm(m); setDd(d);
    if (y && m && d) setBirthdate(`${y}-${m}-${d}`);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(companyid.trim(), birthdate);
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .login-card { padding: 16px; }
          .login-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
          .login-actions button { width: 100%; }
        }
      `}</style>
      <div className="card login-card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} className="form">
          <label>
            Company ID
            <input
              type="text"
              inputMode="text"
              autoComplete="username"
              placeholder="Enter your Company ID"
              value={companyid}
              onChange={(e) => setCompanyid(e.target.value)}
              required
            />
          </label>
          <div>
            <label style={{ marginBottom: 6, display: 'inline-block' }}>Birthdate</label>
            <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <select aria-label="Year" value={yy} onChange={(e) => onYMDChange(e.target.value, null, null)} required>
                <option value="" disabled>Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select aria-label="Month" value={mm} onChange={(e) => onYMDChange(null, e.target.value, null)} required>
                <option value="" disabled>Month</option>
                {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
              </select>
              <select aria-label="Day" value={dd} onChange={(e) => onYMDChange(null, null, e.target.value)} required>
                <option value="" disabled>Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* hidden input to keep a single source string for submission */}
            <input type="hidden" value={birthdate} readOnly required />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="login-actions">
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
