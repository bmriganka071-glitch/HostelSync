import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { paymentService } from '../../services/paymentService';

export default function PaymentApprovals() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fetchPayments = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await paymentService.getAllPayments(); setPayments(Array.isArray(data) ? data : []); }
    catch (err) { setError(err.response?.data?.message || 'Could not load payments.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  const updatePayment = async (id, verified) => {
    setError(''); setNotice('');
    try { await paymentService.verifyPayment(id, verified); setNotice(verified ? 'Payment verified and bill marked paid.' : 'Payment flagged for follow-up.'); await fetchPayments(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update payment.'); }
  };
  return <AdminLayout title="Payment approvals" description="Verify boarder payment references and keep bill status up to date.">
    {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-alert success" role="status">{notice}</div>}
    <section className="admin-panel"><div className="admin-panel-title"><div><h2>Submitted payments</h2><p>Review the reference before approving or flagging a payment.</p></div><button className="admin-control-button" type="button" onClick={fetchPayments}>Refresh</button></div>
      {loading ? <div className="admin-loading">Loading payments…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Submitted</th><th>Boarder</th><th>Reference</th><th>Bill</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{payments.length ? payments.map((payment) => <tr key={payment.id}><td>{payment.submitted_at ? new Date(payment.submitted_at).toLocaleDateString('en-IN') : '—'}</td><td><strong>{payment.user_name}</strong><br />{payment.email}</td><td>{payment.payment_reference}</td><td>#{payment.bill_id}</td><td>₹{Number(payment.amount).toLocaleString('en-IN')}</td><td><span className={'admin-status ' + (payment.status === 'VERIFIED' ? 'good' : payment.status === 'FLAGGED' ? 'bad' : '')}>{payment.status}</span></td><td>{payment.status === 'PENDING' ? <div className="admin-actions"><button className="admin-primary" type="button" onClick={() => updatePayment(payment.id, true)}>Verify</button><button className="admin-danger" type="button" onClick={() => updatePayment(payment.id, false)}>Flag</button></div> : '—'}</td></tr>) : <tr><td className="admin-table-empty" colSpan="7">No submitted payments.</td></tr>}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
