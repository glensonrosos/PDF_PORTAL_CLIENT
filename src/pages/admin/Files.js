import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [uploadGroupsOpen, setUploadGroupsOpen] = useState(false);
  const [selectedUploadGroups, setSelectedUploadGroups] = useState([]);
  const [uploadDisplayName, setUploadDisplayName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editGroups, setEditGroups] = useState([]);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pageInput, setPageInput] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [fRes, gRes] = await Promise.all([
        api.get('/admin/files', { params: { page, limit, q } }),
        api.get('/admin/groups')
      ]);
      const data = fRes.data || {};
      setFiles(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
      if (typeof data.total === 'number') setTotal(data.total); else if (Array.isArray(data)) setTotal(data.length);
      setGroups(gRes.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, limit, q]);
  useEffect(() => { setPageInput(page); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setQ(searchInput); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleUploadGroup = (name) => {
    setSelectedUploadGroups((prev) => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return Array.from(s);
    });
  };

  const toggleEditGroup = (name) => {
    setEditGroups((prev) => {
      const s = new Set(prev);
      if (s.has(name)) s.delete(name); else s.add(name);
      return Array.from(s);
    });
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Choose a PDF');
    if (!selectedUploadGroups.length) return alert('Please select at least one group');
    const form = new FormData();
    form.append('file', file);
    selectedUploadGroups.forEach(g => form.append('groups', g));
    if (uploadDisplayName.trim()) form.append('displayName', uploadDisplayName.trim());
    try {
      await api.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null); setSelectedUploadGroups([]); setUploadDisplayName('');
      setUploadGroupsOpen(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Upload failed');
    }
  };

  const beginEditGroups = (f) => {
    setEditingId(f._id);
    setEditGroups(Array.isArray(f.groups) ? f.groups : []);
    setEditDisplayName(f.displayName || '');
  };

  const saveEditGroups = async () => {
    if (!editingId) return;
    try {
      await api.put(`/admin/files/${editingId}`, { groups: editGroups, displayName: editDisplayName });
      setEditingId(null);
      setEditGroups([]);
      setEditDisplayName('');
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update file');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`/admin/files/${id}`);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete file');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <h3>Upload PDF</h3>
          <form className="form" onSubmit={onUpload}>
            <label>PDF File<input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
            <label>Display Name (optional)<input value={uploadDisplayName} onChange={(e) => setUploadDisplayName(e.target.value)} placeholder="e.g., August Statement Summary" /></label>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Groups</label>
                <button type="button" onClick={() => setUploadGroupsOpen(v => !v)} style={{ padding: '6px 8px' }}>
                  {uploadGroupsOpen ? 'Hide' : 'Select'}
                </button>
              </div>
              {uploadGroupsOpen && (
                <div style={{ border: '1px solid #1f2937', borderRadius: 8, padding: 8, marginTop: 8, maxHeight: 180, overflow: 'auto' }}>
                  {groups.length === 0 && <div className="muted">No groups yet. Add some in Users tab.</div>}
                  {groups.map(g => (
                    <label key={g._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedUploadGroups.includes(g.name)}
                        onChange={() => toggleUploadGroup(g.name)}
                      />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button type="submit">Upload</button>
          </form>
        </div>
        <div className="card">
          <h3>All Files</h3>
          <div className="toolbar">
            <input placeholder="Search display/original name, stored name, or group" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Page size
              <select value={limit} onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
          {loading ? 'Loading...' : error ? <div className="error">{error}</div> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Display Name</th><th>Original Name</th><th>Stored Name</th><th>Groups</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(files) ? files : []).map(f => (
                  <React.Fragment key={f._id}>
                    <tr>
                      <td>{f.displayName || <em style={{opacity:.7}}>—</em>}</td>
                      <td>{f.originalName}</td>
                      <td>{f.filename}</td>
                      <td>{(f.groups || []).join(', ')}</td>
                      <td>
                        <button onClick={() => beginEditGroups(f)}>Edit Groups</button>
                        <button className="danger" onClick={() => onDelete(f._id)}>Delete</button>
                      </td>
                    </tr>
                    {editingId === f._id && (
                      <tr>
                        <td colSpan={5}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div className="form" style={{ flex: 1 }}>
                              <label>Display Name (optional)
                                <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
                              </label>
                              <div style={{ border: '1px solid #1f2937', borderRadius: 8, padding: 8, maxHeight: 180, overflow: 'auto' }}>
                                {groups.map(g => (
                                  <label key={g._id} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '4px 10px', marginRight: 8 }}>
                                    <input type="checkbox" checked={editGroups.includes(g.name)} onChange={() => toggleEditGroup(g.name)} />
                                    <span>{g.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="stack" style={{ minWidth: 160 }}>
                              <button onClick={saveEditGroups}>Save</button>
                              <button type="button" onClick={() => { setEditingId(null); setEditGroups([]); setEditDisplayName(''); }}>Cancel</button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          <div className="pagination">
            <div>
              Page {page} of {totalPages} • Total {total}
            </div>
            <div className="controls">
              <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <form onSubmit={(e) => { e.preventDefault(); const target = Math.max(1, Math.min(totalPages, parseInt(pageInput || 1, 10))); setPage(target); }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>Go to</span>
                <input type="number" min={1} max={totalPages} value={pageInput} onChange={(e) => setPageInput(e.target.value)} style={{ width: 70 }} />
                <button type="submit" className="btn secondary">Go</button>
              </form>
              <button type="button" className="btn ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
