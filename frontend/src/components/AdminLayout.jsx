import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminWorkspace.css';

const links = [
  ['Dashboard', '/admin', '⌂'], ['Rooms', '/admin/rooms', '▦'], ['Mess bills', '/admin/bills', '₹'],
  ['Payments', '/admin/payments', '↗'], ['Room swaps', '/admin/requests', '⇄'],
  ['Rebates', '/admin/rebates', '％'], ['Notices & events', '/admin/announcements', '▤'],
];

export default function AdminLayout({ title, description, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login'); };
  return <div className="admin-workspace">
    <aside className="admin-workspace-sidebar">
      <Link to="/admin" className="admin-workspace-brand"><span>H</span><strong>Hostel<span>Sync</span></strong></Link>
      <small className="admin-workspace-label">ADMINISTRATION</small>
      <nav aria-label="Admin navigation">{links.map(([label, path, icon]) => <Link key={path} to={path} className={location.pathname === path ? 'active' : ''} aria-current={location.pathname === path ? 'page' : undefined}><i>{icon}</i>{label}</Link>)}</nav>
      <div className="admin-workspace-user"><span>{(user?.name || 'A').split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{user?.name || 'Administrator'}</b><small>Administrator</small></div><button onClick={signOut} type="button" title="Sign out">↪</button></div>
    </aside>
    <main className="admin-workspace-main"><header className="admin-workspace-top"><div><small>HOSTELSYNC / ADMIN</small><strong>{title}</strong></div><button onClick={signOut} type="button">Sign out</button></header><div className="admin-workspace-content"><div className="admin-workspace-heading"><div><small>ADMIN WORKSPACE</small><h1>{title}</h1><p>{description}</p></div></div>{children}<footer className="admin-workspace-footer">HostelSync <span>Administration workspace</span></footer></div></main>
  </div>;
}
