import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import './AdminDashboard.css';

const adminLinks = [
  { label: 'Dashboard', path: '/admin', icon: 'grid' },
  { label: 'Rooms', path: '/admin/rooms', icon: 'room' },
  { label: 'Mess bills', path: '/admin/bills', icon: 'payment' },
  { label: 'Payments', path: '/admin/payments', icon: 'payment' },
  { label: 'Requests', path: '/admin/requests', icon: 'request' },
  { label: 'Rebates', path: '/admin/rebates', icon: 'rebate' },
  { label: 'Announcements', path: '/admin/announcements', icon: 'notice' },
];

const iconShapes = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  room: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01" /></>,
  payment: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  request: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" /></>,
  rebate: <><path d="M12 3v18M17 7.5c0-1.4-1.8-2.5-4.5-2.5S8 6.1 8 7.5 9.8 10 12.5 10s4.5 1.1 4.5 2.5-1.8 2.5-4.5 2.5S8 13.9 8 12.5" /></>,
  notice: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
};

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconShapes[name]}</svg>;
}

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [boarders, setBoarders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [selectedBoarder, setSelectedBoarder] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const fetchBoarders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getBoarders();
      setBoarders(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load boarder accounts. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoarders(); }, [fetchBoarders]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredBoarders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return boarders;
    return boarders.filter((boarder) => [boarder.name, boarder.email, boarder.room_number, boarder.block].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [boarders, query]);
  const assignedCount = boarders.filter((boarder) => boarder.room_id !== null).length;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const grantAdminAccess = async () => {
    if (!selectedBoarder) return;
    setSavingId(selectedBoarder.id);
    setError('');
    setSuccess('');
    try {
      const result = await userService.promoteToAdmin(selectedBoarder.id);
      setSelectedBoarder(null);
      setSuccess((result.user?.name || 'The boarder') + ' now has administrator access. They need to sign in again to open the admin dashboard.');
      await fetchBoarders();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Administrator access could not be granted. Please try again.');
      setSelectedBoarder(null);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-access-app">
      <aside className="admin-access-sidebar">
        <Link to="/admin" className="admin-access-brand"><span>H</span><strong>Hostel<span>Sync</span></strong></Link>
        <p className="admin-access-nav-label">ADMINISTRATION</p>
        <nav aria-label="Admin navigation">{adminLinks.map((item) => { const active = location.pathname === item.path; return <Link to={item.path} key={item.path} className={'admin-access-nav-link' + (active ? ' active' : '')} aria-current={active ? 'page' : undefined}><Icon name={item.icon} size={17} /><span>{item.label}</span>{active && <i />}</Link>; })}</nav>
        <div className="admin-access-sidebar-note"><span>ACCESS CONTROL</span><p>Grant administrator access only to people you trust.</p></div>
        <div className="admin-access-profile"><span className="admin-access-avatar">{initials(user?.name)}</span><span><strong>{user?.name || 'Administrator'}</strong><small>Administrator</small></span><button type="button" onClick={handleLogout} aria-label="Log out"><Icon name="logout" size={16} /></button></div>
      </aside>

      <div className="admin-access-main">
        <header className="admin-access-topbar"><div><span className="admin-access-top-eyebrow">HOSTELSYNC / ADMIN</span><strong>People & access</strong></div><div><span>{today}</span><button type="button" onClick={handleLogout}>Log out</button></div></header>
        <main className="admin-access-content">
          <section className="admin-access-welcome"><div><p>CONTROL PANEL</p><h1>Administrator dashboard</h1><span>Manage boarder access and keep your hostel operations moving.</span></div><span className="admin-access-welcome-mark"><Icon name="people" size={25} /></span></section>
          {success && <div className="admin-access-success" role="status"><span><Icon name="check" size={15} /></span><p>{success}</p><button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">×</button></div>}
          {error && <div className="admin-access-error" role="alert"><span>{error}</span><button type="button" onClick={fetchBoarders}>Try again</button></div>}

          <section className="admin-access-stats"><article><span className="admin-stat-icon"><Icon name="people" size={18} /></span><div><p>Boarder accounts</p><strong>{loading ? '—' : boarders.length}</strong><small>Eligible for role changes</small></div></article><article><span className="admin-stat-icon assigned"><Icon name="room" size={18} /></span><div><p>Room assigned</p><strong>{loading ? '—' : assignedCount}</strong><small>Current room assignments</small></div></article></section>

          <section className="admin-access-directory"><div className="admin-directory-heading"><div><h2>Boarder directory</h2><p>Choose a boarder to grant administrator access.</p></div><span>{loading ? 'Loading' : filteredBoarders.length + ' shown'}</span></div><div className="admin-directory-toolbar"><label className="admin-search"><Icon name="search" size={17} /><input type="search" placeholder="Search name, email or room" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search boarders" /></label><span className="admin-directory-role">Boarders only</span></div>
            {loading ? <div className="admin-directory-empty"><span className="admin-access-spinner" /><p>Loading boarder accounts...</p></div> : boarders.length === 0 ? <div className="admin-directory-empty"><span className="admin-directory-empty-mark"><Icon name="check" size={20} /></span><h3>Everyone has administrator access</h3><p>There are no boarder accounts to promote right now.</p></div> : filteredBoarders.length === 0 ? <div className="admin-directory-empty"><h3>No matching boarders</h3><p>Try another name, email or room.</p></div> : <div className="admin-directory-table-wrap"><table className="admin-directory-table"><thead><tr><th>Boarder</th><th>Room</th><th>Role</th><th><span className="admin-sr-only">Action</span></th></tr></thead><tbody>{filteredBoarders.map((boarder) => <tr key={boarder.id}><td><div className="admin-boarder-person"><span>{initials(boarder.name)}</span><div><strong>{boarder.name}</strong><small>{boarder.email}</small></div></div></td><td>{boarder.room_number ? <span className="admin-room-value">{boarder.room_number}<small>{boarder.block || 'Hostel room'}</small></span> : <span className="admin-unassigned">Not assigned</span>}</td><td><span className="admin-boarder-role">Boarder</span></td><td><button className="admin-promote-button" type="button" onClick={() => setSelectedBoarder(boarder)} disabled={Boolean(savingId)}>Grant admin access <span>→</span></button></td></tr>)}</tbody></table></div>}
            {!loading && filteredBoarders.length > 0 && <div className="admin-directory-footer"><span>Administrator role changes take effect at the boarder’s next sign in.</span><span>{filteredBoarders.length} of {boarders.length}</span></div>}
          </section>
          <footer className="admin-access-footer"><span>HostelSync</span><span>Administrator actions are protected by your signed-in account.</span></footer>
        </main>
      </div>

      {selectedBoarder && <div className="admin-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingId) setSelectedBoarder(null); }}><section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title"><button className="admin-confirm-close" type="button" onClick={() => setSelectedBoarder(null)} disabled={Boolean(savingId)} aria-label="Close"><Icon name="close" size={17} /></button><span className="admin-confirm-icon"><Icon name="people" size={21} /></span><p>ROLE CHANGE</p><h2 id="admin-confirm-title">Grant administrator access?</h2><p className="admin-confirm-copy"><strong>{selectedBoarder.name}</strong> will be able to manage hostel operations, review requests and grant administrator access to other boarders.</p><div className="admin-confirm-actions"><button type="button" onClick={() => setSelectedBoarder(null)} disabled={Boolean(savingId)}>Cancel</button><button type="button" onClick={grantAdminAccess} disabled={Boolean(savingId)}>{savingId ? 'Granting access…' : 'Confirm access'}</button></div></section></div>}
    </div>
  );
}
