// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessBills from '../pages/boarder/MessBills';
import RoomManagement from '../pages/admin/RoomManagement';
import RoomSwapApprovals from '../pages/admin/RoomSwapApprovals';
import BoarderRoomSwaps from '../pages/boarder/BoarderRoomSwaps';
import BoarderRebates from '../pages/boarder/BoarderRebates';
import AdminRebates from '../pages/admin/AdminRebates';
import AdminNoticesEvents from '../pages/admin/AdminNoticesEvents';
import PaymentApprovals from '../pages/admin/PaymentApprovals';
import AdminBills from '../pages/admin/AdminBills';

// Pages (You will need to create basic placeholders for these in your pages folder)
import Login from '../pages/Login';
import Register from '../pages/Register';
import ResetPassword from '../pages/ResetPassword';

// We will build these next!
import AdminDashboard from '../pages/admin/AdminDashboard';
import BoarderDashboard from '../pages/boarder/BoarderDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their respective dashboard if they try to access the wrong role's page
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/boarder'} replace />;
  }

  return children;
};

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/boarder'} /> : <Navigate to="/login" />
      } />
      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="ADMIN">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/payments" element={
        <ProtectedRoute allowedRole="ADMIN">
          <PaymentApprovals />
        </ProtectedRoute>
      } />
      <Route path="/admin/bills" element={
        <ProtectedRoute allowedRole="ADMIN">
          <AdminBills />
        </ProtectedRoute>
      } />
      <Route path="/admin/rooms" element={
        <ProtectedRoute allowedRole="ADMIN">
          <RoomManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/requests" element={
        <ProtectedRoute allowedRole="ADMIN">
          <RoomSwapApprovals />
        </ProtectedRoute>
      } />
      <Route path="/admin/rebates" element={<ProtectedRoute allowedRole="ADMIN"><AdminRebates /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute allowedRole="ADMIN"><AdminNoticesEvents /></ProtectedRoute>} />

      
      {/* Boarder Routes */}
      <Route path="/boarder" element={
        <ProtectedRoute allowedRole="BOARDER">
          <BoarderDashboard />
        </ProtectedRoute>
      } />
      <Route path="/boarder/bills" element={
        <ProtectedRoute allowedRole="BOARDER">
          <MessBills />
        </ProtectedRoute>
      } />
      <Route path="/boarder/swaps" element={
        <ProtectedRoute allowedRole="BOARDER">
          <BoarderRoomSwaps />
        </ProtectedRoute>
      } />
      <Route path="/boarder/rebates" element={<ProtectedRoute allowedRole="BOARDER"><BoarderRebates /></ProtectedRoute>} />
 
      </Routes>    
  );
}
