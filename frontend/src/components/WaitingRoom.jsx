import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FiCheckCircle, FiChevronRight, FiClock, FiTrash2, FiShield, FiCheck } from 'react-icons/fi';
import BeautifulModal from './PopupAlert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

export default function PatientView({ currentLiveToken, patients, initialLoad }) {
  const patientId = localStorage.getItem('patientId');
  const myTokenFromStorage = localStorage.getItem('myToken');
  
  const me = patients.find(p => Number(p.tokenNumber) === Number(myTokenFromStorage));
  const myToken = me ? me.tokenNumber : myTokenFromStorage;
  const rawName = me ? (me.patientName || me.name) : localStorage.getItem('patientName') || "Patient";
  const patientName = rawName.split(' ')[0]; 
  
  const currentLivePatient = patients.find(p => Number(p.tokenNumber) === Number(currentLiveToken));
  
  const patientsAhead = Math.max(0, parseInt(myToken || 0) - currentLiveToken);
  const isMyTurn = myToken && parseInt(myToken) === currentLiveToken;
  
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [deletedAlertOpen, setDeletedAlertOpen] = useState(false); 
  const [leaveSuccessOpen, setLeaveSuccessOpen] = useState(false); 
  const [isSelfDeleting, setIsSelfDeleting] = useState(false); 
  const [timeLeftInSeconds, setTimeLeftInSeconds] = useState(0);
  
  const maskMobileNumber = (mobile) => {
    if (!mobile || mobile === "Walk-In Parchi") return "Walk-In";
    const mobStr = String(mobile);
    if (mobStr.length < 4) return mobStr;
    return `XXXXXX${mobStr.slice(-4)}`;
  };

  const formatTime = (dateStr) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    if(isNaN(d)) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    if (initialLoad && myTokenFromStorage && !isSelfDeleting) {
      const isStillInQueue = patients.some(p => Number(p.tokenNumber) === Number(myTokenFromStorage));
      if (!isStillInQueue) {
        setDeletedAlertOpen(true);
      }
    }
  }, [patients, initialLoad, myTokenFromStorage, isSelfDeleting]);

  const handleDeletedAlertClose = () => {
    setDeletedAlertOpen(false);
    localStorage.clear();
    window.location.href = '/checkin';
  };

  const handleLeaveSuccessClose = () => {
    setLeaveSuccessOpen(false);
    localStorage.clear();
    window.location.href = '/checkin';
  };

  useEffect(() => {
    if (patientsAhead <= 0) {
      setTimeLeftInSeconds(0);
      return;
    }
    let savedPatientsAhead = parseInt(localStorage.getItem('savedPatientsAhead'));
    let targetTime = parseInt(localStorage.getItem('targetTime'));
    let savedMyToken = localStorage.getItem('savedMyToken');
    const now = Date.now();

    if (savedMyToken !== String(myToken) || isNaN(savedPatientsAhead) || isNaN(targetTime) || targetTime < now) {
      targetTime = now + (patientsAhead * 15 * 60 * 1000); 
      localStorage.setItem('savedMyToken', String(myToken));
      localStorage.setItem('savedPatientsAhead', String(patientsAhead));
      localStorage.setItem('targetTime', String(targetTime));
    } else if (patientsAhead !== savedPatientsAhead) {
      const diff = savedPatientsAhead - patientsAhead; 
      targetTime = targetTime - (diff * 15 * 60 * 1000); 
      if (targetTime < now) targetTime = now + (patientsAhead * 15 * 60 * 1000);
      localStorage.setItem('savedPatientsAhead', String(patientsAhead));
      localStorage.setItem('targetTime', String(targetTime));
    }

    const updateTimer = () => {
      const currentTime = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - currentTime) / 1000));
      setTimeLeftInSeconds(remaining);
    };

    updateTimer(); 
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId); 
  }, [patientsAhead, myToken]);

  const hours = Math.floor(timeLeftInSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((timeLeftInSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (timeLeftInSeconds % 60).toString().padStart(2, '0');

  useEffect(() => {
    if (isMyTurn && initialLoad) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (freq, time, duration) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + time);
          gain.gain.setValueAtTime(0.5, audioCtx.currentTime + time);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + time + duration);
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + time); osc.stop(audioCtx.currentTime + time + duration);
        };
        playBeep(600, 0, 0.2); playBeep(800, 0.3, 0.4);
      } catch (err) {}
    }
  }, [isMyTurn, initialLoad]);

  const executeLeaveQueue = async () => {
    setIsSelfDeleting(true); 
    try { 
      await fetch(`${BACKEND_URL}/api/auth/patient-leave`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenToRemove: myToken }) 
      }); 
    } catch (err) {}
    
    setIsLeaveModalOpen(false); 
    setLeaveSuccessOpen(true); 
  };

  if (!localStorage.getItem('myToken')) return <Navigate to="/checkin" />;

  return (
    <div style={styles.patientPageWrapper}>
      <div className="blurred-plate" style={{ ...styles.patientContainer, border: isMyTurn ? '3px solid #10B981' : 'none', boxShadow: isMyTurn ? '0 0 30px rgba(16, 185, 129, 0.4)' : '0 10px 30px rgba(0,0,0,0.06)' }}>
        
        <div style={styles.header}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{position: 'relative'}}>
                   <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                     <circle cx="20" cy="20" r="16" fill="#1D4ED8" />
                     <path d="M20 10v20M10 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
                     <path d="M30 36 c-3 0-5-2-5-4s2-5 5-7c3 2 5 5 5 7s-2 4-5 4z" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round"/>
                   </svg>
                </div>
                <div style={{marginTop: '-2px'}}>
                  <div style={{fontWeight:800, fontSize:13, color: '#0F2942', letterSpacing: '-0.3px'}}>SmartQueue</div>
                  <div style={{fontSize:9, color:'#64748B', fontWeight:600, marginTop: '-2px'}}>Waiting Room</div>
                </div>
            </div>
            
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M10 3h4v18h-4z" fill="#1D4ED8"/>
                <path d="M3 10h18v4h-18z" fill="#1D4ED8"/>
                <rect x="14" y="14" width="4" height="4" fill="#60A5FA"/>
              </svg>
              <div style={{textAlign:'left'}}>
                  <div style={{fontWeight:800, fontSize:12, color: '#1E3A8A', lineHeight: 1.1}}>CityCare</div>
                  <div style={{fontSize:7, color:'#1E3A8A', fontWeight:700, letterSpacing: '1px'}}>HOSPITAL</div>
              </div>
            </div>
        </div>

        <div style={styles.uiWelcomeCard}>
            <div style={{flex: 1, zIndex: 2, paddingRight: '55px'}}>
              <div style={styles.uiWelcomeTitle}>Namaste, {patientName}!</div>
              <div style={styles.uiWelcomeLine}></div>
              <div style={styles.uiWelcomeSub}>Hum aapki behtar seva ke liye taiyaar hain.</div>
            </div>
            <div style={styles.uiWelcomeGraphic}>
               <img src="/images/namaste.png" alt="Namaste" style={{ width: '65px', height: '65px', objectFit: 'contain' }} />
            </div>
        </div>

        <div style={styles.uiTokenCard}>
            <div style={styles.uiDotPatternLeft}></div><div style={styles.uiDotPatternRight}></div>
            <div style={styles.uiTokenHeader}><div style={styles.uiTokenDash}></div><span>Aapka Token No.</span><div style={styles.uiTokenDash}></div></div>
            <div style={styles.uiTokenNumber}>{myToken || '--'}</div>
            <div style={styles.uiTokenBottomDash}></div>
            
            {me && me.createdAt && (
              <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                <FiClock size={11} color="#1D4ED8" /> Generated at: {formatTime(me.createdAt)}
              </div>
            )}
        </div>

        {isMyTurn ? (
          <div style={{ backgroundColor: '#10B981', color: 'white', borderRadius: '14px', padding: '14px', textAlign: 'center', animation: 'pulse 2s infinite', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}>
            <FiCheckCircle size={32} style={{ marginBottom: '6px' }} />
            <div style={{ fontSize: 18, fontWeight: 900 }}>Aapki Baari Hai!</div>
            <div style={{ fontSize: 11, marginTop: '2px', opacity: 0.9 }}>Kripya Doctor ke cabin mein pravesh karein.</div>
          </div>
        ) : (
          <>
            <div style={styles.uiServingCard}>
                <div style={styles.uiServingIconBox}>
                   <img src="/images/doctor.png" alt="Doctor" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                </div>
                <div style={{ zIndex: 2 }}>
                    <div style={styles.uiServingBadge}><span style={styles.uiPulseDot}></span> Now Serving</div>
                    
                    <div style={styles.uiServingNumber}>{currentLiveToken || 0}</div>
                    
                    {currentLivePatient ? (
                      <div style={{ fontSize: '11px', opacity: 0.95, fontWeight: '600', marginTop: '1px', letterSpacing: '0.3px' }}>
                        {currentLivePatient.patientName || currentLivePatient.name || "Patient"} • {maskMobileNumber(currentLivePatient.mobileNumber)}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', opacity: 0.95, fontWeight: '600', marginTop: '1px', letterSpacing: '0.3px' }}>
                        Proessing o
                      </div>
                    )}
                </div>
                <div style={styles.uiServingOverlay}></div>
            </div>

            <div style={styles.uiWaitCard}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={styles.uiWaitIconBox}>
                        <img src="/images/people.png" alt="People Waiting" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={styles.uiWaitTitle}>Aapke aage <span style={{color: '#16A34A', fontSize: 15}}>{patientsAhead}</span> patients aur hain.</div>
                        <div style={styles.uiWaitSub}>Hum koshish kar rahe hain ki aapka number jaldi aaye.</div>
                    </div>
                </div>
                <FiChevronRight size={18} color="#94A3B8" />
            </div>

            <div style={styles.uiTimerCard}>
                 <div style={styles.uiTimerIconBox}>
                     <img src="/images/hourglass.png" alt="Hourglass" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                 </div>
                 <div style={{ zIndex: 2 }}>
                    <div style={styles.uiTimerTitle}>Aapka Number Kab Aayega?</div>
                    <div style={styles.uiTimerSub}>Estimated Waiting Time</div>
                    <div style={styles.uiTimerClock}>{hours}:{minutes}:{seconds}</div>
                    <div style={styles.uiTimerFormat}>HH : MM : SS</div>
                 </div>
                 <FiClock style={styles.uiTimerWatermark} />
            </div>
          </>
        )}

        <button onClick={() => setIsLeaveModalOpen(true)} className="leave-btn" style={styles.uiLeaveBtn}>
            <FiTrash2 size={13} /> Leave Queue (Token Delete Karein)
        </button>

        {/* 👇 Yahan Shield ke andar FiCheck (tick) icon laga diya gaya hai */}
        <div style={styles.uiFooter}>
          <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiShield size={13} color="#3B82F6" />
            <FiCheck size={7} color="#FFFFFF" style={{ position: 'absolute', fontWeight: 'bold' }} />
          </span> 
          Aapka data surakshit hai. Dhanyavaad!
        </div>
      </div>
      
      <BeautifulModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Queue Chhodein?" icon="⚠️">
        <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '15px', textAlign: 'center' }}>
          Kya aap sach mein apna token delete karke line se bahar jana chahte hain?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button onClick={() => setIsLeaveModalOpen(false)} style={styles.modalCancelBtn}>Cancel</button>
          <button onClick={executeLeaveQueue} style={styles.modalDeleteBtn}>Ha, Chhodein</button>
        </div>
      </BeautifulModal>

      <BeautifulModal isOpen={leaveSuccessOpen} onClose={handleLeaveSuccessClose} title="Token Deleted" icon="✅">
        <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '15px', textAlign: 'center', fontWeight: '500' }}>
          Aapka token safaltapurvak delete ho gaya hai. Ab aap line mein nahi hain.
        </p>
        <button onClick={handleLeaveSuccessClose} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#10B981', color: '#FFFFFF', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
          Theek Hai
        </button>
      </BeautifulModal>

      <BeautifulModal isOpen={deletedAlertOpen} onClose={handleDeletedAlertClose} title="Token Cancelled" icon="🚨">
        <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '15px', textAlign: 'center', fontWeight: '500' }}>
          Aapka token Admin dwara cancel/delete kar diya gaya hai ya line Reset hui hai. Kripya naya Token lein.
        </p>
        <button onClick={handleDeletedAlertClose} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#EF4444', color: '#FFFFFF', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
          Naya Token Lein
        </button>
      </BeautifulModal>

      <style>{`
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } } 
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        
        .leave-btn {
          transition: all 0.2s ease !important;
        }
        
        .leave-btn:active {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.7) !important;
          background-color: #FEF2F2 !important;
          transform: scale(0.97) !important;
        }
        
        .blurred-plate {
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        
        .blurred-plate::before {
          content: "";
          position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px; 
          background: url('/images/plate-bg.png') center/cover no-repeat;
          filter: blur(1px); 
          z-index: -2;
        }
        
        .blurred-plate::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;

          background: linear-gradient(
            to bottom, 
            rgba(255, 255, 255, 0.98) 0%,   
            rgba(255, 255, 255, 0.98) 18%,  
            rgba(255, 255, 255, 0.15) 35%,  
            rgba(255, 255, 255, 0.15) 75%,  
            rgba(255, 255, 255, 0.98) 88%,  
            rgba(255, 255, 255, 0.98) 100%  
          );
          z-index: -1;
        }
      `}</style>
    </div>
    
  );
  
}

const styles = {
  patientPageWrapper: { background: "url('/images/bg.png') no-repeat center center", backgroundSize: 'cover', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
  patientContainer: { 
      backdropFilter: 'blur(10px)', 
      borderRadius: '20px', 
      width: '100%', 
      maxWidth: '380px', 
      minHeight: '550px', 
      padding: '20px 18px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px', 
      transition: 'all 0.5s ease', 
      boxSizing: 'border-box', 
      margin: 'auto' 
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', padding: '0 2px' },
  
  uiWelcomeCard: { background: '#EBF5FF', borderRadius: '14px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiWelcomeTitle: { fontSize: '18px', fontWeight: '800', color: '#1E3A8A', letterSpacing: '-0.3px' },
  uiWelcomeLine: { width: '24px', height: '2.5px', backgroundColor: '#10B981', borderRadius: '2px', margin: '2px 0 2px 0' },
  uiWelcomeSub: { fontSize: '12px', color: '#475569', fontWeight: '500', lineHeight: 1.2 },
  uiWelcomeGraphic: { position: 'absolute', right: '10px', bottom: '-4px', zIndex: 1 },
  
  uiTokenCard: { backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '6px 12px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.06)' },
  uiDotPatternLeft: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '40px', backgroundImage: 'radial-gradient(circle, #CBD5E1 2px, transparent 2.5px)', backgroundSize: '8px 8px' },
  uiDotPatternRight: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '40px', backgroundImage: 'radial-gradient(circle, #CBD5E1 2px, transparent 2.5px)', backgroundSize: '8px 8px' },
  uiTokenHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#1E3A8A' },
  uiTokenDash: { width: '18px', height: '1px', backgroundColor: '#93C5FD' },
  uiTokenNumber: { fontSize: '85px', fontWeight: '700', color: '#1D4ED8', lineHeight: '0.9', margin: '2px 0 4px 0', letterSpacing: '-2px' },
  uiTokenBottomDash: { width: '20px', height: '2.5px', backgroundColor: '#10B981', borderRadius: '2px', margin: '0 auto' },
  
  uiServingCard: { background: 'linear-gradient(90deg, #1E3A8A 0%, #1D4ED8 100%)', borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', color: '#FFFFFF', boxShadow: '0 10px 22px rgba(29, 78, 216, 0.25)' },
  uiServingIconBox: { backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  uiServingBadge: { background: '#10B981', color: '#FFFFFF', borderRadius: '8px', padding: '4px 12px', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px', marginBottom: '1px' },
  uiPulseDot: { width: '8px', height: '8px', backgroundColor: '#FFFFFF', borderRadius: '50%', animation: 'blink 1.5s infinite' },
  uiServingNumber: { fontSize: '45px', fontWeight: '550', lineHeight: 1, marginBottom: '1px' },
  uiServingText: { fontSize: '8.5px', opacity: 0.9, fontWeight: '500' },
  uiServingOverlay: { 
      position: 'absolute', 
      right: 0, 
      top: 0, 
      bottom: 0, 
      width: '40%', 
      background: "url('/images/serving.png') left center/cover no-repeat", 
      opacity: 0.9, 
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)', 
      maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
      zIndex: 1 
  },
  
  uiWaitCard: { backgroundColor: '#F0FDF4', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCFCE7', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiWaitIconBox: { backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  uiWaitTitle: { fontSize: '14px', fontWeight: '550', color: '#0F2942', marginBottom: '5px' },
  uiWaitSub: { fontSize: '10px', color: '#475569', fontWeight: '500', lineHeight: 1.2 },
  
  uiTimerCard: { backgroundColor: '#EFF6FF', borderRadius: '14px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiTimerIconBox: { backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  uiTimerWatermark: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '60px', color: '#93C5FD', opacity: 0.2, zIndex: 1 },
  uiTimerTitle: { fontSize: '12px', fontWeight: '800', color: '#1E3A8A', marginBottom: '3px' },
  uiTimerSub: { fontSize: '10x', color: '#64748B', fontWeight: '600', marginBottom: '3px' },
  uiTimerClock: { fontSize: '24px', fontWeight: '800', color: '#1D4ED8', letterSpacing: '1px', lineHeight: 1 },
  uiTimerFormat: { fontSize: '7.5px', color: '#64748B', fontWeight: '700', letterSpacing: '5.5px', marginTop: '3px', textAlign: 'left' },
  
  uiLeaveBtn: { border: '1.5px solid #EF4444', backgroundColor: '#FFFFFF', color: '#EF4444', padding: '8px', borderRadius: '10px', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)' },
  uiFooter: { textAlign: 'center', fontSize: '8.5px', color: '#64748B', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' },
  modalCancelBtn: { flex: 1, padding: '12px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' },
  modalDeleteBtn: { flex: 1, padding: '12px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }
};