import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [pageBackground, setPageBackground] = useState(null);
  const navigate = useNavigate();

  const enhancedUserData = {
    skills: ['React.js', 'Node.js', 'Python', 'MongoDB', 'Git', 'JavaScript', 'Express.js', 'PostgreSQL'],
    bio: 'Full-stack developer passionate about creating innovative solutions. Currently working on TeamSync PBL project.',
    github: 'AbhishekGiri04',
    linkedin: 'abhishek-giri-dev',
    leetcode: 'abhishek_giri',
    courses: ['Data Structures & Algorithms', 'Database Management Systems', 'Software Engineering', 'Web Development'],
    cgpa: '8.7',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    semester: '6th Semester',
    interests: ['Web Development', 'Machine Learning', 'Open Source', 'Competitive Programming'],
    achievements: ['Winner - College Hackathon 2023', 'Google Developer Student Club Lead', 'Published Research Paper'],
    projects: [
      { name: 'TeamSync PBL', tech: 'React, Node.js, PostgreSQL', status: 'Active' },
      { name: 'E-Commerce Platform', tech: 'MERN Stack', status: 'Completed' },
      { name: 'AI Chatbot', tech: 'Python, NLP', status: 'In Progress' }
    ]
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const savedProfileImage = localStorage.getItem('profileImage');
    const savedBannerImage = localStorage.getItem('bannerImage');
    const savedPageBackground = localStorage.getItem('pageBackground');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({ ...parsedUser, ...enhancedUserData });
      setProfileData({ ...parsedUser, ...enhancedUserData });
      if (savedProfileImage) setProfileImage(savedProfileImage);
      if (savedBannerImage) setBannerImage(savedBannerImage);
      if (savedPageBackground) setPageBackground(savedPageBackground);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'profile') {
          setProfileImage(event.target.result);
          localStorage.setItem('profileImage', event.target.result);
        } else if (type === 'banner') {
          setBannerImage(event.target.result);
          localStorage.setItem('bannerImage', event.target.result);
        } else if (type === 'background') {
          setPageBackground(event.target.result);
          localStorage.setItem('pageBackground', event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setUser(profileData);
    localStorage.setItem('user', JSON.stringify(profileData));
    setIsEditing(false);
  };

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-container" style={pageBackground ? {
      backgroundImage: `url(${pageBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    } : {}}>
      
      {/* Header Card */}
      <div className="profile-header-card">
        <div className="profile-banner" style={bannerImage ? {backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}>
          <label className="banner-upload-btn">
            <svg width="20" height="20" fill="white" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} style={{display: 'none'}} />
          </label>
        </div>
        <div className="profile-header-content">
          <div className="profile-avatar" style={profileImage ? {backgroundImage: `url(${profileImage})`, backgroundSize: 'cover', backgroundPosition: 'center'} : {}}>
            {!profileImage && user.name.split(' ').map(n => n[0]).join('')}
            <label className="avatar-upload-btn">
              <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
                <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
              </svg>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} style={{display: 'none'}} />
            </label>
          </div>
          <div className="profile-header-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-headline">{user.bio}</p>
            <p className="profile-meta">{user.department} • {user.roll_number}</p>
            <div className="profile-links">
              <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
              <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                LinkedIn
              </a>
              <a href={`https://leetcode.com/${user.leetcode}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-2.365-1.914-5.956-1.676-8.036.713L3.643 10.023 8.149 5.48c.369-.369.962-.369 1.331 0 .369.369.369.962 0 1.331L6.664 9.645a1.015 1.015 0 1 0 1.435 1.435l2.816-2.834a2.377 2.377 0 0 0 0-3.362 2.377 2.377 0 0 0-3.362 0L3.643 8.698a5.527 5.527 0 0 0-.062 7.812l4.277 4.193c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392a2.377 2.377 0 0 0 0-3.362 2.377 2.377 0 0 0-3.362 0l-2.396 2.392a1.685 1.685 0 0 1-2.349.013l-.02-.019-4.276-4.193a2.68 2.68 0 0 1-.066-3.786l4.615-4.934a1.374 1.374 0 0 0-.961-2.346z"/>
                </svg>
                LeetCode
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Left Column */}
        <div className="profile-left">
          {/* About Section */}
          <div className="profile-card">
            <div className="card-header">
              <h2>About</h2>
              <button onClick={() => setIsEditing(!isEditing)} className="btn-edit">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
              </button>
            </div>
            <div className="card-content">
              {isEditing ? (
                <textarea 
                  value={profileData.bio} 
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="input-textarea"
                  rows="4"
                />
              ) : (
                <p className="about-text">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Academic Details */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Academic Details</h2>
            </div>
            <div className="card-content">
              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{user.department}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Academic Year</span>
                <span className="info-value">{user.year} (2023-2024)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Semester</span>
                <span className="info-value">{user.semester}</span>
              </div>
              <div className="info-row">
                <span className="info-label">CGPA</span>
                <span className="info-value cgpa">{user.cgpa}/10.0</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Skills</h2>
            </div>
            <div className="card-content">
              <div className="skills-grid">
                {user.skills?.map(skill => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Activity</h2>
            </div>
            <div className="card-content">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">2</div>
                  <div className="stat-label">Active Teams</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">3</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">130</div>
                  <div className="stat-label">Contributions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">2.6</div>
                  <div className="stat-label">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {/* Contact Information */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Contact Information</h2>
            </div>
            <div className="card-content">
              <div className="contact-item">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
                <div>
                  <div className="contact-label">Email</div>
                  <div className="contact-value">{user.email}</div>
                </div>
              </div>
              <div className="contact-item">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2.038A2.968 2.968 0 0 1 3 2.506V2.5zm1.068.5H7v-.5a1.5 1.5 0 1 0-3 0c0 .085.002.274.045.43a.522.522 0 0 0 .023.07zM9 3h2.932a.56.56 0 0 0 .023-.07c.043-.156.045-.345.045-.43a1.5 1.5 0 0 0-3 0V3zM1 4v2h6V4H1zm8 0v2h6V4H9zm5 3H9v8h4.5a.5.5 0 0 0 .5-.5V7zm-7 8V7H2v7.5a.5.5 0 0 0 .5.5H7z"/>
                </svg>
                <div>
                  <div className="contact-label">Student ID</div>
                  <div className="contact-value">{user.roll_number}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Projects</h2>
            </div>
            <div className="card-content">
              {user.projects?.map((project, index) => (
                <div key={index} className="project-item">
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    <span className={`project-status status-${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-tech">{project.tech}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Achievements</h2>
            </div>
            <div className="card-content">
              {user.achievements?.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-icon">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68L9.669.864zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702 1.509.229z"/>
                      <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1 4 11.794z"/>
                    </svg>
                  </div>
                  <p className="achievement-text">{achievement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Interests</h2>
            </div>
            <div className="card-content">
              <div className="interests-list">
                {user.interests?.map(interest => (
                  <span key={interest} className="interest-tag">{interest}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="save-bar">
          <button onClick={saveProfile} className="btn-save">Save Changes</button>
          <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
          <button onClick={() => {
            setPageBackground(null);
            localStorage.removeItem('pageBackground');
          }} className="btn-remove-bg">Remove Background</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
