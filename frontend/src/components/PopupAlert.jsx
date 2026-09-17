import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';

export default function BeautifulModal({ isOpen, onClose, title, icon, children }) {
  const [render, setRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setIsClosing(false);
    } else if (render) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setRender(false);
        setIsClosing(false);
      }, 250); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, render]);

  if (!render) return null;

  // Theme Logic: Set modern icons and colors based on the emoji
  let themeColor = '#1A73E8'; // Default Blue (Info)
  let bgLight = '#EFF6FF';
  let IconComponent = FiInfo;

  if (icon === '✅') {
    themeColor = '#10B981'; // Emerald Green (Success)
    bgLight = '#ECFDF5';
    IconComponent = FiCheck;
  } else if (icon === '❌' || icon === '🚨') {
    themeColor = '#EF4444'; // Red (Error)
    bgLight = '#FEF2F2';
    IconComponent = FiAlertTriangle;
  } else if (icon === '🗑️') {
    themeColor = '#F43F5E'; // Rose/Red (Delete)
    bgLight = '#FFF1F2';
    IconComponent = FiTrash2;
  }

  return (
    <div style={styles.overlay} className={isClosing ? 'modal-overlay-fade-out' : 'modal-overlay-fade-in'}>
      
      <style>{`
        @keyframes smoothZoomIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes smoothZoomOut {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0; }
        }
        @keyframes fadeOverlayIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeOverlayOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .modal-overlay-fade-in { animation: fadeOverlayIn 0.25s ease forwards; }
        .modal-overlay-fade-out { animation: fadeOverlayOut 0.25s ease forwards; }
        .modal-box-zoom-in { animation: smoothZoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-box-zoom-out { animation: smoothZoomOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div className={isClosing ? 'modal-box-zoom-out' : 'modal-box-zoom-in'} style={styles.modal}>
        
        <button onClick={onClose} style={styles.closeButton}>
          <FiX size={18} />
        </button>

        <div style={styles.iconContainer}>
          <div style={{ ...styles.iconOuterCircle, backgroundColor: bgLight }}>
            <div style={{ ...styles.iconInnerCircle, backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}` }}>
              <IconComponent size={28} color="#FFFFFF" strokeWidth={3} />
            </div>
          </div>
        </div>

        <h2 style={styles.title}>{title}</h2>

        <div style={styles.contentContainer}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 },
  modal: { backgroundColor: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '380px', padding: '32px 24px 24px', position: 'relative', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748B', cursor: 'pointer', transition: '0.2s' },
  iconContainer: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  iconOuterCircle: { width: '86px', height: '86px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  iconInnerCircle: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 12px 0' },
  contentContainer: { fontSize: '15px', color: '#475569', lineHeight: '1.6' }
};