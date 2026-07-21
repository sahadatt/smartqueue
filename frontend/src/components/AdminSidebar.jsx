import React from 'react';
import { FiMenu, FiPlus, FiPhone, FiAlertTriangle } from 'react-icons/fi';
import sidebarImage from '../assets/sidebar-hospital.png'; // 🌟 Apni image ka path yahan check kar lena

export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen, isNextDisabled, socket, setResetModal }) {
  return (
    <aside className={`admin-sidebar ${!isSidebarOpen ? 'closed' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '24px 24px 10px 24px', cursor: 'pointer', zIndex: 10, flexShrink: 0 }}>
        <FiMenu size={24} color="#1A73E8" />
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#0F2942' }}>Dashboard</span>
      </div>

      {/* 🌟 Upar aur niche se fade hoti hui Image (Sharp Corners aur Edge-to-Edge Fit) */}
      <div style={{ flex: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          // Yeh dono lines image ko upar aur niche se fade karke gayab kar dengi
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
        }}>
          <img 
            src={sidebarImage} 
            alt="Hospital Background" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', // Poori jagah exact fit karega
              opacity: '0.8'    // Thoda halka (faded) dikhane ke liye
            }} 
          />
        </div>
      </div>

      {/* Quick Actions Bottom Section */}
      <div className="quick-actions-sidebar" style={{ flexShrink: 0, paddingBottom: '20px' }}>
        <div className="qa-title">QUICK ACTIONS</div>
        <button className="qa-btn" onClick={() => window.open('/checkin', '_blank')}>
          <FiPlus size={16} color="#1A73E8" /> Issue New Token
        </button>
        <button className="qa-btn" disabled={isNextDisabled} onClick={() => socket.emit('next-patient')} style={{ opacity: isNextDisabled ? 0.5 : 1 }}>
          <FiPhone size={16} color="#00E396" /> Call Next Patient
        </button>
        <button className="qa-btn qa-btn-danger" onClick={() => setResetModal({ isOpen: true, password: '' })}>
          <FiAlertTriangle size={16} /> Reset Entire Queue
        </button>
      </div>

    </aside>
  );
}