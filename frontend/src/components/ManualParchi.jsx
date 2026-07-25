import React, { useState, useEffect } from 'react';
import { FiClipboard, FiUser, FiPhone, FiLoader } from 'react-icons/fi';

export default function ManualParchi({ walkInName, setWalkInName, walkInMobile, setWalkInMobile, handleManualCheckin, generatedParchi }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🌟 Loading state

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🌟 SUBMIT HANDLER: Jab tak token issue nahi hota, loading chalu rahegi
  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await handleManualCheckin(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 💻 Desktop view
  if (!isMobile) {
    return (
      <div className="glass-card">
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } } 
          .loading-spinner { animation: spin 1s linear infinite; display: inline-flex; }

          {/* 🌟 Desktop Glowing Input Styles */}
          .desktop-glow-container {
            position: relative;
            display: flex;
            align-items: center;
            flex: 1;
          }
          .desktop-glow-input {
            width: 100%;
            padding: 12px 14px 12px 40px;
            border-radius: 10px;
            border: 1px solid #CBD5E1;
            outline: none;
            font-size: 14px;
            background-color: #F8FAFC;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }
          .desktop-glow-icon {
            position: absolute;
            left: 14px;
            color: #64748B;
            transition: all 0.2s ease;
            pointer-events: none;
          }
          .desktop-glow-container:focus-within .desktop-glow-icon {
            color: #3B82F6;
          }
          .desktop-glow-container:focus-within .desktop-glow-input {
            background-color: #FFFFFF;
            border-color: #3B82F6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0,0,0,0.02);
          }
        `}</style>

        <h3 className="card-title"><FiClipboard /> Manual Token Window</h3>
        
        <form className="parchi-form-row" onSubmit={onSubmitForm} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          <div className="desktop-glow-container">
            <FiUser className="desktop-glow-icon" size={16} />
            <input 
              type="text" 
              placeholder="Patient Name" 
              value={walkInName} 
              onChange={(e) => setWalkInName(e.target.value)} 
              required 
              className="desktop-glow-input" 
            />
          </div>

          <div className="desktop-glow-container">
            <FiPhone className="desktop-glow-icon" size={16} />
            <input 
              type="tel" 
              maxLength="10" 
              placeholder="Mobile Number" 
              value={walkInMobile} 
              onChange={(e) => setWalkInMobile(e.target.value.replace(/\D/g, ''))} 
              className="desktop-glow-input" 
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="parchi-submit-btn premium-issue-btn-desktop" style={{ opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', padding: '12px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
            {isSubmitting ? <><FiLoader size={16} className="loading-spinner" /> Issuing...</> : 'Issue Token 🎫'}
          </button>
        </form>

        {generatedParchi && <div style={{marginTop: '15px', padding: '10px', background: '#F8FBFF', border: '1px dashed #1A73E8', borderRadius: '8px', color: '#1A73E8', fontWeight: 'bold'}}>✅ Token #{generatedParchi.token} generated!</div>}
      </div>
    );
  }

  // 📱 Mobile view
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      padding: '8px 10px', 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E2E8F0',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } } 
        .loading-spinner { animation: spin 1s linear infinite; display: inline-flex; }

        .glow-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .glow-input {
          width: 100%;
          padding: 8px 8px 8px 32px; 
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          outline: none;
          font-size: 13px;
          background-color: #F8FAFC;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }
        
        .glow-icon {
          position: absolute;
          left: 10px;
          color: #64748B;
          transition: all 0.2s ease;
          pointer-events: none;
        }

        .glow-input-container:focus-within .glow-icon {
          color: #3B82F6;
        }
        
        .glow-input-container:focus-within .glow-input {
          background-color: #FFFFFF;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .premium-issue-btn {
          width: 100%;
          padding: 8px; 
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .premium-issue-btn:active {
          transform: translateY(1px);
        }
      `}</style>

      <h3 style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontSize: '13px', 
        color: '#0F2942', 
        fontWeight: '800', 
        marginBottom: '6px',
        marginTop: '0'
      }}>
        <FiClipboard color="#3B82F6" size={14} /> Manual Token Window
      </h3>

      <form onSubmit={onSubmitForm} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        
        <div className="glow-input-container">
          <FiUser className="glow-icon" size={14} />
          <input 
            type="text" 
            className="glow-input"
            placeholder="Patient Name" 
            value={walkInName} 
            onChange={(e) => setWalkInName(e.target.value)} 
            required 
          />
        </div>

        <div className="glow-input-container">
          <FiPhone className="glow-icon" size={14} />
          <input 
            type="tel" 
            className="glow-input"
            maxLength="10" 
            placeholder="Mobile Number" 
            value={walkInMobile} 
            onChange={(e) => setWalkInMobile(e.target.value.replace(/\D/g, ''))} 
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="premium-issue-btn" style={{ opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? (
            <>
              <FiLoader size={14} className="loading-spinner" />
              <span>Issuing...</span>
            </>
          ) : (
            'Issue Token 🎫'
          )}
        </button>
      </form>

      {generatedParchi && (
        <div style={{
          marginTop: '5px', 
          padding: '5px', 
          background: '#ECFDF5', 
          border: '1px dashed #10B981', 
          borderRadius: '5px', 
          color: '#059669', 
          fontWeight: 'bold', 
          textAlign: 'center',
          fontSize: '11px'
        }}>
          ✅ Token #{generatedParchi.token} generated!
        </div>
      )}
    </div>
  );
}