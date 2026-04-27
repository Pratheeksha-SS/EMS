import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    const savedPassword = localStorage.getItem('remembered_password');
    const rememberStatus = localStorage.getItem('remember_me') === 'true';

    if (rememberStatus && savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('🔑 Login attempt for:', username);

      const response = await api.post('token/', {
        username,
        password
      });

      console.log('✅ Login response:', response.data);

      const receivedRole = response.data.role;
      console.log('📋 Received role:', receivedRole);

      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
        localStorage.setItem('remembered_password', password);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('remembered_password');
        localStorage.removeItem('remember_me');
      }

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', receivedRole);
      localStorage.setItem('username', response.data.username);

      console.log('💾 Saved to localStorage:', {
        role: localStorage.getItem('user_role'),
        username: localStorage.getItem('username'),
        rememberMe: rememberMe
      });

      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

      setUser({
        username: response.data.username,
        role: receivedRole
      });

      // Managers should land on the employee dashboard first.
      const rolePath =
        receivedRole === 'ADMIN'
          ? '/admin'
          : '/employee';
      navigate(rolePath, { replace: true });

    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server is not running. Please start the backend and try again.');
      } else {
        setError(error.response?.data?.detail || 'Invalid username or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    try {
      const response = await api.post('forgot-password/', {
        email: resetEmail
      });

      setResetMessage(response.data.message || 'Password reset link sent to your email!');

      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);

    } catch (error) {
      console.error('Forgot password error:', error);
      setResetError(error.response?.data?.error || 'Failed to send reset email. Please try again.');
    }
  };

  // If showing forgot password form
  if (showForgotPassword) {
    return (
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        fontFamily: "'Montserrat', 'Poppins', sans-serif"
      }}>
        <style>{`
          @keyframes moveTriangle1 {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -20px) rotate(120deg); }
            66% { transform: translate(-20px, 30px) rotate(240deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }
          @keyframes moveTriangle2 {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-40px, 30px) rotate(90deg); }
            50% { transform: translate(30px, 40px) rotate(180deg); }
            75% { transform: translate(20px, -30px) rotate(270deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }
          @keyframes moveTriangle3 {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); }
            50% { transform: translate(50px, -50px) rotate(180deg) scale(1.2); }
            100% { transform: translate(0, 0) rotate(360deg) scale(1); }
          }
          @keyframes moveTriangle4 {
            0% { transform: translate(0, 0) rotate(0deg) skew(0deg); }
            33% { transform: translate(-60px, -30px) rotate(120deg) skew(10deg); }
            66% { transform: translate(40px, 50px) rotate(240deg) skew(-10deg); }
            100% { transform: translate(0, 0) rotate(360deg) skew(0deg); }
          }
          @keyframes moveTriangle5 {
            0% { transform: translate(0, 0) rotate(0deg); }
            40% { transform: translate(70px, 20px) rotate(144deg); }
            80% { transform: translate(-30px, -60px) rotate(288deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }
        `}</style>

        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '0', height: '0', borderLeft: '80px solid transparent', borderRight: '80px solid transparent', borderBottom: '140px solid rgba(76, 175, 80, 0.1)', transform: 'rotate(45deg)', animation: 'moveTriangle1 18s ease-in-out infinite', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: '0', height: '0', borderLeft: '100px solid transparent', borderRight: '100px solid transparent', borderTop: '170px solid rgba(255, 153, 51, 0.1)', animation: 'moveTriangle2 22s ease-in-out infinite', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '60%', left: '15%', width: '0', height: '0', borderLeft: '60px solid transparent', borderRight: '60px solid transparent', borderBottom: '100px solid rgba(144, 238, 144, 0.15)', transform: 'rotate(-20deg)', animation: 'moveTriangle3 25s ease-in-out infinite', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '20%', right: '20%', width: '0', height: '0', borderLeft: '70px solid transparent', borderRight: '70px solid transparent', borderTop: '120px solid rgba(255, 218, 185, 0.15)', transform: 'rotate(15deg)', animation: 'moveTriangle4 20s ease-in-out infinite', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '25%', left: '25%', width: '0', height: '0', borderLeft: '90px solid transparent', borderRight: '90px solid transparent', borderBottom: '150px solid rgba(0, 100, 0, 0.1)', transform: 'rotate(-30deg)', animation: 'moveTriangle5 28s ease-in-out infinite', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '70%', right: '30%', width: '0', height: '0', borderLeft: '50px solid transparent', borderRight: '50px solid transparent', borderTop: '85px solid rgba(255, 160, 122, 0.1)', transform: 'rotate(60deg)', animation: 'moveTriangle2 24s ease-in-out infinite reverse', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', top: '40%', left: '60%', width: '0', height: '0', borderLeft: '110px solid transparent', borderRight: '110px solid transparent', borderBottom: '190px solid rgba(60, 179, 113, 0.08)', transform: 'rotate(90deg)', animation: 'moveTriangle1 30s ease-in-out infinite', zIndex: 0 }}></div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '420px',
          maxWidth: '90%',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '40px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#1e3a8a',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Forgot Password?
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#666',
              marginBottom: '30px',
              fontSize: '14px'
            }}>
              Enter your email to receive reset link
            </p>

            {resetMessage && (
              <div style={{
                color: '#4caf50',
                marginBottom: '20px',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {resetMessage}
              </div>
            )}

            {resetError && (
              <div style={{
                color: '#d32f2f',
                marginBottom: '20px',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '30px' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box',
                    fontFamily: "'Montserrat', sans-serif"
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  marginBottom: '15px',
                  fontFamily: "'Montserrat', sans-serif"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4caf50'}
              >
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'Montserrat', sans-serif"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                  e.target.style.borderColor = '#ccc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#e0e0e0';
                }}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main Login Form
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: "'Montserrat', 'Poppins', sans-serif"
    }}>
      <style>{`
        @keyframes moveTriangle1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -20px) rotate(120deg); }
          66% { transform: translate(-20px, 30px) rotate(240deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes moveTriangle2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-40px, 30px) rotate(90deg); }
          50% { transform: translate(30px, 40px) rotate(180deg); }
          75% { transform: translate(20px, -30px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes moveTriangle3 {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(50px, -50px) rotate(180deg) scale(1.2); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1); }
        }
        @keyframes moveTriangle4 {
          0% { transform: translate(0, 0) rotate(0deg) skew(0deg); }
          33% { transform: translate(-60px, -30px) rotate(120deg) skew(10deg); }
          66% { transform: translate(40px, 50px) rotate(240deg) skew(-10deg); }
          100% { transform: translate(0, 0) rotate(360deg) skew(0deg); }
        }
        @keyframes moveTriangle5 {
          0% { transform: translate(0, 0) rotate(0deg); }
          40% { transform: translate(70px, 20px) rotate(144deg); }
          80% { transform: translate(-30px, -60px) rotate(288deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
      `}</style>

      {/* Triangles */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', width: '0', height: '0', borderLeft: '80px solid transparent', borderRight: '80px solid transparent', borderBottom: '140px solid rgba(76, 175, 80, 0.1)', transform: 'rotate(45deg)', animation: 'moveTriangle1 18s ease-in-out infinite', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: '0', height: '0', borderLeft: '100px solid transparent', borderRight: '100px solid transparent', borderTop: '170px solid rgba(255, 153, 51, 0.1)', animation: 'moveTriangle2 22s ease-in-out infinite', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: '60%', left: '15%', width: '0', height: '0', borderLeft: '60px solid transparent', borderRight: '60px solid transparent', borderBottom: '100px solid rgba(144, 238, 144, 0.15)', transform: 'rotate(-20deg)', animation: 'moveTriangle3 25s ease-in-out infinite', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: '20%', right: '20%', width: '0', height: '0', borderLeft: '70px solid transparent', borderRight: '70px solid transparent', borderTop: '120px solid rgba(255, 218, 185, 0.15)', transform: 'rotate(15deg)', animation: 'moveTriangle4 20s ease-in-out infinite', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '25%', left: '25%', width: '0', height: '0', borderLeft: '90px solid transparent', borderRight: '90px solid transparent', borderBottom: '150px solid rgba(0, 100, 0, 0.1)', transform: 'rotate(-30deg)', animation: 'moveTriangle5 28s ease-in-out infinite', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: '70%', right: '30%', width: '0', height: '0', borderLeft: '50px solid transparent', borderRight: '50px solid transparent', borderTop: '85px solid rgba(255, 160, 122, 0.1)', transform: 'rotate(60deg)', animation: 'moveTriangle2 24s ease-in-out infinite reverse', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', top: '40%', left: '60%', width: '0', height: '0', borderLeft: '110px solid transparent', borderRight: '110px solid transparent', borderBottom: '190px solid rgba(60, 179, 113, 0.08)', transform: 'rotate(90deg)', animation: 'moveTriangle1 30s ease-in-out infinite', zIndex: 0 }}></div>

      {/* Login Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '420px',
        maxWidth: '100%',
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header / Logo */}
        <div style={{ padding: '40px 40px 20px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '-50px'
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: '600',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              EL
            </span>

            {/* The "O" with dot inside */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#000000',
                fontFamily: "'Montserrat', 'Poppins', sans-serif"
              }}>
                O
              </span>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '7px',
                height: '7px',
                backgroundColor: '#000000',
                borderRadius: '50%',
                zIndex: 2
              }}></span>
            </div>

            <span style={{
              fontSize: '48px',
              fontWeight: '545',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "sans-serif"
            }}>
              G
            </span>

            <span style={{
              fontSize: '50px',
              fontWeight: '600',
              color: '#ff9933',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              IXA
            </span>
            {/* Modern Triangle Cluster - Positioned to the right of text */}
            <div style={{
              position: 'relative',
              width: '80px',
              height: '150px',
              marginLeft: '-10px',
              display: 'inline-block',
              verticalAlign: 'middle'
            }}>
              {/* Bottom Green Triangle - Largest, bottom-right, rotated +10° */}
              <div style={{
                position: 'absolute',
                bottom: '90px',
                right: '29px',
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderBottom: '31px solid #4caf50',
                transform: 'rotate(-10deg)',
                transformOrigin: 'center',
                zIndex: 1
              }} />
              
              {/* Middle Orange Triangle - Slightly smaller, left position, rotated -20° */}
              <div style={{
                position: 'absolute',
                top: '25px',
                left: '-5px',
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '24px solid #ff9933',
                transform: 'rotate(-50deg)',
                transformOrigin: 'center',
                zIndex: 2
              }} />
              
              {/* Top Dark Gray Triangle - Medium size, top-right, rotated +30° */}
              <div style={{
                position: 'absolute',
                top: '1px',
                right: '40px',
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '28px solid #2d3748',
                transform: 'rotate(30deg)',
                transformOrigin: 'center',
                zIndex: 3
              }} />
            </div>
          </div>
          </div>

        {/* Form Section */}
        <div style={{ padding: '0 40px' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                color: '#d32f2f',
                marginBottom: '20px',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#ffebee',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: "'Montserrat', sans-serif"
                }}
                onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: "'Montserrat', sans-serif"
                }}
                onFocus={(e) => e.target.style.borderColor = '#4caf50'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                required
              />
            </div>

            {/* Remember Me and Forgot Password Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#666',
                fontFamily: "'Montserrat', sans-serif"
              }}>
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{
                    width: '40px',
                    height: '20px',
                    backgroundColor: rememberMe ? '#4caf50' : '#e0e0e0',
                    borderRadius: '20px',
                    position: 'relative',
                    transition: 'background-color 0.3s',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px',
                    left: rememberMe ? '22px' : '2px',
                    transition: 'left 0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                Remember me
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff9933',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                Forgot password?
              </button>
            </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: isSubmitting ? '#81c784' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.3s',
                  marginBottom: '30px',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.target.style.backgroundColor = '#45a049';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isSubmitting ? '#81c784' : '#4caf50';
              }}
              >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          padding: '30px 40px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px',
            marginBottom: '15px'
          }}>
            <span style={{ fontSize: '18px', color: '#4caf50', fontWeight: '500' }}>India</span>
            <span style={{ fontSize: '18px', color: '#ff9933', fontWeight: '500' }}>UAE</span>
            <span style={{ fontSize: '18px', color: '#4caf50', fontWeight: '500' }}>DR.Congo</span>
          </div>

          <div style={{
            fontSize: '18px',
            color: '#666666',
            marginBottom: '8px',
            fontWeight: '400'
          }}>
            www.elogixa.co.in
          </div>

          <div style={{
            fontSize: '15px',
            color: '#999999',
            fontWeight: '300',
            letterSpacing: '0.5px'
          }}>
            COLLABORATE | INNOVATE | TRANSFORM
          </div>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&display=swap" rel="stylesheet" />
    </div>
  );
};

export default Login;
