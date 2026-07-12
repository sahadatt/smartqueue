import React from 'react';

// 1. Component ka function banayein
const PatientCard = () => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px', borderRadius: '5px' }}>
      <h4>🧑‍⚕️ Patient Name: Sahadat</h4>
      <p>Token Status: Waiting</p>
    </div>
  );
};

// 2. Ise export karein taaki doosri files me use ho sake
export default PatientCard;