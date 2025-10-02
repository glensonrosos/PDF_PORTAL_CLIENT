import React, { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pageInput, setPageInput] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState({
    firstname: '', lastname: '', department: '', role: 'user', birthdate: '', companyid: '', groups: []
  });
  const [groupsOpen, setGroupsOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, gRes] = await Promise.all([
        api.get('/admin/users', { params: { page, limit, q } }),
        api.get('/admin/groups')
      ]);
      const data = uRes.data || {};
      setUsers(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
      if (typeof data.total === 'number') setTotal(data.total); else if (Array.isArray(data)) setTotal(data.length);
      setGroups(gRes.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, limit, q]);

  // Keep page input in sync when page or total/limit changes
  useEffect(() => { setPageInput(page); }, [page]);

  // Debounce search input -> q
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleGroup = (name) => {
    const set = new Set(form.groups);
    if (set.has(name)) set.delete(name); else set.add(name);
    setForm({ ...form, groups: Array.from(set) });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.groups || form.groups.length === 0) {
        return alert('Please select at least one group');
      }
      if (editingUserId) {
        // Update existing
        await api.put(`/admin/users/${editingUserId}`, form);
      } else {
        // Create new
        await api.post('/admin/users', form);
      }
      setForm({ firstname: '', lastname: '', department: '', role: 'user', birthdate: '', companyid: '', groups: [] });
      setEditingUserId(null);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create user');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await load();
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  const onDeleteAllNonAdmins = async () => {
    if (!window.confirm('This will delete ALL non-admin users. This action cannot be undone. Continue?')) return;
    try {
      const res = await api.delete('/admin/users');
      const count = res?.data?.deletedCount ?? 0;
      alert(`Deleted ${count} user(s).`);
      // Reset to first page since counts changed
      setPage(1);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete users');
    }
  };

  const onEdit = (u) => {
    setEditingUserId(u._id);
    setGroupsOpen(true);
    setForm({
      firstname: u.firstname || '',
      lastname: u.lastname || '',
      department: u.department || '',
      role: u.role || 'user',
      birthdate: u.birthdate ? u.birthdate.slice(0, 10) : '',
      companyid: u.companyid || '',
      groups: Array.isArray(u.groups) && u.groups.length ? u.groups : (u.group ? [u.group] : [])
    });
  };

  const onCancelEdit = () => {
    setEditingUserId(null);
    setForm({ firstname: '', lastname: '', department: '', role: 'user', birthdate: '', companyid: '', groups: [] });
  };

  // Groups management
  const onCreateGroup = async () => {
    const name = newGroup.trim();
    if (!name) return;
    try {
      await api.post('/admin/groups', { name });
      setNewGroup('');
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create group');
    }
  };

  const onDeleteGroup = async (name) => {
    if (!window.confirm(`Delete group '${name}'?`)) return;
    try {
      await api.delete(`/admin/groups/${encodeURIComponent(name)}`);
      await load();
    } catch (e) {
      alert('Failed to delete group');
    }
  };

  return (
    <div>
      <h2>Users</h2>
      <div className="grid-2">
        <div className="card">
          <h3>{editingUserId ? 'Edit User' : 'Add User'}</h3>
          <form className="form" onSubmit={onSubmit}>
            <label>First name<input name="firstname" value={form.firstname} onChange={onChange} required /></label>
            <label>Last name<input name="lastname" value={form.lastname} onChange={onChange} required /></label>
            <label>Department<input name="department" value={form.department} onChange={onChange} /></label>
            <label>Role
              <select name="role" value={form.role} onChange={onChange}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>Birthdate<input type="date" name="birthdate" value={form.birthdate} onChange={onChange} required /></label>
            <label>Company ID<input name="companyid" value={form.companyid} onChange={onChange} required /></label>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Groups</label>
                <button type="button" onClick={() => setGroupsOpen(v => !v)} style={{ padding: '6px 8px' }}>
                  {groupsOpen ? 'Hide' : 'Select'}
                </button>
              </div>
              {groupsOpen && (
                <div style={{ border: '1px solid #1f2937', borderRadius: 8, padding: 8, marginTop: 8, maxHeight: 180, overflow: 'auto' }}>
                  {groups.length === 0 && <div className="muted">No groups yet. Create one below.</div>}
                  {groups.map(g => (
                    <label key={g._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={form.groups.includes(g.name)}
                        onChange={() => toggleGroup(g.name)}
                      />
                      <span>{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn">{editingUserId ? 'Update' : 'Create'}</button>
              {editingUserId && (
                <button type="button" className="btn danger" onClick={onCancelEdit}>Cancel Edit</button>
              )}
            </div>
          </form>
        </div>
        <div className="card">
          <h3>All Users</h3>
          <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <input style={{ minWidth: 280 }} placeholder="Search name, companyid, dept, role, group" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>Page size
                <select value={limit} onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <button type="button" className="btn danger" onClick={onDeleteAllNonAdmins}>Delete All Non-Admin Users</button>
            </div>
          </div>
          {loading ? 'Loading...' : error ? <div className="error">{error}</div> : (
            <table className="table">
              <thead>
                <tr>
                  <th>First</th><th>Last</th><th>Dept</th><th>Role</th><th>CompanyID</th><th>Groups</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(users) ? users : []).map(u => (
                  <tr key={u._id}>
                    <td>{u.firstname}</td>
                    <td>{u.lastname}</td>
                    <td>{u.department}</td>
                    <td>{u.role}</td>
                    <td>{u.companyid}</td>
                    <td>
                      <div className="badges">
                        {(Array.isArray(u.groups) && u.groups.length ? u.groups : (u.group ? [u.group] : [])).map(g => (
                          <span key={g} className="badge">{g}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => onEdit(u)} className="btn ghost">Edit</button>
                      <button onClick={() => onDelete(u._id)} className="btn danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="pagination">
            <div>
              {(() => { const totalPages = Math.max(1, Math.ceil(total / limit) || 1); return (
                <>
                  Page {page} of {totalPages} • Total {total}
                </>
              ); })()}
            </div>
            <div className="controls">
              <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <form onSubmit={(e) => { e.preventDefault(); const totalPages = Math.max(1, Math.ceil(total / limit) || 1); const target = Math.max(1, Math.min(totalPages, parseInt(pageInput || 1, 10))); setPage(target); }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>Go to</span>
                <input type="number" min={1} max={Math.max(1, Math.ceil(total / limit) || 1)} value={pageInput} onChange={(e) => setPageInput(e.target.value)} style={{ width: 70 }} />
                <button type="submit" className="btn secondary">Go</button>
              </form>
              <button type="button" className="btn ghost" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Manage Groups</h3>
        <div className="form" style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ minWidth: 240 }} placeholder="New group name" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
          <button type="button" onClick={onCreateGroup}>Add Group</button>
        </div>
        <ul className="list" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups.map(g => (
            <li key={g._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>{g.name}</span>
              <button className="danger" onClick={() => onDeleteGroup(g.name)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
