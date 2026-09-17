import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiLoader, FiActivity, FiUser, FiPhone, FiChevronRight, FiSmartphone, FiAlertCircle, FiFileText, FiGlobe } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

const checkinTranslations = {
  en: {
    selectLangTitle: "Select Language",
    selectLangSub: "Please choose your preferred language to proceed",
    englishBtn: "English",
    hindiBtn: "हिंदी",
    title: "Clinic Check-in",
    subtitle: "Welcome! Please enter your details to get started.",
    fullName: "Full Name",
    namePlaceholder: "Enter your name",
    mobileNumber: "Mobile Number",
    mobilePlaceholder: "Enter 10-digit mobile number",
    btnText: "Get Token Number",
    loadingText: "Generating token...",
    footerText: "Your Health, Our Priority",
    errorField: "Please fill out this field.",
    errorMobile: "Please enter a valid 10-digit number."
  },
  hi: {
    selectLangTitle: "भाषा चुनें / Select Language",
    selectLangSub: "आगे बढ़ने के लिए अपनी भाषा चुनें",
    englishBtn: "English",
    hindiBtn: "हिंदी",
    title: "क्लिनिक चेक-इन",
    subtitle: "स्वागत है! टोकन लेने के लिए नीचे जानकारी भरें।",
    fullName: "आपका नाम",
    namePlaceholder: "अपना पूरा नाम यहाँ लिखें",
    mobileNumber: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर डालें",
    btnText: "टोकन लें",
    loadingText: "टोकन बन रहा है...",
    footerText: "आपकी सेहत, हमारी प्राथमिकता",
    errorField: "कृपया यह नाम वाला बॉक्स भरें।",
    errorMobile: "कृपया सही 10 अंकों का मोबाइल नंबर डालें।"
  }
};

export default function PatientCheckin() {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || null);
  const [isExiting, setIsExiting] = useState(false);
  const t = checkinTranslations[lang || 'en'];

  const [name, setName] = useState(''); 
  const [mobile, setMobile] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [redirect, setRedirect] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [nameError, setNameError] = useState('');
  const [mobileError, setMobileError] = useState('');

  const handleLanguageSelect = (selectedLang) => {
    setIsExiting(true);
    setTimeout(() => {
      setLang(selectedLang);
      setIsExiting(false);
      localStorage.setItem('app_lang', selectedLang);
    }, 300);
  };

  const handleGetToken = async (e) => {
    e.preventDefault(); 
    let isValid = true;
    if (!name.trim()) { setNameError(t.errorField); isValid = false; } else { setNameError(''); }
    if (!mobile.trim() || mobile.trim().length < 10) { setMobileError(t.errorMobile); isValid = false; } else { setMobileError(''); }
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/patient-checkin`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ patientName: name, mobileNumber: mobile.trim() }) 
      });
      const data = await res.json();
      if (res.ok) { 
        localStorage.removeItem('q_target_ms');
        localStorage.removeItem('q_live_token');
        localStorage.removeItem('q_my_token');
        localStorage.removeItem('q_expected_str');
        localStorage.removeItem('q_abs_time');

        localStorage.setItem('myToken', data.myToken); 
        localStorage.setItem('patientName', data.patientName); 
        localStorage.setItem('patientId', data.patientId); 
        setRedirect(true); 
      }
    } catch (err) {}
    setLoading(false);
  };

  if (redirect || localStorage.getItem('myToken')) return <Navigate to="/" />;

  if (!lang) {
    return (
      <div style={styles.checkinPageWrapper}>
        <style>{`
          @keyframes zoomIn {
            0% { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes zoomOut {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.85); opacity: 0; }
          }
          .popup-enter { animation: zoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .popup-exit { animation: zoomOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important; }
          .lang-btn { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important; }
          .lang-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 20px rgba(37,99,235,0.2) !important; }
          .lang-btn:active { transform: scale(0.97) !important; }
        `}</style>
        
        <div className={`popup-enter ${isExiting ? 'popup-exit' : ''}`} style={styles.checkinContainer}>
          <div style={styles.checkinTopSection}>
            <div style={styles.checkinLogoCircle}><FiGlobe size={28} color="#2563EB" /></div>
            <h1 style={styles.checkinTitle}>{checkinTranslations.en.selectLangTitle}</h1>
            <p style={styles.checkinSubtitle}>{checkinTranslations.en.selectLangSub}</p>
            <div style={styles.checkinDividerWrapper}><div style={styles.checkinLine}></div><FiActivity size={16} color="#93C5FD" /><div style={styles.checkinLine}></div></div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <button onClick={() => handleLanguageSelect('en')} className="lang-btn" style={styles.langBtnEnglish}>{checkinTranslations.en.englishBtn}</button>
            <button onClick={() => handleLanguageSelect('hi')} className="lang-btn" style={styles.langBtnHindi}>{checkinTranslations.en.hindiBtn}</button>
          </div>
          
          {/* 🔥 OLD FADED BLUE COLOR WITH NEW ICON SHAPE */}
          <div style={styles.checkinFooterText}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            {checkinTranslations.en.footerText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.checkinPageWrapper}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } } 
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes zoomInForm { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .form-enter { animation: zoomInForm 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      
      <div className={`form-enter ${isExiting ? 'popup-exit' : ''}`} style={styles.checkinContainer}>
        <div style={styles.bgPlusLeft}>✚</div><div style={styles.bgPlusRight}>✚</div><div style={styles.bgWaveBottom}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
            <button onClick={() => { setIsExiting(true); setTimeout(() => { setLang(null); setIsExiting(false); }, 300); }} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiGlobe size={11} /> {lang === 'en' ? 'Change Lang (भाषा)' : 'भाषा बदलें (Lang)'}
            </button>
          </div>
          <div style={styles.checkinTopSection}>
            <div style={styles.checkinLogoCircle}>
              <div style={styles.clipboardBody}><div style={styles.clipboardTop}></div><div style={styles.clipboardCrossBox}>✚</div><div style={styles.clipboardLine}></div><div style={styles.clipboardLine}></div><div style={styles.clipboardLineShort}></div></div>
            </div>
            <h1 style={styles.checkinTitle}>{t.title}</h1>
            <p style={styles.checkinSubtitle}>{t.subtitle}</p>
            <div style={styles.checkinDividerWrapper}><div style={styles.checkinLine}></div><FiActivity size={16} color="#93C5FD" /><div style={styles.checkinLine}></div></div>
          </div>
          <form onSubmit={handleGetToken} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={styles.checkinLabel}><div style={styles.checkinLabelIcon}><FiUser size={12} color="#1A73E8"/></div>{t.fullName}</label>
              <div style={{ ...styles.checkinInputWrapper, borderColor: nameError ? '#EF4444' : (focusedInput === 'name' ? '#1A73E8' : '#E2E8F0'), boxShadow: focusedInput === 'name' ? '0 0 0 3px rgba(26,115,232,0.1)' : 'none' }}>
                <input type="text" placeholder={t.namePlaceholder} value={name} onChange={(e) => {setName(e.target.value); setNameError('');}} onFocus={() => setFocusedInput('name')} onBlur={() => setFocusedInput(null)} style={styles.checkinInput} />
                <FiUser size={18} color="#94A3B8" />
              </div>
              {nameError && <div style={styles.checkinErrorText}><FiAlertCircle size={10}/> {nameError}</div>}
            </div>
            <div>
              <label style={styles.checkinLabel}><div style={styles.checkinLabelIcon}><FiSmartphone size={12} color="#1A73E8"/></div>{t.mobileNumber}</label>
              <div style={{ ...styles.checkinInputWrapper, borderColor: mobileError ? '#EF4444' : (focusedInput === 'mobile' ? '#1A73E8' : '#E2E8F0'), boxShadow: focusedInput === 'mobile' ? '0 0 0 3px rgba(26,115,232,0.1)' : 'none' }}>
                <input type="tel" maxLength="10" placeholder={t.mobilePlaceholder} value={mobile} onChange={(e) => {setMobile(e.target.value.replace(/\D/g, '')); setMobileError('');}} onFocus={() => setFocusedInput('mobile')} onBlur={() => setFocusedInput(null)} style={styles.checkinInput} />
                <FiPhone size={18} color="#94A3B8" />
              </div>
              {mobileError && <div style={styles.checkinErrorText}><FiAlertCircle size={10}/> {mobileError}</div>}
            </div>
            <button type="submit" disabled={loading} style={{ ...styles.checkinSubmitBtn, justifyContent: loading ? 'center' : 'flex-start', opacity: loading ? 0.85 : 1 }}>
              {loading ? (<><FiLoader size={18} className="loading-spinner" /><span>{t.loadingText}</span></>) : (<><FiFileText size={16} /><span>{t.btnText}</span><div style={{ flexGrow: 1 }}></div><FiChevronRight size={18} /></>)}
            </button>
          </form>
          
          {/* 🔥 OLD FADED BLUE COLOR WITH NEW ICON SHAPE */}
          <div style={styles.checkinFooterText}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            {t.footerText}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  checkinPageWrapper: { backgroundColor: "#E8F0FE", background: "url('/images/checkin-bg.png') no-repeat center center", backgroundSize: 'cover', minHeight: '100vh', padding: '20px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  checkinContainer: { backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '360px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' },
  bgPlusLeft: { position: 'absolute', top: '20px', left: '15px', fontSize: '50px', color: '#EFF6FF', fontWeight: '900', zIndex: 0, userSelect: 'none' },
  bgPlusRight: { position: 'absolute', top: '40px', right: '10px', fontSize: '80px', color: '#EFF6FF', fontWeight: '900', zIndex: 0, userSelect: 'none' },
  bgWaveBottom: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '110px', background: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 1440 320\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"%23EFF6FF\" fill-opacity=\"1\" d=\"M0,224L48,229.3C96,235,192,245,288,229.3C384,213,480,171,576,154.7C672,139,768,149,864,165.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>')", backgroundSize: 'cover', backgroundPosition: 'bottom', zIndex: 0 },
  checkinTopSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '18px' },
  checkinLogoCircle: { backgroundColor: '#FFFFFF', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', boxShadow: '0 10px 25px rgba(37,99,235,0.15)', position: 'relative' },
  clipboardBody: { backgroundColor: '#2563EB', width: '26px', height: '34px', borderRadius: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '6px', gap: '3px', position: 'relative' },
  clipboardTop: { position: 'absolute', top: '-4px', backgroundColor: '#93C5FD', width: '12px', height: '6px', borderRadius: '2px' },
  clipboardCrossBox: { backgroundColor: '#FFFFFF', width: '13px', height: '13px', borderRadius: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563EB', fontSize: '10px', fontWeight: '900', marginBottom: '1px' },
  clipboardLine: { backgroundColor: '#FFFFFF', width: '15px', height: '2px', borderRadius: '2px', opacity: 0.9 },
  clipboardLineShort: { backgroundColor: '#FFFFFF', width: '10px', height: '2px', borderRadius: '2px', opacity: 0.9, alignSelf: 'flex-start', marginLeft: '6px' },
  checkinTitle: { fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px 0', letterSpacing: '-0.5px', textAlign: 'center' },
  checkinSubtitle: { fontSize: '12px', color: '#64748B', fontWeight: '500', margin: 0, textAlign: 'center' },
  checkinDividerWrapper: { display: 'flex', alignItems: 'center', gap: '8px', width: '60%', marginTop: '16px' },
  checkinLine: { height: '1px', flexGrow: 1, backgroundColor: '#E2E8F0' },
  checkinLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' },
  checkinLabelIcon: { backgroundColor: '#EFF6FF', padding: '5px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  checkinInputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid', borderRadius: '12px', padding: '4px 14px', backgroundColor: '#FFFFFF', transition: 'all 0.2s ease' },
  checkinInput: { border: 'none', outline: 'none', padding: '10px 0', width: '100%', fontSize: '14px', color: '#334155', fontWeight: '500', background: 'transparent' },
  checkinErrorText: { color: '#EF4444', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', paddingLeft: '4px' },
  checkinSubmitBtn: { background: 'linear-gradient(to right, #2563EB, #1D4ED8)', color: '#FFFFFF', border: 'none', borderRadius: '14px', padding: '14px 18px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.3)', marginTop: '8px', transition: 'transform 0.2s' },
  checkinFooterText: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', fontSize: '11.5px', color: '#64748B', fontWeight: '600' },
  langBtnEnglish: { width: '100%', padding: '14px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
  langBtnHindi: { width: '100%', padding: '14px', background: '#F8FAFC', color: '#1E293B', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
};