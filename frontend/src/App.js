import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Auth from './components/Auth';

import { FiMenu, FiLogOut, FiEdit2, FiTrash2, FiUsers, FiClipboard, FiClock, FiLoader, FiChevronDown, FiActivity, FiUser, FiPhone, FiPlus, FiAlertTriangle, FiShield } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
const socket = io(BACKEND_URL);

const maskMobileNumber = (mobile) => {
  if (!mobile || mobile === "Walk-In Parchi") return "Walk-In Parchi";
  if (mobile.length < 4) return mobile;
  return `XXXXXX${mobile.slice(-4)}`;
};

// 0. MODAL
function BeautifulModal({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '22px' }}>{icon || '🔔'}</span><h3 style={styles.modalTitle}>{title}</h3></div>
          <button onClick={onClose} style={styles.modalCloseX}>&times;</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

// 1. PATIENT WAIT ROOM
function PatientView({ currentLiveToken, patients, initialLoad }) {
  const patientId = localStorage.getItem('patientId');
  const me = patients.find(p => p._id === patientId);
  const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const myToken = me ? me.tokenNumber : localStorage.getItem('myToken');
  const patientName = me ? me.name : localStorage.getItem('patientName') || "Patient";
  const isMyTurn = myToken && parseInt(myToken) === currentLiveToken;
  const currentServingPatient = patients.find(p => p.tokenNumber === currentLiveToken);

  useEffect(() => {
    if (isMyTurn && initialLoad) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = audioCtx.createOscillator(); const gain1 = audioCtx.createGain();
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); gain1.gain.setValueAtTime(0.5, audioCtx.currentTime); gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4); osc1.connect(gain1); gain1.connect(audioCtx.destination); osc1.start(); osc1.stop(audioCtx.currentTime + 0.4);
      } catch (err) {}
    }
  }, [isMyTurn, currentLiveToken, initialLoad]);

  useEffect(() => {
    if (myToken) {
      const tokenDiff = parseInt(myToken) - currentLiveToken;
      const patientsAhead = tokenDiff > 0 ? tokenDiff : 0;
      const storageKey = `queue_target_timestamp_${myToken}_${currentLiveToken}`;
      let targetTimestamp = localStorage.getItem(storageKey);
      if (!targetTimestamp) { targetTimestamp = Date.now() + (patientsAhead * 15 * 60 * 1000); localStorage.setItem(storageKey, targetTimestamp); }
      const updateCountdownClock = () => setTimeLeftInSeconds(Math.max(0, Math.floor((parseInt(targetTimestamp) - Date.now()) / 1000)));
      updateCountdownClock(); const intervalId = setInterval(updateCountdownClock, 1000);
      return () => clearInterval(intervalId);
    }
  }, [myToken, currentLiveToken]);

  const formatTimer = (totalSeconds) => {
    if (totalSeconds <= 0) return { h: "00", m: "00", s: "00" };
    return { h: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'), m: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'), s: String(totalSeconds % 60).padStart(2, '0') };
  };

  const executeLeaveQueue = async () => {
    try { await fetch(`${BACKEND_URL}/api/auth/patient-leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenToRemove: myToken }) }); } catch (err) {}
    localStorage.clear(); window.location.reload();
  };

  if (initialLoad && patientId && !me && localStorage.getItem('myToken')) return (<div style={styles.patientPageWrapper}><div style={{ ...styles.patientAppContainer, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}><div style={{ fontSize: '64px' }}>⚠️</div><h2 style={{ color: '#DC3545', margin: 0, fontWeight: '800' }}>Token Delete Kar Diya Gya Hai</h2><button onClick={() => { localStorage.clear(); window.location.href = '/checkin'; }} style={{ ...styles.patientLeaveBtnClean, backgroundColor: '#1A73E8', color: '#FFFFFF', border: 'none' }}>Naya Token Generate Karein 🎫</button></div></div>);
  if (!localStorage.getItem('myToken')) return <Navigate to="/checkin" />;
  
  const patientsAhead = Math.max(0, parseInt(myToken) - currentLiveToken);
  const timerObj = formatTimer(timeLeftInSeconds);

  return (
    <div style={styles.patientPageWrapper}>
      <div style={styles.patientAppContainer}>
        
        {/* HEADER */}
        <div style={styles.patientBrandHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.patientBlueCrossIcon}>✚</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F2942' }}>SmartQueue</div>
              <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Waiting Room</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F2942' }}>CityCare HOSPITAL</div>
              <div style={{ fontSize: '8px', color: '#64748B', fontWeight: '600' }}>We Care. We Heal.</div>
            </div>
            <div style={{ fontSize: '20px', color: '#1A73E8' }}>✚</div>
          </div>
        </div>

        {/* WELCOME CARD */}
        <div style={styles.patientWelcomeCard}>
          <h2 style={styles.patientWelcomeTitle}>Namaste, {patientName}!</h2>
          <div style={{ fontSize: '32px' }}>🙏</div>
        </div>

        {/* AAPKA TOKEN NO */}
        <div style={styles.patientMyTokenCard}>
          <div style={styles.dotsLeft}>⋮⋮</div>
          <div style={styles.dotsRight}>⋮⋮</div>
          <div style={{ fontSize: '14px', color: '#0F2942', fontWeight: '700' }}>Aapka Token No.</div>
          <div style={{ fontSize: '85px', fontWeight: '900', color: '#0A429B', lineHeight: '1.1', margin: '5px 0' }}>{myToken}</div>
        </div>

        {/* NOW SERVING CARD */}
        <div style={isMyTurn ? styles.patientServingCardGreen : styles.patientNowServingCard}>
          <div style={styles.patientServingIconContainer}>
            <FiUser size={32} color={isMyTurn ? "#059669" : "#1A73E8"} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', opacity: 0.9 }}>{isMyTurn ? "Aapki Baari Hai!" : "Now Serving"}</div>
            <div style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1', marginTop: '2px' }}>{currentLiveToken}</div>
          </div>
        </div>

        {/* TIMER CARD */}
        <div style={styles.patientTimerCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '15px' }}>
            <div style={styles.patientTimerIconBox}>
              <FiClock size={24} color="#10B981" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F2942', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiClock /> Aapka Number Kab Aayega?
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', fontWeight: '600' }}>
                Aapke aage <strong style={{color: '#10B981'}}>{patientsAhead}</strong> patients aur hain.
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '42px', fontWeight: '900', color: '#10B981', fontFamily: 'monospace', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <FiLoader size={30} /> {timerObj.h}:{timerObj.m}:{timerObj.s}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', letterSpacing: '2px', marginTop: '5px' }}>HH : MM : SS</div>
          </div>
        </div>

        {/* LEAVE BUTTON & FOOTER */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button onClick={() => setIsLeaveModalOpen(true)} style={styles.patientLeaveBtnClean}>
            <FiTrash2 /> Leave Queue (Token Delete Karein)
          </button>
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '11px', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
            <FiShield size={14} /> Aapka data surakshit hai. Dhanyavaad!
          </div>
        </div>

      </div>
      <BeautifulModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Queue Chhodein?" icon="⚠️"><div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}><button onClick={() => setIsLeaveModalOpen(false)} style={styles.modalCancelBtn}>Cancel</button><button onClick={executeLeaveQueue} style={styles.modalDeleteBtn}>Ha, Chhodein</button></div></BeautifulModal>
    </div>
  );
}

// 2. PATIENT QR CHECK-IN VIEW
function PatientCheckin() {
  const [name, setName] = useState(''); const [mobile, setMobile] = useState(''); const [loading, setLoading] = useState(false); const [redirect, setRedirect] = useState(false);
  const handleGetToken = async (e) => {
    e.preventDefault(); if (!name.trim() || !mobile.trim() || mobile.trim().length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientName: name, mobileNumber: mobile.trim() }) });
      const data = await res.json();
      if (res.ok) { localStorage.setItem('myToken', data.myToken); localStorage.setItem('patientName', data.patientName); localStorage.setItem('patientId', data.patientId); setRedirect(true); }
    } catch (err) {}
    setLoading(false);
  };
  if (redirect || localStorage.getItem('myToken')) return <Navigate to="/" />;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '340px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#0F2942', margin: '0 0 20px 0', textAlign: 'center' }}>🏥 Clinic Check-in</h2>
        <form onSubmit={handleGetToken} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={styles.modalInputLabel}>Full Name</label><input type="text" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.modalInputField} /></div>
          <div><label style={styles.modalInputLabel}>Mobile Number</label><input type="tel" maxLength="10" placeholder="Enter 10-Digit No" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required style={styles.modalInputField} /></div>
          <button type="submit" disabled={loading} style={styles.modalSaveBtn}>{loading ? "Alloting..." : "Get Token Number 🎫"}</button>
        </form>
      </div>
    </div>
  );
}

// 3. ULTRA PREMIUM ADMIN PANEL DASHBOARD
function AdminPanel({ currentLiveToken, totalTokensDistributed, patients, username, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState(''); 
  const [generatedParchi, setGeneratedParchi] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', tokenNumber: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' });
  const [resetModal, setResetModal] = useState({ isOpen: false, password: '' });

  const visitedPatients = patients.filter(p => p.tokenNumber < currentLiveToken).sort((a,b) => b.tokenNumber - a.tokenNumber);
  const currentConsultingPatient = patients.find(p => p.tokenNumber === currentLiveToken);
  const waitingPatients = patients.filter(p => p.tokenNumber > currentLiveToken).sort((a,b) => a.tokenNumber - b.tokenNumber);

  const totalTokensToday = totalTokensDistributed; 
  const completedCount = visitedPatients.length;
  const inProgressCount = currentConsultingPatient ? 1 : 0;
  const remainingCount = waitingPatients.length;
  const isNextDisabled = currentLiveToken >= totalTokensDistributed;

  const triggerDeleteModal = (id, tokenNumber) => setDeleteModal({ isOpen: true, id, tokenNumber });
  const executeAdminDelete = () => { socket.emit('admin-delete-patient', { id: deleteModal.id }); setDeleteModal({ isOpen: false, id: '', tokenNumber: '' }); };
  const triggerEditModal = (id, name, tokenNumber, mobileNumber) => setEditModal({ isOpen: true, id, name, tokenNumber, mobileNumber: mobileNumber || '' });
  const executeAdminEdit = (e) => { e.preventDefault(); socket.emit('admin-edit-patient', { id: editModal.id, newName: editModal.name.trim(), newTokenNumber: editModal.tokenNumber, newMobileNumber: editModal.mobileNumber.trim() }); setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' }); };
  const executeSystemReset = (e) => { e.preventDefault(); if (!resetModal.password.trim()) return; socket.emit('reset-entire-queue', { username, password: resetModal.password.trim() }); setResetModal({ isOpen: false, password: '' }); setGeneratedParchi(null); };

  const handleManualCheckin = async (e) => {
    e.preventDefault(); if (!walkInName.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientName: walkInName, mobileNumber: walkInMobile.trim() || "Walk-In Parchi" }) });
      const data = await res.json();
      if (res.ok) { setGeneratedParchi({ token: data.myToken, name: data.patientName }); setWalkInName(''); setWalkInMobile(''); }
    } catch (err) {}
  };

  return (
    <div className="admin-layout">
      
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div onClick={() => setIsSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '24px 24px 10px 24px', cursor: 'pointer', zIndex: 10, background: 'transparent' }}>
          <FiMenu size={24} color="#1A73E8" />
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#0F2942' }}>Dashboard</span>
        </div>
        <div className="sidebar-bottom-img"></div>
        <div className="quick-actions-sidebar">
          <div className="qa-title">QUICK ACTIONS</div>
          <button className="qa-btn" onClick={() => window.open('/checkin', '_blank')}><FiPlus size={16} color="#1A73E8" /> Issue New Token</button>
          <button className="qa-btn" disabled={isNextDisabled} onClick={() => socket.emit('next-patient')} style={{ opacity: isNextDisabled ? 0.5 : 1 }}>
            <FiPhone size={16} color="#00E396" /> Call Next Patient
          </button>
          <button className="qa-btn qa-btn-danger" onClick={() => setResetModal({ isOpen: true, password: '' })}>
            <FiAlertTriangle size={16} /> Reset Entire Queue
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <nav className="admin-navbar">
          <div className="nav-left">
            {!isSidebarOpen && ( <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}><FiMenu /></button> )}
            <div className="hospital-brand"><span className="blue-cross">✚</span> CityCare HOSPITAL</div>
          </div>
          <div className="nav-right">
            <div className="profile-box">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=e1ecf9`} alt="Dr Profile" className="profile-img" />
              <div className="profile-text"><span className="profile-name">Dr. {username}</span><span className="profile-role">Administrator</span></div>
              <FiChevronDown color="#A3AED0" style={{marginLeft: '10px'}} />
            </div>
            <button onClick={onLogout} className="logout-btn"><FiLogOut /> Logout</button>
          </div>
        </nav>

        <div className="dashboard-content">
          <div className="page-header">
            <h1><FiActivity color="#1A73E8" /> Dashboard</h1>
            <p>Welcome back! Here's what's happening today.</p>
          </div>

          <div className="stats-grid">
            <div className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}><div className="stat-top"><div className="stat-icon s-blue"><FiUsers /></div><div className="stat-info"><h3>Total Tokens Today</h3><h2 style={{color: '#008FFB'}}>{totalTokensToday}</h2></div></div><div className="stat-link">Click to view all &gt;</div></div>
            <div className={`stat-card ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')}><div className="stat-top"><div className="stat-icon s-green"><FiClipboard /></div><div className="stat-info"><h3>Completed</h3><h2 className="s-green-txt">{completedCount}</h2></div></div><div className="stat-link">Click to view visited &gt;</div></div>
            <div className={`stat-card ${activeFilter === 'progress' ? 'active' : ''}`} onClick={() => setActiveFilter('progress')}><div className="stat-top"><div className="stat-icon s-orange"><FiClock /></div><div className="stat-info"><h3>In Progress</h3><h2 className="s-orange-txt">{inProgressCount}</h2></div></div><div className="stat-link">Click to view active &gt;</div></div>
            <div className={`stat-card ${activeFilter === 'remaining' ? 'active' : ''}`} onClick={() => setActiveFilter('remaining')}><div className="stat-top"><div className="stat-icon s-purple"><FiLoader /></div><div className="stat-info"><h3>Remaining</h3><h2 className="s-purple-txt">{remainingCount}</h2></div></div><div className="stat-link">Click to view queue &gt;</div></div>
          </div>

          <div className="workspace-grid">
            <div className="left-stack">
              <div className="glass-card">
                <h3 className="card-title"><FiActivity /> Live Counter Status</h3>
                <div className="live-counter-box">
                  <div className="ekg-bg">〰〰</div>
                  <div className="circle-gauge">{currentLiveToken}</div>
                  <div className="counter-actions">
                    <button className="btn-prev" onClick={() => socket.emit('previous-patient')} disabled={currentLiveToken <= 1}>← Previous</button>
                    <button className="btn-next" onClick={() => socket.emit('next-patient')} disabled={isNextDisabled} style={{opacity: isNextDisabled ? 0.5 : 1}}>Next Patient →</button>
                  </div>
                </div>
              </div>

              <div className="glass-card">
                <h3 className="card-title"><FiClipboard /> Manual Parchi Window</h3>
                <form className="parchi-form-row" onSubmit={handleManualCheckin}>
                  <div className="parchi-input-box"><FiUser className="parchi-icon" /><input type="text" placeholder="Patient Name" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} required className="parchi-input-row" /></div>
                  <div className="parchi-input-box"><FiPhone className="parchi-icon" /><input type="tel" maxLength="10" placeholder="Mobile Number (Optional)" value={walkInMobile} onChange={(e) => setWalkInMobile(e.target.value.replace(/\D/g, ''))} className="parchi-input-row" /></div>
                  <button type="submit" className="parchi-submit-btn">Issue Parchi Token 🎫</button>
                </form>
                {generatedParchi && <div style={{marginTop: '15px', padding: '10px', background: '#F8FBFF', border: '1px dashed #1A73E8', borderRadius: '8px', color: '#1A73E8', fontWeight: 'bold'}}>✅ Token #{generatedParchi.token} generated for {generatedParchi.name}!</div>}
              </div>
            </div>

            {/* FLOW BOARD WITH STICKY MIDDLE SECTION */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 5px 16px', flexShrink: 0 }}><h3 className="card-title" style={{ paddingBottom: '0', margin: 0 }}><FiUsers /> Live Patient Flow Board <span className="flow-badge">Showing: {activeFilter.toUpperCase()}</span></h3></div>

              {(activeFilter === 'all' || activeFilter === 'completed') && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
                  <div className="section-label" style={{color: '#00E396'}}><FiClipboard /> Recently Visited (Completed)</div>
                  {visitedPatients.length === 0 ? <p style={{fontSize: '12px', color: '#A3AED0'}}>No visited history yet</p> : visitedPatients.map(p => (
                    <div key={p._id} className="flow-list-item" style={{ opacity: 0.65 }}><div className="flow-user-info"><h4><span style={{color: '#00E396'}}>#{p.tokenNumber}</span> {p.name}</h4><p><FiPhone /> {maskMobileNumber(p.mobileNumber)}</p></div><div className="flow-actions"><button className="circle-btn edit-btn" onClick={() => triggerEditModal(p._id, p.name, p.tokenNumber, p.mobileNumber)}><FiEdit2 /></button><button className="circle-btn del-btn" onClick={() => triggerDeleteModal(p._id, p.tokenNumber)}><FiTrash2 /></button></div></div>
                  ))}
                </div>
              )}

              {(activeFilter === 'all' || activeFilter === 'progress') && (
                <div style={{ flexShrink: 0, background: '#F8FBFF', padding: '12px 16px', borderTop: '2px solid #E1ECF9', borderBottom: '2px solid #E1ECF9', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', zIndex: 5 }}>
                  <div className="section-label" style={{color: '#FEB019', marginBottom: '8px'}}><FiActivity /> Currently In Consultation</div>
                  {currentConsultingPatient ? (
                    <div className="flow-list-item active" style={{ marginBottom: 0, boxShadow: '0 4px 15px rgba(26,115,232,0.15)' }}><div className="flow-user-info"><h4><span style={{color: '#1A73E8'}}>#{currentConsultingPatient.tokenNumber}</span> {currentConsultingPatient.name}</h4><p><FiPhone /> {maskMobileNumber(currentConsultingPatient.mobileNumber)}</p></div><div className="flow-actions"><button className="circle-btn edit-btn" onClick={() => triggerEditModal(currentConsultingPatient._id, currentConsultingPatient.name, currentConsultingPatient.tokenNumber, currentConsultingPatient.mobileNumber)}><FiEdit2 /></button><button className="circle-btn del-btn" onClick={() => triggerDeleteModal(currentConsultingPatient._id, currentConsultingPatient.tokenNumber)}><FiTrash2 /></button></div></div>
                  ) : <p style={{fontSize: '12px', color: '#A3AED0', margin: 0}}>Counter Empty</p>}
                </div>
              )}

              {(activeFilter === 'all' || activeFilter === 'remaining') && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
                  <div className="section-label"><FiLoader /> Next In Line (Waiting)</div>
                  {waitingPatients.length === 0 ? <p style={{fontSize: '12px', color: '#A3AED0'}}>Line khali hai!</p> : waitingPatients.map(p => (
                    <div key={p._id} className="flow-list-item"><div className="flow-user-info"><h4><span style={{color: '#A3AED0'}}>#{p.tokenNumber}</span> {p.name}</h4><p><FiPhone /> {maskMobileNumber(p.mobileNumber)}</p></div><div className="flow-actions"><button className="circle-btn edit-btn" onClick={() => triggerEditModal(p._id, p.name, p.tokenNumber, p.mobileNumber)}><FiEdit2 /></button><button className="circle-btn del-btn" onClick={() => triggerDeleteModal(p._id, p.tokenNumber)}><FiTrash2 /></button></div></div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* ALL MODALS */}
      <BeautifulModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', tokenNumber: '' })} title="Patient Hataayein?" icon="🗑️"><p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>Kya aap Token <b>#{deleteModal.tokenNumber}</b> ko permanently hatana chahte hain?</p><div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}><button onClick={() => setDeleteModal({ isOpen: false, id: '', tokenNumber: '' })} style={styles.modalCancelBtn}>Cancel</button><button onClick={executeAdminDelete} style={styles.modalDeleteBtn}>Delete Karein</button></div></BeautifulModal>
      <BeautifulModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' })} title="Patient Details Edit" icon="✏️"><form onSubmit={executeAdminEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><div><label style={styles.modalInputLabel}>Patient Name</label><input type="text" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} required style={styles.modalInputField} /></div><div><label style={styles.modalInputLabel}>Mobile Number</label><input type="tel" maxLength="10" value={editModal.mobileNumber} onChange={(e) => setEditModal({ ...editModal, mobileNumber: e.target.value.replace(/\D/g, '') })} required style={styles.modalInputField} /></div><div><label style={styles.modalInputLabel}>Token Number</label><input type="number" value={editModal.tokenNumber} onChange={(e) => setEditModal({ ...editModal, tokenNumber: e.target.value })} required style={styles.modalInputField} /></div><div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}><button type="button" onClick={() => setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' })} style={styles.modalCancelBtn}>Cancel</button><button type="submit" style={styles.modalSaveBtn}>Save Changes</button></div></form></BeautifulModal>
      <BeautifulModal isOpen={resetModal.isOpen} onClose={() => setResetModal({ isOpen: false, password: '' })} title="🚨 DANGER ZONE: System Reset" icon="🔒"><form onSubmit={executeSystemReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}><p style={{ margin: 0, color: '#C62828', fontSize: '14px', padding: '10px', backgroundColor: '#FFEBEE', borderRadius: '8px' }}>⚠️ WARNING: Is action se poori line saaf ho jayegi.</p><div><label style={styles.modalInputLabel}>Confirm Admin Password</label><input type="password" placeholder="••••••••" value={resetModal.password} onChange={(e) => setResetModal({ ...resetModal, password: e.target.value })} required style={styles.modalInputField} /></div><div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}><button type="button" onClick={() => setResetModal({ isOpen: false, password: '' })} style={styles.modalCancelBtn}>Cancel</button><button type="submit" style={{ ...styles.modalDeleteBtn, backgroundColor: '#D32F2F' }}>Confirm Wipe ♻️</button></div></form></BeautifulModal>
    </div>
  );
}

// 4. MAIN APP ROUTER
function App() {
  const [currentLiveToken, setCurrentLiveToken] = useState(1);
  const [totalTokensDistributed, setTotalTokensDistributed] = useState(0); 
  const [patients, setPatients] = useState([]);
  const [initialLoad, setInitialLoad] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [adminUser, setAdminUser] = useState(localStorage.getItem('username'));
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: 'System Info', icon: 'ℹ️' });

  useEffect(() => {
    socket.on('queue-updated', (data) => { setCurrentLiveToken(data.currentToken); setTotalTokensDistributed(data.totalTokensDistributed || 0); setPatients(data.patients); setInitialLoad(true); });
    socket.on('reset-status-response', (res) => { setAlertModal({ isOpen: true, title: res.success ? 'Success' : 'Access Denied', icon: res.success ? '✅' : '❌', message: res.message }); });
    return () => { socket.off('queue-updated'); socket.off('reset-status-response'); };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PatientView currentLiveToken={currentLiveToken} patients={patients} initialLoad={initialLoad} />} />
        <Route path="/checkin" element={<PatientCheckin />} />
        <Route path="/admin" element={authToken ? <AdminPanel currentLiveToken={currentLiveToken} totalTokensDistributed={totalTokensDistributed} patients={patients} username={adminUser} onLogout={() => { localStorage.clear(); setAuthToken(null); window.location.reload(); }} /> : <Auth onLoginSuccess={(user) => { setAuthToken(localStorage.getItem('token')); setAdminUser(user); }} />} />
      </Routes>
      <BeautifulModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title} icon={alertModal.icon}><p style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '15px', textAlign: 'center', fontWeight: '500' }}>{alertModal.message}</p><div style={{ display: 'flex', justifyContent: 'center' }}><button onClick={() => setAlertModal({ ...alertModal, isOpen: false })} style={{ ...styles.modalSaveBtn, padding: '8px 30px' }}>OK</button></div></BeautifulModal>
    </Router>
  );
}

// 🎨 INLINE STYLES FOR NEW PREMIUM UI
const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 41, 66, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: '16px', width: '90%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(15, 34, 58, 0.15)', border: '1px solid #E2E8F0' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0F2942', margin: 0 },
  modalCloseX: { background: 'none', border: 'none', fontSize: '24px', color: '#94A3B8', cursor: 'pointer' },
  modalBody: { padding: '20px' },
  modalCancelBtn: { padding: '9px 18px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  modalDeleteBtn: { padding: '9px 18px', backgroundColor: '#DC3545', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  modalSaveBtn: { padding: '9px 22px', backgroundColor: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  modalInputLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  modalInputField: { width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' },
  
  // 🔥 PATIENT UI PREMIUM STYLES 🔥
  patientPageWrapper: { 
    background: "linear-gradient(rgba(244, 247, 254, 0.85), rgba(244, 247, 254, 0.95)), url('bg-photo.png') no-repeat center center", 
    backgroundSize: 'cover', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' 
  },
  patientAppContainer: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', 
    borderRadius: '24px', width: '100%', maxWidth: '420px', height: '95vh', 
    padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', 
    gap: '15px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
  },
  patientBrandHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' },
  patientBlueCrossIcon: { backgroundColor: '#E1ECF9', color: '#1A73E8', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  
  patientWelcomeCard: { backgroundColor: '#F0F5FF', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientWelcomeTitle: { fontSize: '18px', fontWeight: '800', color: '#0F2942', margin: 0 },
  
  patientMyTokenCard: { 
    background: 'linear-gradient(to bottom, #FFFFFF 70%, #F0F5FF 100%)', 
    borderRadius: '20px', padding: '25px 20px', textAlign: 'center', 
    boxShadow: '0 10px 25px rgba(10, 66, 155, 0.05)', border: '1px solid #E2E8F0', position: 'relative' 
  },
  dotsLeft: { position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', fontSize: '24px', letterSpacing: '4px', writingMode: 'vertical-lr' },
  dotsRight: { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#CBD5E1', fontSize: '24px', letterSpacing: '4px', writingMode: 'vertical-lr' },
  
  patientNowServingCard: { 
    background: "linear-gradient(to right, #0A429B 45%, rgba(10,66,155,0.7)), url('/serving-photo.png') no-repeat right center", 
    backgroundSize: 'cover', borderRadius: '16px', padding: '20px 24px', color: '#FFFFFF', 
    display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 25px rgba(10,66,155,0.25)' 
  },
  patientServingCardGreen: { 
    background: "linear-gradient(to right, #10B981 45%, rgba(16,185,129,0.7)), url('/serving-photo.png') no-repeat right center", 
    backgroundSize: 'cover', borderRadius: '16px', padding: '20px 24px', color: '#FFFFFF', 
    display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 25px rgba(16,185,129,0.35)' 
  },
  patientServingIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },
  
  patientTimerCard: { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' },
  patientTimerIconBox: { backgroundColor: '#E6F8F0', padding: '12px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  
  patientLeaveBtnClean: { 
    backgroundColor: '#FFFFFF', color: '#DC3545', border: '1.5px solid #DC3545', 
    borderRadius: '12px', padding: '12px', fontWeight: '700', fontSize: '14px', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', 
    cursor: 'pointer', transition: '0.2s', width: '100%' 
  }
};

export default App;