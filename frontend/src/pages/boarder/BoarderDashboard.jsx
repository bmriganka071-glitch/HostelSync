import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { noticeService } from '../../services/noticeService';
import { eventService } from '../../services/eventService';
import './BoarderDashboard.css';

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
};

function Icon({ name, size = 18 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconShapes[name]}
    </svg>
  );
}

function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', options);
}

function formatEventDate(value) {
  if (!value) return { day: '--', month: 'TBD', time: 'Time to be announced' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '--', month: 'TBD', time: 'Time to be announced' };
  return {
    day: date.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    time: date.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
  };
}

export default function BoarderDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [noticeData, eventData] = await Promise.all([
        noticeService.getNotices(),
        eventService.getEvents(),
      ]);
      setNotices(Array.isArray(noticeData) ? noticeData : []);
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (error) {
      setLoadError('We could not load your latest updates. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const initials = (user?.name || 'HS').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="boarder-app">
      <aside className="boarder-sidebar">
        <Link className="boarder-brand" to="/boarder" aria-label="HostelSync home">
          <span className="boarder-brand-mark">H</span>
          <span>Hostel<span className="boarder-brand-light">Sync</span></span>
        </Link>

        <div className="boarder-nav-label">YOUR SPACE</div>
        <nav className="boarder-nav" aria-label="Boarder navigation">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`boarder-nav-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {active && <span className="boarder-nav-active-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="boarder-sidebar-note">
          <span className="boarder-note-spark">✦</span>
          <p className="boarder-note-title">A better hostel day</p>
          <p className="boarder-note-copy">Your room, bills and community updates, all in one place.</p>
        </div>

        <div className="boarder-sidebar-user">
          <span className="boarder-avatar boarder-avatar-sidebar">{initials}</span>
          <span className="boarder-sidebar-user-copy"><strong>{user?.name || 'Hostel resident'}</strong><small>Boarder account</small></span>
          <button className="boarder-logout-icon" type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
        </div>
      </aside>

      <div className="boarder-main-column">
        <header className="boarder-topbar">
          <div className="boarder-mobile-brand"><span className="boarder-brand-mark">H</span> HostelSync</div>
          <div className="boarder-breadcrumb"><span>Workspace</span><span className="boarder-breadcrumb-divider">/</span><strong>Overview</strong></div>
          <div className="boarder-topbar-right">
            <span className="boarder-top-date"><Icon name="calendar" size={16} />{today}</span>
            <span className="boarder-avatar boarder-avatar-top" title={user?.name || 'Your profile'}>{initials}</span>
            <button className="boarder-top-logout" type="button" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <main className="boarder-content">
          <section className="boarder-welcome-row">
            <div>
              <p className="boarder-eyebrow">YOUR HOSTEL, IN SYNC</p>
              <h1>Good day, {firstName}<span className="boarder-heading-period">.</span></h1>
              <p className="boarder-welcome-copy">Here’s what’s happening around your hostel.</p>
            </div>
            <Link className="boarder-primary-link" to="/boarder/bills">View mess bills <Icon name="arrow" size={17} /></Link>
          </section>

          <section className="boarder-hero" aria-label="HostelSync overview">
            <div className="boarder-hero-copy">
              <span className="boarder-hero-chip"><span className="boarder-live-dot" /> BOARDER PORTAL</span>
              <h2>Your hostel life,<br />a little more in sync.</h2>
              <p>Stay up to date with the latest notices and everything happening in your community.</p>
              <Link className="boarder-hero-link" to="/boarder/swaps">Explore your portal <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="boarder-hero-art" aria-hidden="true">
              <div className="boarder-art-orbit boarder-art-orbit-one" />
              <div className="boarder-art-orbit boarder-art-orbit-two" />
              <div className="boarder-art-card boarder-art-card-back"><span className="boarder-art-card-line" /><span className="boarder-art-card-line short" /><span className="boarder-art-card-pill" /></div>
              <div className="boarder-art-card boarder-art-card-front"><span className="boarder-art-calendar-top" /><span className="boarder-art-calendar-grid"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div>
              <span className="boarder-art-star star-one">✦</span><span className="boarder-art-star star-two">✧</span>
            </div>
          </section>

          <section className="boarder-stat-grid" aria-label="Your updates">
            <article className="boarder-stat-card">
              <span className="boarder-stat-icon notice-icon"><Icon name="overview" size={19} /></span>
              <div><p>Latest notices</p><strong>{loading ? '—' : notices.length}</strong><span>Updates from your hostel</span></div>
              <span className="boarder-stat-arrow"><Icon name="arrow" size={17} /></span>
            </article>
            <article className="boarder-stat-card">
              <span className="boarder-stat-icon event-icon"><Icon name="calendar" size={19} /></span>
              <div><p>Upcoming events</p><strong>{loading ? '—' : events.length}</strong><span>On the hostel calendar</span></div>
              <span className="boarder-stat-arrow"><Icon name="arrow" size={17} /></span>
            </article>
            <Link className="boarder-stat-card boarder-stat-action" to="/boarder/rebates">
              <span className="boarder-stat-icon rebate-icon"><Icon name="rebates" size={19} /></span>
              <div><p>Plan time away?</p><strong className="boarder-stat-action-title">Request a rebate</strong><span>Apply for a mess rebate</span></div>
              <span className="boarder-stat-arrow"><Icon name="arrow" size={17} /></span>
            </Link>
          </section>

          {loadError && <div className="boarder-error-banner" role="alert"><span>{loadError}</span><button type="button" onClick={fetchData}>Try again</button></div>}

          <div className="boarder-section-heading">
            <div><p className="boarder-eyebrow">STAY IN THE LOOP</p><h2>Your latest updates</h2></div>
            <span className="boarder-update-count">{loading ? 'Loading updates' : `${notices.length + events.length} updates`}</span>
          </div>

          <div className="boarder-updates-grid">
            <section className="boarder-panel boarder-notices-panel">
              <div className="boarder-panel-heading"><div><span className="boarder-panel-icon notice-icon"><Icon name="overview" size={17} /></span><div><h3>Notice board</h3><p>Important notes from your hostel</p></div></div><span className="boarder-panel-count">{notices.length}</span></div>
              {loading ? <div className="boarder-empty-state"><span className="boarder-loader" /><p>Loading notices...</p></div> : notices.length === 0 ? <div className="boarder-empty-state"><span className="boarder-empty-mark">N</span><h4>All caught up</h4><p>New hostel notices will appear here.</p></div> : (
                <div className="boarder-notice-list">
                  {notices.slice(0, 5).map((notice) => (
                    <article className="boarder-notice-item" key={notice.id}>
                      <span className="boarder-notice-marker" />
                      <div className="boarder-notice-copy"><div className="boarder-notice-meta"><span className="boarder-category-label">HOSTEL UPDATE</span><time>{formatDate(notice.created_at)}</time></div><h4>{notice.title}</h4><p>{notice.content}</p></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="boarder-panel boarder-events-panel">
              <div className="boarder-panel-heading"><div><span className="boarder-panel-icon event-icon"><Icon name="calendar" size={17} /></span><div><h3>Coming up</h3><p>Dates for your community</p></div></div><span className="boarder-panel-count">{events.length}</span></div>
              {loading ? <div className="boarder-empty-state"><span className="boarder-loader" /><p>Loading events...</p></div> : events.length === 0 ? <div className="boarder-empty-state"><span className="boarder-empty-mark">E</span><h4>Nothing scheduled yet</h4><p>New hostel events will show up here.</p></div> : (
                <div className="boarder-event-list">
                  {events.slice(0, 5).map((event) => {
                    const eventDate = formatEventDate(event.event_date);
                    return <article className="boarder-event-item" key={event.id}><div className="boarder-event-date"><strong>{eventDate.day}</strong><span>{eventDate.month}</span></div><div className="boarder-event-copy"><h4>{event.title}</h4><p>{event.description}</p><span><Icon name="calendar" size={14} />{eventDate.time}</span></div></article>;
                  })}
                </div>
              )}
            </section>
          </div>

          <footer className="boarder-footer"><span>HostelSync</span><span>Making hostel life simpler, together.</span></footer>
        </main>
      </div>
    </div>
  );
}
