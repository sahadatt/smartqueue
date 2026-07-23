import React, { useState, useEffect } from 'react';
import { FiMenu, FiLogOut, FiChevronDown } from 'react-icons/fi';

export default function AdminNavbar({ isSidebarOpen, setIsSidebarOpen, username, onLogout, isProfileMenuOpen, setIsProfileMenuOpen }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="admin-navbar" style={{ padding: isMobile ? '10px' : '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center' }}>
        {!isSidebarOpen && (
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} style={{ marginRight: isMobile ? '10px' : '15px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <FiMenu size={isMobile ? 20 : 24} />
          </button>
        )}
        
        <div className="hospital-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/images/hospital-logo.webp" 
            alt="Logo" 
            style={{ height: isMobile ? '28px' : '42px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>
      </div>

      <div className="nav-right" style={{ position: 'relative' }}>
        <div className="profile-box" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
          <img 
  src="/images/logo.webp" 
  alt="Logo" 
  style={{ height: '32px', objectFit: 'contain' }}
  onError={(e) => { e.target.style.display = 'none'; }} 
/>
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=e1ecf9`} 
            alt="Dr" 
            className="profile-img" 
            style={{ width: isMobile ? '30px' : '40px', height: isMobile ? '30px' : '40px', borderRadius: '50%' }}
          />
          
          {/* 🌟 FIX: Mobile par pura naam aur text hide kar diya, sirf DP dikhegi */}
          {!isMobile && (
            <div className="profile-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="profile-name" style={{ fontSize: '15px', fontWeight: 'bold' }}>Dr. {username}</span>
              <span className="profile-role" style={{ fontSize: '12px', color: '#64748B' }}>Administrator</span>
            </div>
          )}
          
          <FiChevronDown color="#A3AED0" size={isMobile ? 16 : 20} style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>

        {isProfileMenuOpen && (
          <div style={{ 
            position: 'absolute', top: '110%', right: '0', backgroundColor: '#FFFFFF', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: '12px', 
            padding: isMobile ? '6px' : '8px', 
            zIndex: 100, 
            minWidth: isMobile ? '110px' : '150px' 
          }}>
            <button onClick={onLogout} style={{ 
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px', 
              padding: isMobile ? '8px' : '10px 12px', 
              fontSize: isMobile ? '12px' : '14px',
              backgroundColor: '#FFF1F2', color: '#E11D48', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' 
            }}>
              <FiLogOut size={isMobile ? 14 : 16} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}