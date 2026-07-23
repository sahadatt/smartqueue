import React, { useState, useEffect } from 'react';
import { FiMenu, FiPlus, FiPhone, FiAlertTriangle } from 'react-icons/fi';

export default function AdminSidebar({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  isNextDisabled, 
  socket, 
  setResetModal,
  totalTokensToday,
  completedCount,
  inProgressCount,
  remainingCount,
  deletedCount,
  activeFilter,
  setActiveFilter
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar open hone par bahar click karne se close hone ka logic (Mobile & Desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest('.admin-sidebar') && !event.target.closest('.hamburger-btn') && !event.target.closest('.nav-left')) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  return (
    <aside 
      className={`admin-sidebar ${!isSidebarOpen ? 'closed' : ''}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100dvh', // 🌟 FIX: Mobile browser bar issue fix karne ke liye dvh use kiya hai
        boxSizing: 'border-box',
        width: isMobile ? '160px' : '', 
        position: isMobile ? 'fixed' : '', 
        left: 0,
        top: 0,
        zIndex: 999,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        transition: 'all 0.3s ease',
        overflowY: 'auto'
      }}
    >
      
      {/* Top Header */}
      <div 
        onClick={() => setIsSidebarOpen(false)} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '8px' : '15px',
          padding: isMobile ? '16px 12px 10px 12px' : '24px 24px 10px 24px', 
          cursor: 'pointer', 
          zIndex: 10, 
          flexShrink: 0,
          backgroundColor: '#FFFFFF' 
        }}
      >
        <FiMenu size={24} color="#1A73E8" />
        <span style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '800', color: '#0F2942' }}>
          Dashboard
        </span>
      </div>

      {/* 🌟 FIX: Background image container ke andar Queue Stats aur Image dono ko daal diya gaya hai taaki photo stats ke pichhe bhi dikhe */}
      <div style={{ flex: 1, width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 0,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)'
        }}>
          <img 
            src="/images/sidebar-hospital.webp" 
            alt="Sidebar"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              opacity: '0.8'
            }} 
          />
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: isMobile ? '4px 6px' : '0', overflowY: 'auto' }}>
          
          {/* MOBILE STATS & FILTERS */}
          {isMobile && (
            <div style={{ padding: '8px 4px', marginBottom: '8px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', flexShrink: 0 }}>
              <div className="qa-title" style={{ fontSize: '9px', marginBottom: '6px', color: '#64748B', fontWeight: 'bold', textAlign: 'center' }}>
                QUEUE STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div 
                  onClick={() => { setActiveFilter('all'); setIsSidebarOpen(false); }}
                  style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'all' ? '#EFF6FF' : 'rgba(248, 250, 252, 0.9)', border: '1px solid', borderColor: activeFilter === 'all' ? '#3B82F6' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  <span style={{ color: '#1E293B', fontWeight: '600' }}>Total</span>
                  <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{totalTokensToday}</span>
                </div>
                
                <div 
                  onClick={() => { setActiveFilter('completed'); setIsSidebarOpen(false); }}
                  style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'completed' ? '#ECFDF5' : 'rgba(248, 250, 252, 0.9)', border: '1px solid', borderColor: activeFilter === 'completed' ? '#10B981' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  <span style={{ color: '#065F46', fontWeight: '600' }}>Done</span>
                  <span style={{ backgroundColor: '#D1FAE5', color: '#047857', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{completedCount}</span>
                </div>

                <div 
                  onClick={() => { setActiveFilter('progress'); setIsSidebarOpen(false); }}
                  style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'progress' ? '#FFFBEB' : 'rgba(248, 250, 252, 0.9)', border: '1px solid', borderColor: activeFilter === 'progress' ? '#F59E0B' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  <span style={{ color: '#92400E', fontWeight: '600' }}>Active</span>
                  <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{inProgressCount}</span>
                </div>

                <div 
                  onClick={() => { setActiveFilter('remaining'); setIsSidebarOpen(false); }}
                  style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'remaining' ? '#F5F3FF' : 'rgba(248, 250, 252, 0.9)', border: '1px solid', borderColor: activeFilter === 'remaining' ? '#8B5CF6' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  <span style={{ color: '#5B21B6', fontWeight: '600' }}>Wait</span>
                  <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{remainingCount}</span>
                </div>

                <div 
                  onClick={() => { setActiveFilter('deleted'); setIsSidebarOpen(false); }}
                  style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'deleted' ? '#FEF2F2' : 'rgba(248, 250, 252, 0.9)', border: '1px solid', borderColor: activeFilter === 'deleted' ? '#EF4444' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                  <span style={{ color: '#991B1B', fontWeight: '600' }}>Deleted</span>
                  <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{deletedCount}</span>
                </div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: '20px' }} />
        </div>
      </div>

      {/* Quick Actions Bottom Section */}
      <div className="quick-actions-sidebar" style={{ flexShrink: 0, paddingBottom: isMobile ? '80px' : '20px', padding: isMobile ? '8px 8px 80px 8px' : '20px', backgroundColor: '#FFFFFF', zIndex: 10 }}>
        <div className="qa-title" style={{ fontSize: isMobile ? '9px' : '12px', textAlign: isMobile ? 'center' : 'left' }}>
          QUICK ACTIONS
        </div>
        
        <button 
          className="qa-btn" 
          onClick={() => window.open('/checkin', '_blank')}
          style={{ padding: isMobile ? '6px' : '12px', fontSize: isMobile ? '10px' : '14px', justifyContent: isMobile ? 'center' : 'flex-start' }}
        >
          <FiPlus size={16} color="#1A73E8" /> {!isMobile && "Issue New Token"}
        </button>
        
        <button 
          className="qa-btn" 
          disabled={isNextDisabled} 
          onClick={() => socket.emit('next-patient')} 
          style={{ opacity: isNextDisabled ? 0.5 : 1, padding: isMobile ? '6px' : '12px', fontSize: isMobile ? '10px' : '14px', justifyContent: isMobile ? 'center' : 'flex-start' }}
        >
          <FiPhone size={16} color="#00E396" /> {!isMobile && "Call Next Patient"}
        </button>
        
        <button 
          className="qa-btn qa-btn-danger" 
          onClick={() => setResetModal({ isOpen: true, password: '' })}
          style={{ padding: isMobile ? '6px' : '12px', fontSize: isMobile ? '10px' : '14px', justifyContent: isMobile ? 'center' : 'flex-start' }}
        >
          <FiAlertTriangle size={16} /> {!isMobile && "Reset Queue"}
        </button>
      </div>
    </aside>
  );
}