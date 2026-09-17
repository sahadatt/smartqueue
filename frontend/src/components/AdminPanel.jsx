import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import LiveCounter from './LiveCounter';
import ManualParchi from './ManualParchi';
import PatientFlowBoard from './PatientFlowBoard';
import StatsGrid from './StatsGrid';
import BeautifulModal from './PopupAlert';
import ResetQueueModal from './ResetQueueModal'; 

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

const maskMobileNumber = (mobile) => {
  if (!mobile || mobile === "Walk-In Parchi") return "Walk-In Parchi";
  return mobile; 
};

export default function AdminPanel({ currentLiveToken = 1, totalTokensDistributed = 0, patients = [], username, onLogout, socket, doctorDetails, clinicStatus = 'not-started' }) {
  
  const [profileInfo, setProfileInfo] = useState({
    clinicName: doctorDetails?.clinicName || "LIFE CARE",
    doctorName: doctorDetails?.doctorName || username || "Dr. Sahadat Ansari",
    degree: doctorDetails?.degree || "MBBS, MD",
    mobile: doctorDetails?.mobile || "+91 0000000000"
  });

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/admin-profile`);
        const data = await res.json();
        if (res.ok) {
          setProfileInfo({
            clinicName: data.clinicName || "LIFE CARE",
            doctorName: data.doctorName || username || "Dr. Sahadat Ansari",
            degree: data.degree || "MBBS, MD",
            mobile: data.mobile || "+91 0000000000"
          });
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
      }
    };
    fetchAdminProfile();
  }, [username]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  
  const [walkInAddress, setWalkInAddress] = useState(''); 
  
  const [generatedParchi, setGeneratedParchi] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [tokenReceiptModal, setTokenReceiptModal] = useState({ isOpen: false, token: null, name: '', mobile: '', date: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  const [localStatus, setLocalStatus] = useState(clinicStatus);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  
  const [liveExpectedTime, setLiveExpectedTime] = useState(doctorDetails?.expectedStartTime || '');
  const [isTimeReached, setIsTimeReached] = useState(true);
  const [timePerPatient, setTimePerPatient] = useState(doctorDetails?.timePerPatient || 5);
  const [lastTokenTime, setLastTokenTime] = useState(Date.now());

  // 🔥 Database se Deleted History fetch karne ke liye state
  const [deletedPatients, setDeletedPatients] = useState([]);

  const fetchDeletedHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/deleted-patients`);
      const data = await res.json();
      if (res.ok) {
        setDeletedPatients(data);
      }
    } catch (err) {
      console.error("Error fetching deleted history from DB", err);
    }
  };

  useEffect(() => {
    fetchDeletedHistory();
  }, []);

  const prevPatientsMap = useRef(new Map());
  const isFirstRender = useRef(true);
  const adminDeletingIds = useRef(new Set());

  useEffect(() => {
    const currentMap = new Map();
    patients.forEach(p => currentMap.set(p._id, p));

    if (isFirstRender.current) {
      prevPatientsMap.current = currentMap;
      isFirstRender.current = false;
      return;
    }

    const added = [];
    const removed = [];

    currentMap.forEach((p, id) => {
      if (!prevPatientsMap.current.has(id)) added.push(p);
    });

    prevPatientsMap.current.forEach((p, id) => {
      if (!currentMap.has(id)) removed.push(p);
    });

    if (added.length + removed.length <= 10) {
      added.forEach(newPatient => {
        const isWalkIn = !newPatient.mobileNumber || newPatient.mobileNumber.toLowerCase().includes('walk-in');
        const mobileDisplay = isWalkIn ? newPatient.mobileNumber : maskMobileNumber(newPatient.mobileNumber);
        
        toast.custom((t) => (
          <div style={{
            opacity: t.visible ? 1 : 0, transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '10px', 
            background: '#F0FDF4', color: '#0F172A', border: '1.5px solid #10B981', 
            padding: '12px 24px', borderRadius: '30px', 
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            fontSize: '14px', maxWidth: '95vw'
          }}>
            <span style={{ color: '#065F46', fontWeight: 'bold' }}>{isWalkIn ? '🎫 Walk-In' : '🔔 New'}</span> 
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ color: '#10B981', fontWeight: '900', fontSize: '16px' }}>#{newPatient.tokenNumber}</span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ fontWeight: '700' }}>{newPatient.name}</span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>{mobileDisplay}</span>
          </div>
        ), { position: 'top-center', duration: 4000 });
      });

      removed.forEach(deletedPatient => {
        const isDeletedByAdmin = adminDeletingIds.current.has(String(deletedPatient._id));
        if (isDeletedByAdmin) {
          adminDeletingIds.current.delete(String(deletedPatient._id));
        }
        const deleteSource = isDeletedByAdmin ? 'by admin' : 'by user';

        toast.custom((t) => (
          <div style={{
            opacity: t.visible ? 1 : 0, transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '10px', 
            background: '#FEF2F2', color: '#0F172A', border: '1.5px solid #EF4444', 
            padding: '12px 24px', borderRadius: '30px', 
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
            fontSize: '14px', maxWidth: '95vw'
          }}>
            <span style={{ color: '#991B1B', fontWeight: 'bold' }}>🗑️ Deleted ({deleteSource})</span> 
            <span style={{ color: '#FCA5A5' }}>|</span>
            <span style={{ color: '#EF4444', fontWeight: '900', fontSize: '16px' }}>#{deletedPatient.tokenNumber}</span>
            <span style={{ color: '#FCA5A5' }}>|</span>
            <span style={{ fontWeight: '700' }}>{deletedPatient.name}</span>
            <span style={{ color: '#FCA5A5' }}>|</span>
            <span style={{ color: '#475569', fontSize: '13px' }}>{maskMobileNumber(deletedPatient.mobileNumber)}</span>
          </div>
        ), { position: 'top-center', duration: 4000 });

        // Refresh database history list
        fetchDeletedHistory();
      });
    }

    prevPatientsMap.current = currentMap;
  }, [patients]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchRealTimeStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/clinic-status`);
        const data = await res.json();
        if (data) {
          if (data.expectedStartTime !== undefined) setLiveExpectedTime(data.expectedStartTime);
          if (data.timePerPatient !== undefined) setTimePerPatient(data.timePerPatient);
          if (data.lastTokenUpdateTime !== undefined) setLastTokenTime(data.lastTokenUpdateTime); 
        }
      } catch (err) {}
    };
    fetchRealTimeStatus();
    const intervalId = setInterval(fetchRealTimeStatus, 3000); 
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setLocalStatus(clinicStatus);
  }, [clinicStatus]);

  useEffect(() => {
    if (!socket) return;
    socket.on('clinic-status-changed', (status) => setLocalStatus(status));
    
    socket.on('queue-updated', (data) => {
      if (data.timePerPatient !== undefined) setTimePerPatient(data.timePerPatient);
      if (data.lastTokenUpdateTime !== undefined) setLastTokenTime(data.lastTokenUpdateTime); 
      fetchDeletedHistory(); // Sync DB history on queue update
    });

    socket.on('reset-status-response', (data) => {
      if (data.success) {
        setIsQueueFinished(false);
        fetchDeletedHistory();
      } else {
        setAlertModal({ isOpen: true, title: 'Error', message: data.message || 'Error occurred.', icon: '🚨' });
      }
    });

    return () => {
      socket.off('clinic-status-changed');
      socket.off('reset-status-response');
      socket.off('queue-updated');
    };
  }, [socket]);

  useEffect(() => {
    if (localStatus !== 'active' || currentLiveToken >= totalTokensDistributed || totalTokensDistributed === 0) return;

    const checkTimeAndMove = async () => {
      const now = Date.now();
      const timePassed = now - lastTokenTime;
      const timeLimitInMs = timePerPatient * 60 * 1000;

      if (timePassed >= timeLimitInMs) {
        try {
          await fetch(`${BACKEND_URL}/api/auth/auto-next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentLive: currentLiveToken })
          });
        } catch (error) {
          console.error("Auto-next API Error:", error);
        }
      }
    };

    const autoNextTimer = setInterval(checkTimeAndMove, 2000);
    return () => clearInterval(autoNextTimer);
  }, [localStatus, currentLiveToken, totalTokensDistributed, lastTokenTime, timePerPatient]);

  const handleStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
    if (socket) socket.emit('update-clinic-status', newStatus);
  };

  useEffect(() => {
    const runEngine = () => {
      if (!liveExpectedTime || !liveExpectedTime.includes(':')) {
        setIsTimeReached(true);
        return;
      }

      let [hours, rest] = liveExpectedTime.split(':');
      let hrs = parseInt(hours, 10);
      let mins = parseInt(rest, 10);
      if (liveExpectedTime.toLowerCase().includes('pm') && hrs < 12) hrs += 12;
      if (liveExpectedTime.toLowerCase().includes('am') && hrs === 12) hrs = 0;

      const expectedDate = new Date();
      expectedDate.setHours(hrs, mins, 0, 0);

      const now = new Date();
      const reached = now >= expectedDate;
      setIsTimeReached(reached);

      if (socket) {
        if (reached && localStatus === 'not-started') {
          handleStatusChange('active');
        } 
        else if (!reached && localStatus !== 'not-started') {
          handleStatusChange('not-started');
        }
      }
    };

    const engineTimer = setInterval(runEngine, 2000);
    runEngine();

    return () => clearInterval(engineTimer);
  }, [liveExpectedTime, localStatus, socket]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', tokenNumber: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' });
  const [resetModal, setResetModal] = useState({ isOpen: false, password: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', icon: '' });
  const [clearHistoryModal, setClearHistoryModal] = useState({ isOpen: false, password: '' });
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isQueueFinished, setIsQueueFinished] = useState(false);

  const safePatients = Array.isArray(patients) ? patients : [];
  const visitedPatients = safePatients.filter(p => p.tokenNumber < currentLiveToken).sort((a,b) => a.tokenNumber - b.tokenNumber);
  const currentConsultingPatient = safePatients.find(p => p.tokenNumber === currentLiveToken);
  const waitingPatients = safePatients.filter(p => p.tokenNumber > currentLiveToken).sort((a,b) => a.tokenNumber - b.tokenNumber);
  
  const deletedCount = deletedPatients.length;
  const isNextDisabled = totalTokensDistributed === 0 || localStatus !== 'active';

  useEffect(() => {
    if (totalTokensDistributed > currentLiveToken) setIsQueueFinished(false);
  }, [totalTokensDistributed, currentLiveToken]);

  const triggerDeleteModal = (id, tokenNumber) => setDeleteModal({ isOpen: true, id, tokenNumber });
  
  const executeAdminDelete = () => { 
    if (deleteModal.id) {
      adminDeletingIds.current.add(String(deleteModal.id));
    }
    if (socket) socket.emit('admin-delete-patient', { id: deleteModal.id }); 
    setDeleteModal({ isOpen: false, id: '', tokenNumber: '' }); 
  };
  
  const triggerEditModal = (id, name, tokenNumber, mobileNumber) => setEditModal({ isOpen: true, id, name, tokenNumber, mobileNumber: mobileNumber || '' });
  
  const executeAdminEdit = (e) => { 
    e.preventDefault(); 
    if (socket) {
      socket.emit('admin-edit-patient', { 
        id: editModal.id, 
        newName: editModal.name.trim(), 
        newTokenNumber: editModal.tokenNumber, 
        newMobileNumber: editModal.mobileNumber.trim() 
      }); 
    }

    toast.custom((t) => (
      <div style={{
        opacity: t.visible ? 1 : 0, transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', gap: '10px', 
        background: '#FFFBEB', color: '#0F172A', border: '1.5px solid #F59E0B', 
        padding: '12px 24px', borderRadius: '30px', 
        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
        fontSize: '14px', maxWidth: '95vw'
      }}>
        <span style={{ color: '#D97706', fontWeight: 'bold' }}>✏️ Updated</span> 
        <span style={{ color: '#FDE68A' }}>|</span>
        <span style={{ color: '#B45309', fontWeight: '900', fontSize: '16px' }}>#{editModal.tokenNumber}</span>
        <span style={{ color: '#FDE68A' }}>|</span>
        <span style={{ fontWeight: '700' }}>{editModal.name.trim()}</span>
        <span style={{ color: '#FDE68A' }}>|</span>
        <span style={{ color: '#475569', fontSize: '13px' }}>{maskMobileNumber(editModal.mobileNumber.trim())}</span>
      </div>
    ), { position: 'top-center', duration: 4000 });

    setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' }); 
  };
  
  const executeSystemReset = (e) => {
    if (e) e.preventDefault();
    if (!resetModal.password || resetModal.password.trim() === "") return;
    if (socket) socket.emit('reset-entire-queue', { username, password: resetModal.password.trim() });
    
    toast.success('Queue Reset Successful!', { style: { background: '#F0FDF4', color: '#065F46', border: '1px solid #10B981', borderRadius: '30px' } });
    
    setResetModal({ isOpen: false, password: '' });
    handleStatusChange('not-started'); 
    setTimeout(fetchDeletedHistory, 1000);
  };

  // 🔥 Database se Deleted History clear karne ki function
  const executeClearHistory = async (e) => {
    if (e) e.preventDefault();
    if (!clearHistoryModal.password || clearHistoryModal.password.trim() === "") return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/deleted-patients`, { method: 'DELETE' });
      if (res.ok) {
        setDeletedPatients([]);
        setClearHistoryModal({ isOpen: false, password: '' });
        toast.success('Deleted history cleared successfully!', { style: { background: '#F0FDF4', color: '#065F46', border: '1px solid #10B981', borderRadius: '30px' } });
      }
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const handleManualCheckin = async (e) => {
    e.preventDefault(); if (!walkInName.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ patientName: walkInName, mobileNumber: walkInAddress.trim() || "Walk-In Parchi" }) 
      });
      const data = await res.json();
      if (res.ok) { 
        setTokenReceiptModal({
          isOpen: true,
          token: data.myToken,
          name: data.patientName,
          mobile: walkInAddress.trim() || "Walk-In",
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        });
        setWalkInName(''); 
        setWalkInAddress(''); 
        setGeneratedParchi(null);
      }
    } catch (err) {}
  };

  const handleNextToken = () => {
    if (localStatus !== 'active') return;
    if (currentLiveToken >= totalTokensDistributed && totalTokensDistributed > 0) setShowFinishModal(true);
    else if (socket) socket.emit('next-token');
  };

  const handlePrevToken = () => {
    if (localStatus !== 'active') return;
    setIsQueueFinished(false);
    if (socket) socket.emit('prev-token');
  };

  const handleConfirmFinish = () => {
    setShowFinishModal(false);
    setIsQueueFinished(true);
  };

  const sidebarSocketProxy = {
    emit: (eventName, data) => {
      if (eventName === 'next-patient') {
        handleNextToken(); 
      } else if (socket) {
        socket.emit(eventName, data);
      }
    }
  };

  const tokensAhead = tokenReceiptModal.token > currentLiveToken ? tokenReceiptModal.token - currentLiveToken : 0;
  
  let baseTimeForReceipt = Date.now();
  
  if (liveExpectedTime) {
    const lowerStart = liveExpectedTime.toLowerCase();
    if (lowerStart.includes('shortly') && localStatus !== 'active') {
      baseTimeForReceipt = Date.now() + (10 * 60000);
    } else if (lowerStart.includes('delay') && localStatus !== 'active') {
      baseTimeForReceipt = Date.now() + (30 * 60000);
    } else if (liveExpectedTime.includes(':')) {
      let [hours, rest] = liveExpectedTime.split(':');
      let hrs = parseInt(hours, 10);
      let mins = parseInt(rest, 10);
      if (lowerStart.includes('pm') && hrs < 12) hrs += 12;
      if (lowerStart.includes('am') && hrs === 12) hrs = 0;
      
      const expectedDate = new Date();
      expectedDate.setHours(hrs, mins, 0, 0);
      
      if (expectedDate.getTime() > Date.now()) {
          baseTimeForReceipt = expectedDate.getTime();
      }
    }
  }

  const estimatedMinutes = tokensAhead * (timePerPatient || 5); 
  const arrivalTimeObj = new Date(baseTimeForReceipt + estimatedMinutes * 60000);
  const formattedArrivalTime = arrivalTimeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="admin-layout" style={{ height: '100dvh', overflow: 'hidden', display: 'flex', width: '100%' }}>
      
      <Toaster 
        position="top-center" 
        containerStyle={{ zIndex: 999999999, top: 15 }} 
      />

      <style>{`
        .ticket-wrapper { position: relative; background: #FFFFFF; width: 100%; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px -5px rgba(0,0,0,0.1); }
        
        .glow-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #CBD5E1;
          outline: none;
          font-size: 14px;
          background-color: #F8FAFC;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .glow-input:focus {
          border-color: #3B82F6;
          background-color: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 2px 4px rgba(0,0,0,0.02);
        }

        @media print {
          body * { visibility: hidden !important; }
          #print-section, #print-section * { visibility: visible !important; }
          #print-section { position: absolute; left: 50%; top: 0; transform: translateX(-50%); width: 80mm; margin: 0; padding: 0; box-shadow: none !important; }
          .hide-on-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} 
        isNextDisabled={isNextDisabled} socket={sidebarSocketProxy} setResetModal={setResetModal}
        totalTokensToday={totalTokensDistributed} completedCount={visitedPatients.length}
        inProgressCount={currentConsultingPatient && !isQueueFinished ? 1 : 0} remainingCount={waitingPatients.length}
        deletedCount={deletedCount} activeFilter={activeFilter} setActiveFilter={setActiveFilter}
        localStatus={localStatus} handleStatusChange={handleStatusChange} setPauseModalOpen={setPauseModalOpen}
        isTimeReached={isTimeReached}
      />

      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        
        <AdminNavbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} username={username} onLogout={onLogout} isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen} />

        <div className="dashboard-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '8px 16px' : '20px', paddingBottom: isMobile ? '10px' : '20px', overflow: 'hidden', boxSizing: 'border-box', width: '100%' }}>
          
          {!isMobile && (
            <div style={{ flexShrink: 0 }}>
              <div className="page-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                <h1 style={{ margin: 0, fontSize: '26px', color: '#0F172A', fontWeight: '800', letterSpacing: '-0.5px' }}>Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ margin: 0, fontWeight: '800', fontSize: '15px', background: 'linear-gradient(90deg, #2563EB, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.2px' }}>{getGreeting()}!</span>
                  <span style={{ fontSize: '12px', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', padding: '6px 16px', borderRadius: '24px', color: '#475569', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      <span style={{ color: '#3B82F6', fontSize: '13px' }}>⏱️</span> {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      <span style={{ color: '#CBD5E1', margin: '0 2px' }}>|</span> 
                      <span style={{ color: '#10B981', fontSize: '13px' }}>📅</span> {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <StatsGrid totalTokensToday={totalTokensDistributed} completedCount={visitedPatients.length} inProgressCount={currentConsultingPatient && !isQueueFinished ? 1 : 0} remainingCount={waitingPatients.length} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            </div>
          )}

          <div className="workspace-grid" style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: isMobile ? 'none' : '1fr 1fr', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '15px', marginTop: isMobile ? '4px' : '0', flex: 1, overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
            
            {isMobile && (
              <div style={{ order: 1, flexShrink: 0, width: '100%' }}>
                <ManualParchi 
                  walkInName={walkInName} 
                  setWalkInName={setWalkInName} 
                  walkInAddress={walkInAddress} 
                  setWalkInAddress={setWalkInAddress} 
                  walkInMobile={walkInAddress} 
                  setWalkInMobile={setWalkInAddress} 
                  handleManualCheckin={handleManualCheckin} 
                  generatedParchi={generatedParchi} 
                />
              </div>
            )}

            <div style={{ order: 2, width: '100%', display: 'flex', flexDirection: 'column', flex: isMobile ? '0 1 auto' : 'auto', height: isMobile ? 'auto' : 'calc(100dvh - 160px)', minHeight: 0, overflow: 'hidden' }}>
              <PatientFlowBoard isMobile={isMobile} activeFilter={activeFilter} visitedPatients={visitedPatients} currentConsultingPatient={currentConsultingPatient} waitingPatients={waitingPatients} deletedPatients={deletedPatients} triggerEditModal={triggerEditModal} triggerDeleteModal={triggerDeleteModal} maskMobileNumber={maskMobileNumber} onClearHistory={() => setClearHistoryModal({ isOpen: true, password: '' })} />
            </div>

            <div className="left-stack" style={{ order: isMobile ? 3 : 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '15px', flexShrink: 0, width: '100%' }}>
              {isQueueFinished ? (
                <div className="glass-card pulse-anim" style={{ padding: '40px 20px', borderRadius: '20px', backgroundColor: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', border: '3px solid #10B981' }}>
                  <style>{`@keyframes pop { 0% {transform: scale(0.8)} 50% {transform: scale(1.1)} 100% {transform: scale(1)} }`}</style>
                  <div style={{ fontSize: '55px', marginBottom: '10px', animation: 'pop 0.5s ease' }}>✅</div>
                  <h3 style={{ color: '#059669', margin: '0 0 10px 0', fontSize: '22px', fontWeight: '900' }}>All Tokens Visited!</h3>
                  <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: '600' }}>The current session has been completed.</p>
                  <button onClick={() => setIsQueueFinished(false)} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>View Counter Again</button>
                </div>
              ) : (
                <LiveCounter 
                  currentLiveToken={currentLiveToken} 
                  socket={socket} 
                  isNextDisabled={isNextDisabled || localStatus !== 'active'} 
                  isPrevDisabled={localStatus !== 'active'}
                  onNext={handleNextToken} 
                  onPrevious={handlePrevToken} 
                />
              )}

              {!isMobile && (
                <ManualParchi 
                  walkInName={walkInName} 
                  setWalkInName={setWalkInName} 
                  walkInAddress={walkInAddress} 
                  setWalkInAddress={setWalkInAddress} 
                  walkInMobile={walkInAddress} 
                  setWalkInMobile={setWalkInAddress} 
                  handleManualCheckin={handleManualCheckin} 
                  generatedParchi={generatedParchi} 
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <BeautifulModal isOpen={pauseModalOpen} onClose={() => setPauseModalOpen(false)} title="Pause Session" icon="⏸️">
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
          Select a reason. This will be visible to patients.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => { handleStatusChange('lunch'); setPauseModalOpen(false); }} style={{ padding: '14px', border: '1px solid #FDE68A', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>🍔 Doctor is on Lunch Break</button>
          <button onClick={() => { handleStatusChange('meeting'); setPauseModalOpen(false); }} style={{ padding: '14px', border: '1px solid #BFDBFE', borderRadius: '10px', backgroundColor: '#E0E7FF', color: '#2563EB', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>👥 Doctor is in a Meeting</button>
          <button onClick={() => { handleStatusChange('busy'); setPauseModalOpen(false); }} style={{ padding: '14px', border: '1px solid #FECACA', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>⏳ Doctor is Busy / Paused</button>
          <button onClick={() => setPauseModalOpen(false)} style={{ padding: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>Cancel</button>
        </div>
      </BeautifulModal>

      <BeautifulModal isOpen={tokenReceiptModal.isOpen} onClose={() => setTokenReceiptModal({ isOpen: false, token: null, name: '', mobile: '', date: '' })} title="Success" icon="✅">
        <div style={{ backgroundColor: '#E2E8F0', padding: '10px', borderRadius: '8px', margin: '0 auto 10px auto' }}>
          <div id="print-section" className="ticket-wrapper" style={{ maxWidth: '300px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#10B981', color: 'white', padding: '12px 10px', textAlign: 'center' }}>
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{profileInfo.clinicName}</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: '500', opacity: '0.9' }}>Token Receipt</p>
            </div>
            <div style={{ padding: '15px 10px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Token Number</div>
              <div style={{ fontSize: '55px', fontWeight: '900', color: '#0F172A', lineHeight: '1' }}>#{tokenReceiptModal.token}</div>
            </div>
            <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
              <div style={{ position: 'absolute', left: '-10px', width: '20px', height: '20px', backgroundColor: '#E2E8F0', borderRadius: '50%', zIndex: 2 }}></div>
              <div style={{ flex: 1, borderBottom: '2px dashed #CBD5E1', margin: '0 20px' }}></div>
              <div style={{ position: 'absolute', right: '-10px', width: '20px', height: '20px', backgroundColor: '#E2E8F0', borderRadius: '50%', zIndex: 2 }}></div>
            </div>
            <div style={{ padding: '10px 15px 15px 15px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Patient Name:</span>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>{tokenReceiptModal.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Mobile/Address:</span>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: '800', textAlign: 'right', maxWidth: '180px', wordWrap: 'break-word' }}>{tokenReceiptModal.mobile}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Expected Time:</span>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: '800' }}>
                  {tokensAhead === 0 ? 'Your Turn Now!' : `${formattedArrivalTime} (${tokensAhead} ahead)`}
                </span>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <h4 style={{ margin: '0 0 2px 0', color: '#0F172A', fontSize: '14px', fontWeight: '800' }}>{profileInfo.doctorName}</h4>
                <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '11px', fontWeight: '600' }}>{profileInfo.degree} | Mob: {profileInfo.mobile}</p>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', marginBottom: '8px' }}>📅 {tokenReceiptModal.date}</div>
                
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#10B981', fontWeight: '800' }}>
                    Thank You for visiting {profileInfo.clinicName}!
                  </p>
                </div>
              </div>

            </div>
          </div>
          <div className="hide-on-print" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => window.print()} style={{ flex: 1, padding: '10px', border: '2px solid #10B981', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backgroundColor: 'transparent', color: '#10B981', transition: 'all 0.2s' }}>🖨️ Print</button>
            <button onClick={() => setTokenReceiptModal({ isOpen: false, token: null, name: '', mobile: '', date: '' })} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#10B981', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>Done</button>
          </div>
        </div>
      </BeautifulModal>

      <BeautifulModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', tokenNumber: '' })} title="Delete Patient?" icon="🗑️">
        <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>Are you sure you want to permanently delete Token <b>#{deleteModal.tokenNumber}</b>?</p>
        <button onClick={executeAdminDelete} style={{backgroundColor: '#DC3545', color: '#fff', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer', width: '100%', fontWeight: 'bold'}}>Delete</button>
      </BeautifulModal>

      <ResetQueueModal isOpen={resetModal.isOpen} onClose={() => setResetModal({ isOpen: false, password: '' })} password={resetModal.password} setPassword={(val) => setResetModal({ ...resetModal, password: val })} onConfirm={executeSystemReset} />
      
      <BeautifulModal isOpen={clearHistoryModal.isOpen} onClose={() => setClearHistoryModal({ isOpen: false, password: '' })} title="Clear Deleted History" icon="🔒">
        <form onSubmit={executeClearHistory} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Please enter your password to permanently clear the deleted history:</p>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" value={clearHistoryModal.password} onChange={(e) => setClearHistoryModal({...clearHistoryModal, password: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }} placeholder="Enter password" required />
          </div>
          <button type="submit" style={{ padding: '14px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>Clear History</button>
        </form>
      </BeautifulModal>

      <BeautifulModal isOpen={showFinishModal} onClose={() => setShowFinishModal(false)} title="Consultation Complete" icon="🏁">
        <p style={{ margin: '0 0 20px 0', fontSize: '15px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>This was your last token. Has the visit for all patients been completed?</p>
        <button onClick={handleConfirmFinish} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#10B981', color: '#FFFFFF' }}>OK, Mark as Visited</button>
      </BeautifulModal>

      <BeautifulModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' })} title="Edit Patient" icon="✍️">
        <form onSubmit={executeAdminEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Token Number</label>
            <input type="number" value={editModal.tokenNumber} onChange={(e) => setEditModal({...editModal, tokenNumber: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Name</label>
            <input type="text" value={editModal.name} onChange={(e) => setEditModal({...editModal, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Mobile/Address</label>
            <input type="text" value={editModal.mobileNumber} onChange={(e) => setEditModal({...editModal, mobileNumber: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ padding: '14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>Save Changes</button>
        </form>
      </BeautifulModal>

      <BeautifulModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: '', message: '', icon: '' })} title={alertModal.title} icon={alertModal.icon}>
        <p style={{ margin: '0 0 20px 0', fontSize: '15px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>{alertModal.message}</p>
        <button onClick={() => setAlertModal({ isOpen: false, title: '', message: '', icon: '' })} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: alertModal.title === 'Success' || alertModal.title === 'Session Auto-Started 🚀' ? '#10B981' : '#EF4444', color: '#FFFFFF' }}>OK</button>
      </BeautifulModal>
    </div>
  );
}