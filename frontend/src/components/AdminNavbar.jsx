import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiLogOut, FiChevronDown, FiCamera, FiEdit2, FiX, FiTrash2, FiAlertTriangle, FiClock, FiUsers } from 'react-icons/fi';

export default function AdminNavbar({ isSidebarOpen, setIsSidebarOpen, username, onLogout, isProfileMenuOpen, setIsProfileMenuOpen }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const profileRef = useRef(null); 
  const fileInputRef = useRef(null); 

  const [currentUsername, setCurrentUsername] = useState(() => {
    return localStorage.getItem('admin_username') || username;
  });

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUsername}&backgroundColor=e1ecf9`;
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('admin_profile_dp') || defaultAvatar;
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editUsername, setEditUsername] = useState(currentUsername);
  const [editPassword, setEditPassword] = useState("");
  const [editDoctorName, setEditDoctorName] = useState("");
  const [editClinicName, setEditClinicName] = useState("");
  const [editDegree, setEditDegree] = useState("");
  const [editMobile, setEditMobile] = useState("");
  
  const [editExpectedStartTime, setEditExpectedStartTime] = useState(""); 
  const [editTimePerPatient, setEditTimePerPatient] = useState(5); // 🌟 NAYA FIELD: Time Per Patient
  
  const [deletePassword, setDeletePassword] = useState(""); 

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
        const res = await fetch(`${BACKEND_URL}/api/auth/admin-profile`);
        const data = await res.json();
        
        if (res.ok) {
          if (data.username) {
            setCurrentUsername(data.username);
            setEditUsername(data.username);
            localStorage.setItem('admin_username', data.username);
          }
          if (data.profileImage) {
            setProfileImage(data.profileImage);
            localStorage.setItem('admin_profile_dp', data.profileImage);
          }
          if (data.doctorName) setEditDoctorName(data.doctorName);
          if (data.clinicName) setEditClinicName(data.clinicName);
          if (data.degree) setEditDegree(data.degree);
          if (data.mobile) setEditMobile(data.mobile);
          if (data.expectedStartTime !== undefined) setEditExpectedStartTime(data.expectedStartTime);
          
          // 🌟 Fetch time per patient
          if (data.timePerPatient !== undefined) setEditTimePerPatient(data.timePerPatient);
        }
      } catch (err) {
        console.error("Error fetching live profile from DB:", err);
      }
    };

    fetchLatestProfile();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, setIsProfileMenuOpen]);

  const handleDpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setProfileImage(compressedBase64);
          
          try {
            localStorage.setItem('admin_profile_dp', compressedBase64);
          } catch (err) {
            console.error("Storage error:", err);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage({ type: '', text: '' }); 

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
      
      const payload = {
        username: editUsername,
        profileImage: profileImage,
        doctorName: editDoctorName,
        clinicName: editClinicName,
        degree: editDegree,
        mobile: editMobile,
        expectedStartTime: editExpectedStartTime,
        timePerPatient: Number(editTimePerPatient) // 🌟 Bhejna
      };
      if (editPassword.trim() !== "") {
        payload.password = editPassword; 
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/update-admin`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('admin_username', editUsername);
        setCurrentUsername(editUsername);

        setStatusMessage({ type: 'success', text: "Profile Successfully Updated! ✅" });
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditPassword(""); 
          window.location.reload(); 
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: data.message || "Failed to update profile ❌" });
      }
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: "Error connecting to database! Make sure backend is running." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setStatusMessage({ type: 'error', text: "Password is required to delete account!" });
      return;
    }
    
    setIsDeleting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;
      const res = await fetch(`${BACKEND_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername, password: deletePassword })
      });
      
      const data = await res.json();

      if (res.ok) {
        setStatusMessage({ type: 'success', text: "Account deleted permanently. Logging out..." });
        setTimeout(() => {
          onLogout(); 
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: data.message || "Incorrect Password!" });
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage({ type: 'error', text: "Server error occurred." });
      setIsDeleting(false);
    }
  };

  const openEditModal = (e) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
    setIsProfileMenuOpen(false);
    setStatusMessage({ type: '', text: '' });
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>
      
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleDpChange} />

      <nav className="admin-navbar" style={{ position: 'relative', padding: isMobile ? '10px' : '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center' }}>
          {!isSidebarOpen && (
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} style={{ marginRight: isMobile ? '10px' : '15px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <FiMenu size={isMobile ? 20 : 24} />
            </button>
          )}
          
          <div className="hospital-brand" style={{ display: 'flex', alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <img src="/images/hospital-logo.webp" alt="Logo" style={{ height: isMobile ? '28px' : '42px', width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>

        <div className="nav-right" ref={profileRef} style={{ position: 'relative' }}>
          
          <div className="profile-box" onClick={(e) => { e.stopPropagation(); setIsProfileMenuOpen(!isProfileMenuOpen); }} 
            style={{ 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '6px',
              padding: isMobile ? '4px 8px' : '6px 10px', backgroundColor: isProfileMenuOpen ? '#F1F5F9' : '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '50px', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
            
            {!isMobile && (
              <img src="/images/logo.webp" alt="Logo" style={{ height: '24px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            )}

            <div style={{ position: 'relative', display: 'flex' }}>
              <img 
                src={profileImage} alt="Dr" className="profile-img" onError={(e) => { e.target.src = defaultAvatar; }} 
                style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: '50%', border: '2px solid #FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: isMobile ? '8px' : '10px', height: isMobile ? '8px' : '10px', backgroundColor: '#10B981', borderRadius: '50%', border: '2px solid #FFFFFF' }} />
            </div>
            
            {!isMobile && (
              <div className="profile-text" style={{ display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
                <span className="profile-name" style={{ fontSize: '14px', fontWeight: '800', color: '#0F2942' }}>{editDoctorName || currentUsername}</span>
                <span className="profile-role" style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '700', letterSpacing: '0.3px' }}>Administrator</span>
              </div>
            )}
            
            <FiChevronDown color="#64748B" size={isMobile ? 16 : 20} style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </div>

          {isProfileMenuOpen && (
            <div style={{ 
              position: 'absolute', top: '115%', right: '0', backgroundColor: '#FFFFFF', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderRadius: '12px', padding: '8px', zIndex: 100, minWidth: isMobile ? '160px' : '180px', border: '1px solid #F1F5F9'
            }}>
              
              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 12px 4px', borderBottom: '1px solid #E2E8F0', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F2942' }}>{editDoctorName || currentUsername}</span>
                  <button onClick={openEditModal} 
                    style={{ background: '#EFF6FF', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#3B82F6', display: 'flex' }}>
                    <FiEdit2 size={14} />
                  </button>
                </div>
              )}

              {!isMobile && (
                <button onClick={openEditModal} 
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', fontSize: '14px', backgroundColor: 'transparent', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '4px' }}>
                  <FiEdit2 size={18} /> Edit Profile
                </button>
              )}

              <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '4px 0' }} />

              <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: isMobile ? '10px' : '12px', fontSize: isMobile ? '13px' : '14px', backgroundColor: '#FFF1F2', color: '#E11D48', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                <FiLogOut size={isMobile ? 16 : 18} /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 🌟 EDIT PROFILE MODAL */}
      {isEditModalOpen && !isDeleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '15px', boxSizing: 'border-box' }}>
          <div className="custom-scrollbar" style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#0F2942', fontWeight: '800', textAlign: 'center' }}>Edit Profile</h2>
            
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
              <FiX size={18} />
            </button>
            
            {statusMessage.text && (
              <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center', backgroundColor: statusMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5', color: statusMessage.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${statusMessage.type === 'error' ? '#FCA5A5' : '#6EE7B7'}` }}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  <img src={profileImage} alt="Preview" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#3B82F6', borderRadius: '50%', padding: '8px', display: 'flex', border: '2px solid #FFF' }}>
                     <FiCamera size={14} color="#FFF" />
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Tap image to change</span>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Doctor's Name</label>
                <input type="text" value={editDoctorName} onChange={e => setEditDoctorName(e.target.value)} style={inputStyle} required placeholder="Dr. John Doe" />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Clinic / Hospital Name</label>
                <input type="text" value={editClinicName} onChange={e => setEditClinicName(e.target.value)} style={inputStyle} required placeholder="Life Care Clinic" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Degree</label>
                  <input type="text" value={editDegree} onChange={e => setEditDegree(e.target.value)} style={inputStyle} required placeholder="MBBS, MD" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Mobile</label>
                  <input type="tel" maxLength="10" value={editMobile} onChange={e => setEditMobile(e.target.value.replace(/\D/g, ''))} style={inputStyle} required placeholder="Phone Number" />
                </div>
              </div>

              {/* 🌟 NAYA BLOCK: Dono Settings sath me */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Doctor's Arrival Time
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiClock size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" value={editExpectedStartTime} onChange={e => setEditExpectedStartTime(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} placeholder="e.g. 5:00 PM" />
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Mins Per Patient
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiUsers size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="number" min="1" max="120" value={editTimePerPatient} onChange={e => setEditTimePerPatient(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} required />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>Login ID (Username)</label>
                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} style={inputStyle} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', display: 'block' }}>New Password <span style={{color: '#94A3B8', fontWeight: 'normal'}}>(Optional)</span></label>
                <input type="password" placeholder="Leave blank to keep current" value={editPassword} onChange={e => setEditPassword(e.target.value)} style={inputStyle} />
              </div>

              <button type="submit" disabled={isSaving} 
                style={{ width: '100%', padding: '14px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '5px', opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s' }}>
                {isSaving ? 'Saving Updates...' : 'Save Changes'}
              </button>

              <div style={{ height: '1px', backgroundColor: '#E2E8F0', margin: '10px 0' }} />

              <button type="button" onClick={() => setIsDeleteModalOpen(true)}
                style={{ width: '100%', padding: '12px', backgroundColor: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <FiTrash2 size={16} /> Delete Account Permanently
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 🌟 DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '25px', width: '100%', maxWidth: '350px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', textAlign: 'center' }}>
            
            <div style={{ backgroundColor: '#FEF2F2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#EF4444' }}>
              <FiAlertTriangle size={30} />
            </div>

            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F2942', fontWeight: '800' }}>Are you absolutely sure?</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
              This action cannot be undone. This will permanently delete your account, patient queue, and all settings. 
            </p>

            {statusMessage.text && (
              <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', backgroundColor: statusMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5', color: statusMessage.type === 'error' ? '#DC2626' : '#059669', border: `1px solid ${statusMessage.type === 'error' ? '#FCA5A5' : '#6EE7B7'}` }}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleDeleteAccount}>
              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'block' }}>Enter password to confirm:</label>
                <input 
                  type="password" 
                  value={deletePassword} 
                  onChange={e => setDeletePassword(e.target.value)} 
                  style={{ ...inputStyle, borderColor: '#EF4444' }} 
                  required 
                  placeholder="Your Admin Password"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setStatusMessage({type: '', text: ''}); setDeletePassword(""); }} 
                  style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isDeleting} 
                  style={{ flex: 1, padding: '12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
                  {isDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </form>
            
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle = { 
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', 
  boxSizing: 'border-box', outline: 'none', fontSize: '13px', backgroundColor: '#F8FAFC', transition: 'all 0.2s ease' 
};