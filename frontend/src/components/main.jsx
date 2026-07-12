// 1. Sabse upar naye component ko import karo
import React from 'react';
import PatientCard from './components/PatientCard'; // ✅ Naya component import kiya

// 2. Yeh aapka main App function hai
function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1>🏥 Clinic Dashboard</h1>
      <p>Welcome to the queue management system</p>

      <hr />

      {/* 👇 Aapka naya component yahan render (live) ho jayega */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        <PatientCard />
        <PatientCard /> 
      </div>

    </div>
  );
}

// 3. Sabse niche App ko export karo (yeh pehle se likha hoga)
export default App;