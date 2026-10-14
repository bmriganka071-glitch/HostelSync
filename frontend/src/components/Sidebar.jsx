// src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Define links based on role
  const adminLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Rooms', path: '/admin/rooms' },
    { name: 'Payments', path: '/admin/payments' },
    { name: 'Requests', path: '/admin/requests' },
    { name: 'Announcements', path: '/admin/announcements' },
  ];

  const boarderLinks = [
    { name: 'Dashboard', path: '/boarder' },
    { name: 'My Room', path: '/boarder/room' },
    { name: 'Mess Bills', path: '/boarder/bills' },
    { name: 'Swap Requests', path: '/boarder/swaps' },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : boarderLinks;

  return (
    <aside className="w-64 min-h-screen text-white bg-gray-800 shadow-lg">
      <div className="p-6 text-2xl font-bold tracking-wider text-center border-b border-gray-700">
        HostelSync
      </div>
      <nav className="p-4 mt-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`block px-4 py-3 rounded transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}