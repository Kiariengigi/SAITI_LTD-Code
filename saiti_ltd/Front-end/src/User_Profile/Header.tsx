// Header.tsx
import Navbar from 'react-bootstrap/Navbar'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from '../api/axios'

interface HeaderProps {
  brandName?: string;
  userName?: string;
  userRole?: string;
}

export default function Header({
  brandName = "SAITI_LTD",
  userName = "Saiti_LTD",
  userRole = "Supplier",
}: HeaderProps) {
  const underscoreIdx = brandName.indexOf("_");
  const bold   = brandName.slice(0, underscoreIdx);
  const italic = brandName.slice(underscoreIdx + 1);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(userName);
  const [displayRole, setDisplayRole] = useState(userRole);
  const logoTarget = location.pathname === "/products" ? "/dashboard" : "/products";

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('user/info', {
          withCredentials: true,
        });

        const user = response.data?.data?.user;
        if (!user) return;

        if (user.fullName) {
          setDisplayName(user.fullName);
        }

        if (user.roleType) {
          const roleLabel = String(user.roleType)
            .charAt(0)
            .toUpperCase() + String(user.roleType).slice(1);
          setDisplayRole(roleLabel);
        }
      } catch (error) {
        console.error('Failed to fetch user info for header:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post('auth/logout', {}, {
        withCredentials: true
      });
      window.localStorage.removeItem('accessToken');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Navbar
      className="navbar bg-white border-bottom px-4"
      style={{ height: 60, flexShrink: 0 }}
    >
      {/* Brand */}
      <Navbar.Brand as={Link} to={logoTarget} >
        <span
        className="navbar-brand mb-0 h1"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 20,
          fontWeight: 800,
          color: "#111",
          letterSpacing: "-0.5px",
        }}
      >
        {bold}
        <span style={{ fontWeight: 300 }}>_{italic}</span>
      </span>
      </Navbar.Brand>

      {/* User chip + Logout — pushed to the right */}
      <div className="d-flex align-items-center gap-3 ms-auto">
        <div 
        onClick={() => navigate('/profile')}
        className="d-flex align-items-center gap-2"
        style={{cursor: 'pointer'}} >
          <div
              className="d-flex align-items-center justify-content-center rounded-circle border"
              style={{ width: 36, height: 36, background: "#fafafa", cursor: 'pointer' }}
            >
            <svg
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="#555" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="fw-semibold" style={{ fontSize: 13, color: "#111" }}>
              {displayName}
            </div>
            <div className="text-muted" style={{ fontSize: 11 }}>
              {displayRole}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="d-flex align-items-center gap-2 border-0 bg-transparent"
          style={{ 
            fontSize: 12, 
            color: "#999", 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", 
            opacity: loading ? 0.6 : 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Logout"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </Navbar>
  );
}