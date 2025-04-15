import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Divider } from '@mui/material';
import { Lock as LockIcon, Person as PersonIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { auth } from '../../firebase';
import './LoginPage.css';

const LoginPage = () => {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  
  // Refs for input elements
  const userEmailRef = useRef(null);
  const userPasswordRef = useRef(null);
  const adminEmailRef = useRef(null);
  const adminPasswordRef = useRef(null);

  // State management
  const [formData, setFormData] = useState({
    userEmail: '',
    userPassword: '',
    adminEmail: '',
    adminPassword: ''
  });
  
  const [errors, setErrors] = useState({
    userError: '',
    adminError: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    showUserPassword: false,
    showAdminPassword: false
  });

  // Effect to clear any cached form data
  useEffect(() => {
    // Reset all form fields
    setFormData({
      userEmail: '',
      userPassword: '',
      adminEmail: '',
      adminPassword: ''
    });

    // Clear browser autofill by resetting form values
    const clearInputs = () => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        input.value = '';
        input.setAttribute('value', '');
      });
    };

    // Run immediately and after delays to catch all autofill attempts
    clearInputs();
    const timer1 = setTimeout(clearInputs, 50);
    const timer2 = setTimeout(clearInputs, 200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      setErrors({ ...errors, userError: '' });
      setLoading(true);
      await login(formData.userEmail, formData.userPassword);
      navigate('/user-dashboard');
    } catch (err) {
      setErrors({ ...errors, userError: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setErrors({ ...errors, adminError: '' });
      setLoading(true);
      
      // First perform the login
      await login(formData.adminEmail, formData.adminPassword);
      
      // Then verify the user is the project owner
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        
        if (token.claims.owner === true) {
          navigate('/admin-dashboard');
        } else {
          await logout();
          throw new Error('Only the project owner can access admin');
        }
      }
    } catch (err) {
      setErrors({ ...errors, adminError: err.message });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Box className="login-container">
      <Typography variant="h3" component="h1" className="system-title">
        Hit & Run Case System
      </Typography>

      <Box className="login-split-container">
        {/* User Login Section */}
        <Box className="login-half user-login">
          <Box className="login-content">
            <Box className="login-header">
              <PersonIcon className="login-icon user-icon" />
              <Typography variant="h5" component="h2" className="login-subtitle">
                User Login
              </Typography>
            </Box>
            
            <form onSubmit={handleUserLogin} className="login-form" autoComplete="off">
              <TextField
                fullWidth
                inputRef={userEmailRef}
                name="userEmail"
                label="Email"
                type="email"
                value={formData.userEmail}
                onChange={handleInputChange}
                required
                variant="outlined"
                className="login-input"
                margin="normal"
                InputProps={{
                  startAdornment: <PersonIcon className="input-icon" />
                }}
                inputProps={{
                  autoComplete: "new-user-email",
                  'data-lpignore': "true"
                }}
              />
              
              <TextField
                fullWidth
                inputRef={userPasswordRef}
                name="userPassword"
                label="Password"
                type={showPasswords.showUserPassword ? 'text' : 'password'}
                value={formData.userPassword}
                onChange={handleInputChange}
                required
                variant="outlined"
                className="login-input"
                margin="normal"
                InputProps={{
                  startAdornment: <LockIcon className="input-icon" />,
                  endAdornment: (
                    <Button 
                      onClick={() => togglePasswordVisibility('showUserPassword')} 
                      className="password-toggle"
                      size="small"
                    >
                      {showPasswords.showUserPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  )
                }}
                inputProps={{
                  autoComplete: "new-user-password",
                  'data-lpignore': "true"
                }}
              />
              
              {errors.userError && (
                <Typography className="error-message">
                  {errors.userError}
                </Typography>
              )}
              
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                className="login-button user-button"
                sx={{ mt: 2 }}
              >
                {loading ? 'Logging in...' : 'Login as User'}
              </Button>
            </form>
          </Box>
        </Box>

        <Divider orientation="vertical" flexItem className="login-divider" />

        {/* Admin Login Section */}
        <Box className="login-half admin-login">
          <Box className="login-content">
            <Box className="login-header">
              <LockIcon className="login-icon admin-icon" />
              <Typography variant="h5" component="h2" className="login-subtitle">
                Admin Login
              </Typography>
            </Box>
            
            <form onSubmit={handleAdminLogin} className="login-form" autoComplete="off">
              <TextField
                fullWidth
                inputRef={adminEmailRef}
                name="adminEmail"
                label="Admin Email"
                type="email"
                value={formData.adminEmail}
                onChange={handleInputChange}
                required
                variant="outlined"
                className="login-input"
                margin="normal"
                InputProps={{
                  startAdornment: <PersonIcon className="input-icon" />
                }}
                inputProps={{
                  autoComplete: "new-admin-email",
                  'data-lpignore': "true"
                }}
              />
              
              <TextField
                fullWidth
                inputRef={adminPasswordRef}
                name="adminPassword"
                label="Admin Password"
                type={showPasswords.showAdminPassword ? 'text' : 'password'}
                value={formData.adminPassword}
                onChange={handleInputChange}
                required
                variant="outlined"
                className="login-input"
                margin="normal"
                InputProps={{
                  startAdornment: <LockIcon className="input-icon" />,
                  endAdornment: (
                    <Button 
                      onClick={() => togglePasswordVisibility('showAdminPassword')} 
                      className="password-toggle"
                      size="small"
                    >
                      {showPasswords.showAdminPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  )
                }}
                inputProps={{
                  autoComplete: "new-admin-password",
                  'data-lpignore': "true"
                }}
              />
              
              {errors.adminError && (
                <Typography className="error-message">
                  {errors.adminError}
                </Typography>
              )}
              
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="secondary"
                disabled={loading}
                className="login-button admin-button"
                sx={{ mt: 2 }}
              >
                {loading ? 'Verifying...' : 'Login as Admin'}
              </Button>
            </form>
          </Box>
        </Box>
      </Box>

      <Typography className="login-footer">
        Need help? Contact support@hitandrun.com
      </Typography>
    </Box>
  );
};

export default LoginPage;