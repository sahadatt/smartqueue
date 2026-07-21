import React from 'react';
import { FiMenu, FiLogOut, FiChevronDown } from 'react-icons/fi';
import hospitalLogo from '../assets/hospital-logo.png'; 

export default function AdminNavbar({ isSidebarOpen, setIsSidebarOpen, username, onLogout, isProfileMenuOpen, setIsProfileMenuOpen }) {
  return (
    <nav className="admin-navbar">
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center' }}>
        {!isSidebarOpen && (<button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} style={{ marginRight: '15px' }}><FiMenu /></button>)}
        
        {/* 🌟 Logo bada kar diya aur text hata diya kyunki logo ke andar naam hai */}
        <div className="hospital-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={hospitalLogo} 
            alt="CityCare Hospital Logo" 
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
          />
        </div>
      </div>

      <div className="nav-right" style={{ position: 'relative' }}>
        <div className="profile-box" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=e1ecf9`} alt="Dr" className="profile-img" />
          <div className="profile-text"><span className="profile-name">Dr. {username}</span><span className="profile-role">Administrator</span></div>
          <FiChevronDown color="#A3AED0" style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </div>
        {isProfileMenuOpen && (
          <div style={{ position: 'absolute', top: '110%', right: '0', backgroundColor: '#FFFFFF', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: '12px', padding: '8px', zIndex: 100 }}>
            <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#FFF1F2', color: '#E11D48', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}><FiLogOut size={16} /> Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}