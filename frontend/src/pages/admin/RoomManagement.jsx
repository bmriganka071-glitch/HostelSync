// src/pages/admin/RoomManagement.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { roomService } from '../../services/roomService';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boarders, setBoarders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBoarder, setSelectedBoarder] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [roomData, boarderData] = await Promise.all([roomService.getAllRooms(), roomService.getBoarders()]);
      setRooms(roomData);
      setBoarders(boarderData);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load room and boarder data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const availableRooms = useMemo(() => rooms.filter((room) => Number(room.occupants) < Number(room.capacity)), [rooms]);
  const allocate = async (event) => {
    event.preventDefault();
    if (!selectedBoarder || !selectedRoom) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await roomService.allocateRoom(selectedBoarder, selectedRoom);
      setSuccess('Room allocation saved.'); setSelectedBoarder(''); setSelectedRoom(''); await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not allocate this room.');
    } finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Room management" description="Review room capacity and allocate unassigned boarders.">
      {error && <div className="admin-alert" role="alert">{error}</div>}{success && <div className="admin-alert success" role="status">{success}</div>}
      <section className="admin-panel"><div className="admin-panel-title"><div><h2>Allocate a room</h2><p>Only available rooms and unassigned boarders are listed.</p></div></div><div className="admin-panel-body"><form className="admin-inline-form" onSubmit={allocate}><label className="admin-field">Boarder<select value={selectedBoarder} onChange={(event) => setSelectedBoarder(event.target.value)} required><option value="">Choose a boarder</option>{boarders.filter((person) => person.room_id == null).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}</select></label><label className="admin-field">Available room<select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)} required><option value="">Choose a room</option>{availableRooms.map((room) => <option key={room.id} value={room.id}>{room.block} · Room {room.room_number} · {room.capacity - room.occupants} bed(s) free</option>)}</select></label><button className="admin-primary" type="submit" disabled={saving || !selectedBoarder || !selectedRoom}>{saving ? 'Saving…' : 'Allocate room'}</button></form>{!loading && boarders.every((person) => person.room_id != null) && <p className="admin-workspace-heading"><small>All boarders currently have a room assignment.</small></p>}</div></section>
      <section className="admin-panel"><div className="admin-panel-title"><div><h2>Room inventory</h2><p>{rooms.length} rooms across all blocks</p></div><button className="admin-control-button" type="button" onClick={fetchData}>Refresh</button></div>{loading ? <div className="admin-loading">Loading rooms…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Block</th><th>Room</th><th>Capacity</th><th>Occupants</th><th>Availability</th></tr></thead><tbody>{rooms.length ? rooms.map((room) => { const full = Number(room.occupants) >= Number(room.capacity); return <tr key={room.id}><td><strong>{room.block}</strong></td><td>Room {room.room_number}</td><td>{room.capacity} beds</td><td>{room.occupants}</td><td><span className={`admin-status ${full ? 'bad' : 'good'}`}>{full ? 'Full' : `${room.capacity - room.occupants} available`}</span></td></tr>; }) : <tr><td className="admin-table-empty" colSpan="5">No rooms found.</td></tr>}</tbody></table></div>}</section>
    </AdminLayout>
  );
}
