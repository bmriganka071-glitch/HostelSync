// src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="text-xl font-bold text-blue-600 md:hidden">
        HostelSync
      </div>
      <div className="hidden md:block"></div> {/* Spacer for desktop */}
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          Welcome, {user?.name} ({user?.role})
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-white transition-colors bg-red-500 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}