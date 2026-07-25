import React, { useState, useEffect } from 'react';
import { FiMenu, FiUserPlus, FiBell, FiTrash2, FiPlay, FiSquare, FiClock } from 'react-icons/fi'; 

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
  setActiveFilter,
  localStatus = 'not-started',
  handleStatusChange,
  setPauseModalOpen,
  setStartModalOpen
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && isMobile && !event.target.closest('.admin-sidebar') && !event.target.closest('.hamburger-btn') && !event.target.closest('.nav-left')) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen && isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen, isMobile]); 

  const isSessionStarted = localStatus !== 'not-started';
  const isSessionActive = localStatus === 'active';

  return (
    <aside 
      className={`admin-sidebar ${!isSidebarOpen ? 'closed' : ''}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100dvh',
        boxSizing: 'border-box',
        width: isMobile ? '160px' : '240px', 
        position: isMobile ? 'fixed' : 'relative', 
        left: 0,
        top: 0,
        zIndex: 999,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
    >
      
      {/* Professional Button & Animation Styling */}
      <style>{`
        .qa-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 14px;
          background-color: #FFFFFF;
          color: #0F172A;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .qa-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.08);
          border-color: #3B82F6;
          color: #1D4ED8;
        }
        .qa-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .qa-btn:disabled {
          opacity: 0.45 !important;
          background-color: #F1F5F9 !important;
          color: #94A3B8 !important;
          border-color: #CBD5E1 !important;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .qa-btn:disabled svg {
          opacity: 0.5;
        }
        .qa-btn-danger {
          background-color: #FEF2F2 !important;
          color: #DC2626 !important;
          border-color: #FECACA !important;
        }
        .qa-btn-danger:hover:not(:disabled) {
          border-color: #EF4444 !important;
          color: #B91C1C !important;
          background-color: #FEE2E2 !important;
        }
      `}</style>

      {/* Background Image Container */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <img 
          src="/images/sidebar-hospital.webp" 
          alt="Sidebar Hospital"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: '0.85' 
          }} 
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.75) 100%)'
        }} />
      </div>

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
          backgroundColor: 'transparent' 
        }}
      >
        <FiMenu size={24} color="#1A73E8" />
        <span style={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '800', color: '#0F2942' }}>
          Dashboard
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {isMobile && (
          <div style={{ padding: '8px 4px', marginBottom: '8px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', flexShrink: 0, margin: '0 8px' }}>
            <div style={{ fontSize: '9px', marginBottom: '6px', color: '#64748B', fontWeight: 'bold', textAlign: 'center' }}>
              QUEUE STATS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div onClick={() => { setActiveFilter('all'); setIsSidebarOpen(false); }} style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'all' ? '#EFF6FF' : '#F8FAFC', border: '1px solid', borderColor: activeFilter === 'all' ? '#3B82F6' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                <span style={{ color: '#1E293B', fontWeight: '600' }}>Total</span>
                <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{totalTokensToday}</span>
              </div>
              <div onClick={() => { setActiveFilter('completed'); setIsSidebarOpen(false); }} style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'completed' ? '#ECFDF5' : '#F8FAFC', border: '1px solid', borderColor: activeFilter === 'completed' ? '#10B981' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                <span style={{ color: '#065F46', fontWeight: '600' }}>Done</span>
                <span style={{ backgroundColor: '#D1FAE5', color: '#047857', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{completedCount}</span>
              </div>
              <div onClick={() => { setActiveFilter('progress'); setIsSidebarOpen(false); }} style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'progress' ? '#FFFBEB' : '#F8FAFC', border: '1px solid', borderColor: activeFilter === 'progress' ? '#F59E0B' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                <span style={{ color: '#92400E', fontWeight: '600' }}>Active</span>
                <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{inProgressCount}</span>
              </div>
              <div onClick={() => { setActiveFilter('remaining'); setIsSidebarOpen(false); }} style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'remaining' ? '#F5F3FF' : '#F8FAFC', border: '1px solid', borderColor: activeFilter === 'remaining' ? '#8B5CF6' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                <span style={{ color: '#5B21B6', fontWeight: '600' }}>Wait</span>
                <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{remainingCount}</span>
              </div>
              <div onClick={() => { setActiveFilter('deleted'); setIsSidebarOpen(false); }} style={{ padding: '5px 6px', borderRadius: '6px', backgroundColor: activeFilter === 'deleted' ? '#FEF2F2' : '#F8FAFC', border: '1px solid', borderColor: activeFilter === 'deleted' ? '#EF4444' : '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '10px' }}>
                <span style={{ color: '#991B1B', fontWeight: '600' }}>Deleted</span>
                <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{deletedCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* System Controls Bottom Section */}
        <div className="quick-actions-sidebar" style={{ marginTop: 'auto', position: 'relative', zIndex: 10, flexShrink: 0, paddingBottom: isMobile ? '80px' : '20px', padding: isMobile ? '8px 8px 80px 8px' : '16px 20px', backgroundColor: 'transparent' }}>
          
          {/* 🌟 Green Gradient Title */}
          <div className="qa-title" style={{ fontSize: isMobile ? '9px' : '11px', textAlign: isMobile ? 'center' : 'left', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.8px', background: 'linear-gradient(90deg, #059669, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        
          </div>

          {/* 1. Start / End Session Button (Top) */}
          <button 
            className="qa-btn" 
            onClick={() => localStatus === 'not-started' ? setStartModalOpen(true) : handleStatusChange('not-started')}
          >
            {localStatus === 'not-started' ? <FiPlay size={16} color="#10B981" /> : <FiSquare size={16} color="#EF4444" />} 
            {!isMobile && (localStatus === 'not-started' ? "Start Session" : "End Session")}
          </button>

          {/* 2. Pause / Resume Button (Below Start) */}
          <button 
            className="qa-btn" 
            disabled={!isSessionStarted}
            onClick={() => isSessionActive ? setPauseModalOpen(true) : handleStatusChange('active')}
          >
            <FiClock size={16} color={isSessionActive ? "#F59E0B" : "#3B82F6"} /> 
            {!isMobile && (isSessionActive ? "Pause Session" : "Resume Session")}
          </button>

          {/* 3. Issue New Token */}
          <button 
            className="qa-btn" 
            onClick={() => window.open('/checkin', '_blank')}
          >
            <FiUserPlus size={16} color="#1A73E8" /> {!isMobile && "Issue New Token"}
          </button>
          
          {/* 4. Call Next Patient */}
          <button 
            className="qa-btn" 
            disabled={isNextDisabled || !isSessionActive} 
            onClick={() => socket.emit('next-patient')} 
          >
            <FiBell size={16} color="#00E396" /> {!isMobile && "Call Next Patient"}
          </button>
          
          {/* 5. Reset Queue */}
          <button 
            className="qa-btn qa-btn-danger" 
            onClick={() => setResetModal({ isOpen: true, password: '' })}
          >
            <FiTrash2 size={16} color="#DC2626" /> {!isMobile && "Reset Queue"}
          </button>
        </div>

      </div>
    </aside>
  );
}