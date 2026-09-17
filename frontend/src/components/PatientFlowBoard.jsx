import React, { useRef, useEffect, useState } from 'react';
import { FiCheckSquare, FiActivity, FiLoader, FiEdit2, FiTrash2, FiPhone, FiClock, FiSearch, FiChevronRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import BeautifulModal from './PopupAlert';

// ==========================================
// 🌟 1. ONLINE TICKET LIVE PREVIEW (Ultra Compact View)
// ==========================================
const OnlineTicketPreview = ({ p, currentLiveToken, currentConsultingPatient, maskMobileNumber }) => {
  const [realStatus, setRealStatus] = useState('active');
  const [expectedStartTime, setExpectedStartTime] = useState('');
  const [timePerPatient, setTimePerPatient] = useState(5);
  const [targetEtaMs, setTargetEtaMs] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [isFetching, setIsFetching] = useState(true);

  const trackingId = p._id ? p._id.slice(-8).toUpperCase() : Math.floor(10000000 + Math.random() * 90000000);

  useEffect(() => {
    const timeout = setTimeout(() => setIsFetching(false), 300);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
        const res = await fetch(`${BACKEND_URL}/api/auth/clinic-status`);
        const data = await res.json();
        if (data) {
          setRealStatus(data.status || 'active');
          setExpectedStartTime(data.expectedStartTime || ''); 
          if (data.timePerPatient) setTimePerPatient(data.timePerPatient); 
        }
      } catch (err) {}
    };
    fetchStatus(); 
    const interval = setInterval(fetchStatus, 3000); 
    return () => clearInterval(interval);
  }, []);

  const patientsAhead = Math.max(0, p.tokenNumber - currentLiveToken);
  const isMyTurn = p.tokenNumber === currentLiveToken;

  useEffect(() => {
    if (isMyTurn || patientsAhead <= 0) {
       setTargetEtaMs(null); return;
    }
    let baseTime = Date.now();
    if (expectedStartTime) {
        const lowerStart = expectedStartTime.toLowerCase();
        if (lowerStart.includes('shortly') && realStatus !== 'active') {
          baseTime = Date.now() + (10 * 60000);
        } else if (lowerStart.includes('delay') && realStatus !== 'active') {
          baseTime = Date.now() + (30 * 60000);
        } else if (expectedStartTime.includes(':')) {
          let [hours, rest] = expectedStartTime.split(':');
          let hrs = parseInt(hours, 10);
          let mins = parseInt(rest, 10);
          if (lowerStart.includes('pm') && hrs < 12) hrs += 12;
          if (lowerStart.includes('am') && hrs === 12) hrs = 0;
          const d = new Date(); d.setHours(hrs, mins, 0, 0);
          baseTime = Math.max(Date.now(), d.getTime());
        }
    }
    const target = baseTime + (patientsAhead * (timePerPatient || 5) * 60000);
    setTargetEtaMs(target);
  }, [p, currentLiveToken, expectedStartTime, realStatus, timePerPatient, patientsAhead, isMyTurn]);

  useEffect(() => {
    const timer = setInterval(() => {
        if (targetEtaMs) setTimeLeftMs(Math.max(0, targetEtaMs - Date.now()));
        else setTimeLeftMs(0);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetEtaMs]);

  const formatLiveCountdown = (ms) => {
    if (ms <= 0) return "00:00:00";
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTime = (dateStr) => {
    if(!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const arrivalTimeFormatted = targetEtaMs ? new Date(targetEtaMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Your Turn Now!';

  if (isFetching) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#1D4ED8', fontWeight: 'bold', fontSize: '12px' }}>
        <FiLoader className="spin-anim" size={20} style={{ marginBottom: '5px' }} />
        <div>Loading...</div>
      </div>
    );
  }

  // 🔥 HEIGHT REDUCED HERE SIGNIFICANTLY
  return (
    <div style={{ backgroundColor: '#F8FAFC', padding: '0', borderRadius: '12px' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', backgroundColor: '#FFFFFF', padding: '8px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                  <svg width="18" height="18" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" fill="#1D4ED8" /><path d="M20 10v20M10 20h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/><path d="M30 36 c-3 0-5-2-5-4s2-5 5-7c3 2 5 5 5 7s-2 4-5 4z" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round"/></svg>
                  <div style={{fontWeight:800, fontSize:11, color: '#0F2942'}}>SmartQueue</div>
              </div>
              <div style={{ fontSize: '9px', backgroundColor: '#E0E7FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                ID: {trackingId}
              </div>
          </div>

          <div style={{ background: '#EBF5FF', borderRadius: '8px', padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{flex: 1, zIndex: 2}}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A' }}>Welcome, {p.name.split(' ')[0]}</div>
                <div style={{ fontSize: '9px', color: '#475569', fontWeight: '500' }}>Live queue tracking</div>
              </div>
              <div style={{ position: 'absolute', right: '6px', bottom: '0px', zIndex: 1 }}><img src="/images/namaste.webp" alt="Namaste" style={{ width: '35px', height: '35px', objectFit: 'contain' }} onError={(e) => e.target.style.display='none'} /></div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '4px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)', marginTop: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#1E3A8A' }}>Token Number</div>
              <div style={{ fontSize: '45px', fontWeight: '700', color: '#1D4ED8', lineHeight: '1', margin: '2px 0', letterSpacing: '-1px' }}>{p.tokenNumber}</div>
              <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '700' }}>Issued: {formatTime(p.createdAt)}</div>
          </div>

          {isMyTurn ? (
            <div style={{ backgroundColor: '#10B981', color: 'white', borderRadius: '8px', padding: '8px', textAlign: 'center', marginTop: '6px' }}>
              <FiCheckCircle size={20} style={{ marginBottom: '2px' }} />
              <div style={{ fontSize: 13, fontWeight: 900 }}>Ready for Consultation</div>
            </div>
          ) : (
            <>
              <div style={{ background: 'linear-gradient(90deg, #1E3A8A 0%, #1D4ED8 100%)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden', color: '#FFFFFF', marginTop: '6px' }}>
                  <div style={{ backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                      <img src="/images/doctor.webp" alt="Doctor" style={{ width: '30px', height: '30px', objectFit: 'contain' }} onError={(e) => e.target.style.display='none'} />
                  </div>
                  <div style={{ zIndex: 2 }}>
                      <div style={{ background: '#10B981', color: '#FFFFFF', borderRadius: '4px', padding: '2px 6px', fontSize: '8px', fontWeight: '700', display: 'inline-block', marginBottom: '1px' }}>Consulting</div>
                      <div style={{ fontSize: '22px', fontWeight: '600', lineHeight: 1 }}>{currentLiveToken || 0}</div>
                      <div style={{ fontSize: '9px', opacity: 0.95, fontWeight: '600' }}>{currentConsultingPatient?.name || 'Waiting...'}</div>
                  </div>
              </div>

              <div style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #DCFCE7', marginTop: '6px' }}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                      <img src="/images/people.webp" alt="People" style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={(e) => e.target.style.display='none'} />
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#0F2942' }}>Ahead: <span style={{color: '#16A34A', fontSize: 13, fontWeight: '800'}}>{patientsAhead}</span></div>
                  </div>
                  <FiChevronRight size={14} color="#94A3B8" />
              </div>

              <div style={{ backgroundColor: '#EFF6FF', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden', marginTop: '6px' }}>
                   <div style={{ backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                     <img src="/images/hourglass.webp" alt="Hourglass" style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => e.target.style.display='none'} />
                   </div>
                   <div style={{ zIndex: 2 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#1E3A8A' }}>Estimated Time</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#1D4ED8', lineHeight: 1 }}>{arrivalTimeFormatted}</div>
                      <div style={{ fontSize: '9px', color: '#1E3A8A', fontWeight: '800', marginTop: '2px' }}>WAIT: {formatLiveCountdown(timeLeftMs)}</div>
                   </div>
              </div>
            </>
          )}

          <div style={{ border: '1px solid #EF4444', backgroundColor: '#FFFFFF', color: '#EF4444', padding: '5px', borderRadius: '6px', fontWeight: 700, fontSize: '10px', textAlign: 'center', marginTop: '6px' }}>
              <FiTrash2 size={10} style={{verticalAlign: 'middle', marginRight: '3px'}} /> Cancel Token
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '8px', color: '#64748B', fontWeight: '600', marginTop: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
              <FiShield size={9} color="#3B82F6" /> Secured & Encrypted
          </div>
      </div>
    </div>
  );
};


// ==========================================
// 🌟 2. MAIN PATIENT FLOW BOARD COMPONENT
// ==========================================
export default function PatientFlowBoard({ 
  isMobile, 
  visitedPatients, 
  currentConsultingPatient, 
  waitingPatients, 
  deletedPatients = [], 
  triggerEditModal, 
  triggerDeleteModal,
  maskMobileNumber,
  activeFilter = 'all',
  onClearHistory
}) {
  
  const visitedListRef = useRef(null);
  const [deletedSearchQuery, setDeletedSearchQuery] = useState('');
  const [ticketModal, setTicketModal] = useState({ isOpen: false, patient: null });

  const [timePerPatient, setTimePerPatient] = useState(5);
  const [clinicStatusData, setClinicStatusData] = useState({ status: 'active', expectedStartTime: '' });

  useEffect(() => {
    if (visitedListRef.current) {
      visitedListRef.current.scrollTop = visitedListRef.current.scrollHeight;
    }
  }, [visitedPatients.length]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
        const res = await fetch(`${BACKEND_URL}/api/auth/clinic-status`);
        const data = await res.json();
        if (data) {
          if (data.timePerPatient) setTimePerPatient(data.timePerPatient);
          setClinicStatusData({ status: data.status || 'active', expectedStartTime: data.expectedStartTime || '' });
        }
      } catch (err) {}
    };
    fetchStatus();
  }, [ticketModal.isOpen]);

  const formatTimeWithSeconds = (timeData) => {
    if (!timeData) return "--:--:--";
    const date = new Date(timeData);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  const formatDate = (timeData) => {
    if (!timeData) return "";
    const date = new Date(timeData);
    return date.toLocaleDateString('en-GB'); 
  };

  const filteredDeletedPatients = deletedPatients.filter(patient => {
    const query = deletedSearchQuery.toLowerCase();
    const nameMatch = patient.name?.toLowerCase().includes(query);
    const tokenMatch = String(patient.tokenNumber)?.toLowerCase().includes(query);
    const mobileMatch = String(patient.mobileNumber)?.toLowerCase().includes(query);
    return nameMatch || tokenMatch || mobileMatch;
  });

  // 🔥 YAHAN HUA HAI SMART CHECK UPDATE 🔥
  const checkIsManual = (patient) => {
    if (!patient) return false;
    const mobileOrAddress = String(patient.mobileNumber || "").trim();
    
    // Check if it's EXACTLY 10 digits (Numbers Only)
    const isExactly10Digits = /^\d{10}$/.test(mobileOrAddress);

    if (isExactly10Digits) {
      return false; // False = It's ONLINE 
    }
    
    // Anything else (empty, walk-in, text, 2-3 digits) = MANUAL
    return true; 
  };

  const getSourceBadge = (patient) => {
    const isMan = checkIsManual(patient);
    return (
      <span style={{
        backgroundColor: isMan ? '#F1F5F9' : '#DBEAFE',
        color: isMan ? '#64748B' : '#1D4ED8',
        padding: '3px 6px',
        borderRadius: '4px',
        fontSize: '9px',
        fontWeight: '800',
        marginLeft: '6px',
        letterSpacing: '0.5px',
        verticalAlign: 'middle',
        border: `1px solid ${isMan ? '#E2E8F0' : '#BFDBFE'}`
      }}>
        {isMan ? 'MANUAL' : 'ONLINE'}
      </span>
    );
  };

  const calculateManualWaitTime = (patientToken) => {
    const currentLive = currentConsultingPatient?.tokenNumber || 0;
    const ahead = Math.max(0, patientToken - currentLive);
    if (ahead === 0) return "Your Turn Now!";
    
    let baseTime = Date.now();
    const exp = clinicStatusData.expectedStartTime;
    if (exp) {
      const lower = exp.toLowerCase();
      if (lower.includes('shortly') && clinicStatusData.status !== 'active') {
        baseTime = Date.now() + (10 * 60000);
      } else if (lower.includes('delay') && clinicStatusData.status !== 'active') {
        baseTime = Date.now() + (30 * 60000);
      } else if (exp.includes(':')) {
        let [hours, rest] = exp.split(':');
        let hrs = parseInt(hours, 10);
        let mins = parseInt(rest, 10);
        if (lower.includes('pm') && hrs < 12) hrs += 12;
        if (lower.includes('am') && hrs === 12) hrs = 0;
        const d = new Date(); d.setHours(hrs, mins, 0, 0);
        baseTime = Math.max(Date.now(), d.getTime());
      }
    }
    const totalMinutes = ahead * (timePerPatient || 5);
    const targetMs = baseTime + (totalMinutes * 60000);
    const arrivalTime = new Date(targetMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    return `${arrivalTime} (~${totalMinutes} mins, ${ahead} ahead)`;
  };

  return (
    <div className="glass-card" style={{ 
      backgroundColor: '#fff', 
      padding: '12px 15px', 
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'auto', 
      maxHeight: '100%' 
    }}>
       
       <style>{`
         .flow-scrollbar::-webkit-scrollbar { width: 4px; }
         .flow-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; border-radius: 10px; margin: 4px 0; }
         .flow-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
         .glass-card { border-radius: 24px !important; overflow: hidden !important; border: 1px solid #E2E8F0 !important; }
         @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
         .spin-anim { animation: spin 1s linear infinite; }
       `}</style>

       {/* 1. RECENTLY COMPLETED */}
       {(activeFilter === 'all' || activeFilter === 'completed') && (
         <div style={{ display: 'flex', flexDirection: 'column', flex: activeFilter === 'completed' ? 1 : 'none', minHeight: 0 }}>
           <h3 style={{ margin: '0 0 6px 0', color: '#10B981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
             <FiCheckSquare size={15} /> Recently Completed ({visitedPatients.length})
           </h3>
           
           <div ref={visitedListRef} className="flow-scrollbar" style={{ overflowY: 'auto', maxHeight: isMobile ? (activeFilter === 'all' ? '50px' : '195px') : '138px', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {visitedPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No completed patients yet.</div>
             ) : (
               visitedPatients.map((patient) => (
                 <div key={patient._id} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1FAE5', backgroundColor: '#F0FDF4', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: '700', color: '#059669', fontSize: '13px', marginBottom: '2px' }}>
                       #{patient.tokenNumber} - {patient.name} {getSourceBadge(patient)}
                     </div>
                     <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#10B981', fontWeight: '600' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={10} /> {maskMobileNumber(patient.mobileNumber)}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={10} /> {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}</span>
                     </div>
                   </div>
                   <button onClick={() => setTicketModal({ isOpen: true, patient })} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #10B981', backgroundColor: '#FFFFFF', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                     View 🎫
                   </button>
                 </div>
               ))
             )}
           </div>
         </div>
       )}

       {/* 2. CURRENTLY CONSULTING */}
       {(activeFilter === 'all' || activeFilter === 'progress') && (
         <div style={{ flexShrink: 0, margin: '6px 0' }}>
           <h3 style={{ margin: '0 0 6px 0', color: '#D97706', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <FiActivity size={15} /> Currently Consulting
           </h3>
           {currentConsultingPatient ? (
             <div style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #F59E0B', backgroundColor: '#FFFBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontWeight: '800', color: '#B45309', fontSize: '14px', marginBottom: '2px' }}>
                   #{currentConsultingPatient.tokenNumber} - {currentConsultingPatient.name} {getSourceBadge(currentConsultingPatient)}
                 </div>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#D97706', fontWeight: '600' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={11} /> {maskMobileNumber(currentConsultingPatient.mobileNumber)}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={11} /> {formatTimeWithSeconds(currentConsultingPatient.createdAt || currentConsultingPatient.timestamp)}</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setTicketModal({ isOpen: true, patient: currentConsultingPatient })} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #D97706', backgroundColor: '#FFFFFF', color: '#D97706', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>🎫 View</button>
                  <button onClick={() => triggerEditModal(currentConsultingPatient._id, currentConsultingPatient.name, currentConsultingPatient.tokenNumber, currentConsultingPatient.mobileNumber)} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: '#FDE68A', color: '#D97706', cursor: 'pointer' }}><FiEdit2 size={12} /></button>
                  <button onClick={() => triggerDeleteModal(currentConsultingPatient._id, currentConsultingPatient.tokenNumber)} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: '#FEE2E2', color: '#EF4444', cursor: 'pointer' }}><FiTrash2 size={12} /></button>
               </div>
             </div>
           ) : (
             <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No patient currently in cabin.</div>
           )}
         </div>
       )}

       {/* 3. WAITING LINE */}
       {(activeFilter === 'all' || activeFilter === 'remaining') && (
         <div style={{ display: 'flex', flexDirection: 'column', flex: activeFilter === 'remaining' ? 1 : 'none', minHeight: 0 }}>
           <h3 style={{ margin: '0 0 6px 0', color: '#8B5CF6', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
             <FiLoader size={15} /> Waiting Line ({waitingPatients.length})
           </h3>
           
           <div className="flow-scrollbar" style={{ overflowY: 'auto', maxHeight: isMobile ? (activeFilter === 'all' ? '50px' : '195px') : '138px', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {waitingPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Queue is empty.</div>
             ) : (
               waitingPatients.map((patient) => (
                 <div key={patient._id} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                   <div>
                     <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '13px', marginBottom: '2px' }}>
                       #{patient.tokenNumber} - {patient.name} {getSourceBadge(patient)}
                     </div>
                     <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={10} /> {maskMobileNumber(patient.mobileNumber)}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={10} /> {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setTicketModal({ isOpen: true, patient })} style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #6366F1', backgroundColor: '#FFFFFF', color: '#4F46E5', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>🎫 View</button>
                      <button onClick={() => triggerEditModal(patient._id, patient.name, patient.tokenNumber, patient.mobileNumber)} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: '#EFF6FF', color: '#3B82F6', cursor: 'pointer' }}><FiEdit2 size={12} /></button>
                      <button onClick={() => triggerDeleteModal(patient._id, patient.tokenNumber)} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}><FiTrash2 size={12} /></button>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
       )}

       {/* 4. DELETED / CANCELLED HISTORY */}
       {activeFilter === 'deleted' && (
         <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: '0', gap: '8px' }}>
             <h3 style={{ margin: 0, color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
               <FiTrash2 size={15} /> Deleted / Reset History ({filteredDeletedPatients.length})
             </h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               <div style={{ position: 'relative', width: '160px' }}>
                 <FiSearch size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={deletedSearchQuery}
                   onChange={(e) => setDeletedSearchQuery(e.target.value)}
                   style={{ width: '100%', padding: '5px 8px 5px 26px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', outline: 'none', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }}
                 />
               </div>
               <button onClick={onClearHistory} style={{ padding: '5px 8px', backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} title="Clear All History with Password">
                 <FiTrash2 size={11} /> Clear All
               </button>
             </div>
           </div>
           <div className="flow-scrollbar" style={{ overflowY: 'auto', maxHeight: isMobile ? '195px' : 'none', flex: 1, minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {filteredDeletedPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No deleted or reset records found.</div>
             ) : (
               filteredDeletedPatients.map((patient, index) => (
                 <div key={patient._id || index} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', flexShrink: 0 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                     <div style={{ fontWeight: '700', color: '#DC2626', fontSize: '13px' }}>
                       #{patient.tokenNumber} - {patient.name} {getSourceBadge(patient)}
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '10px', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', display: 'inline-block', marginBottom: '2px' }}>
                         Date: {formatDate(patient.deletedAt || patient.timestamp)}
                       </span>
                       <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                         <FiClock size={10} /> Deleted At: {formatTimeWithSeconds(patient.deletedAt)}
                       </div>
                     </div>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px', color: '#B91C1C', fontWeight: '600' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={10} /> Mobile: {maskMobileNumber(patient.mobileNumber)}</span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={10} /> Generated At: {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}</span>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
       )}

       {/* 🔥 SMART PREVIEW MODAL */}
       <BeautifulModal 
         isOpen={ticketModal.isOpen} 
         onClose={() => setTicketModal({ isOpen: false, patient: null })} 
         title="Token Viewer" 
         icon="🎫"
       >
         {ticketModal.patient && (
           checkIsManual(ticketModal.patient) ? (
             <div style={{ backgroundColor: '#E2E8F0', padding: '6px', borderRadius: '8px' }}>
               <div style={{ maxWidth: '260px', margin: '0 auto', background: '#FFFFFF', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                 <div style={{ backgroundColor: '#10B981', color: 'white', padding: '6px 8px', textAlign: 'center' }}>
                   <h2 style={{ margin: '0', fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>CLINIC TOKEN</h2>
                   <p style={{ margin: '1px 0 0 0', fontSize: '9px', fontWeight: '500' }}>Manual Walk-In Receipt</p>
                 </div>
                 <div style={{ padding: '8px', textAlign: 'center' }}>
                   <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '700', letterSpacing: '1px' }}>TOKEN NUMBER</div>
                   <div style={{ fontSize: '40px', fontWeight: '900', color: '#0F172A', lineHeight: '1', margin: '2px 0' }}>#{ticketModal.patient.tokenNumber}</div>
                 </div>
                 <div style={{ position: 'relative', height: '10px', display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                   <div style={{ position: 'absolute', left: '-6px', width: '12px', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '50%', zIndex: 2 }}></div>
                   <div style={{ flex: 1, borderBottom: '2px dashed #CBD5E1', margin: '0 12px' }}></div>
                   <div style={{ position: 'absolute', right: '-6px', width: '12px', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '50%', zIndex: 2 }}></div>
                 </div>
                 <div style={{ padding: '4px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Name:</span>
                     <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: '800' }}>{ticketModal.patient.name}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Mobile/Address:</span>
                     <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: '800' }}>{ticketModal.patient.mobileNumber || "Walk-In"}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>Generated:</span>
                     <span style={{ fontSize: '10px', color: '#0F172A', fontWeight: '700', textAlign: 'right' }}>
                        {formatTimeWithSeconds(ticketModal.patient.createdAt || ticketModal.patient.timestamp)}
                     </span>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingTop: '4px', borderTop: '1px dashed #E2E8F0', backgroundColor: '#F0FDF4', padding: '4px 6px', borderRadius: '4px' }}>
                     <span style={{ fontSize: '10px', color: '#047857', fontWeight: '700' }}>Expected Time:</span>
                     <span style={{ fontSize: '10px', color: '#059669', fontWeight: '900', textAlign: 'right' }}>
                        {calculateManualWaitTime(ticketModal.patient.tokenNumber)}
                     </span>
                   </div>

                 </div>
               </div>
             </div>
           ) : (
             <OnlineTicketPreview 
                p={ticketModal.patient} 
                currentLiveToken={currentConsultingPatient?.tokenNumber || 0} 
                currentConsultingPatient={currentConsultingPatient}
                maskMobileNumber={maskMobileNumber}
             />
           )
         )}
         {/* 🔥 CLOSE BUTTON HEIGHT REDUCED HERE */}
         <button onClick={() => setTicketModal({ isOpen: false, patient: null })} style={{ width: '100%', padding: '8px', marginTop: '8px', border: 'none', borderRadius: '6px', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>Close Window</button>
       </BeautifulModal>

    </div>
  );
}