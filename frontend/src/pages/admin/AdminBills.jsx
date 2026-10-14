import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { paymentService } from '../../services/paymentService';

export default function AdminBills() {
  const [bills, setBills] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ bill_month: new Date().toISOString().slice(0, 7), base_fee: '', due_date: '' });
  const fetchData = useCallback(async () => { setLoading(true); setError(''); try { const rows = await paymentService.getAllMessBills(); setBills(Array.isArray(rows) ? rows : []); } catch (err) { setError(err.response?.data?.message || 'Could not load bills.'); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); setNotice(''); try { const result = await paymentService.createMessBill({ bill_month: `${form.bill_month}-01`, base_fee: Number(form.base_fee), due_date: form.due_date }); setNotice(`Common bill created for ${result.boarders_billed} boarders. Each boarder owes ₹${Number(result.total_amount).toLocaleString('en-IN')}.`); setForm((current) => ({ ...current, base_fee: '' })); await fetchData(); } catch (err) { setError(err.response?.data?.message || 'Could not create the common mess bill.'); } finally { setSaving(false); } };
  return <AdminLayout title="Mess bills" description="Create one monthly bill for every boarder and track payment status.">
    {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-alert success" role="status">{notice}</div>}
    <section className="admin-panel"><div className="admin-panel-title"><div><h2>Create a common monthly bill</h2><p>Every current boarder gets the same unpaid bill. Rebates and fines are handled separately.</p></div></div><div className="admin-panel-body"><form className="admin-form-grid" onSubmit={submit}>
      <label className="admin-field">Billing month<input name="bill_month" type="month" value={form.bill_month} onChange={setField} required /></label>
      <label className="admin-field">Base fee (₹)<input name="base_fee" type="number" min="0" step="0.01" value={form.base_fee} onChange={setField} required /></label>
      <label className="admin-field">Due date<input name="due_date" type="date" value={form.due_date} onChange={setField} required /></label>
      <div className="admin-field-wide"><button className="admin-primary" type="submit" disabled={saving || loading}>{saving ? 'Creating…' : 'Create bill for all boarders'}</button></div>
    </form></div></section>
    <section className="admin-panel"><div className="admin-panel-title"><div><h2>Bill ledger</h2><p>Recent bills and current payment status.</p></div><button className="admin-control-button" type="button" onClick={fetchData}>Refresh</button></div>
      {loading ? <div className="admin-loading">Loading bills…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Boarder</th><th>Month</th><th>Amount due</th><th>Due date</th><th>Status</th></tr></thead><tbody>{bills.length ? bills.map((bill) => <tr key={bill.id}><td><strong>{bill.user_name}</strong><br />{bill.email}</td><td>{new Date(bill.bill_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td><td><strong>₹{Number(bill.total_amount).toLocaleString('en-IN')}</strong></td><td>{new Date(bill.due_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td><td><span className={'admin-status ' + (bill.status === 'PAID' ? 'good' : '')}>{bill.status}</span></td></tr>) : <tr><td className="admin-table-empty" colSpan="5">No bills have been created yet.</td></tr>}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
