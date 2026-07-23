import React from 'react';
import { FiClipboard, FiUser, FiPhone } from 'react-icons/fi';

export default function ManualParchi({ walkInName, setWalkInName, walkInMobile, setWalkInMobile, handleManualCheckin, generatedParchi }) {
  return (
    <div className="glass-card">
      <h3 className="card-title"><FiClipboard /> Manual Token Window</h3>
      <form className="parchi-form-row" onSubmit={handleManualCheckin}>
        <div className="parchi-input-box"><FiUser className="parchi-icon" /><input type="text" placeholder="Patient Name" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} required className="parchi-input-row" /></div>
        <div className="parchi-input-box"><FiPhone className="parchi-icon" /><input type="tel" maxLength="10" placeholder="Mobile Number" value={walkInMobile} onChange={(e) => setWalkInMobile(e.target.value.replace(/\D/g, ''))} className="parchi-input-row" /></div>
        <button type="submit" className="parchi-submit-btn">Issue Token 🎫</button>
      </form>
      {generatedParchi && <div style={{marginTop: '15px', padding: '10px', background: '#F8FBFF', border: '1px dashed #1A73E8', borderRadius: '8px', color: '#1A73E8', fontWeight: 'bold'}}>✅ Token #{generatedParchi.token} generated!</div>}
    </div>
  );
}