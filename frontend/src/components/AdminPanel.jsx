import React, { useState, useEffect } from 'react';
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

export default function AdminPanel({ currentLiveToken, totalTokensDistributed, patients, username, onLogout, socket }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState(''); 
  const [generatedParchi, setGeneratedParchi] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };
  
  const [deletedPatients, setDeletedPatients] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('hospital_deleted_patients_history');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hospital_deleted_patients_history', JSON.stringify(deletedPatients));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  }, [deletedPatients]);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', tokenNumber: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, id: '', name: '', tokenNumber: '', mobileNumber: '' });
  const [resetModal, setResetModal] = useState({ isOpen: false, password: '' });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', icon: '' });
  const [clearHistoryModal, setClearHistoryModal] = useState({ isOpen: false, password: '' });
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isQueueFinished, setIsQueueFinished] = useState(false);

  const visitedPatients = patients.filter(p => p.tokenNumber < currentLiveToken).sort((a,b) => a.tokenNumber - b.tokenNumber);
  const currentConsultingPatient = patients.find(p => p.tokenNumber === currentLiveToken);
  const waitingPatients = patients.filter(p => p.tokenNumber > currentLiveToken).sort((a,b) => a.tokenNumber - b.tokenNumber);
  
  const deletedCount = deletedPatients.length;
  const isNextDisabled = totalTokensDistributed === 0;

  useEffect(() => {
    if (totalTokensDistributed > currentLiveToken) setIsQueueFinished(false);
  }, [totalTokensDistributed, currentLiveToken]);

  useEffect(() => {
    if (!socket) return;
    socket.on('reset-status-response', (data) => {
      if (data.success) {
        setAlertModal({ isOpen: true, title: 'Success', message: data.message || 'System Reset Successful!', icon: '✅' });
        setIsQueueFinished(false);
      } else {
        setAlertModal({ isOpen: true, title: 'Error', message: data.message || 'Error occurred.', icon: '🚨' });
      }
    });
    return () => socket.off('reset-status-response');
  }, [socket]);

  const triggerDeleteModal = (id, tokenNumber) => setDeleteModal({ isOpen: true, id, tokenNumber });
  
  const executeAdminDelete = () => { 
    const targetPatient = patients.find(p => String(p._id) === String(deleteModal.id) || Number(p.tokenNumber) === Number(deleteModal.tokenNumber));
    const deleteTimestamp = new Date();
    if (targetPatient) {
      setDeletedPatients(prev => {
        const exists = prev.some(p => String(p._id) === String(targetPatient._id) && new Date(p.deletedAt).toDateString() === deleteTimestamp.toDateString());
        if (exists) return prev;
        return [...prev, { ...targetPatient, deletedAt: deleteTimestamp }];
      });
    } else {
      setDeletedPatients(prev => [...prev, { _id: deleteModal.id || Date.now(), tokenNumber: deleteModal.tokenNumber, name: `Token #${deleteModal.tokenNumber}`, mobileNumber: "N/A", createdAt: deleteTimestamp, deletedAt: deleteTimestamp }]);
    }
    socket.emit('admin-delete-patient', { id: deleteModal.id }); 
    setDeleteModal({ isOpen: false, id: '', tokenNumber: '' }); 
  };
  
  const triggerEditModal = (id, name, tokenNumber, mobileNumber) => setEditModal({ isOpen: true, id, name, tokenNumber, mobileNumber: mobileNumber || '' });
  
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
    if (e) e.preventDefault();
    if (!resetModal.password || resetModal.password.trim() === "") return;
    if (patients.length > 0) {
      const resetTime = new Date();
      setDeletedPatients(prev => {
        const existingIds = new Set(prev.map(p => String(p._id)));
        const newItems = patients.filter(p => !existingIds.has(String(p._id))).map(p => ({ ...p, deletedAt: resetTime }));
        return [...prev, ...newItems];
      });
    }
    socket.emit('reset-entire-queue', { username, password: resetModal.password.trim() });
    setResetModal({ isOpen: false, password: '' });
  };

  const executeClearHistory = (e) => {
    if (e) e.preventDefault();
    if (!clearHistoryModal.password || clearHistoryModal.password.trim() === "") return;
    localStorage.removeItem('hospital_deleted_patients_history');
    setDeletedPatients([]);
    setClearHistoryModal({ isOpen: false, password: '' });
    setAlertModal({ isOpen: true, title: 'Success', message: 'Deleted history cleared successfully!', icon: '✅' });
  };

  const handleManualCheckin = async (e) => {
    e.preventDefault(); if (!walkInName.trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientName: walkInName, mobileNumber: walkInMobile.trim() || "Walk-In Parchi" }) });
      const data = await res.json();
      if (res.ok) { setGeneratedParchi({ token: data.myToken, name: data.patientName }); setWalkInName(''); setWalkInMobile(''); }
    } catch (err) {}
  };

  const handleNextToken = () => {
    if (currentLiveToken >= totalTokensDistributed && totalTokensDistributed > 0) setShowFinishModal(true);
    else if (socket) socket.emit('next-token');
  };

  const handlePrevToken = () => {
    setIsQueueFinished(false);
    if (socket) socket.emit('prev-token');
  };

  const handleConfirmFinish = () => {
    setShowFinishModal(false);
    setIsQueueFinished(true);
  };

  return (
    <div className="admin-layout" style={{ height: '100dvh', overflow: 'hidden', display: 'flex', width: '100%' }}>
      <AdminSidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        isNextDisabled={isNextDisabled} 
        socket={socket} 
        setResetModal={setResetModal}
        totalTokensToday={totalTokensDistributed}
        completedCount={visitedPatients.length}
        inProgressCount={currentConsultingPatient && !isQueueFinished ? 1 : 0}
        remainingCount={waitingPatients.length}
        deletedCount={deletedCount}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      <main className="admin-main" style={{ flex: 1, overflowY: 'auto', height: '100dvh' }}>
        <AdminNavbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} username={username} onLogout={onLogout} isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen} />

        <div className="dashboard-content" style={{ paddingBottom: isMobile ? '20px' : '0' }}>
          
          {!isMobile && (
            <>
              <div className="page-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                <h1 style={{ margin: 0, fontSize: '26px', color: '#0F172A', fontWeight: '800', letterSpacing: '-0.5px' }}>Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ margin: 0, fontWeight: '800', fontSize: '15px', background: 'linear-gradient(90deg, #2563EB, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.2px' }}>
                    {getGreeting()}!
                  </span>
                  <span style={{ fontSize: '12px', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', padding: '6px 16px', borderRadius: '24px', color: '#475569', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      <span style={{ color: '#3B82F6', fontSize: '13px' }}>⏱️</span> {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      <span style={{ color: '#CBD5E1', margin: '0 2px' }}>|</span> 
                      <span style={{ color: '#10B981', fontSize: '13px' }}>📅</span> {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <StatsGrid totalTokensToday={totalTokensDistributed} completedCount={visitedPatients.length} inProgressCount={currentConsultingPatient && !isQueueFinished ? 1 : 0} remainingCount={waitingPatients.length} deletedCount={deletedCount} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            </>
          )}

          <div className="workspace-grid" style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: isMobile ? 'none' : '1fr 1fr', flexDirection: isMobile ? 'column' : '', gap: '15px', marginTop: isMobile ? '10px' : '0' }}>
            
            <div className="left-stack" style={{ order: isMobile ? 2 : 1 }}>
              {isQueueFinished ? (
                <div className="glass-card pulse-anim" style={{ padding: '40px 20px', borderRadius: '20px', backgroundColor: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', border: '3px solid #10B981' }}>
                  <style>{`@keyframes pop { 0% {transform: scale(0.8)} 50% {transform: scale(1.1)} 100% {transform: scale(1)} }`}</style>
                  <div style={{ fontSize: '55px', marginBottom: '10px', animation: 'pop 0.5s ease' }}>✅</div>
                  <h3 style={{ color: '#059669', margin: '0 0 10px 0', fontSize: '22px', fontWeight: '900' }}>All Tokens Visited!</h3>
                  <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: '600' }}>The current session has been completed.</p>
                  <button onClick={() => setIsQueueFinished(false)} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>View Counter Again</button>
                </div>
              ) : (
                <LiveCounter currentLiveToken={currentLiveToken} socket={socket} isNextDisabled={isNextDisabled} onNext={handleNextToken} onPrevious={handlePrevToken} />
              )}

              {!isMobile && (
                <ManualParchi walkInName={walkInName} setWalkInName={setWalkInName} walkInMobile={walkInMobile} setWalkInMobile={setWalkInMobile} handleManualCheckin={handleManualCheckin} generatedParchi={generatedParchi} />
              )}
            </div>

            <div style={{ 
              order: isMobile ? 1 : 2, 
              width: '100%', 
              height: isMobile ? '40dvh' : 'calc(100dvh - 160px)', 
              display: 'flex',
              flexDirection: 'column'
            }}>
              <PatientFlowBoard
                isMobile={isMobile}
                activeFilter={activeFilter} 
                visitedPatients={visitedPatients} 
                currentConsultingPatient={currentConsultingPatient} 
                waitingPatients={waitingPatients} 
                deletedPatients={deletedPatients}
                triggerEditModal={triggerEditModal} 
                triggerDeleteModal={triggerDeleteModal} 
                maskMobileNumber={maskMobileNumber}
                onClearHistory={() => setClearHistoryModal({ isOpen: true, password: '' })}
              />
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
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
            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Mobile</label>
            <input type="text" value={editModal.mobileNumber} onChange={(e) => setEditModal({...editModal, mobileNumber: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ padding: '14px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>Save Changes</button>
        </form>
      </BeautifulModal>

      <BeautifulModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ isOpen: false, title: '', message: '', icon: '' })} title={alertModal.title} icon={alertModal.icon}>
        <p style={{ margin: '0 0 20px 0', fontSize: '15px', textAlign: 'center', color: '#475569', fontWeight: '500' }}>{alertModal.message}</p>
        <button onClick={() => setAlertModal({ isOpen: false, title: '', message: '', icon: '' })} style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: alertModal.title === 'Success' ? '#10B981' : '#EF4444', color: '#FFFFFF' }}>OK</button>
      </BeautifulModal>

    </div>
  );
}