import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roomSwapService } from '../../services/roomSwapService';
import { userService } from '../../services/userService';
import './MessBills.css';
import './BoarderRoomSwaps.css';

const navItems = [
  { label: 'Overview', path: '/boarder', icon: 'overview' },
  { label: 'Mess bills', path: '/boarder/bills', icon: 'bills' },
  { label: 'Rebate requests', path: '/boarder/rebates', icon: 'rebates' },
  { label: 'Room swaps', path: '/boarder/swaps', icon: 'swap' },
];

const iconShapes = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  bills: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  rebates: <><path d="M12 3v18M17 7.5c0-1.4-1.8-2.5-4.5-2.5S8 6.1 8 7.5 9.8 10 12.5 10s4.5 1.1 4.5 2.5-1.8 2.5-4.5 2.5S8 13.9 8 12.5" /></>,
  swap: <><path d="M7 7h13l-3-3M17 17H4l3 3" /><path d="M20 7a8 8 0 0 1-2.3 5.7M4 17a8 8 0 0 1 2.3-5.7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  bed: <><path d="M3 20v-8h18v8M3 16h18M7 12V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
};

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconShapes[name]}</svg>;
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

const statusLabels = {
  PENDING_B: 'Needs your response',
  PENDING_ADM: 'Awaiting administrator',
  APPROVED: 'Swap approved',
  REJECTED: 'Request closed',
};

function getStatusClass(status) {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'PENDING_ADM') return 'admin-review';
  return 'needs-response';
}

export default function BoarderRoomSwaps() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [swaps, setSwaps] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [action, setAction] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, swapsData] = await Promise.all([
        userService.getAllUsers(),
        roomSwapService.getMySwaps(),
      ]);
      const availableBoarders = (Array.isArray(usersData) ? usersData : []).filter((candidate) => candidate.role === 'BOARDER' && String(candidate.id) !== String(user?.id) && candidate.room_id !== null);
      setUsers(availableBoarders);
      setSwaps(Array.isArray(swapsData) ? swapsData : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not load room swap data. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedUser = users.find((candidate) => String(candidate.id) === String(selectedReceiver));
  const incomingCount = swaps.filter((swap) => String(swap.receiver_id) === String(user?.id) && swap.status === 'PENDING_B').length;
  const adminReviewCount = swaps.filter((swap) => swap.status === 'PENDING_ADM').length;
  const completedCount = swaps.filter((swap) => ['APPROVED', 'REJECTED'].includes(swap.status)).length;
  const initialsForUser = initials(user?.name || 'HostelSync');
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const visibleSwaps = useMemo(() => swaps.filter((swap) => {
    if (filter === 'incoming') return String(swap.receiver_id) === String(user?.id);
    if (filter === 'sent') return String(swap.sender_id) === String(user?.id);
    if (filter === 'open') return ['PENDING_B', 'PENDING_ADM'].includes(swap.status);
    return true;
  }), [swaps, filter, user?.id]);

  const handleCreateSwap = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    if (!selectedReceiver) {
      setFormError('Choose a boarder to send your swap request to.');
      return;
    }
    setSubmitting(true);
    try {
      await roomSwapService.createSwap(Number(selectedReceiver));
      setSelectedReceiver('');
      setSuccess('Your room swap request has been sent. The other boarder will need to respond first.');
      await fetchInitialData();
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Your request could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async () => {
    if (!action) return;
    setRespondingId(action.swap.id);
    setError('');
    setSuccess('');
    try {
      await roomSwapService.boarderRespond(action.swap.id, action.accepted);
      setSuccess(action.accepted ? 'You accepted the request. It has been sent to the administrator for review.' : 'You declined the room swap request.');
      setAction(null);
      await fetchInitialData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not update this request. Please try again.');
      setAction(null);
    } finally {
      setRespondingId(null);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All requests', count: swaps.length },
    { id: 'incoming', label: 'Incoming', count: swaps.filter((swap) => String(swap.receiver_id) === String(user?.id)).length },
    { id: 'sent', label: 'Sent by me', count: swaps.filter((swap) => String(swap.sender_id) === String(user?.id)).length },
    { id: 'open', label: 'In progress', count: swaps.filter((swap) => ['PENDING_B', 'PENDING_ADM'].includes(swap.status)).length },
  ];

  return (
    <div className="bills-app swaps-app">
      <aside className="bills-sidebar">
        <Link className="bills-brand" to="/boarder" aria-label="HostelSync home"><span className="bills-brand-mark">H</span><span>Hostel<span>Sync</span></span></Link>
        <div className="bills-nav-label">YOUR SPACE</div>
        <nav className="bills-nav" aria-label="Boarder navigation">{navItems.map((item) => { const active = location.pathname === item.path; return <Link key={item.path} to={item.path} className={'bills-nav-link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span>{active && <span className="bills-nav-dot" />}</Link>; })}</nav>
        <div className="bills-sidebar-tip"><span>✦</span><strong>Room to make a change?</strong><p>Find a boarder whose room plans work for you.</p><a href="#swap-guidance">How swaps work <Icon name="arrow" size={14} /></a></div>
        <div className="bills-sidebar-user"><span className="bills-avatar">{initialsForUser}</span><span className="bills-user-copy"><strong>{user?.name || 'Hostel resident'}</strong><small>Boarder account</small></span><button type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" size={17} /></button></div>
      </aside>

      <div className="bills-main">
        <header className="bills-topbar"><div className="bills-mobile-brand"><span className="bills-brand-mark">H</span>HostelSync</div><div className="bills-breadcrumb"><span>Workspace</span><i>/</i><strong>Room swaps</strong></div><div className="bills-topbar-right"><span className="bills-today"><Icon name="calendar" size={15} />{today}</span><span className="bills-avatar bills-avatar-small">{initialsForUser}</span><button type="button" className="bills-top-logout" onClick={handleLogout}>Log out</button></div></header>

        <main className="bills-content swaps-content">
          <div className="bills-title-row"><div><p className="bills-eyebrow">ROOMMATE COORDINATION</p><h1>Room swaps</h1><p className="bills-page-intro">Find a boarder to swap with and follow each step of the request.</p></div><span className="swaps-title-icon"><Icon name="swap" size={23} /></span></div>
          {success && <div className="swaps-success-banner" role="status"><span><Icon name="check" size={15} /></span><span>{success}</span><button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">×</button></div>}
          {error && <div className="bills-error-banner" role="alert"><span>{error}</span><button type="button" onClick={fetchInitialData}>Try again</button></div>}

          <section className="swaps-hero"><div className="swaps-hero-copy"><span className="swaps-hero-chip"><span /> A BETTER FIT</span><h2>Make room for a change.</h2><p>Send a swap request to another boarder. If they accept, it moves to the administrator for final review.</p><a href="#new-swap-request">Start a request <Icon name="arrow" size={15} /></a></div><div className="swaps-hero-art" aria-hidden="true"><div className="swaps-art-loop loop-one" /><div className="swaps-art-loop loop-two" /><div className="swaps-art-room room-one"><Icon name="bed" size={23} /><span>YOUR ROOM</span></div><div className="swaps-art-transfer"><Icon name="swap" size={18} /></div><div className="swaps-art-room room-two"><Icon name="bed" size={23} /><span>NEW ROOM</span></div><span className="swaps-art-spark">✦</span></div></section>

          <section className="swaps-summary-grid" aria-label="Room swap summary"><article className="swaps-summary-card"><span className="swaps-summary-icon incoming-icon"><Icon name="swap" size={18} /></span><div><p>Needs your response</p><strong>{loading ? '—' : incomingCount}</strong><span>Requests sent to you</span></div></article><article className="swaps-summary-card"><span className="swaps-summary-icon review-icon"><Icon name="calendar" size={18} /></span><div><p>With administrator</p><strong>{loading ? '—' : adminReviewCount}</strong><span>Waiting for final review</span></div></article><article className="swaps-summary-card"><span className="swaps-summary-icon complete-icon"><Icon name="check" size={18} /></span><div><p>Closed requests</p><strong>{loading ? '—' : completedCount}</strong><span>Approved or declined</span></div></article></section>

          <div className="swaps-workspace-grid">
            <section className="swaps-create-panel" id="new-swap-request"><div className="swaps-panel-heading"><span><Icon name="swap" size={18} /></span><div><h2>Start a room swap</h2><p>Select a boarder to send a request.</p></div></div><form onSubmit={handleCreateSwap}><label htmlFor="swap-boarder">Boarder to swap with</label><div className="swaps-select-row"><select id="swap-boarder" value={selectedReceiver} onChange={(event) => { setSelectedReceiver(event.target.value); setFormError(''); }} required><option value="">Choose a boarder...</option>{users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · Room {candidate.room_id}</option>)}</select><button type="submit" disabled={submitting || users.length === 0}>{submitting ? 'Sending…' : 'Send request'}<Icon name="arrow" size={15} /></button></div>{users.length === 0 && !loading && <p className="swaps-no-boarders">No other boarders with an assigned room are available right now.</p>}{formError && <p className="swaps-form-error" role="alert">{formError}</p>}{selectedUser && <div className="swaps-selected-person"><span className="swaps-person-avatar">{initials(selectedUser.name)}</span><span><strong>{selectedUser.name}</strong><small>Room {selectedUser.room_id}</small></span><span className="swaps-selected-check"><Icon name="check" size={14} /></span></div>}<p className="swaps-form-note">Your request will be sent to the selected boarder first.</p></form></section>
            <aside className="swaps-guidance-panel" id="swap-guidance"><span className="swaps-guidance-icon"><Icon name="swap" size={19} /></span><p className="bills-eyebrow">THE PROCESS</p><h2>How a swap works</h2><ol><li><span>1</span><div><strong>Send a request</strong><p>Choose a boarder with an assigned room.</p></div></li><li><span>2</span><div><strong>Both boarders agree</strong><p>The recipient can accept or decline your request.</p></div></li><li><span>3</span><div><strong>Administrator reviews</strong><p>Accepted requests go to the administrator for a final decision.</p></div></li></ol></aside>
          </div>

          <section className="swaps-history-panel"><div className="swaps-history-heading"><div><h2>Swap requests</h2><p>Follow the status of requests you’ve sent and received.</p></div><span>{loading ? 'Loading' : swaps.length + (swaps.length === 1 ? ' request' : ' requests')}</span></div><div className="swaps-filter-row" role="tablist" aria-label="Filter swap requests">{filterTabs.map((tab) => <button type="button" role="tab" aria-selected={filter === tab.id} className={filter === tab.id ? 'selected' : ''} key={tab.id} onClick={() => setFilter(tab.id)}>{tab.label}<span>{tab.count}</span></button>)}</div>
            {loading ? <div className="swaps-empty-state"><span className="swaps-spinner" /><p>Loading your requests...</p></div> : swaps.length === 0 ? <div className="swaps-empty-state"><span className="swaps-empty-icon"><Icon name="swap" size={21} /></span><h3>No swap requests yet</h3><p>When you send or receive a request, it will appear here.</p></div> : visibleSwaps.length === 0 ? <div className="swaps-empty-state"><h3>No requests in this view</h3><p>Try another filter to see your room swap history.</p><button type="button" onClick={() => setFilter('all')}>Show all requests</button></div> : <div className="swaps-request-list">{visibleSwaps.map((swap) => {
              const isSender = String(swap.sender_id) === String(user?.id);
              const isReceiver = String(swap.receiver_id) === String(user?.id);
              const canRespond = isReceiver && swap.status === 'PENDING_B';
              const otherName = isSender ? swap.receiver : swap.sender;
              const participantRole = isSender ? 'Request sent to' : 'Request from';
              return <article className="swaps-request-card" key={swap.id}><div className="swaps-request-person"><span className="swaps-person-avatar">{initials(otherName)}</span><div><span className="swaps-request-direction">{participantRole}</span><strong>{otherName || 'Hostel boarder'}</strong><small>Request #{swap.id} · {formatDate(swap.created_at)}</small></div></div><div className="swaps-request-flow"><span>{isSender ? 'You' : otherName}</span><i><Icon name="swap" size={15} /></i><span>{isSender ? otherName : 'You'}</span></div><span className={'swaps-status ' + getStatusClass(swap.status)}><i />{statusLabels[swap.status] || swap.status}</span><div className="swaps-request-actions">{canRespond ? <><button type="button" className="swaps-decline-button" onClick={() => setAction({ swap, accepted: false })} disabled={respondingId === swap.id}>Decline</button><button type="button" className="swaps-accept-button" onClick={() => setAction({ swap, accepted: true })} disabled={respondingId === swap.id}>Accept</button></> : swap.status === 'PENDING_ADM' ? <span>With hostel admin</span> : <span>{swap.status === 'APPROVED' ? 'Completed' : 'Closed'}</span>}</div></article>;
            })}</div>}
          </section>
          <footer className="bills-footer"><span>HostelSync</span><span>Room changes are final only after administrator approval.</span></footer>
        </main>
      </div>

      {action && <div className="swaps-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !respondingId) setAction(null); }}><section className="swaps-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="swap-confirm-title"><button className="swaps-modal-close" type="button" onClick={() => setAction(null)} disabled={Boolean(respondingId)} aria-label="Close"><Icon name="close" size={18} /></button><span className={'swaps-confirm-icon' + (action.accepted ? ' accept' : ' decline')}><Icon name={action.accepted ? 'check' : 'close'} size={20} /></span><p className="bills-eyebrow">ROOM SWAP REQUEST</p><h2 id="swap-confirm-title">{action.accepted ? 'Accept this request?' : 'Decline this request?'}</h2><p>{action.accepted ? 'Your response will send this swap to the hostel administrator for final review.' : 'The request will be closed, and the sender will see that it was declined.'}</p><div className="swaps-confirm-actions"><button type="button" onClick={() => setAction(null)} disabled={Boolean(respondingId)}>Go back</button><button type="button" className={action.accepted ? 'confirm-accept' : 'confirm-decline'} onClick={handleRespond} disabled={Boolean(respondingId)}>{respondingId ? 'Updating…' : action.accepted ? 'Accept request' : 'Decline request'}</button></div></section></div>}
    </div>
  );
}
