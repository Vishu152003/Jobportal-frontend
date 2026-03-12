import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.verifyToken()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userRole');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userRole', userData.role);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      let errorMessage = 'Login failed';
      const responseData = error.response?.data;
      const status = error.response?.status;
      
      if (status === 401) {
        errorMessage = 'Invalid username/email or password';
      } else if (status === 403) {
        errorMessage = responseData?.error || 'Your account has been blocked';
      } else if (responseData) {
        if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else {
          const firstKey = Object.keys(responseData)[0];
          if (firstKey) {
            const firstError = responseData[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      }
      
      console.error('Login error:', errorMessage, error.response?.data);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access, refresh, user: newUser } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userRole', newUser.role);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      let errorMessage = 'Registration failed';
      const responseData = error.response?.data;
      
      if (responseData) {
        if (responseData.password) {
          errorMessage = Array.isArray(responseData.password) 
            ? responseData.password.join(', ') 
            : responseData.password;
        } else if (responseData.email) {
          errorMessage = Array.isArray(responseData.email) 
            ? responseData.email.join(', ') 
            : responseData.email;
        } else if (responseData.username) {
          errorMessage = Array.isArray(responseData.username) 
            ? responseData.username.join(', ') 
            : responseData.username;
        } else if (responseData.non_field_errors) {
          errorMessage = Array.isArray(responseData.non_field_errors) 
            ? responseData.non_field_errors.join(', ') 
            : responseData.non_field_errors;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else {
          errorMessage = JSON.stringify(responseData);
        }
      }
      
      console.error('Registration error:', error.response?.data);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.verifyToken();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isRecruiter: user?.role === 'recruiter',
    isSeeker: user?.role === 'seeker',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
