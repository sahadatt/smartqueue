import React, { useState } from 'react';
import { FiLoader, FiActivity, FiUser, FiLock, FiEye, FiEyeOff, FiChevronRight, FiAlertCircle, FiShield } from 'react-icons/fi';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [focusedInput, setFocusedInput] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setError('');
    setUsernameError('');
    setPasswordError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    let isValid = true;
    if (!username.trim()) { setUsernameError('Please fill out this field.'); isValid = false; } else { setUsernameError(''); }
    if (!password.trim()) { setPasswordError('Please fill out this field.'); isValid = false; } else { setPasswordError(''); }
    if (!isValid) return;

    setMessage('');
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ username: username.trim(), password }) 
        });
        const data = await res.json();
        if (res.ok) {
          if (rememberMe) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
          } else {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
          }
          if (onLoginSuccess) onLoginSuccess(data.username);
        } else {
          throw new Error(data.message || 'Login fail ho gaya!');
        }
      } else {
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ username: username.trim(), password }) 
        });
        const data = await res.json();
        if (res.ok) {
          setMessage('Registration successful! Ab aap login kar sakte hain.');
          setIsLogin(true);
          setPassword('');
        } else {
          throw new Error(data.message || 'Registration fail hua!');
        }
      }
    } catch (err) {
      setError(err.message || 'Server se connect nahi ho pa raha hai.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.checkinPageWrapper}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .loading-spinner { animation: spin 1s linear infinite; }`}</style>
      <div style={styles.checkinContainer}>
        <div style={styles.bgPlusLeft}>✚</div>
        <div style={styles.bgPlusRight}>✚</div>
        <div style={styles.bgWaveBottom}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={styles.checkinTopSection}>
            <div style={styles.checkinLogoCircle}>
              <div style={styles.clipboardBody}>
                <div style={styles.clipboardTop}></div>
                <div style={styles.clipboardCrossBox}>✚</div>
                <div style={styles.clipboardLine}></div>
                <div style={styles.clipboardLine}></div>
                <div style={styles.clipboardLineShort}></div>
              </div>
            </div>
            <h1 style={styles.checkinTitle}>Clinic {isLogin ? 'Login' : 'Signup'}</h1>
            <p style={styles.checkinSubtitle}>{isLogin ? 'Welcome back! Please enter your details.' : 'Create your admin account to get started.'}</p>
            <div style={styles.checkinDividerWrapper}>
              <div style={styles.checkinLine}></div>
              <FiActivity size={16} color="#93C5FD" />
              <div style={styles.checkinLine}></div>
            </div>
          </div>

          {message && <div style={styles.successTextBanner}>{message}</div>}
          {error && <div style={styles.errorTextBanner}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={styles.checkinLabel}>
                <div style={styles.checkinLabelIcon}><FiUser size={12} color="#1A73E8"/></div>Username
              </label>
              <div style={{ ...styles.checkinInputWrapper, borderColor: usernameError ? '#EF4444' : (focusedInput === 'username' ? '#1A73E8' : '#E2E8F0'), boxShadow: focusedInput === 'username' ? '0 0 0 3px rgba(26,115,232,0.1)' : 'none' }}>
                <input 
                  type="text" 
                  placeholder="Enter Username" 
                  value={username} 
                  onChange={(e) => {setUsername(e.target.value); setUsernameError('');}} 
                  onFocus={() => setFocusedInput('username')} 
                  onBlur={() => setFocusedInput(null)} 
                  style={styles.checkinInput} 
                />
                <FiUser size={18} color="#94A3B8" />
              </div>
              {usernameError && <div style={styles.checkinErrorText}><FiAlertCircle size={10}/> {usernameError}</div>}
            </div>

            <div>
              <label style={styles.checkinLabel}>
                <div style={styles.checkinLabelIcon}><FiLock size={12} color="#1A73E8"/></div>Password
              </label>
              <div style={{ ...styles.checkinInputWrapper, borderColor: passwordError ? '#EF4444' : (focusedInput === 'password' ? '#1A73E8' : '#E2E8F0'), boxShadow: focusedInput === 'password' ? '0 0 0 3px rgba(26,115,232,0.1)' : 'none' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter Password" 
                  value={password} 
                  onChange={(e) => {setPassword(e.target.value); setPasswordError('');}} 
                  onFocus={() => setFocusedInput('password')} 
                  onBlur={() => setFocusedInput(null)} 
                  style={styles.checkinInput} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <FiEyeOff size={18} color="#94A3B8" /> : <FiEye size={18} color="#94A3B8" />}
                </button>
              </div>
              {passwordError && <div style={styles.checkinErrorText}><FiAlertCircle size={10}/> {passwordError}</div>}
            </div>

            {isLogin && (
              <div style={styles.optionsRow}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" style={styles.checkbox} checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...styles.checkinSubmitBtn, justifyContent: loading ? 'center' : 'flex-start', opacity: loading ? 0.85 : 1 }}>
              {loading ? (
                <><FiLoader size={18} className="loading-spinner" /><span>Processing...</span></>
              ) : (
                <><FiUser size={16} /><span>{isLogin ? 'Login to Dashboard' : 'Create Account'}</span><div style={{ flexGrow: 1 }}></div><FiChevronRight size={18} /></>
              )}
            </button>
          </form>

          <div style={styles.checkinFooterText}>
            <FiShield size={12} color="#2563EB" /> Your Health, Our Priority
          </div>

          <p style={styles.toggleText}>
            {isLogin ? (
              <>Naya account banana hai? <span onClick={handleModeSwitch} style={styles.link}>Signup karein</span></>
            ) : (
              <>Pehle se account hai? <span onClick={handleModeSwitch} style={styles.link}>Login karein</span></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  checkinPageWrapper: { backgroundColor: "#E8F0FE", background: "url('/images/checkin-bg.png') no-repeat center center", backgroundSize: 'cover', minHeight: '100vh', padding: '20px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
  checkinContainer: { backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' },
  bgPlusLeft: { position: 'absolute', top: '20px', left: '15px', fontSize: '50px', color: '#EFF6FF', fontWeight: '900', zIndex: 0, userSelect: 'none' },
  bgPlusRight: { position: 'absolute', top: '40px', right: '10px', fontSize: '80px', color: '#EFF6FF', fontWeight: '900', zIndex: 0, userSelect: 'none' },
  bgWaveBottom: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '110px', background: "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 1440 320\" xmlns=\"http://www.w3.org/2000/svg\"><path fill=\"%23EFF6FF\" fill-opacity=\"1\" d=\"M0,224L48,229.3C96,235,192,245,288,229.3C384,213,480,171,576,154.7C672,139,768,149,864,165.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>')", backgroundSize: 'cover', backgroundPosition: 'bottom', zIndex: 0 },
  checkinTopSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' },
  checkinLogoCircle: { backgroundColor: '#FFFFFF', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px', boxShadow: '0 10px 25px rgba(37,99,235,0.15)', position: 'relative' },
  clipboardBody: { backgroundColor: '#2563EB', width: '26px', height: '34px', borderRadius: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '6px', gap: '3px', position: 'relative' },
  clipboardTop: { position: 'absolute', top: '-4px', backgroundColor: '#93C5FD', width: '12px', height: '6px', borderRadius: '2px' },
  clipboardCrossBox: { backgroundColor: '#FFFFFF', width: '13px', height: '13px', borderRadius: '3px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#2563EB', fontSize: '10px', fontWeight: '900', marginBottom: '1px' },
  clipboardLine: { backgroundColor: '#FFFFFF', width: '15px', height: '2px', borderRadius: '2px', opacity: 0.9 },
  clipboardLineShort: { backgroundColor: '#FFFFFF', width: '10px', height: '2px', borderRadius: '2px', opacity: 0.9, alignSelf: 'flex-start', marginLeft: '6px' },
  checkinTitle: { fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
  checkinSubtitle: { fontSize: '12px', color: '#64748B', fontWeight: '500', margin: 0, textAlign: 'center' },
  checkinDividerWrapper: { display: 'flex', alignItems: 'center', gap: '8px', width: '60%', marginTop: '12px' },
  checkinLine: { height: '1px', flexGrow: 1, backgroundColor: '#E2E8F0' },
  checkinLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' },
  checkinLabelIcon: { backgroundColor: '#EFF6FF', padding: '5px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  checkinInputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid', borderRadius: '12px', padding: '3px 14px', backgroundColor: '#FFFFFF', transition: 'all 0.2s ease' },
  checkinInput: { border: 'none', outline: 'none', padding: '9px 0', width: '100%', fontSize: '14px', color: '#334155', fontWeight: '500', background: 'transparent' },
  eyeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  checkinErrorText: { color: '#EF4444', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', paddingLeft: '4px' },
  optionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '2px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
  checkbox: { cursor: 'pointer', accentColor: '#2563EB' },
  checkinSubmitBtn: { background: 'linear-gradient(to right, #2563EB, #1D4ED8)', color: '#FFFFFF', border: 'none', borderRadius: '14px', padding: '13px 18px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.3)', marginTop: '4px', transition: 'transform 0.2s', width: '100%', boxSizing: 'border-box' },
  checkinFooterText: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '11px', color: '#64748B', fontWeight: '600' },
  successTextBanner: { background: '#D1FAE5', color: '#065F46', padding: '8px', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'center' },
  errorTextBanner: { background: '#FEE2E2', color: '#991B1B', padding: '8px', borderRadius: '8px', marginBottom: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'center' },
  toggleText: { marginTop: '8px', color: '#64748B', fontSize: '12px', textAlign: 'center', fontWeight: '500' },
  link: { color: '#2563EB', cursor: 'pointer', fontWeight: '700' }
};