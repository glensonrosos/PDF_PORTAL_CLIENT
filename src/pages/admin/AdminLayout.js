import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  return (
    <div className="grid">
      <aside className="sidebar">
        <h3>Admin</h3>
        <nav className="stack">
          <Link className={location.pathname.endsWith('/admin') || location.pathname.includes('/admin/users') ? 'active' : ''} to="/admin/users">Users</Link>
          <Link className={location.pathname.includes('/admin/import') ? 'active' : ''} to="/admin/import">Import Users</Link>
          <Link className={location.pathname.includes('/admin/files') ? 'active' : ''} to="/admin/files">Files</Link>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
