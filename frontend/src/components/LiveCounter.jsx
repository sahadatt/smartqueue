import React from 'react';
import { FiActivity } from 'react-icons/fi';

export default function LiveCounter({ currentLiveToken, isNextDisabled, socket, onNext, onPrevious }) {
  
  const handleNextClick = () => {
    if (onNext) onNext();
    else if (socket) socket.emit('next-token');
  };

  const handlePrevClick = () => {
    if (onPrevious) onPrevious();
    else if (socket) socket.emit('prev-token');
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
      
      {/* 🌟 CSS ANIMATIONS */}
      <style>{`
        /* Beautiful Soft Pulse Glow for Circle */
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.1); }
          70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0), inset 0 0 20px rgba(16, 185, 129, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), inset 0 0 10px rgba(16, 185, 129, 0.1); }
        }
        .pulse-circle {
          animation: pulse-glow 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Complex EKG Line Flowing RIGHT TO LEFT */
        @keyframes ekg-flow-rtl {
          from { stroke-dashoffset: -250; }
          to { stroke-dashoffset: 0; }
        }
        .flowing-ekg {
          stroke-dasharray: 90 160; /* Line aur gap ko adjust kiya taaki complex wave smooth dikhe */
          animation: ekg-flow-rtl 2.5s linear infinite; /* Thodi smooth aur steady speed */
        }

        /* Button Hover Bouncy Animations */
        .btn-prev, .btn-next {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .btn-prev:hover { 
          transform: translateX(-6px) scale(1.03); 
          background-color: #E2E8F0 !important; 
          box-shadow: -4px 4px 12px rgba(0,0,0,0.06);
        }
        
        .btn-next:hover:not(:disabled) { 
          transform: translateX(6px) scale(1.03); 
          box-shadow: 4px 4px 18px rgba(16, 185, 129, 0.3);
          background-color: #059669 !important; 
        }
        .btn-next:disabled { cursor: not-allowed; opacity: 0.6; }
      `}</style>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px', color: '#64748B', fontWeight: '700', fontSize: '14px' }}>
        <FiActivity size={18} color="#10B981" /> Live Counter Status
      </div>

      {/* Counter & Heartbeat Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '35px' }}>
        
        {/* Left Faded Complex EKG */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <UltraFadedComplexEKG />
        </div>
        
        {/* 🟢 BEAUTIFUL PULSING CIRCLE */}
        <div className="pulse-circle" style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          backgroundColor: '#F0FDF4', 
          border: '4px solid #10B981',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          zIndex: 2,
          position: 'relative'
        }}>
          {/* Token Number */}
          <div style={{ fontSize: '50px', fontWeight: '900', color: '#059669', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {currentLiveToken || 0}
          </div>
        </div>

        {/* Right Faded Complex EKG */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <UltraFadedComplexEKG />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn-prev"
          onClick={handlePrevClick} 
          style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
        >
          ← Previous
        </button>
        
        <button 
          className="btn-next"
          disabled={isNextDisabled} 
          onClick={handleNextClick} 
          style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: isNextDisabled ? '#94A3B8' : '#10B981', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
        >
          Next Patient →
        </button>
      </div>
    </div>
  );
}

// 📉 Ultra-Faded & Complex EKG Component
const UltraFadedComplexEKG = () => (
  <svg width="150" height="60" viewBox="0 0 150 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
    
    <defs>
      {/* 🌟 Ultra-Soft Gradient */}
      <linearGradient id="ultraFikaGradient" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
        <stop offset="50%" stopColor="#10B981" stopOpacity="0.25" /> {/* Opacity aur gira di taaki ekdum soft lage */}
        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Naya Complex Path: P-wave, Q-dip, R-peak, S-dip, T-wave jaisa detail */}
    {/* Background Track (Ekdum halka) */}
    <path 
      d="M 0 30 L 20 30 L 25 24 L 30 30 L 40 30 L 45 42 L 55 5 L 63 52 L 70 30 L 85 30 L 95 18 L 105 30 L 150 30" 
      stroke="#10B981" 
      strokeWidth="1" /* Thoda patla kar diya */
      strokeLinecap="round" 
      strokeLinejoin="round" 
      opacity="0.25" /* Background ko lagbhag gayab kar diya */
    />
    
    {/* Animated Flowing Line with Complex Wave */}
    <path 
      className="flowing-ekg" 
      d="M 0 30 L 20 30 L 25 24 L 30 30 L 40 30 L 45 42 L 55 5 L 63 52 L 70 30 L 85 30 L 95 18 L 105 30 L 150 30" 
      stroke="url(#ultraFikaGradient)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);