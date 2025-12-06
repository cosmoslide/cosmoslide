import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    setIsLoading(true);

    // Step 1: Verify magic link and get token
    const verifyResult = await authAPI.verifyMagicLink(token);
    if (!verifyResult.ok) {
      localStorage.removeItem('token');
      switch (verifyResult.error.type) {
        case 'UNAUTHORIZED':
          setMessage('Invalid or expired magic link');
          break;
        case 'NETWORK':
          setMessage(`Verification failed: ${verifyResult.error.message}`);
          break;
      }
      setIsLoading(false);
      return;
    }

    const accessToken = verifyResult.value.access_token;

    // Step 2: Store token temporarily
    localStorage.setItem('token', accessToken);

    // Step 3: Get user info to check admin status
    const userResult = await authAPI.getMe();
    if (!userResult.ok) {
      localStorage.removeItem('token');
      switch (userResult.error.type) {
        case 'UNAUTHORIZED':
          setMessage('Session expired. Please try again.');
          break;
        case 'NETWORK':
          setMessage(`Failed to verify user: ${userResult.error.message}`);
          break;
      }
      setIsLoading(false);
      return;
    }

    const user = userResult.value;

    // Step 4: Check if user has admin privileges
    if (!user.isAdmin) {
      localStorage.removeItem('token');
      setMessage('Access denied. Admin privileges required.');
      setIsLoading(false);
      return;
    }

    // Step 5: User is admin, redirect to users page
    navigate('/users');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const result = await authAPI.requestMagicLink(email);
    if (!result.ok) {
      switch (result.error.type) {
        case 'NOT_FOUND':
          setMessage('No account found with this email.');
          break;
        case 'UNAUTHORIZED':
          setMessage('This email is not registered as an admin account.');
          break;
        case 'NETWORK':
          setMessage(`Failed to send magic link: ${result.error.message}`);
          break;
      }
      setIsLoading(false);
      return;
    }

    setMessage('Magic link sent! Check your email.');
    setIsLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Cosmoslide Admin
        </h1>

        {isLoading && searchParams.get('token') ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>Verifying...</div>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            ></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="email"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {message && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: message.includes('sent') ? '#d4edda' : '#f8d7da',
              color: message.includes('sent') ? '#155724' : '#721c24',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
