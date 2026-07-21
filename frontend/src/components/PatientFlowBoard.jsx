import React, { useRef, useEffect, useState } from 'react';
import { FiCheckSquare, FiActivity, FiLoader, FiEdit2, FiTrash2, FiPhone, FiClock, FiSearch } from 'react-icons/fi';

export default function PatientFlowBoard({ 
  visitedPatients, 
  currentConsultingPatient, 
  waitingPatients, 
  deletedPatients = [], 
  triggerEditModal, 
  triggerDeleteModal,
  maskMobileNumber,
  activeFilter = 'all',
  onClearHistory // 🌟 Naya prop clear history modal trigger karne ke liye
}) {
  
  const visitedListRef = useRef(null);
  const [deletedSearchQuery, setDeletedSearchQuery] = useState('');

  useEffect(() => {
    if (visitedListRef.current) {
      requestAnimationFrame(() => {
        if (visitedListRef.current) {
          visitedListRef.current.scrollTop = visitedListRef.current.scrollHeight;
        }
      });
    }
  }, [visitedPatients]);

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

  return (
    <div className="glass-card" style={{ 
      backgroundColor: '#fff', 
      padding: '12px 15px', 
      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 220px)', 
      minHeight: '400px'
    }}>
       
       <style>{`
         .flow-scrollbar::-webkit-scrollbar { width: 4px; }
         .flow-scrollbar::-webkit-scrollbar-track { background: #F8FAFC; border-radius: 10px; margin: 4px 0; }
         .flow-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

         .glass-card {
           border-radius: 24px !important;
           overflow: hidden !important;
           border: 1px solid #E2E8F0 !important;
         }
       `}</style>

       {/* 1. RECENTLY COMPLETED */}
       {(activeFilter === 'all' || activeFilter === 'completed') && (
         <div style={{ display: 'flex', flexDirection: 'column', flex: activeFilter === 'completed' ? 1 : '0.8', minHeight: 0 }}>
           <h3 style={{ margin: '0 0 6px 0', color: '#10B981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
             <FiCheckSquare size={15} /> Recently Completed ({visitedPatients.length})
           </h3>
           <div ref={visitedListRef} className="flow-scrollbar" style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {visitedPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No completed patients yet.</div>
             ) : (
               visitedPatients.map((patient) => (
                 <div key={patient._id} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1FAE5', backgroundColor: '#F0FDF4', flexShrink: 0 }}>
                   <div style={{ fontWeight: '700', color: '#059669', fontSize: '13px', marginBottom: '2px' }}>
                     #{patient.tokenNumber} - {patient.name}
                   </div>
                   <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#10B981', fontWeight: '600' }}>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={10} /> {maskMobileNumber(patient.mobileNumber)}</span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={10} /> {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}</span>
                   </div>
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
                   #{currentConsultingPatient.tokenNumber} - {currentConsultingPatient.name}
                 </div>
                 <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#D97706', fontWeight: '600' }}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={11} /> {maskMobileNumber(currentConsultingPatient.mobileNumber)}</span>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={11} /> {formatTimeWithSeconds(currentConsultingPatient.createdAt || currentConsultingPatient.timestamp)}</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '6px' }}>
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
         <div style={{ display: 'flex', flexDirection: 'column', flex: activeFilter === 'remaining' ? 1 : '1', minHeight: 0 }}>
           <h3 style={{ margin: '0 0 6px 0', color: '#8B5CF6', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
             <FiLoader size={15} /> Waiting Line ({waitingPatients.length})
           </h3>
           <div className="flow-scrollbar" style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {waitingPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>Queue is empty.</div>
             ) : (
               waitingPatients.map((patient) => (
                 <div key={patient._id} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                   <div>
                     <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '13px', marginBottom: '2px' }}>
                       #{patient.tokenNumber} - {patient.name}
                     </div>
                     <div style={{ display: 'flex', gap: '15px', fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiPhone size={10} /> {maskMobileNumber(patient.mobileNumber)}</span>
                       <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><FiClock size={10} /> {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}</span>
                     </div>
                   </div>
                   <div style={{ display: 'flex', gap: '6px' }}>
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
           
           {/* Header with Title, Search Bar and Clear All Button */}
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: '0', gap: '8px' }}>
             <h3 style={{ margin: 0, color: '#EF4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
               <FiTrash2 size={15} /> Deleted / Reset History ({filteredDeletedPatients.length})
             </h3>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
               {/* Search Input Box */}
               <div style={{ position: 'relative', width: '160px' }}>
                 <FiSearch size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={deletedSearchQuery}
                   onChange={(e) => setDeletedSearchQuery(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '5px 8px 5px 26px',
                     borderRadius: '6px',
                     border: '1px solid #CBD5E1',
                     fontSize: '11px',
                     outline: 'none',
                     backgroundColor: '#F8FAFC',
                     boxSizing: 'border-box'
                   }}
                 />
               </div>

               {/* 🌟 Clear History Button */}
               <button 
                 onClick={onClearHistory}
                 style={{
                   padding: '5px 8px',
                   backgroundColor: '#FEE2E2',
                   color: '#DC2626',
                   border: '1px solid #FCA5A5',
                   borderRadius: '6px',
                   fontSize: '10px',
                   fontWeight: '700',
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '3px',
                   flexShrink: 0
                 }}
                 title="Clear All History with Password"
               >
                 <FiTrash2 size={11} /> Clear All
               </button>
             </div>
           </div>

           <div className="flow-scrollbar" style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             {filteredDeletedPatients.length === 0 ? (
               <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No deleted or reset records found.</div>
             ) : (
               filteredDeletedPatients.map((patient, index) => (
                 <div key={patient._id || index} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', flexShrink: 0 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                     <div style={{ fontWeight: '700', color: '#DC2626', fontSize: '13px' }}>
                       #{patient.tokenNumber} - {patient.name}
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
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                       <FiPhone size={10} /> Mobile: {maskMobileNumber(patient.mobileNumber)}
                     </span>
                     <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                       <FiClock size={10} /> Generated At: {formatTimeWithSeconds(patient.createdAt || patient.timestamp)}
                     </span>
                   </div>
                 </div>
               ))
             )}
           </div>
         </div>
       )}

    </div>
  );
}