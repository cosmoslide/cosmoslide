import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          Cosmoslide Admin
        </h2>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/users"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              background: window.location.pathname === '/users' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            👥 Users
          </Link>
          <Link
            to="/actors"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              background: window.location.pathname === '/actors' ? 'rgba(255,255,255,0.2)' : 'transparent',
            }}
          >
            🎭 Actors
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '1.5rem',
            right: '1.5rem',
            width: 'calc(100% - 3rem)',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem' }}>
        {children}
      </div>
    </div>
  );
}
