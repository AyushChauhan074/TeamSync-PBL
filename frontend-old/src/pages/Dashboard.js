import React from 'react';

const Dashboard = () => {
  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">12</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">45</div>
          <div className="stat-label">Contributions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">8.5</div>
          <div className="stat-label">Avg Rating</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Activity */}
        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ padding: '0.75rem', borderLeft: '3px solid #495057', marginBottom: '1rem', background: '#f8f9fa' }}>
              <strong>New commit pushed</strong>
              <p style={{ margin: '0.25rem 0', color: '#666' }}>Added user authentication module</p>
              <small style={{ color: '#999' }}>2 hours ago</small>
            </div>
            <div style={{ padding: '0.75rem', borderLeft: '3px solid #6c757d', marginBottom: '1rem', background: '#f8f9fa' }}>
              <strong>Team formed</strong>
              <p style={{ margin: '0.25rem 0', color: '#666' }}>Joined "AI Research Team"</p>
              <small style={{ color: '#999' }}>1 day ago</small>
            </div>
            <div style={{ padding: '0.75rem', borderLeft: '3px solid #495057', marginBottom: '1rem', background: '#f8f9fa' }}>
              <strong>Project milestone</strong>
              <p style={{ margin: '0.25rem 0', color: '#666' }}>Phase 1 completed successfully</p>
              <small style={{ color: '#999' }}>3 days ago</small>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary">Create New Team</button>
            <button className="btn btn-secondary">Join Existing Team</button>
            <button className="btn btn-secondary">Start New Project</button>
            <button className="btn btn-secondary">View Contributions</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;