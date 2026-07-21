import React from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiInfo, FiTrash2 } from 'react-icons/fi';

export default function BeautifulModal({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;

  // Theme Logic: Emoji ke hisab se modern icons aur colors set karna
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Close Button */}
        <button onClick={onClose} style={styles.closeButton}>
          <FiX size={18} />
        </button>

        {/* Glowing Icon (Premium Look) */}
        <div style={styles.iconContainer}>
          <div style={{ ...styles.iconOuterCircle, backgroundColor: bgLight }}>
            <div style={{ ...styles.iconInnerCircle, backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}` }}>
              <IconComponent size={28} color="#FFFFFF" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 style={styles.title}>{title}</h2>

        {/* Content (Text & Buttons) */}
        <div style={styles.contentContainer}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 },
  modal: { backgroundColor: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '380px', padding: '32px 24px 24px', position: 'relative', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'popIn 0.3s ease-out' },
  closeButton: { position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748B', cursor: 'pointer', transition: '0.2s' },
  iconContainer: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  iconOuterCircle: { width: '86px', height: '86px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  iconInnerCircle: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 12px 0' },
  contentContainer: { fontSize: '15px', color: '#475569', lineHeight: '1.6' }
};