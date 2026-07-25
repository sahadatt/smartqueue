import React, { useState } from 'react';
import { FiActivity, FiLoader } from 'react-icons/fi';

export default function LiveCounter({ currentLiveToken, isNextDisabled, socket, onNext, onPrevious }) {
  
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [isPrevLoading, setIsPrevLoading] = useState(false);

  const handleNextClick = async () => {
    setIsNextLoading(true);
    try {
      if (onNext) await onNext();
      else if (socket) socket.emit('next-token');
    } finally {
      setTimeout(() => setIsNextLoading(false), 400);
    }
  };

  const handlePrevClick = async () => {
    setIsPrevLoading(true);
    try {
      if (onPrevious) await onPrevious();
      else if (socket) socket.emit('prev-token');
    } finally {
      setTimeout(() => setIsPrevLoading(false), 400);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
      
      {/* 🌟 RESPONSIVE CSS & ANIMATIONS */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .btn-loading-spinner { animation: spin 0.8s linear infinite; display: inline-flex; }

        @keyframes pulse-glow-neon {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7), inset 0 0 15px rgba(16, 185, 129, 0.3); }
          70% { box-shadow: 0 0 0 25px rgba(16, 185, 129, 0), inset 0 0 25px rgba(16, 185, 129, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), inset 0 0 15px rgba(16, 185, 129, 0.3); }
        }
        .pulse-circle {
          animation: pulse-glow-neon 1.8s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes ekg-flow-rtl {
          from { stroke-dashoffset: -250; }
          to { stroke-dashoffset: 0; }
        }
        .flowing-ekg {
          stroke-dasharray: 90 160; 
          animation: ekg-flow-rtl 2s linear infinite; 
        }

        .ekg-mobile-wrap { display: none; }
        .ekg-desktop-wrap { display: flex; }

        @media (max-width: 768px) {
          .ekg-desktop-wrap { display: none !important; }
          .ekg-mobile-wrap { display: flex !important; max-width: 75px; overflow: hidden; }
        }

        .btn-prev, .btn-next {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-prev:hover:not(:disabled) { 
          transform: translateX(-4px) scale(1.02); 
          background-color: #E2E8F0 !important; 
          box-shadow: -4px 4px 12px rgba(0,0,0,0.08);
        }
        .btn-prev:disabled { cursor: not-allowed; opacity: 0.6; }
        
        .btn-next:hover:not(:disabled) { 
          transform: translateX(4px) scale(1.02); 
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
          background-color: #059669 !important; 
        }
        .btn-next:disabled { cursor: not-allowed; opacity: 0.6; }
      `}</style>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px', color: '#1E293B', fontWeight: '800', fontSize: '14px' }}>
        <FiActivity size={18} color="#10B981" /> Live Counter Status
      </div>

      {/* Counter & Heartbeat Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '35px' }}>
        
        {/* Left EKG */}
        <div className="ekg-desktop-wrap" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <DesktopEKG />
        </div>
        <div className="ekg-mobile-wrap" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <MobileEKG />
        </div>
        
        {/* 🟢 PULSING CIRCLE */}
        <div className="pulse-circle" style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          backgroundColor: '#ECFDF5', 
          border: '4px solid #059669',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          zIndex: 2,
          position: 'relative'
        }}>
          <div style={{ fontSize: '50px', fontWeight: '900', color: '#047857', fontFamily: 'system-ui, -apple-system, sans-serif', textShadow: '0 2px 10px rgba(16,185,129,0.3)' }}>
            {currentLiveToken || 0}
          </div>
        </div>

        {/* Right EKG */}
        <div className="ekg-desktop-wrap" style={{ flex: 1, justifyContent: 'flex-start' }}>
            <DesktopEKG />
        </div>
        <div className="ekg-mobile-wrap" style={{ flex: 1, justifyContent: 'flex-start' }}>
            <MobileEKG />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn-prev"
          onClick={handlePrevClick} 
          disabled={isPrevLoading}
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', color: '#334155', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}
        >
          {isPrevLoading ? <FiLoader size={16} className="btn-loading-spinner" /> : '← Previous'}
        </button>
        
        <button 
          className="btn-next"
          disabled={isNextDisabled || isNextLoading} 
          onClick={handleNextClick} 
          style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: isNextDisabled ? '#94A3B8' : '#10B981', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}
        >
          {isNextLoading ? (
            <>
              <FiLoader size={16} className="btn-loading-spinner" />
              <span>Updating...</span>
            </>
          ) : (
            'Next Patient →'
          )}
        </button>
      </div>
    </div>
  );
}

// 🖥️ Desktop EKG (Pehle jaisi patli aur saaf line)
const DesktopEKG = () => (
  <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="vibrantGreenGlowDesk" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#059669" stopOpacity="0" />
        <stop offset="50%" stopColor="#34D399" stopOpacity="1" />
        <stop offset="100%" stopColor="#059669" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path 
      d="M 0 30 L 20 30 L 25 24 L 30 30 L 40 30 L 45 42 L 55 5 L 63 52 L 70 30 L 85 30 L 95 18 L 105 30 L 150 30" 
      stroke="#059669" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" 
    />
    <path 
      className="flowing-ekg" 
      d="M 0 30 L 20 30 L 25 24 L 30 30 L 40 30 L 45 42 L 55 5 L 63 52 L 70 30 L 85 30 L 95 18 L 105 30 L 150 30" 
      stroke="url(#vibrantGreenGlowDesk)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
      style={{ filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8))' }}
    />
  </svg>
);

// 📱 Mobile EKG (Patli aur choti line taaki na kate)
const MobileEKG = () => (
  <svg width="80" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="vibrantGreenGlowMob" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#059669" stopOpacity="0" />
        <stop offset="50%" stopColor="#34D399" stopOpacity="1" />
        <stop offset="100%" stopColor="#059669" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path 
      d="M 0 25 L 15 25 L 20 20 L 25 25 L 30 25 L 35 35 L 42 5 L 48 42 L 54 25 L 65 25 L 75 15 L 82 25 L 100 25" 
      stroke="#059669" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" 
    />
    <path 
      className="flowing-ekg" 
      d="M 0 25 L 15 25 L 20 20 L 25 25 L 30 25 L 35 35 L 42 5 L 48 42 L 54 25 L 65 25 L 75 15 L 82 25 L 100 25" 
      stroke="url(#vibrantGreenGlowMob)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
      style={{ filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.8))' }}
    />
  </svg>
);