import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import Users from './pages/admin/Users';
import ImportUsers from './pages/admin/ImportUsers';
import Files from './pages/admin/Files';

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav className="nav">
      <Link to={user ? "/dashboard" : "/login"} className="brand" title={user ? "Go to Dashboard" : "Go to Login"}>
        <img src="/logo.png" alt="PEBA Tandem Manufacturing, Inc. - PDF Portal" style={{ height: 36, display: 'block' }} />
      </Link>
      <div className="links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user.role === 'admin' && <Link to="/admin">Admin</Link>}
            <button className="btn ghost" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link className="btn ghost" to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}> 
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<AdminRoute />}> 
            <Route path="/admin" element={<AdminLayout />}> 
              <Route index element={<Users />} />
              <Route path="users" element={<Users />} />
              <Route path="import" element={<ImportUsers />} />
              <Route path="files" element={<Files />} />
            </Route>
          </Route>

          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </div>
      <footer style={{ textAlign: 'center', padding: '16px 12px', color: '#6b7280' }}>
        © {new Date().getFullYear()} Glenson_Encode. All rights reserved.
      </footer>
    </AuthProvider>
  );
}
