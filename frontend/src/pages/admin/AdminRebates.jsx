import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { messRebateService } from '../../services/messRebateService';

export default function AdminRebates() {
  const [rebates, setRebates] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const fetchRebates = useCallback(async () => { setLoading(true); setError(''); try { const data = await messRebateService.getRebates(); setRebates(Array.isArray(data) ? data : []); } catch (err) { setError(err.response?.data?.message || 'Could not load rebate requests.'); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchRebates(); }, [fetchRebates]);
  const process = async (id, approved) => { setError(''); setNotice(''); try { await messRebateService.processRebate(id, approved); setNotice(approved ? 'Rebate request approved.' : 'Rebate request rejected.'); await fetchRebates(); } catch (err) { setError(err.response?.data?.message || 'Could not process this rebate.'); } };
  const pending = rebates.filter((item) => item.status === 'PENDING').length;
  return <AdminLayout title="Rebate requests" description="Review absence dates and process boarder mess rebate applications.">
    {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-alert success" role="status">{notice}</div>}
    <div className="admin-stat-row"><div className="admin-stat-card"><small>Total applications</small><strong>{loading ? '—' : rebates.length}</strong></div><div className="admin-stat-card"><small>Awaiting review</small><strong>{loading ? '—' : pending}</strong></div><div className="admin-stat-card"><small>Approved</small><strong>{loading ? '—' : rebates.filter((item) => item.status === 'APPROVED').length}</strong></div></div>
    <section className="admin-panel"><div className="admin-panel-title"><div><h2>Applications</h2><p>Pending requests can be approved or rejected.</p></div><button className="admin-control-button" type="button" onClick={fetchRebates}>Refresh</button></div>
      {loading ? <div className="admin-loading">Loading rebate requests…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Boarder</th><th>Absence period</th><th>Days</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{rebates.length ? rebates.map((item) => { const days = Math.max(1, Math.round((new Date(item.end_date) - new Date(item.start_date)) / 86400000) + 1); return <tr key={item.id}><td><strong>{item.name || `Boarder #${item.user_id}`}</strong>{item.email && <><br />{item.email}</>}</td><td>{new Date(item.start_date).toLocaleDateString('en-IN')} – {new Date(item.end_date).toLocaleDateString('en-IN')}</td><td>{days}</td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '—'}</td><td><span className={'admin-status ' + (item.status === 'APPROVED' ? 'good' : item.status === 'REJECTED' ? 'bad' : '')}>{item.status}</span></td><td>{item.status === 'PENDING' ? <div className="admin-actions"><button className="admin-primary" type="button" onClick={() => process(item.id, true)}>Approve</button><button className="admin-danger" type="button" onClick={() => process(item.id, false)}>Reject</button></div> : '—'}</td></tr>; }) : <tr><td className="admin-table-empty" colSpan="6">No rebate applications yet.</td></tr>}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
