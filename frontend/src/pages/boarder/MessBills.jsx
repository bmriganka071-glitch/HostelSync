import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import './MessBills.css';

const navItems = [
  { label: 'Overview', path: '/boarder', icon: 'overview' },
  { label: 'Mess bills', path: '/boarder/bills', icon: 'bills' },
  { label: 'Rebate requests', path: '/boarder/rebates', icon: 'rebates' },
  { label: 'Room swaps', path: '/boarder/swaps', icon: 'swap' },
];

const icons = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  bills: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  rebates: <><path d="M12 3v18M17 7.5c0-1.4-1.8-2.5-4.5-2.5S8 6.1 8 7.5 9.8 10 12.5 10s4.5 1.1 4.5 2.5-1.8 2.5-4.5 2.5S8 13.9 8 12.5" /></>,
  swap: <><path d="M7 7h13l-3-3M17 17H4l3 3" /><path d="M20 7a8 8 0 0 1-2.3 5.7M4 17a8 8 0 0 1 2.3-5.7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  receipt: <><path d="M4 3h16v18l-4-2-4 2-4-2-4 2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="m9 12 2 2 4-4" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
};

function Icon({ name, size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function parseDate(value) {
  if (!value) return null;
  const normalized = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T00:00:00' : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonth(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Mess bill';
}

function formatFullDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
}

function getBillState(bill, paymentStatuses) {
  if (bill.status === 'PAID') return 'paid';
  const paymentStatus = paymentStatuses.get(bill.id);
  if (paymentStatus === 'PENDING') return 'pending';
  if (paymentStatus === 'FLAGGED') return 'flagged';
  const dueDate = parseDate(bill.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate && dueDate < today ? 'overdue' : 'due';
}

const statusLabels = { paid: 'Paid', pending: 'Under review', flagged: 'Action needed', overdue: 'Overdue', due: 'Unpaid' };

export default function MessBills() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeBill, setActiveBill] = useState(null);
  const [reference, setReference] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [paymentStatuses, setPaymentStatuses] = useState(() => new Map());

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, payments] = await Promise.all([
        paymentService.getMyBills(),
        paymentService.getMyPayments().catch(() => []),
      ]);
      setBills(Array.isArray(data) ? data : []);
      const latestStatuses = new Map();
      if (Array.isArray(payments)) {
        payments.forEach((payment) => {
          if (!latestStatuses.has(payment.bill_id)) latestStatuses.set(payment.bill_id, payment.status);
        });
      }
      setPaymentStatuses(latestStatuses);
    } catch (requestError) {
      setError('We could not load your bills. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const billStates = useMemo(() => new Map(bills.map((bill) => [bill.id, getBillState(bill, paymentStatuses)])), [bills, paymentStatuses]);
  const totals = useMemo(() => bills.reduce((result, bill) => {
    const amount = Number(bill.total_amount) || 0;
    if (bill.status === 'PAID') result.paid += amount;
    else result.balance += amount;
    return result;
  }, { balance: 0, paid: 0 }), [bills]);
  const filteredBills = bills.filter((bill) => {
    const state = billStates.get(bill.id);
    if (filter === 'all') return true;
    if (filter === 'due') return state === 'due' || state === 'overdue' || state === 'flagged';
    if (filter === 'pending') return state === 'pending';
    return state === 'paid';
  });
  const dueCount = bills.filter((bill) => ['due', 'overdue', 'flagged'].includes(billStates.get(bill.id))).length;
  const pendingCount = bills.filter((bill) => billStates.get(bill.id) === 'pending').length;
  const paidCount = bills.filter((bill) => billStates.get(bill.id) === 'paid').length;
  const initials = (user?.name || 'HS').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const openPaymentForm = (bill) => {
    setActiveBill(bill);
    setReference('');
    setPaymentError('');
    setNotice('');
  };

  const closePaymentForm = () => {
    if (submitting) return;
    setActiveBill(null);
    setPaymentError('');
    setReference('');
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    const cleanReference = reference.trim();
    if (!activeBill || !cleanReference) {
      setPaymentError('Enter the transaction reference to continue.');
      return;
    }
    setSubmitting(true);
    setPaymentError('');
    try {
      await paymentService.submitPayment(activeBill.id, cleanReference);
      setPaymentStatuses((current) => new Map(current).set(activeBill.id, 'PENDING'));
      setNotice('Your payment reference for ' + formatMonth(activeBill.bill_month) + ' was submitted for review.');
      setActiveBill(null);
      setReference('');
    } catch (requestError) {
      setPaymentError(requestError.response?.data?.message || 'Payment reference could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All bills', count: bills.length },
    { id: 'due', label: 'Due', count: dueCount },
    { id: 'pending', label: 'Under review', count: pendingCount },
    { id: 'paid', label: 'Paid', count: paidCount },
  ];

  return (
    <div className="bills-app">
      <aside className="bills-sidebar">
        <Link className="bills-brand" to="/boarder" aria-label="HostelSync home"><span className="bills-brand-mark">H</span><span>Hostel<span>Sync</span></span></Link>
        <div className="bills-nav-label">YOUR SPACE</div>
        <nav className="bills-nav" aria-label="Boarder navigation">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={'bills-nav-link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined}><Icon name={item.icon} /><span>{item.label}</span>{active && <span className="bills-nav-dot" />}</Link>;
          })}
        </nav>
        <div className="bills-sidebar-tip"><span>✦</span><strong>Need a meal break?</strong><p>Apply for a mess rebate before you travel.</p><Link to="/boarder/rebates">View rebate requests <Icon name="arrow" size={14} /></Link></div>
        <div className="bills-sidebar-user"><span className="bills-avatar">{initials}</span><span className="bills-user-copy"><strong>{user?.name || 'Hostel resident'}</strong><small>Boarder account</small></span><button type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" size={17} /></button></div>
      </aside>

      <div className="bills-main">
        <header className="bills-topbar">
          <div className="bills-mobile-brand"><span className="bills-brand-mark">H</span>HostelSync</div>
          <div className="bills-breadcrumb"><span>Workspace</span><i>/</i><strong>Mess bills</strong></div>
          <div className="bills-topbar-right"><span className="bills-today"><Icon name="calendar" size={15} />{today}</span><span className="bills-avatar bills-avatar-small">{initials}</span><button type="button" className="bills-top-logout" onClick={handleLogout}>Log out</button></div>
        </header>

        <main className="bills-content">
          <div className="bills-title-row"><div><p className="bills-eyebrow">YOUR MONTHLY ACCOUNT</p><h1>Mess bills</h1><p className="bills-page-intro">Review charges, track due dates and submit payment references.</p></div><span className="bills-title-icon"><Icon name="receipt" size={23} /></span></div>
          {notice && <div className="bills-success-banner" role="status"><span className="bills-success-check">✓</span><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
          {error && <div className="bills-error-banner" role="alert"><span>{error}</span><button type="button" onClick={fetchBills}>Try again</button></div>}

          <section className="bills-summary-grid" aria-label="Bill summary">
            <article className="bills-summary-card bills-balance-card"><span className="bills-summary-icon"><Icon name="receipt" size={18} /></span><div><p>Current balance</p><strong>{loading ? '—' : formatMoney(totals.balance)}</strong><span>Unpaid or awaiting verification</span></div></article>
            <article className="bills-summary-card"><span className="bills-summary-icon due-summary-icon"><Icon name="calendar" size={18} /></span><div><p>Needs attention</p><strong>{loading ? '—' : dueCount}</strong><span>{dueCount === 1 ? 'bill due' : 'bills due'}</span></div></article>
            <article className="bills-summary-card"><span className="bills-summary-icon paid-summary-icon"><Icon name="shield" size={18} /></span><div><p>Paid to date</p><strong>{loading ? '—' : formatMoney(totals.paid)}</strong><span>{paidCount} {paidCount === 1 ? 'bill settled' : 'bills settled'}</span></div></article>
          </section>

          <section className="bills-ledger-panel">
            <div className="bills-ledger-heading"><div><h2>Bill history</h2><p>Your mess charges and payment status</p></div><span className="bills-secure-note"><Icon name="shield" size={15} /> Payments reviewed by your administrator</span></div>
            <div className="bills-filter-row" role="tablist" aria-label="Filter bills">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={filter === tab.id} className={'bills-filter-tab' + (filter === tab.id ? ' selected' : '')} onClick={() => setFilter(tab.id)}>{tab.label}<span>{tab.count}</span></button>)}</div>

            {loading ? <div className="bills-loading"><span className="bills-spinner" /><p>Loading your bills...</p></div> : bills.length === 0 ? (
              <div className="bills-empty"><span className="bills-empty-icon"><Icon name="receipt" size={22} /></span><h3>No bills yet</h3><p>When your hostel posts a mess bill, it will appear here.</p></div>
            ) : filteredBills.length === 0 ? (
              <div className="bills-empty bills-filter-empty"><h3>Nothing in this view</h3><p>There are no {filter === 'due' ? 'due' : filter === 'paid' ? 'paid' : 'pending review'} bills right now.</p><button type="button" onClick={() => setFilter('all')}>View all bills</button></div>
            ) : (
              <>
                <div className="bills-table-wrap"><table className="bills-table"><thead><tr><th>Billing period</th><th>Base fee</th><th>Rebate</th><th>Fine</th><th>Total</th><th>Due date</th><th>Status</th><th><span className="bills-sr-only">Action</span></th></tr></thead><tbody>
                  {filteredBills.map((bill) => {
                    const state = billStates.get(bill.id);
                    return <tr key={bill.id}><td><span className="bills-period-cell"><span className="bills-period-icon"><Icon name="receipt" size={16} /></span><span><strong>{formatMonth(bill.bill_month)}</strong><small>Bill #{bill.id}</small></span></span></td><td>{formatMoney(bill.base_fee)}</td><td className="bills-positive-value">−{formatMoney(bill.rebate_amount)}</td><td className={Number(bill.fine_amount) ? 'bills-fine-value' : 'bills-muted-value'}>{formatMoney(bill.fine_amount)}</td><td className="bills-total-cell">{formatMoney(bill.total_amount)}</td><td><span className={state === 'overdue' ? 'bills-date-overdue' : 'bills-muted-value'}>{formatFullDate(bill.due_date)}</span></td><td><span className={'bills-status-badge ' + state}>{['pending', 'flagged'].includes(state) && <span className="bills-status-dot" />}{statusLabels[state]}</span></td><td className="bills-action-cell">{['due', 'overdue', 'flagged'].includes(state) ? <button type="button" className="bills-pay-button" onClick={() => openPaymentForm(bill)}>{state === 'flagged' ? 'Resubmit reference' : 'Submit reference'} <Icon name="arrow" size={14} /></button> : state === 'pending' ? <span className="bills-action-note">Awaiting review</span> : <span className="bills-paid-mark">✓</span>}</td></tr>;
                  })}
                </tbody></table></div>
                <div className="bills-mobile-list">{filteredBills.map((bill) => {
                  const state = billStates.get(bill.id);
                  return <article className="bills-mobile-card" key={bill.id}><div className="bills-mobile-card-top"><span className="bills-mobile-period"><span className="bills-period-icon"><Icon name="receipt" size={16} /></span><span><strong>{formatMonth(bill.bill_month)}</strong><small>Bill #{bill.id}</small></span></span><span className={'bills-status-badge ' + state}>{['pending', 'flagged'].includes(state) && <span className="bills-status-dot" />}{statusLabels[state]}</span></div><div className="bills-mobile-total"><span>Total amount</span><strong>{formatMoney(bill.total_amount)}</strong></div><div className="bills-mobile-breakdown"><span>Base fee <b>{formatMoney(bill.base_fee)}</b></span><span>Rebate <b className="bills-positive-value">−{formatMoney(bill.rebate_amount)}</b></span><span>Fine <b>{formatMoney(bill.fine_amount)}</b></span><span>Due date <b className={state === 'overdue' ? 'bills-date-overdue' : ''}>{formatFullDate(bill.due_date)}</b></span></div>{['due', 'overdue', 'flagged'].includes(state) ? <button type="button" className="bills-mobile-pay" onClick={() => openPaymentForm(bill)}>{state === 'flagged' ? 'Resubmit reference' : 'Submit payment reference'} <Icon name="arrow" size={15} /></button> : state === 'pending' ? <p className="bills-mobile-review">Your reference is awaiting administrator review.</p> : null}</article>;
                })}</div>
              </>
            )}
            {!loading && bills.length > 0 && <div className="bills-ledger-footer"><span>Showing {filteredBills.length} of {bills.length} bills</span><span>Amounts shown in Indian rupees (INR)</span></div>}
          </section>
          <footer className="bills-footer"><span>HostelSync</span><span>Questions about a charge? Contact your hostel administrator.</span></footer>
        </main>
      </div>

      {activeBill && <div className="bills-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePaymentForm(); }}><section className="bills-payment-modal" role="dialog" aria-modal="true" aria-labelledby="bills-modal-title"><button className="bills-modal-close" type="button" onClick={closePaymentForm} disabled={submitting} aria-label="Close"><Icon name="close" size={18} /></button><span className="bills-modal-icon"><Icon name="receipt" size={21} /></span><p className="bills-eyebrow">PAYMENT REFERENCE</p><h2 id="bills-modal-title">Submit your payment</h2><p className="bills-modal-copy">Enter the bank or UPI transaction reference for your <strong>{formatMonth(activeBill.bill_month)}</strong> mess bill.</p><div className="bills-modal-amount"><span>Amount due</span><strong>{formatMoney(activeBill.total_amount)}</strong></div><form onSubmit={handlePayment}><label htmlFor="payment-reference">Transaction reference</label><input id="payment-reference" autoFocus autoComplete="off" maxLength={100} placeholder="e.g. UPI transaction ID" value={reference} onChange={(event) => setReference(event.target.value)} required />{paymentError && <p className="bills-payment-error" role="alert">{paymentError}</p>}<p className="bills-modal-hint">Your submission will be reviewed by the hostel administrator.</p><div className="bills-modal-actions"><button type="button" className="bills-cancel-button" onClick={closePaymentForm} disabled={submitting}>Cancel</button><button type="submit" className="bills-submit-button" disabled={submitting || !reference.trim()}>{submitting ? 'Submitting…' : 'Submit reference'}</button></div></form></section></div>}
    </div>
  );
}
