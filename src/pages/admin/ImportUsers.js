import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function ImportUsers() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!file) return setError('Please choose a .xlsx or .csv file');
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    try {
      const res = await api.post('/admin/import-users', form, { headers: { 'Content-Type': 'multipart/form-data', Authorization: token ? `Bearer ${token}` : undefined } });
      setResult(res.data);
    } catch (e) {
      const data = e.response?.data;
      const validation = Array.isArray(data?.errors) ? data.errors.map(er => er.msg || er.param || JSON.stringify(er)).join('; ') : '';
      const msg = data?.error || validation || e.message || 'Import failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onExport = async (format) => {
    try {
      const res = await api.get('/admin/export-users', {
        params: { format },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setError(e.response?.data?.error || 'Export failed');
    }
  };

  return (
    <div className="card">
      <h2>Import Users</h2>
      <p>Upload an Excel (.xlsx) file with headers: <code>firstname, lastname, department, role, birthdate, companyid, group</code>. Dates must be YYYY-MM-DD or MM/DD/YYYY.</p>
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => onExport('xlsx')}>Export Excel</button>
      </div>
      <form onSubmit={onSubmit} className="form">
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Importing...' : 'Upload & Import'}</button>
      </form>
      {result && (
        <div className="success">
          Inserted: {result.inserted}, Matched Existing: {result.matchedExisting}
          {typeof result.skippedExistingName === 'number' && (
            <> , Skipped (name duplicates): {result.skippedExistingName}</>
          )}
        </div>
      )}
    </div>
  );
}
