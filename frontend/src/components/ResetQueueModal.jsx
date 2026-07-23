import React from 'react';
import { FiAlertTriangle, FiX, FiTrash2 } from 'react-icons/fi';

export default function ResetQueueModal({ isOpen, onClose, onConfirm, password, setPassword }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Top Right Close Button */}
        <button onClick={onClose} style={styles.closeButton}>
          <FiX size={18} />
        </button>

        {/* Warning Icon (Matched with image) */}
        <div style={styles.iconContainer}>
          <div style={styles.iconOuterCircle}>
            <div style={styles.iconInnerCircle}>
              <FiAlertTriangle size={28} color="#FFFFFF" />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <h2 style={styles.title}>Reset Queue?</h2>
        <p style={styles.subtitle}>
          You are about to delete all patient data. Please enter the Admin Password to confirm.
        </p>

        {/* Password Input Area */}
        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {/* Divider */}
        <div style={styles.divider}></div>

        {/* Action Buttons (Matched with image) */}
        <div style={styles.buttonContainer}>
          <button onClick={onClose} style={styles.cancelBtn}>
            <div style={styles.cancelIconBox}><FiX size={12} /></div> 
            Cancel
          </button>
          
          <button onClick={onConfirm} style={styles.confirmBtn}>
            <div style={styles.confirmIconBox}><FiTrash2 size={12} /></div> 
            Yes, Reset
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modal: { backgroundColor: '#ffffff', borderRadius: '24px', width: '90%', maxWidth: '420px', padding: '32px 24px 24px', position: 'relative', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  closeButton: { position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748B', cursor: 'pointer' },
  iconContainer: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  iconOuterCircle: { width: '86px', height: '86px', borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #FFEDD5' },
  iconInnerCircle: { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)' },
  title: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 12px 0' },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '0 0 24px 0', lineHeight: '1.5', padding: '0 10px' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#F8FAFC', marginBottom: '24px', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' },
  divider: { height: '1px', backgroundColor: '#E2E8F0', margin: '0 0 20px 0' },
  buttonContainer: { display: 'flex', gap: '16px' },
  cancelBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 0', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#334155', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  cancelIconBox: { backgroundColor: '#E2E8F0', borderRadius: '50%', padding: '4px', display: 'flex' },
  confirmBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 0', background: '#EF4444', border: 'none', borderRadius: '12px', color: '#FFFFFF', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' },
  confirmIconBox: { backgroundColor: '#FFFFFF', color: '#EF4444', borderRadius: '50%', padding: '4px', display: 'flex' }
};