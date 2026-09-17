import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FiCheckCircle, FiChevronRight, FiClock, FiTrash2, FiXCircle, FiCoffee, FiBriefcase, FiAlertTriangle, FiGlobe } from 'react-icons/fi';
import BeautifulModal from './PopupAlert';

// 🚀 यहाँ हमने नया टाइमर इंजन इम्पोर्ट किया है
import { useQueueTimer } from './useQueueTimer'; 

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

const translations = {
  // ... (यहाँ आपके पुराने translation object को वैसे का वैसा ही रहने दें, मैंने जगह बचाने के लिए इसे यहाँ छोटा कर दिया है)
  en: {
    consultationRoom: "Waiting Room", welcome: "Welcome", subWelcome: "Track your live queue status below", assignedToken: "Assigned Token Number", issuedAt: "Issued at", readyTitle: "Ready for Consultation", readySub: "Please proceed to the doctor's cabin.", notStartedTitle: "Doctor is not available yet", notStartedSub: "Session has not started. Please wait for the doctor to begin.", servingBadge: "Currently Consulting", waitingTitle: "Patients Ahead", timerTitle: "Estimated Consultation Time", proceedCabin: "Please proceed to cabin", calculating: "CALCULATING...", waitTime: "WAIT TIME", cancelToken: "Cancel Token", secureText: "Secured & Encrypted", doneTitle: "Thank You! 🙏", doneText: "Your consultation has been successfully completed.", newCheckin: "Done / New Check-in", syncing: "Syncing with server...", modalCancelTitle: "Cancel Token Request", modalCancelText: "Are you sure?", goBack: "Go Back", confirmCancel: "Confirm Cancellation", modalResetTitle: "Token Invalidated", modalResetText: "The queue has been reset.", newToken: "Generate New Token", toastSuccess: "Token successfully deleted!"
  },
  hi: {
    consultationRoom: "वेटिंग रूम", welcome: "नमस्ते", subWelcome: "अपनी लाइन की लाइव स्थिति यहाँ देखें", assignedToken: "आपका टोकन नंबर", issuedAt: "टोकन मिलने का समय", readyTitle: "आपकी बारी आ गई है!", readySub: "कृपया अंदर डॉक्टर के पास जाएं।", notStartedTitle: "डॉक्टर अभी नहीं आए हैं", notStartedSub: "क्लीनिक अभी शुरू नहीं हुआ है।", servingBadge: "अभी इनका नंबर है", waitingTitle: "लाइन में आपके आगे मरीज", aheadText: "लोग बाकी हैं", timerTitle: "डॉक्टर से मिलने का अनुमानित समय", proceedCabin: "कृपया अंदर जाएं", calculating: "समय तय हो रहा है...", waitTime: "लगभग इंतज़ार", cancelToken: "टोकन कैंसिल करें", secureText: "पूरी तरह सुरक्षित", doneTitle: "धन्यवाद! 🙏", doneText: "आपका काम पूरा हो गया है।", newCheckin: "नया टोकन लें", syncing: "डेटा लोड हो रहा है...", modalCancelTitle: "टोकन कैंसिल करना", modalCancelText: "क्या आप वाकई कैंसिल करना चाहते हैं?", goBack: "वापस जाएं", confirmCancel: "हाँ, कैंसिल करें", modalResetTitle: "टोकन रीसेट हो गया है", modalResetText: "लाइन फिर से शुरू हुई है।", newToken: "नया टोकन बनाएं", toastSuccess: "टोकन कैंसिल कर दिया गया है!"
  }
};

const PatientView = ({ currentLiveToken, patients, initialLoad, socket }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');
  const t = translations[lang];

  const toggleLanguage = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const myTokenFromStorage = localStorage.getItem('myToken');
  const me = patients.find(p => Number(p.tokenNumber) === Number(myTokenFromStorage));
  const myToken = me ? me.tokenNumber : myTokenFromStorage;
  const rawName = me ? (me.patientName || me.name) : localStorage.getItem('patientName') || "Patient";
  const patientName = rawName.split(' ')[0]; 
  
  const safeLiveToken = currentLiveToken !== undefined && currentLiveToken !== null ? Number(currentLiveToken) : 0;
  const currentLivePatient = patients.find(p => Number(p.tokenNumber) === safeLiveToken);
  
  const patientsAhead = safeLiveToken === 0 
    ? Math.max(0, parseInt(myToken || 0) - 1) 
    : Math.max(0, parseInt(myToken || 0) - safeLiveToken);
  
  const isMyTurn = myToken && parseInt(myToken) === safeLiveToken;
  const isTurnCompleted = myToken && safeLiveToken > Number(myToken);
  
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [deletedAlertOpen, setDeletedAlertOpen] = useState(false); 
  const [isSelfDeleting, setIsSelfDeleting] = useState(false); 
  const [isExiting, setIsExiting] = useState(false); 
  
  const [realStatus, setRealStatus] = useState('loading');
  const [expectedStartTime, setExpectedStartTime] = useState(''); 
  const [timePerPatient, setTimePerPatient] = useState(5); 

  const [clinicName, setClinicName] = useState('CityCare Hospital');
  const [doctorName, setDoctorName] = useState('Dr. Sahadat Ansari');
  const [clinicLogo, setClinicLogo] = useState('');

  // 🚀 यहाँ हमने आपका कस्टम हुक कॉल किया है (इंजन स्टार्ट!)
  const { 
    displayStatus, 
    formattedCountdown, 
    arrivalTimeFormatted, 
    clearTimerCache 
  } = useQueueTimer({
    myToken, safeLiveToken, patientsAhead, expectedStartTime, timePerPatient, realStatus, isMyTurn, isTurnCompleted, lang
  });

  useEffect(() => {
    const fetchClinicProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/admin-profile`);
        const data = await res.json();
        if (res.ok && data) {
          if (data.clinicName) setClinicName(data.clinicName);
          if (data.doctorName) setDoctorName(data.doctorName); 
          if (data.profileImage) setClinicLogo(data.profileImage); 
        }
      } catch (err) {}
    };
    fetchClinicProfile();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = (data) => {
      if (data.expectedStartTime !== undefined) setExpectedStartTime(data.expectedStartTime || '');
      if (data.clinicStatus) setRealStatus(data.clinicStatus);
      if (data.timePerPatient) setTimePerPatient(data.timePerPatient);
    };
    socket.on('queue-updated', handleQueueUpdate);
    return () => socket.off('queue-updated', handleQueueUpdate);
  }, [socket]);

  useEffect(() => {
    const fetchClinicStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/clinic-status`);
        const data = await res.json();
        if (data && data.status) {
          setRealStatus(data.status);
          setExpectedStartTime(data.expectedStartTime || ''); 
          if (data.timePerPatient) setTimePerPatient(data.timePerPatient); 
        }
      } catch (err) {
        if(realStatus === 'loading') setRealStatus('active'); 
      }
    };
    fetchClinicStatus(); 
    const statusInterval = setInterval(fetchClinicStatus, 2000); 
    return () => clearInterval(statusInterval);
  }, [realStatus]);

  // 🚀 LIVE QUEUE RESET DETECTOR
  useEffect(() => {
    if (!myTokenFromStorage || isSelfDeleting || isTurnCompleted) return;
    if (patients && patients.length > 0) {
      const isStillInQueue = patients.some(p => Number(p.tokenNumber) === Number(myTokenFromStorage));
      if (!isStillInQueue) setDeletedAlertOpen(true);
    }
  }, [patients, myTokenFromStorage, isSelfDeleting, isTurnCompleted]);

  const formatExpectedTime = (timeStr) => {
    if(!timeStr) return '';
    let [hours, rest] = timeStr.split(':');
    if(!hours || !rest) return timeStr; 
    let hrs = parseInt(hours, 10);
    let mins = parseInt(rest, 10);
    if (timeStr.toLowerCase().includes('pm') && hrs < 12) hrs += 12;
    if (timeStr.toLowerCase().includes('am') && hrs === 12) hrs = 0;
    const d = new Date();
    d.setHours(hrs, mins, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getExpectedDisplayText = (str) => {
    if (!str) return '';
    const lower = str.toLowerCase();
    if (lower.includes('shortly') || lower.includes('delay')) return str; 
    if (str.includes(':')) return `${lang === 'hi' ? 'समय' : 'Expected Start'}: ${formatExpectedTime(str)}`;
    return str;
  };

  const formatTime = (dateStr) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    if(isNaN(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const maskMobileNumber = (mobile) => {
    if (!mobile || mobile === "Walk-In Parchi") return "Walk-In";
    const mobStr = String(mobile);
    if (mobStr.length < 4) return mobStr;
    return `XXXXXX${mobStr.slice(-4)}`;
  };

  const getPauseReasonDetails = (status) => {
    switch (status) {
      case 'lunch': return { text: lang === 'hi' ? 'डॉक्टर लंच ब्रेक पर हैं' : "Doctor is on Lunch Break", icon: <FiCoffee size={28} color="#D97706" />, bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' };
      case 'meeting': return { text: lang === 'hi' ? 'डॉक्टर मीटिंग में हैं' : "Doctor is in a Meeting", icon: <FiBriefcase size={28} color="#2563EB" />, bg: '#E0E7FF', border: '#BFDBFE', color: '#1D4ED8' };
      case 'busy': return { text: lang === 'hi' ? 'डॉक्टर अभी व्यस्त हैं' : "Doctor is Busy / Paused", icon: <FiAlertTriangle size={28} color="#DC2626" />, bg: '#FEE2E2', border: '#FECACA', color: '#B91C1C' };
      default: return { text: lang === 'hi' ? 'क्लीनिक थोड़ी देर के लिए रुका है' : "Session is Paused", icon: <FiAlertTriangle size={28} color="#D97706" />, bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' };
    }
  };

  const navigateToCheckin = () => {
    setIsExiting(true); 
    clearTimerCache(); // 🚀 Clear cache on exit
    setTimeout(() => {
      localStorage.clear();
      window.location.href = '/checkin';
    }, 400); 
  };

  const handleDeletedAlertClose = () => { 
    setDeletedAlertOpen(false); 
    navigateToCheckin(); 
  };

  useEffect(() => {
    if (isMyTurn && initialLoad) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (freq, time, duration) => {
          const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
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
      await fetch(`${BACKEND_URL}/api/auth/patient-leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenToRemove: myToken }) }); 
    } catch (err) {}
    setIsLeaveModalOpen(false); 
    
    toast.custom((tItem) => (
      <div style={{
        opacity: tItem.visible ? 1 : 0, 
        transform: tItem.visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', alignItems: 'center', gap: '10px', 
        background: '#F0FDF4', color: '#0F172A', border: '1.5px solid #10B981', 
        padding: '12px 24px', borderRadius: '30px', 
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
        fontSize: '14px', maxWidth: '95vw'
      }}>
        <span style={{ color: '#065F46', fontWeight: 'bold' }}>✓</span> 
        <span style={{ color: '#CBD5E1' }}>|</span>
        <span style={{ fontWeight: '700' }}>{t.toastSuccess}</span>
      </div>
    ), { position: 'top-center', duration: 3000 });

    setTimeout(() => {
      navigateToCheckin();
    }, 2800);
  };

  if (!localStorage.getItem('myToken')) return <Navigate to="/checkin" />;

  return (
    <div className="page-wrapper">
      <Toaster position="top-center" containerStyle={{ zIndex: 999999999, top: 15 }} />

      <style>{`
        /* SAME CSS STYLES AS BEFORE */
        .page-wrapper { background: url('/images/bg.webp') no-repeat center center; background-size: cover; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 10px; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
        .app-card { backdrop-filter: blur(10px); border-radius: 20px; width: 100%; max-width: 360px; min-height: 500px; padding: 20px 18px; display: flex; flex-direction: column; gap: 4px; transition: all 0.5s ease; box-sizing: border-box; margin: auto; }
        @media (max-width: 600px) { .page-wrapper { padding: 0; align-items: flex-end; } .app-card { max-width: 100%; margin: 0; border-radius: 40px 40px 0 0; padding: 25px 20px 20px 20px; min-height: 82vh; } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } } 
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } } 
        @keyframes modalBoxPop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes overlayFade { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes pageEntranceAnim { 0% { opacity: 0; transform: translateY(25px) scale(0.94); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .page-entrance-card { animation: pageEntranceAnim 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes pageExitAnim { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(40px) scale(0.9); } }
        .page-exit-card { animation: pageExitAnim 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important; }
        div[style*="position: fixed"]:has(h2), div[style*="position:fixed"]:has(h2) { animation: overlayFade 0.3s ease forwards; }
        div[style*="position: fixed"] > div:not([class]), div[style*="position:fixed"] > div:not([class]), div[style*="position: fixed"] > div > div:only-child, div[style*="position:fixed"] > div > div:only-child { animation: modalBoxPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInSlide { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animated-thankyou { animation: fadeInSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .leave-btn { transition: all 0.2s ease !important; } 
        .leave-btn:active { box-shadow: 0 0 20px rgba(239, 68, 68, 0.7) !important; background-color: #FEF2F2 !important; transform: scale(0.97) !important; } 
        .blurred-plate { position: relative; z-index: 1; overflow: hidden; } 
        .blurred-plate::before { content: ""; position: absolute; top: -15px; left: -15px; right: -15px; bottom: -15px; background: url('/images/plate-bg.webp') center/cover no-repeat; filter: blur(1px); z-index: -2; } 
        .blurred-plate::after { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient( to bottom, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.98) 18%, rgba(255, 255, 255, 0.15) 35%, rgba(255, 255, 255, 0.15) 75%, rgba(255, 255, 255, 0.98) 88%, rgba(255, 255, 255, 0.98) 100% ); z-index: -1; }
      `}</style>

      <div 
        className={`blurred-plate app-card page-entrance-card ${isExiting ? 'page-exit-card' : ''}`} 
        style={{ border: isMyTurn ? '3px solid #10B981' : 'none', boxShadow: isMyTurn ? '0 0 30px rgba(16, 185, 129, 0.4)' : '0 10px 30px rgba(0,0,0,0.06)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#334155' }}>
            <FiGlobe size={12} color="#2563EB" />
            <select value={lang} onChange={toggleLanguage} style={{ background: 'transparent', border: 'none', outline: 'none', fontWeight: '700', fontSize: '11px', color: '#1E3A8A', cursor: 'pointer' }}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>

        <div style={styles.header}>
            <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
              <div style={{width: '42px', height: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0}}>
                <img src={clinicLogo || "/images/hospital-logo.png"} alt="Hospital Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/1055/1055673.png" }} />
              </div>
              <div style={{textAlign:'left', maxWidth: '120px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                <div style={{ fontWeight: 900, fontSize: clinicName.length > 15 ? '10px' : '11.5px', background: 'linear-gradient(90deg, #1E3A8A, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.2px', wordWrap: 'break-word', textAlign: 'left' }}>
                  {clinicName}
                </div>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'8px', textAlign: 'right'}}>
                <div style={{marginTop: '-2px'}}>
                  <div style={{fontWeight:900, fontSize:'13.5px', color: '#0F172A', letterSpacing: '-0.3px'}}>{doctorName}</div>
                  <div style={{fontSize:'8px', color:'#3B82F6', fontWeight:700, marginTop: '-1px', letterSpacing: '0.4px', textTransform: 'uppercase'}}>{t.consultationRoom}</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #BFDBFE', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
            </div>
        </div>

        <div style={styles.uiWelcomeCard}>
            <div style={{flex: 1, zIndex: 2, paddingRight: '55px'}}>
              <div style={styles.uiWelcomeTitle}>{t.welcome}, {patientName}</div>
              <div style={styles.uiWelcomeLine}></div>
              <div style={styles.uiWelcomeSub}>{t.subWelcome}</div>
            </div>
            <div style={styles.uiWelcomeGraphic}><img src="/images/namaste.webp" alt="Namaste" style={{ width: '65px', height: '65px', objectFit: 'contain' }} /></div>
        </div>

        {isTurnCompleted ? (
          <div className="animated-thankyou" style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #10B981', borderRadius: '14px', padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.15)', margin: '10px 0' }}>
            <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCheckCircle size={32} color="#059669" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#065F46' }}>{t.doneTitle}</div>
            <div style={{ fontSize: '12.5px', color: '#047857', fontWeight: '500', lineHeight: 1.5 }}>{t.doneText}</div>
            <button onClick={navigateToCheckin} style={{ marginTop: '12px', width: '100%', padding: '12px', border: 'none', borderRadius: '10px', backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>{t.newCheckin}</button>
          </div>
        ) : (
          <>
            <div style={styles.uiTokenCard}>
                <div style={styles.uiDotPatternLeft}></div><div style={styles.uiDotPatternRight}></div>
                <div style={styles.uiTokenHeader}><div style={styles.uiTokenDash}></div><span>{t.assignedToken}</span><div style={styles.uiTokenDash}></div></div>
                <div style={styles.uiTokenNumber}>{myToken || '--'}</div>
                <div style={styles.uiTokenBottomDash}></div>
                {me && me.createdAt && (
                  <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '700', marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={11} color="#1D4ED8" /> {t.issuedAt}: {formatTime(me.createdAt)}
                  </div>
                )}
            </div>

            {isMyTurn ? (
              <div style={{ backgroundColor: '#10B981', color: 'white', borderRadius: '14px', padding: '14px', textAlign: 'center', animation: 'pulse 2s infinite', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}>
                <FiCheckCircle size={32} style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: 18, fontWeight: 900 }}>{t.readyTitle}</div>
                <div style={{ fontSize: 11, marginTop: '2px', opacity: 0.9 }}>{t.readySub}</div>
              </div>
            ) : (
              <>
                {displayStatus === 'loading' || !initialLoad ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: 'bold' }}>{t.syncing} ⏳</div>
                ) : displayStatus === 'not-started' ? (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '14px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiXCircle size={22} color="#EF4444" /></div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#991B1B' }}>{t.notStartedTitle}</div>
                    <div style={{ fontSize: '11.5px', color: '#B91C1C', fontWeight: '500' }}>{t.notStartedSub}</div>
                    {expectedStartTime && (
                      <div style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px dashed #F87171', color: '#B91C1C', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)' }}>
                        <FiClock size={14} /> {getExpectedDisplayText(expectedStartTime)}
                      </div>
                    )}
                  </div>
                ) : displayStatus !== 'active' ? (
                  (() => {
                    const reason = getPauseReasonDetails(displayStatus);
                    return (
                      <div style={{ backgroundColor: reason.bg, border: `1px solid ${reason.border}`, borderRadius: '14px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' }}>
                        {reason.icon}
                        <div style={{ fontSize: '14px', fontWeight: '800', color: reason.color }}>{reason.text}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '500' }}>{lang === 'hi' ? 'लाइन थोड़ी देर के लिए रुकी है।' : 'Queue operations are temporarily paused.'}</div>
                      </div>
                    );
                  })()
                ) : (
                  <div style={styles.uiServingCard}>
                      <div style={styles.uiServingIconBox}><img src="/images/doctor.webp" alt="Doctor" style={{ width: '55px', height: '55px', objectFit: 'contain' }} /></div>
                      <div style={{ zIndex: 2 }}>
                          <div style={styles.uiServingBadge}><span style={styles.uiPulseDot}></span> {t.servingBadge}</div>
                          <div style={styles.uiServingNumber}>{currentLiveToken || 0}</div>
                          {currentLivePatient ? (
                            <div style={{ fontSize: '11px', opacity: 0.95, fontWeight: '600', marginTop: '1px', letterSpacing: '0.3px' }}>{currentLivePatient.patientName || currentLivePatient.name || "Patient"} • {maskMobileNumber(currentLivePatient.mobileNumber)}</div>
                          ) : (
                            <div style={{ fontSize: '11px', opacity: 0.95, fontWeight: '600', marginTop: '1px', letterSpacing: '0.3px' }}>{lang === 'hi' ? 'रोगी की जानकारी आ रही है...' : 'Awaiting patient details...'}</div>
                          )}
                      </div>
                      <div style={styles.uiServingOverlay}></div>
                  </div>
                )}

                <div style={styles.uiWaitCard}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={styles.uiWaitIconBox}><img src="/images/people.webp" alt="People Waiting" style={{ width: '42px', height: '42px', objectFit: 'contain' }} /></div>
                        <div><div style={styles.uiWaitTitle}>{t.waitingTitle}: <span style={{color: '#16A34A', fontSize: 16, fontWeight: '800'}}>{patientsAhead > 0 ? patientsAhead : 0}</span> {t.aheadText}</div></div>
                    </div>
                    <FiChevronRight size={18} color="#94A3B8" />
                </div>

                <div style={styles.uiTimerCard}>
                     <div style={styles.uiTimerIconBox}><img src="/images/hourglass.webp" alt="Hourglass" style={{ width: '42px', height: '42px', objectFit: 'contain' }} /></div>
                     <div style={{ zIndex: 2 }}>
                        <div style={styles.uiTimerTitle}>{t.timerTitle}</div>
                        
                        {/* 🚀 यहाँ से कस्टम हुक का डेटा आ रहा है */}
                        <div style={styles.uiTimerClock}>{arrivalTimeFormatted}</div>
                        <div style={styles.uiTimerFormat}>
                          {isMyTurn ? t.proceedCabin : displayStatus === 'loading' || !initialLoad ? t.calculating : `${t.waitTime} ~ ${formattedCountdown}`}
                        </div>

                     </div>
                     <FiClock style={styles.uiTimerWatermark} />
                </div>
              </>
            )}
            <div style={{ flexGrow: 1 }}></div>
            <button onClick={() => setIsLeaveModalOpen(true)} className="leave-btn" style={styles.uiLeaveBtn}><FiTrash2 size={13} /> {t.cancelToken}</button>
          </>
        )}
        <div style={styles.uiFooter}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
          {t.secureText}
        </div>
      </div>
      
      <BeautifulModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title={t.modalCancelTitle} icon="⚠️">
        <div>
          <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '14.5px', textAlign: 'center', lineHeight: 1.4 }}>{t.modalCancelText}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button onClick={() => setIsLeaveModalOpen(false)} style={styles.modalCancelBtn}>{t.goBack}</button>
            <button onClick={executeLeaveQueue} style={styles.modalDeleteBtn}>{t.confirmCancel}</button>
          </div>
        </div>
      </BeautifulModal>

      <BeautifulModal isOpen={deletedAlertOpen} onClose={handleDeletedAlertClose} title={t.modalResetTitle} icon="🚨">
        <div>
          <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '14.5px', textAlign: 'center', fontWeight: '500', lineHeight: 1.4 }}>{t.modalResetText}</p>
          <button onClick={handleDeletedAlertClose} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#EF4444', color: '#FFFFFF', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>{t.newToken}</button>
        </div>
      </BeautifulModal>
    </div>
  );
}; 

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  uiWelcomeCard: { background: '#EBF5FF', borderRadius: '14px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiWelcomeTitle: { fontSize: '18px', fontWeight: '800', color: '#1E3A8A', letterSpacing: '-0.3px' },
  uiWelcomeLine: { width: '24px', height: '2.5px', backgroundColor: '#10B981', borderRadius: '2px', margin: '2px 0 2px 0' },
  uiWelcomeSub: { fontSize: '12px', color: '#475569', fontWeight: '500', lineHeight: 1.2 },
  uiWelcomeGraphic: { position: 'absolute', right: '10px', bottom: '-4px', zIndex: 1 },
  uiTokenCard: { backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '4px 6px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.06)' },
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
  uiServingOverlay: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: "url('/images/serving.webp') left center/cover no-repeat", opacity: 0.9, WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)', maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', zIndex: 1 },
  uiWaitCard: { backgroundColor: '#F0FDF4', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCFCE7', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiWaitIconBox: { backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  uiWaitTitle: { fontSize: '14px', fontWeight: '600', color: '#0F2942', marginBottom: '0px' },
  uiTimerCard: { backgroundColor: '#EFF6FF', borderRadius: '14px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.05)' },
  uiTimerIconBox: { backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  uiTimerWatermark: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '60px', color: '#93C5FD', opacity: 0.2, zIndex: 1 },
  uiTimerTitle: { fontSize: '14px', fontWeight: '800', color: '#1E3A8A', marginBottom: '4px' },
  uiTimerClock: { fontSize: '24px', fontWeight: '800', color: '#1D4ED8', letterSpacing: '0.5px', lineHeight: 1 },
  uiTimerFormat: { fontSize: '12px', color: '#1E3A8A', fontWeight: '800', letterSpacing: '1px', marginTop: '4px', textAlign: 'left' },
  uiLeaveBtn: { border: '1.5px solid #EF4444', backgroundColor: '#FFFFFF', color: '#EF4444', padding: '8px', borderRadius: '10px', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', width: '100%', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)' },
  uiFooter: { textAlign: 'center', fontSize: '11px', color: '#64748B', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '4px' },
  modalCancelBtn: { flex: 1, padding: '12px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' },
  modalDeleteBtn: { flex: 1, padding: '12px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }
};

export default React.memo(PatientView, (prevProps, nextProps) => {
  return prevProps.currentLiveToken === nextProps.currentLiveToken &&
         prevProps.initialLoad === nextProps.initialLoad;
});