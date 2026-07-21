import React from 'react';
import { FiUsers, FiClipboard, FiClock, FiLoader, FiTrash2 } from 'react-icons/fi';

export default function StatsGrid({ totalTokensToday, completedCount, inProgressCount, remainingCount, deletedCount, activeFilter, setActiveFilter }) {
  return (
    <div className="stats-grid" style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Total Tokens Plate (All) */}
      <div className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')} style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-top">
          <div className="stat-icon s-blue"><FiUsers /></div>
          <div className="stat-info">
            <h3>Total Tokens</h3>
            <h2>{totalTokensToday}</h2>
          </div>
        </div>
      </div>

      {/* Completed Plate */}
      <div className={`stat-card ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')} style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-top">
          <div className="stat-icon s-green"><FiClipboard /></div>
          <div className="stat-info">
            <h3>Completed</h3>
            <h2>{completedCount}</h2>
          </div>
        </div>
      </div>

      {/* In Progress Plate */}
      <div className={`stat-card ${activeFilter === 'progress' ? 'active' : ''}`} onClick={() => setActiveFilter('progress')} style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-top">
          <div className="stat-icon s-orange"><FiClock /></div>
          <div className="stat-info">
            <h3>In Progress</h3>
            <h2>{inProgressCount}</h2>
          </div>
        </div>
      </div>

      {/* Remaining Plate */}
      <div className={`stat-card ${activeFilter === 'remaining' ? 'active' : ''}`} onClick={() => setActiveFilter('remaining')} style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-top">
          <div className="stat-icon s-purple"><FiLoader /></div>
          <div className="stat-info">
            <h3>Remaining</h3>
            <h2>{remainingCount}</h2>
          </div>
        </div>
      </div>

      {/* Deleted History Plate */}
      <div className={`stat-card ${activeFilter === 'deleted' ? 'active' : ''}`} onClick={() => setActiveFilter('deleted')} style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-top">
          <div className="stat-icon s-red" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}><FiTrash2 /></div>
          <div className="stat-info">
            <h3>Deleted History</h3>
            <h2>{deletedCount}</h2>
          </div>
        </div>
      </div>

    </div>
  );
}