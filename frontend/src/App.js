import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';

// Components
import Auth from './components/Login'; 
import PatientView from './components/WaitingRoom';
import PatientCheckin from './components/PatientCheckin';
import AdminPanel from './components/AdminPanel';
import BeautifulModal from './components/PopupAlert';

import './App.css';
import './index.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
const socket = io(BACKEND_URL);

function App() {
  useEffect(() => {
    const imagesToPreload = [
      "/images/plate-bg.webp",
      "/images/serving.webp",
      "/images/namaste.webp",
      "/images/doctor.webp",
      "/images/people.webp",
      "/images/hospital-logo.webp",
      "/images/people.webp",
      "/images/hourglass.webp"
    ];

    imagesToPreload.forEach((imageSrc) => {
      const preloadImage = new Image();
      preloadImage.src = imageSrc;
    });
  }, []);
  
  const [currentLiveToken, setCurrentLiveToken] = useState(1);
  const [totalTokensDistributed, setTotalTokensDistributed] = useState(0); 
  const [patients, setPatients] = useState([]);
  const [initialLoad, setInitialLoad] = useState(false);
  
  // 🌟 FIX: Checking both storages (Local and Session) to ensure the token is not missed
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [adminUser, setAdminUser] = useState(localStorage.getItem('username') || sessionStorage.getItem('username'));
  
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: 'System Info', icon: 'ℹ️' });

  useEffect(() => {
    socket.on('queue-updated', (data) => { 
      setCurrentLiveToken(data.currentToken); 
      setTotalTokensDistributed(data.totalTokensDistributed || 0); 
      setPatients(data.patients); 
      setInitialLoad(true); 
    });
    
    socket.on('reset-status-response', (res) => { 
      setAlertModal({ isOpen: true, title: res.success ? 'Success' : 'Access Denied', icon: res.success ? '✅' : '❌', message: res.message }); 
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
        <Route path="/admin" element={
          authToken ? 
            <AdminPanel 
              currentLiveToken={currentLiveToken} 
              totalTokensDistributed={totalTokensDistributed} 
              patients={patients} 
              username={adminUser} 
              socket={socket} 
              onLogout={() => { 
                localStorage.clear(); 
                sessionStorage.clear(); 
                setAuthToken(null); 
                window.location.reload(); 
              }} 
            /> 
            : 
            <Auth onLoginSuccess={(user) => { 
              // 🌟 FIX: Set state immediately upon login so the dashboard opens without a page reload
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              setAuthToken(token);
              setAdminUser(user);
            }} />
        } />
      </Routes>
      
      {/* Premium System Alert Modal */}
      <BeautifulModal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title} icon={alertModal.icon}>
        <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '15px', textAlign: 'center', fontWeight: '500' }}>
          {alertModal.message}
        </p>
        <button 
          onClick={() => setAlertModal({ ...alertModal, isOpen: false })} 
          style={{ 
            width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            backgroundColor: alertModal.icon === '✅' ? '#10B981' : '#EF4444', 
            color: '#FFFFFF',
            boxShadow: alertModal.icon === '✅' ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
          }}
        >
          {alertModal.icon === '✅' ? 'Awesome, Thanks!' : 'Understood'}
        </button>
      </BeautifulModal>
    </Router>
  );
}

export default App;