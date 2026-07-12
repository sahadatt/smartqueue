import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import Auth from './components/Auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
const socket = io(BACKEND_URL);

// Helper function to mask mobile number (e.g., XXXXXX8737)
const maskMobileNumber = (mobile) => {
  if (!mobile || mobile === "Walk-In Parchi") return "Walk-In Parchi";
  if (mobile.length < 4) return mobile;
  return `XXXXXX${mobile.slice(-4)}`;
};

// ==========================================
// 💡 0. REUSABLE ULTRA-PREMIUM MODERN MODAL DIALOG COMPONENT
// ==========================================
function BeautifulModal({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContainer}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>{icon || '🔔'}</span>
            <h3 style={styles.modalTitle}>{title}</h3>
          </div>
          <button onClick={onClose} style={styles.modalCloseX}>&times;</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

// ==========================================
// 1. 👥 PREMIUM PATIENT WAIT ROOM (SOUND & GREEN ALERT INCLUDED)
// ==========================================
function PatientView({ currentLiveToken, patients, initialLoad }) {
  const patientId = localStorage.getItem('patientId');
  const me = patients.find(p => p._id === patientId);
  const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const myToken = me ? me.tokenNumber : localStorage.getItem('myToken');
  const patientName = me ? me.name : localStorage.getItem('patientName') || "Patient";

  // Check if it's currently this patient's turn
  const isMyTurn = myToken && parseInt(myToken) === currentLiveToken;

  // Find who is currently being served for display purposes
  const currentServingPatient = patients.find(p => p.tokenNumber === currentLiveToken);

  // 🔊 AUDIO SOUND AUTOMATION LAYER
  useEffect(() => {
    if (isMyTurn && initialLoad) {
      try {
        // Generate a professional synthetic clinic chime bell sound dynamically
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // First Note
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
        gain1.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.4);

        // Second Note (Slightly delayed for chime effect)
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
          gain2.gain.setValueAtTime(0.5, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        }, 150);

      } catch (err) {
        console.error("Audio block play restriction:", err);
      }
    }
  }, [isMyTurn, currentLiveToken, initialLoad]);

  // Absolute Timestamp Method for Countdown
  useEffect(() => {
    if (myToken) {
      const tokenDiff = parseInt(myToken) - currentLiveToken;
      const patientsAhead = tokenDiff > 0 ? tokenDiff : 0;
      
      const storageKey = `queue_target_timestamp_${myToken}_${currentLiveToken}`;
      let targetTimestamp = localStorage.getItem(storageKey);
      
      if (!targetTimestamp) {
        targetTimestamp = Date.now() + (patientsAhead * 15 * 60 * 1000);
        localStorage.setItem(storageKey, targetTimestamp);
      }
      
      const updateCountdownClock = () => {
        const remainingTime = Math.max(0, Math.floor((parseInt(targetTimestamp) - Date.now()) / 1000));
        setTimeLeftInSeconds(remainingTime);
      };

      updateCountdownClock(); 
      const intervalId = setInterval(updateCountdownClock, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [myToken, currentLiveToken]);

  const formatTimer = (totalSeconds) => {
    if (totalSeconds <= 0) return { h: "00", m: "00", s: "00" };
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { h: String(hours).padStart(2, '0'), m: String(minutes).padStart(2, '0'), s: String(seconds).padStart(2, '0') };
  };

  const executeLeaveQueue = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/patient-leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenToRemove: myToken })
      });
    } catch (err) { console.error(err); }
    localStorage.clear();
    window.location.reload();
  };

  if (initialLoad && patientId && !me && localStorage.getItem('myToken')) {
    return (
      <div style={styles.patientPageWrapper}>
        <div style={{ ...styles.patientAppContainer, justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '20px', padding: '30px' }}>
          <div style={{ fontSize: '64px' }}>⚠️</div>
          <h2 style={{ color: '#DC3545', margin: 0, fontWeight: '800' }}>Token Delete Kar Diya Gya Hai</h2>
          <p style={{ color: '#566A7F', fontSize: '14px', margin: 0 }}>
            Admin ya Doctor dwara aapka token queue se hata diya gaya hai.
          </p>
          <button onClick={() => { localStorage.clear(); window.location.href = '/checkin'; }} style={{ ...styles.patientLeaveButton, backgroundColor: '#1A73E8', color: '#FFFFFF', border: 'none', padding: '12px 24px', fontSize: '15px' }}>
            Naya Token Generate Karein 🎫
          </button>
        </div>
      </div>
    );
  }

  if (!localStorage.getItem('myToken')) return <Navigate to="/checkin" />;

  const tokenDiff = parseInt(myToken) - currentLiveToken;
  const patientsAhead = tokenDiff > 0 ? tokenDiff : 0;
  const timerObj = formatTimer(timeLeftInSeconds);

  return (
    <div style={styles.patientPageWrapper}>
      <div style={styles.patientAppContainer}>
        <div style={styles.patientBrandHeader}>
          <div style={styles.patientLeftBrand}><div style={styles.patientBlueCrossIcon}>✚</div><div><div style={styles.patientMainBrandText}>SmartQueue</div></div></div>
          <div style={styles.patientRightBrand}><div style={styles.patientHospitalLogo}>✚</div><div><div style={styles.patientHospitalName}>CityCare</div></div></div>
        </div>
        <div style={styles.patientWelcomeCard}>
          <div><h2 style={styles.patientWelcomeTitle}>Namaste, {patientName}!</h2></div>
          <div style={styles.patientNamasteAvatar}>🙏</div>
        </div>
        <div style={styles.patientMyTokenCard}>
          <div><div style={styles.patientMyTokenLabel}>Aapka Token No.</div><div style={styles.patientHugeMyToken}>{myToken}</div></div>
        </div>

        {/* 🟢 DYNAMIC ALERT BANNER SYSTEM FOR NOW SERVING CARD */}
        <div style={isMyTurn ? styles.patientServingCardGreen : styles.patientNowServingCard}>
          <div style={styles.patientServingLeft}>
            <div style={styles.patientServingBadge}>🔘 {isMyTurn ? "Aapki Baari Hai" : "Now Serving"}</div>
            
            {isMyTurn ? (
              <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '10px', lineHeight: '1.4' }}>
                Aapka number aa gaya jaiye! 🟢
              </div>
            ) : (
              <>
                <div style={styles.patientHugeLiveToken}>{currentLiveToken}</div>
                {currentServingPatient && (
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', fontWeight: '500' }}>
                    Patient: {currentServingPatient.name} ({maskMobileNumber(currentServingPatient.mobileNumber)})
                  </div>
                )}
              </>
            )}
          </div>
          <div style={styles.patientServingRightIcon}>{isMyTurn ? '🙋‍♂️' : '🩺'}</div>
        </div>

        <div style={styles.patientCombinedTimerCard}>
          <div style={styles.patientTimerTopRow}><div>Aapke aage <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>{patientsAhead} patients</span> aur hain.</div></div>
          <div style={styles.patientDottedDivider}></div>
          <div style={styles.patientTimerBottomRow}><div>Aapka Time:</div><div style={styles.patientTimeDigits}>{timerObj.h}:{timerObj.m}:{timerObj.s}</div></div>
        </div>
        <button onClick={() => setIsLeaveModalOpen(true)} style={styles.patientLeaveButton}>🗑️ Leave Queue</button>
      </div>

      <BeautifulModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Queue Chhodein?" icon="⚠️">
        <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>Kya aap sach me queue chhodna chahte hain? Aapka token number delete ho jayega.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => setIsLeaveModalOpen(false)} style={styles.modalCancelBtn}>Cancel</button>
          <button onClick={executeLeaveQueue} style={styles.modalDeleteBtn}>Ha, Chhodein</button>
        </div>
      </BeautifulModal>
    </div>
  );
}

// ==========================================
// 2. 📲 PATIENT QR CHECK-IN VIEW
// ==========================================
function PatientCheckin() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleGetToken = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;
    if (mobile.trim().length < 10) {
      alert("❌ Kripya sahi 10-digit mobile number darj karein!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: name, mobileNumber: mobile.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('myToken', data.myToken);
        localStorage.setItem('patientName', data.patientName);
        localStorage.setItem('patientId', data.patientId); 
        setRedirect(true);
      }
    } catch (err) { alert("Server error!"); }
    setLoading(false);
  };

  if (redirect || localStorage.getItem('myToken')) return <Navigate to="/" />;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxSizing: 'border-box', width: '340px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <h2 style={{ color: '#0F2942', margin: '0 0 20px 0', textAlign: 'center' }}>🏥 Clinic Check-in</h2>
        <form onSubmit={handleGetToken} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.modalInputLabel}>Full Name</label>
            <input type="text" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={styles.modalInputLabel}>Mobile Number</label>
            <input type="tel" maxLength="10" placeholder="Enter 10-Digit Mobile No" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#1A73E8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px' }}>
            {loading ? "Alloting..." : "Get Token Number 🎫"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. 👨‍⚕️ ULTRA PREMIUM ADMIN PANEL DASHBOARD
// ==========================================
function AdminPanel({ currentLiveToken, totalTokensDistributed, patients, username, onLogout }) {
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

  const triggerDeleteModal = (id, tokenNumber) => {
    setDeleteModal({ isOpen: true, id, tokenNumber });
  };

  const executeAdminDelete = () => {
    socket.emit('admin-delete-patient', { id: deleteModal.id });
    setDeleteModal({ isOpen: false, id: '', tokenNumber: '' });
  };

  const triggerEditModal = (id, name, tokenNumber, mobileNumber) => {
    setEditModal({ isOpen: true, id, name, tokenNumber, mobileNumber: mobileNumber || '' });
  };

  const executeAdminEdit = (e) => {
    e.preventDefault();
    socket.emit('admin-edit-patient', {
      id: editModal.id,
      newName: editModal.name.trim(),
      newTokenNumber: editModal.tokenNumber,
      newMobileNumber: editModal.mobileNumber.trim()
    });
    setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' });
  };

  const executeSystemReset = (e) => {
    e.preventDefault();
    if (!resetModal.password.trim()) return;
    socket.emit('reset-entire-queue', { username, password: resetModal.password.trim() });
    setResetModal({ isOpen: false, password: '' });
    setGeneratedParchi(null);
  };

  const handleManualCheckin = async (e) => {
    e.preventDefault();
    if (!walkInName.trim()) return;
    const phoneToSubmit = walkInMobile.trim() || "Walk-In Parchi";

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: walkInName, mobileNumber: phoneToSubmit })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedParchi({ token: data.myToken, name: data.patientName });
        setWalkInName('');
        setWalkInMobile('');
      }
    } catch (err) { alert("Error!"); }
  };

  return (
    <div style={styles.adminContainer}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarBranding}><div style={styles.sidebarLogoIcon}>✚</div><div><div style={styles.sidebarLogoMain}>SmartQueue</div></div></div>
        <div style={styles.sidebarMenu}><div style={{...styles.sidebarItem, ...styles.activeSidebarItem}}>📊 Dashboard</div></div>
        <div style={styles.quickActionsContainer}>
          <div style={styles.quickActionsTitle}>Quick Actions</div>
          <button style={styles.quickActionBtn} onClick={() => window.open('/checkin', '_blank')}>➕ Issue New Token</button>
          <button disabled={isNextDisabled} style={{...styles.quickActionBtn, opacity: isNextDisabled ? 0.5 : 1, cursor: isNextDisabled ? 'not-allowed' : 'pointer'}} onClick={() => socket.emit('next-patient')}>🔊 Call Next Patient</button>
          <button style={{...styles.quickActionBtn, backgroundColor: '#FFF5F5', color: '#DC3545', borderColor: '#FFC1C1'}} onClick={() => setResetModal({ isOpen: true, password: '' })}>⚠️ Reset Entire Queue</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        <div style={styles.topNavBar}>
          <div style={{fontWeight: 'bold'}}>📊 Dashboard</div>
          <div>CityCare HOSPITAL</div>
          <div style={styles.adminProfileSection}><span>Dr. {username}</span><button onClick={onLogout} style={styles.logoutBtn}>Logout</button></div>
        </div>

        {/* METRICS ROW */}
        <div style={styles.statsRow}>
          <div onClick={() => setActiveFilter('all')} style={{...styles.statCard, ...(activeFilter === 'all' ? styles.selectedCardBlue : {})}}><div style={styles.statIconBlue}>👥</div><div style={styles.statLabel}>Total Tokens Today</div><div style={styles.statValue}>{totalTokensToday}</div><div style={styles.clickHint}>Click to View All {activeFilter === 'all' && '●'}</div></div>
          <div onClick={() => setActiveFilter('completed')} style={{...styles.statCard, ...(activeFilter === 'completed' ? styles.selectedCardGreen : {})}}><div style={styles.statIconGreen}>📋</div><div style={styles.statLabel}>Completed</div><div style={styles.statValue}>{completedCount}</div><div style={styles.clickHint}>Click to View Visited {activeFilter === 'completed' && '●'}</div></div>
          <div onClick={() => setActiveFilter('progress')} style={{...styles.statCard, ...(activeFilter === 'progress' ? styles.selectedCardAmber : {})}}><div style={styles.statIconAmber}>🕒</div><div style={styles.statLabel}>In Progress</div><div style={styles.statValue}>{inProgressCount}</div><div style={styles.clickHint}>Click to View Active {activeFilter === 'progress' && '●'}</div></div>
          <div onClick={() => setActiveFilter('remaining')} style={{...styles.statCard, ...(activeFilter === 'remaining' ? styles.selectedCardPurple : {})}}><div style={styles.statIconPurple}>⏳</div><div style={styles.statLabel}>Remaining</div><div style={styles.statValue}>{remainingCount}</div><div style={styles.clickHint}>Click to View Queue {activeFilter === 'remaining' && '●'}</div></div>
        </div>

        {/* WORKSPACE LAYOUT */}
        <div style={styles.workspaceGrid}>
          <div style={styles.leftControlStack}>
            <div style={styles.innerBoxCard}>
              <div style={styles.cardHeaderTitle}>Live Counter Status</div>
              <div style={styles.giantCounterDisplay}>{currentLiveToken}</div>
              <div style={styles.actionBtnGroup}>
                <button onClick={() => socket.emit('previous-patient')} disabled={currentLiveToken <= 1} style={styles.prevBtn}>← Previous</button>
                <button onClick={() => socket.emit('next-patient')} disabled={isNextDisabled} style={{...styles.nextBtn, backgroundColor: isNextDisabled ? '#CBD5E1' : '#28A745', cursor: isNextDisabled ? 'not-allowed' : 'pointer', opacity: isNextDisabled ? 0.7 : 1 }}>Next Patient →</button>
              </div>
            </div>

            <div style={styles.innerBoxCard}>
              <div style={styles.cardHeaderTitle}>Manual Parchi Window</div>
              <form onSubmit={handleManualCheckin} style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <input type="text" placeholder="Patient Name" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} required style={styles.parchiInput} />
                <input type="tel" maxLength="10" placeholder="Mobile Number (Optional)" value={walkInMobile} onChange={(e) => setWalkInMobile(e.target.value.replace(/\D/g, ''))} style={styles.parchiInput} />
                <button type="submit" style={{...styles.parchiSubmitBtn, padding: '10px'}}>Issue Parchi Token 🎫</button>
              </form>
              {generatedParchi && <div style={styles.parchiReceiptView}><div>#{generatedParchi.token}</div><div>{generatedParchi.name}</div></div>}
            </div>
          </div>

          <div style={styles.flowBoardContainer}>
            <div style={styles.flowBoardHeader}><div style={styles.cardHeaderTitle}>📋 Live Patient Flow Board <span style={styles.filterModeBadge}>Showing: {activeFilter.toUpperCase()}</span></div></div>
            
            {/* AREA 1 */}
            {(activeFilter === 'all' || activeFilter === 'completed') && (
              <>
                <div style={{fontSize: '11px', fontWeight: 'bold', margin: '5px 0', color: '#10B981'}}>✅ RECENTLY VISITED</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px'}}>
                  {visitedPatients.length === 0 ? <div style={{fontSize: '12px', color: '#999', fontStyle: 'italic'}}>No visited history yet</div> : visitedPatients.map(p => (
                    <div key={p._id} style={styles.visitedListItem}>
                      <div style={{textAlign: 'left'}}>
                        <span style={{fontSize: '14.5px'}}><b>#{p.tokenNumber}</b> {p.name}</span>
                        <div style={{fontSize: '11px', color: '#64748B', marginTop: '2px'}}>📞 {maskMobileNumber(p.mobileNumber)}</div>
                      </div>
                      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                        <span onClick={() => triggerEditModal(p._id, p.name, p.tokenNumber, p.mobileNumber)} style={styles.crudIconBtn}>✏️</span>
                        <span onClick={() => triggerDeleteModal(p._id, p.tokenNumber)} style={styles.crudIconBtn}>🗑️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* AREA 2: ADMIN CURRENTLY IN CONSULTATION BLOCK (MASKED PHONE SYSTEM) */}
            {(activeFilter === 'all' || activeFilter === 'progress') && (
              <>
                <div style={styles.frozenHeaderIndicator}>🟢 CURRENTLY IN CONSULTATION</div>
                <div style={styles.gradientConsultationBlock}>
                  {currentConsultingPatient ? (
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                      <div style={{textAlign: 'left'}}>
                        <div style={styles.consultingNameText}>{currentConsultingPatient.name}</div>
                        {/* ✅ MASKED TO LAST 4 DIGITS FOR PRIVACY */}
                        <div style={styles.consultingTokenText}>Token: #{currentConsultingPatient.tokenNumber} | 📞 {maskMobileNumber(currentConsultingPatient.mobileNumber)}</div>
                      </div>
                      <div style={{display: 'flex', gap: '15px', fontSize: '20px', color: '#FFFFFF'}}>
                        <span onClick={() => triggerEditModal(currentConsultingPatient._id, currentConsultingPatient.name, currentConsultingPatient.tokenNumber, currentConsultingPatient.mobileNumber)} style={{cursor:'pointer'}}>✏️</span>
                        <span onClick={() => triggerDeleteModal(currentConsultingPatient._id, currentConsultingPatient.tokenNumber)} style={{cursor:'pointer'}}>🗑️</span>
                      </div>
                    </div>
                  ) : <div style={styles.consultingNameText}>Counter Empty</div>}
                </div>
              </>
            )}

            {/* AREA 3 */}
            {(activeFilter === 'all' || activeFilter === 'remaining') && (
              <>
                <div style={{fontSize: '11px', fontWeight: 'bold', margin: '15px 0 5px 0', color: '#0A429B'}}>⏳ NEXT IN LINE (WAITING)</div>
                <div style={styles.queueFlowListStack}>
                  {waitingPatients.length === 0 ? <div style={{fontSize: '12px', color: '#999', padding: '10px'}}>Line khali hai!</div> : waitingPatients.map((p, idx) => (
                    <div key={p._id} style={idx === 0 ? styles.flowListItemFirst : styles.flowListItem}>
                      <div style={{textAlign: 'left'}}>
                        <span style={{fontSize: '14.5px'}}><b>#{p.tokenNumber}</b> {p.name}</span>
                        <div style={{fontSize: '11px', color: idx === 0 ? '#1E3A8A' : '#64748B', marginTop: '2px'}}>📞 {maskMobileNumber(p.mobileNumber)}</div>
                      </div>
                      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                        <span onClick={() => triggerEditModal(p._id, p.name, p.tokenNumber, p.mobileNumber)} style={styles.crudIconBtn}>✏️</span>
                        <span onClick={() => triggerDeleteModal(p._id, p.tokenNumber)} style={styles.crudIconBtn}>🗑️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: DELETE CONFIRMATION */}
      <BeautifulModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', tokenNumber: '' })} title="Patient Hataayein?" icon="🗑️">
        <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '15px' }}>Kya aap Token <b>#{deleteModal.tokenNumber}</b> ko permanently hatana chahte hain?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => setDeleteModal({ isOpen: false, id: '', tokenNumber: '' })} style={styles.modalCancelBtn}>Cancel</button>
          <button onClick={executeAdminDelete} style={styles.modalDeleteBtn}>Delete Karein</button>
        </div>
      </BeautifulModal>

      {/* MODAL 2: EDIT FULL DETAILS */}
      <BeautifulModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' })} title="Patient Details Edit" icon="✏️">
        <form onSubmit={executeAdminEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.modalInputLabel}>Patient Name</label>
            <input type="text" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} required style={styles.modalInputField} />
          </div>
          <div>
            <label style={styles.modalInputLabel}>Mobile Number</label>
            <input type="tel" maxLength="10" value={editModal.mobileNumber} onChange={(e) => setEditModal({ ...editModal, mobileNumber: e.target.value.replace(/\D/g, '') })} required style={styles.modalInputField} />
          </div>
          <div>
            <label style={styles.modalInputLabel}>Token Number</label>
            <input type="number" value={editModal.tokenNumber} onChange={(e) => setEditModal({ ...editModal, tokenNumber: e.target.value })} required style={styles.modalInputField} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={() => setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' })} style={styles.modalCancelBtn}>Cancel</button>
            <button type="submit" style={styles.modalSaveBtn}>Save Changes</button>
          </div>
        </form>
      </BeautifulModal>

      {/* MODAL 3: SYSTEM RESET */}
      <BeautifulModal isOpen={resetModal.isOpen} onClose={() => setResetModal({ isOpen: false, password: '' })} title="🚨 DANGER ZONE: System Reset" icon="🔒">
        <form onSubmit={executeSystemReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, color: '#C62828', fontSize: '14px', padding: '10px', backgroundColor: '#FFEBEE', borderRadius: '8px' }}>⚠️ WARNING: Is action se poori line saaf ho jayegi aur counter wapas Token 1 par chala jayega. Kripya Admin Password likhein:</p>
          <div>
            <label style={styles.modalInputLabel}>Confirm Admin Password</label>
            <input type="password" placeholder="••••••••" value={resetModal.password} onChange={(e) => setResetModal({ ...resetModal, password: e.target.value })} required style={styles.modalInputField} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={() => setResetModal({ isOpen: false, password: '' })} style={styles.modalCancelBtn}>Cancel</button>
            <button type="submit" style={{ ...styles.modalDeleteBtn, backgroundColor: '#D32F2F' }}>Confirm Wipe ♻️</button>
          </div>
        </form>
      </BeautifulModal>
    </div>
  );
}

// ==========================================
// 4. 🌐 MAIN APPMANAGER MASTER CORE
// ==========================================
function App() {
  const [currentLiveToken, setCurrentLiveToken] = useState(1);
  const [totalTokensDistributed, setTotalTokensDistributed] = useState(0); 
  const [patients, setPatients] = useState([]);
  const [initialLoad, setInitialLoad] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [adminUser, setAdminUser] = useState(localStorage.getItem('username'));
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: 'System Info', icon: 'ℹ️' });

  useEffect(() => {
    socket.on('queue-updated', (data) => {
      setCurrentLiveToken(data.currentToken);
      setTotalTokensDistributed(data.totalTokensDistributed || 0); 
      setPatients(data.patients);
      setInitialLoad(true);
    });

    socket.on('reset-status-response', (res) => {
       const isSuccess = res.success;
       setAlertModal({
         isOpen: true,
         title: isSuccess ? 'Success' : 'Access Denied',
         icon: isSuccess ? '✅' : '❌',
         message: res.message
       });
    });

    return () => {
      socket.off('queue-updated');
      socket.off('reset-status-response');
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PatientView currentLiveToken={currentLiveToken} patients={patients} initialLoad={initialLoad} />} />
        <Route path="/checkin" element={<PatientCheckin />} />
        <Route path="/admin" element={authToken ? <AdminPanel currentLiveToken={currentLiveToken} totalTokensDistributed={totalTokensDistributed} patients={patients} username={adminUser} onLogout={() => { localStorage.clear(); setAuthToken(null); window.location.reload(); }} /> : <Auth onLoginSuccess={(user) => { setAuthToken(localStorage.getItem('token')); setAdminUser(user); }} />} />
      </Routes>

      <BeautifulModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title} icon={alertModal.icon}>
        <p style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '15px', textAlign: 'center', fontWeight: '500' }}>{alertModal.message}</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setAlertModal({ ...alertModal, isOpen: false })} style={{ ...styles.modalSaveBtn, padding: '8px 30px' }}>OK</button>
        </div>
      </BeautifulModal>
    </Router>
  );
}

const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 41, 66, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: '16px', width: '90%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(15, 34, 58, 0.15)', border: '1px solid #E2E8F0', overflow: 'hidden', boxSizing: 'border-box' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' },
  modalTitle: { fontSize: '16px', fontWeight: '700', color: '#0F2942', margin: 0 },
  modalCloseX: { background: 'none', border: 'none', fontSize: '24px', color: '#94A3B8', cursor: 'pointer', padding: 0, lineHeight: 1 },
  modalBody: { padding: '20px', boxSizing: 'border-box' },
  modalCancelBtn: { padding: '9px 18px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  modalDeleteBtn: { padding: '9px 18px', backgroundColor: '#DC3545', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  modalSaveBtn: { padding: '9px 22px', backgroundColor: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  modalInputLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px', textAlign: 'left' },
  modalInputField: { width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },

  adminContainer: { display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  sidebarBranding: { display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' },
  sidebarLogoIcon: { backgroundColor: '#E1ECF9', color: '#1A73E8', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  sidebarLogoMain: { fontSize: '16px', fontWeight: 'bold', color: '#0F2942' },
  sidebarMenu: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '15px' },
  sidebarItem: { padding: '9px 12px', borderRadius: '8px', color: '#475569', fontSize: '13.5px', cursor: 'pointer', textAlign: 'left' },
  activeSidebarItem: { backgroundColor: '#E1ECF9', color: '#1A73E8', fontWeight: 'bold' },
  quickActionsContainer: { marginTop: '15px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  quickActionsTitle: { fontSize: '11px', fontWeight: 'bold', color: '#1A73E8', textTransform: 'uppercase', textAlign: 'left' },
  quickActionBtn: { width: '100%', padding: '7px 10px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: '500' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 25px', boxSizing: 'border-box', overflowY: 'auto' },
  topNavBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 24px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' },
  adminProfileSection: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoutBtn: { padding: '5px 12px', backgroundColor: '#DC3545', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px', marginBottom: '20px' },
  statCard: { backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.2s' },
  statIconBlue: { color: '#1A73E8', fontSize: '18px' }, statIconGreen: { color: '#10B981', fontSize: '18px' }, statIconAmber: { color: '#F59E0B', fontSize: '18px' }, statIconPurple: { color: '#7C3AED', fontSize: '18px' },
  statLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  statValue: { fontSize: '26px', fontWeight: '800', color: '#0F2942', marginTop: '2px' },
  clickHint: { fontSize: '9px', color: '#94A3B8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' },
  selectedCardBlue: { borderColor: '#1A73E8', boxShadow: '0 0 10px rgba(26,115,232,0.15)', transform: 'scale(1.02)' },
  selectedCardGreen: { borderColor: '#10B981', boxShadow: '0 0 10px rgba(16,185,129,0.15)', transform: 'scale(1.02)' },
  selectedCardAmber: { borderColor: '#F59E0B', boxShadow: '0 0 10px rgba(245,158,11,0.15)', transform: 'scale(1.02)' },
  selectedCardPurple: { borderColor: '#7C3AED', boxShadow: '0 0 10px rgba(124,58,237,0.15)', transform: 'scale(1.02)' },
  filterModeBadge: { fontSize: '11px', backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '12px', marginLeft: '12px', fontWeight: 'bold' },
  
  workspaceGrid: { display: 'grid', gridTemplateColumns: '1.25fr 1.35fr', gap: '20px', alignItems: 'start' },
  leftControlStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  innerBoxCard: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' },
  cardHeaderTitle: { fontSize: '15px', fontWeight: '700', color: '#0F2942', textAlign: 'left' },
  giantCounterDisplay: { fontSize: '64px', fontWeight: '900', color: '#28A745', margin: '10px 0' },
  actionBtnGroup: { display: 'flex', gap: '12px' },
  prevBtn: { flex: 1, padding: '10px', backgroundColor: '#64748B', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  nextBtn: { flex: 1, padding: '10px', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' },
  parchiForm: { display: 'flex', gap: '10px', marginTop: '12px' },
  parchiInput: { width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', outline: 'none' },
  parchiSubmitBtn: { backgroundColor: '#1A73E8', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  parchiReceiptView: { marginTop: '12px', padding: '10px', backgroundColor: '#FFF9E6', border: '1px dashed #FFE0B2', borderRadius: '8px' },
  flowBoardContainer: { backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0' },
  flowBoardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  activePillBadge: { fontSize: '12px', backgroundColor: '#E1ECF9', color: '#1A73E8', padding: '4px 12px', borderRadius: '20px' },
  crudIconBtn: { cursor: 'pointer', fontSize: '12px' },
  visitedListItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: '8px', alignItems: 'center' },
  frozenHeaderIndicator: { fontSize: '10px', fontWeight: '900', color: '#2E7D32', textAlign: 'left', marginBottom: '6px' },
  
  gradientConsultationBlock: { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '12px', padding: '10px 18px', color: '#FFFFFF', textAlign: 'center', marginBottom: '15px' },
  consultingNameText: { fontSize: '26px', fontWeight: '800' },
  consultingTokenText: { fontSize: '13px', opacity: 0.9 },
  
  queueFlowListStack: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto', paddingRight: '6px' },
  
  flowListItemFirst: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#E1ECF9', border: '1px solid #CBD5E1', borderRadius: '8px', alignItems: 'center' },
  flowListItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', alignItems: 'center' },
  
  patientPageWrapper: { backgroundColor: '#EEF3F7', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  patientAppContainer: { backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '420px', height: '95vh', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  patientBrandHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F0F4F8', paddingBottom: '8px' },
  patientLeftBrand: { display: 'flex', gap: '6px', alignItems: 'center' },
  patientBlueCrossIcon: { backgroundColor: '#E1ECF9', color: '#1A73E8', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  patientWelcomeCard: { backgroundColor: '#E8F1FC', borderRadius: '14px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' },
  patientMyTokenCard: { border: '1px solid #E6EEF5', borderRadius: '16px', padding: '15px', textAlign: 'center' },
  patientMyTokenLabel: { fontSize: '14px', color: '#64748B', fontWeight: '600' },
  patientHugeMyToken: { fontSize: '56px', fontWeight: '800', color: '#0A429B', margin: '5px 0' },
  
  // Base blue banner layout
  patientNowServingCard: { background: 'linear-gradient(135deg, #0A429B 0%, #1A73E8 100%)', borderRadius: '16px', padding: '14px 20px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.3s ease' },
  
  // ✅ NEW INTERACTIVE GREEN CARD STATE FOR MATCHED SESSIONS
  patientServingCardGreen: { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '16px', padding: '14px 20px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(16,185,129,0.35)', animation: 'pulseGreen 2s infinite', transition: 'background 0.3s ease' },
  
  patientServingLeft: { textAlign: 'left' },
  patientServingBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginBottom: '4px' },
  patientHugeLiveToken: { fontSize: '48px', fontWeight: '800', lineHeight: 1 },
  patientServingRightIcon: { fontSize: '36px', opacity: 0.3 },
  patientCombinedTimerCard: { border: '1px solid #E6EEF5', borderRadius: '18px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
  patientTimerTopRow: { fontSize: '14.5px', color: '#1E293B', fontWeight: '500' },
  patientDottedDivider: { borderTop: '1px dashed #E2E8F0', margin: '4px 0' },
  patientTimerBottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientTimeDigits: { fontSize: '26px', fontWeight: '800', color: '#28a745', fontFamily: 'monospace' },
  patientLeaveButton: { border: '1.5px solid #EF9A9A', color: '#C62828', borderRadius: '12px', padding: '11px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' }
};

export default App;