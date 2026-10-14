import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { roomSwapService } from '../../services/roomSwapService';

export default function RoomSwapApprovals() {
  const [swaps, setSwaps] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const fetchSwaps = useCallback(async () => { setLoading(true); setError(''); try { const data = await roomSwapService.getAdminSwaps(); setSwaps(Array.isArray(data) ? data : []); } catch (err) { setError(err.response?.data?.message || 'Could not load room swap requests.'); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchSwaps(); }, [fetchSwaps]);
  const respond = async (id, approved) => { setError(''); setNotice(''); try { await roomSwapService.adminRespond(id, approved); setNotice(approved ? 'Room swap approved.' : 'Room swap rejected.'); await fetchSwaps(); } catch (err) { setError(err.response?.data?.message || 'Could not process this room swap.'); } };
  const pending = swaps.filter((swap) => swap.status === 'PENDING_ADM').length;
  return <AdminLayout title="Room swap requests" description="Review mutually accepted room swaps and approve or reject the final request.">
    {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-alert success" role="status">{notice}</div>}
    <div className="admin-stat-row"><div className="admin-stat-card"><small>Total requests</small><strong>{loading ? '—' : swaps.length}</strong></div><div className="admin-stat-card"><small>Awaiting admin review</small><strong>{loading ? '—' : pending}</strong></div><div className="admin-stat-card"><small>Approved</small><strong>{loading ? '—' : swaps.filter((item) => item.status === 'APPROVED').length}</strong></div></div>
    <section className="admin-panel"><div className="admin-panel-title"><div><h2>Swap queue</h2><p>Only requests accepted by both boarders are ready for admin review.</p></div><button className="admin-control-button" type="button" onClick={fetchSwaps}>Refresh</button></div>
      {loading ? <div className="admin-loading">Loading swap requests…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Request</th><th>Boarder A</th><th>Boarder B</th><th>Created</th><th>Status</th><th>Action</th></tr></thead><tbody>{swaps.length ? swaps.map((swap) => <tr key={swap.id}><td><strong>#{swap.id}</strong></td><td>{swap.sender}</td><td>{swap.receiver}</td><td>{swap.created_at ? new Date(swap.created_at).toLocaleDateString('en-IN') : '—'}</td><td><span className={'admin-status ' + (swap.status === 'APPROVED' ? 'good' : swap.status === 'REJECTED' ? 'bad' : '')}>{swap.status.replaceAll('_', ' ')}</span></td><td>{swap.status === 'PENDING_ADM' ? <div className="admin-actions"><button className="admin-primary" type="button" onClick={() => respond(swap.id, true)}>Approve</button><button className="admin-danger" type="button" onClick={() => respond(swap.id, false)}>Reject</button></div> : '—'}</td></tr>) : <tr><td className="admin-table-empty" colSpan="6">No room swap requests yet.</td></tr>}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
