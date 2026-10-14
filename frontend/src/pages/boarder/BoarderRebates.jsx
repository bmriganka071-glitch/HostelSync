import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messRebateService } from '../../services/messRebateService';
import './MessBills.css';
import './BoarderRebates.css';

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
  check: <><path d="m5 12 4 4L19 6" /></>,
  plane: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconShapes[name]}</svg>;
}

function parseDate(value) {
  if (!value) return null;
  const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00:00' : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-IN', options) : 'Date unavailable';
}

function getDuration(start, end) {
  if (!start || !end) return 0;
  const dayNumber = (value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return Date.UTC(year, month - 1, day);
    }
    const date = parseDate(value);
    return date ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) : NaN;
  };
  const startDay = dayNumber(start);
  const endDay = dayNumber(end);
  if (Number.isNaN(startDay) || Number.isNaN(endDay) || endDay < startDay) return 0;
  return Math.floor((endDay - startDay) / 86400000) + 1;
}

const statusLabels = { PENDING: 'Awaiting review', APPROVED: 'Approved', REJECTED: 'Not approved' };

export default function BoarderRebates() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rebates, setRebates] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRebates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await messRebateService.getRebates();
      setRebates(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError('We could not load your requests. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRebates(); }, [fetchRebates]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || 'HS').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const duration = getDuration(startDate, endDate);
  const counts = useMemo(() => rebates.reduce((result, rebate) => {
    const status = String(rebate.status || '').toUpperCase();
    result.total += 1;
    if (status === 'PENDING') result.pending += 1;
    if (status === 'APPROVED') result.approved += 1;
    return result;
  }, { total: 0, pending: 0, approved: 0 }), [rebates]);

  const handleApply = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    if (!startDate || !endDate) {
      setFormError('Choose both dates for your time away.');
      return;
    }
    if (duration < 3) {
      setFormError('A mess rebate request must cover at least 3 consecutive days.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await messRebateService.applyRebate(startDate, endDate);
      setStartDate('');
      setEndDate('');
      setSuccess(response.message || 'Your rebate request has been submitted for review.');
      await fetchRebates();
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'Your request could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bills-app rebate-app">
      <aside className="bills-sidebar">
        <Link className="bills-brand" to="/boarder" aria-label="HostelSync home"><span className="bills-brand-mark">H</span><span>Hostel<span>Sync</span></span></Link>
        <div className="bills-nav-label">YOUR SPACE</div>
        <nav className="bills-nav" aria-label="Boarder navigation">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={'bills-nav-link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span>{active && <span className="bills-nav-dot" />}</Link>;
          })}
        </nav>
        <div className="bills-sidebar-tip"><span>✦</span><strong>Taking time away?</strong><p>Requests need at least three consecutive days.</p><a href="#rebate-guidance">See how it works <Icon name="arrow" size={14} /></a></div>
        <div className="bills-sidebar-user"><span className="bills-avatar">{initials}</span><span className="bills-user-copy"><strong>{user?.name || 'Hostel resident'}</strong><small>Boarder account</small></span><button type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" size={17} /></button></div>
      </aside>

      <div className="bills-main">
        <header className="bills-topbar"><div className="bills-mobile-brand"><span className="bills-brand-mark">H</span>HostelSync</div><div className="bills-breadcrumb"><span>Workspace</span><i>/</i><strong>Rebate requests</strong></div><div className="bills-topbar-right"><span className="bills-today"><Icon name="calendar" size={15} />{today}</span><span className="bills-avatar bills-avatar-small">{initials}</span><button type="button" className="bills-top-logout" onClick={handleLogout}>Log out</button></div></header>

        <main className="bills-content rebate-content">
          <div className="bills-title-row"><div><p className="bills-eyebrow">MESS REBATE PROGRAMME</p><h1>Time away, made simple</h1><p className="bills-page-intro">Request a rebate for the days you’ll be away from the hostel.</p></div><span className="rebate-title-icon"><Icon name="plane" size={22} /></span></div>

          {success && <div className="rebate-success-banner" role="status"><span className="rebate-banner-check"><Icon name="check" size={15} /></span><span>{success}</span><button type="button" onClick={() => setSuccess('')} aria-label="Dismiss">×</button></div>}
          {error && <div className="bills-error-banner" role="alert"><span>{error}</span><button type="button" onClick={fetchRebates}>Try again</button></div>}

          <section className="rebate-hero">
            <div className="rebate-hero-copy"><span className="rebate-hero-chip"><span /> PLAN AHEAD</span><h2>Heading out for a few days?</h2><p>Let your hostel team know when you’ll be away. Submit your dates and track the request right here.</p><a href="#new-rebate-request">Start a request <Icon name="arrow" size={15} /></a></div>
            <div className="rebate-hero-art" aria-hidden="true"><div className="rebate-art-circle" /><div className="rebate-art-ticket"><span>MESS REBATE</span><strong>3+</strong><small>days away</small><i /></div><span className="rebate-art-spark spark-a">✦</span><span className="rebate-art-spark spark-b">✧</span></div>
          </section>

          <section className="rebate-summary-grid" aria-label="Rebate request summary">
            <article className="rebate-summary-card"><span className="rebate-summary-icon"><Icon name="receipt" size={18} /></span><div><p>Total requests</p><strong>{loading ? '—' : counts.total}</strong><span>Your request history</span></div></article>
            <article className="rebate-summary-card"><span className="rebate-summary-icon rebate-pending-icon"><Icon name="clock" size={18} /></span><div><p>Awaiting review</p><strong>{loading ? '—' : counts.pending}</strong><span>Being reviewed by your hostel</span></div></article>
            <article className="rebate-summary-card"><span className="rebate-summary-icon rebate-approved-icon"><Icon name="check" size={18} /></span><div><p>Approved</p><strong>{loading ? '—' : counts.approved}</strong><span>Approved time-away requests</span></div></article>
          </section>

          <div className="rebate-workspace-grid">
            <section className="rebate-form-panel" id="new-rebate-request">
              <div className="rebate-panel-heading"><span className="rebate-panel-icon"><Icon name="calendar" size={18} /></span><div><h2>New rebate request</h2><p>Choose your away dates to get started.</p></div></div>
              <form className="rebate-form" onSubmit={handleApply}>
                <div className="rebate-date-fields">
                  <div className="rebate-field"><label htmlFor="rebate-start">First day away</label><input id="rebate-start" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setFormError(''); }} required /><span>The first day you’ll be away</span></div>
                  <div className="rebate-date-arrow"><Icon name="arrow" size={17} /></div>
                  <div className="rebate-field"><label htmlFor="rebate-end">Return date</label><input id="rebate-end" type="date" min={startDate ? new Date(Date.parse(startDate + 'T00:00:00Z') + 2 * 86400000).toISOString().slice(0, 10) : undefined} value={endDate} onChange={(event) => { setEndDate(event.target.value); setFormError(''); }} required /><span>Include your last day away</span></div>
                </div>
                <div className={'rebate-duration' + (duration >= 3 ? ' is-valid' : '')}><span className="rebate-duration-icon"><Icon name={duration >= 3 ? 'check' : 'clock'} size={15} /></span><span>{duration ? duration + (duration === 1 ? ' day selected' : ' consecutive days selected') : 'Select dates to see your request length'}</span><span className="rebate-minimum">3 day minimum</span></div>
                {formError && <p className="rebate-form-error" role="alert">{formError}</p>}
                <button className="rebate-submit-button" type="submit" disabled={submitting}>{submitting ? 'Submitting request…' : 'Submit rebate request'}<Icon name="arrow" size={16} /></button>
                <p className="rebate-form-footnote">Your request will be sent to the hostel administrator for review.</p>
              </form>
            </section>

            <aside className="rebate-guidance-panel" id="rebate-guidance"><div className="rebate-guidance-icon"><Icon name="plane" size={19} /></div><p className="bills-eyebrow">GOOD TO KNOW</p><h2>How it works</h2><ol><li><span>1</span><div><strong>Choose your dates</strong><p>Requests must cover at least 3 consecutive days.</p></div></li><li><span>2</span><div><strong>We’ll review it</strong><p>Your hostel administrator checks each request.</p></div></li><li><span>3</span><div><strong>Track the outcome</strong><p>Your latest status appears in your request history.</p></div></li></ol><div className="rebate-guidance-note">Submitting a request does not guarantee approval. Check back here for updates.</div></aside>
          </div>

          <section className="rebate-history-panel">
            <div className="rebate-history-heading"><div><h2>Request history</h2><p>Keep track of your previous and current requests.</p></div><span className="rebate-history-count">{loading ? 'Loading' : counts.total + (counts.total === 1 ? ' request' : ' requests')}</span></div>
            {loading ? <div className="rebate-history-loading"><span className="rebate-spinner" /><p>Loading request history...</p></div> : rebates.length === 0 ? <div className="rebate-history-empty"><span><Icon name="calendar" size={20} /></span><h3>No requests yet</h3><p>Your submitted rebate requests will appear here.</p></div> : (
              <div className="rebate-history-list">{rebates.map((rebate) => {
                const status = String(rebate.status || 'PENDING').toUpperCase();
                return <article className="rebate-history-item" key={rebate.id}><div className="rebate-history-icon"><Icon name="calendar" size={17} /></div><div className="rebate-history-dates"><strong>{formatDate(rebate.start_date)} <span>to</span> {formatDate(rebate.end_date)}</strong><small>{getDuration(rebate.start_date, rebate.end_date)} consecutive days away</small></div><div className="rebate-history-applied"><span>Submitted</span><strong>{formatDate(rebate.created_at)}</strong></div><span className={'rebate-status ' + status.toLowerCase()}><i />{statusLabels[status] || status}</span></article>;
              })}</div>
            )}
          </section>
          <footer className="bills-footer"><span>HostelSync</span><span>Questions about a request? Contact your hostel administrator.</span></footer>
        </main>
      </div>
    </div>
  );
}
