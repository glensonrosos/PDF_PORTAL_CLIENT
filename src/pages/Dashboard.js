import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/files');
        setFiles(res.data);
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const openPdf = async (id, name) => {
    try {
      const res = await api.get(`/files/${id}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noreferrer');
      if (w) {
        // Try to set title if same-origin URL blob allows
        try { w.document.title = name || 'PDF'; } catch {}
      }
      // Optionally revoke later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to open file');
    }
  };

  return (
    <div className="card">
      <h2>My PDFs</h2>
      {files.length === 0 ? (
        <div>No files available for your group.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Uploaded</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => {
              const name = f.displayName || f.originalName;
              const dateStr = f.uploadDate ? new Date(f.uploadDate).toLocaleDateString() : '';
              return (
                <tr key={f.id}>
                  <td>{name}</td>
                  <td>{dateStr}</td>
                  <td>
                    <button className="btn" onClick={() => openPdf(f.id, name)}>Open</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
