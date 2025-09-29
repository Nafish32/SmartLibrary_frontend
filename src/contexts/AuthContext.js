import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      if (token) {
        // Parse user info from localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          try {
            const parsedUser = JSON.parse(userInfo);
            setCurrentUser(parsedUser);
          } catch (error) {
            console.error('Error parsing user info:', error);
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const result = await apiService.login({ username, password });
      
      if (result.success) {
        const { token, username: user, role } = result.data;
        const userInfo = { username: user, role };

        localStorage.setItem('token', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        setToken(token);
        setCurrentUser(userInfo);

        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      console.log('Attempting to register user:', { 
        ...userData, 
        password: '[HIDDEN]', 
        adminKey: userData.adminKey ? '[HIDDEN]' : undefined 
      });

      const result = await apiService.register(userData);
      
      if (result.success) {
        console.log('Registration successful:', result.data);
        return { success: true };
      } else {
        return result;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during registration'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setToken(null);
    setCurrentUser(null);
    // The API service interceptor will handle removing the auth header
  };

  const isAdmin = () => {
    return currentUser?.role === 'ROLE_ADMIN';
  };

  const isUser = () => {
    return currentUser?.role === 'ROLE_USER';
  };

  const isLoggedIn = () => {
    return !!token && !!currentUser;
  };

  const getUserDisplayName = () => {
    return currentUser?.username || 'Guest';
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    isAdmin,
    isUser,
    isLoggedIn,
    getUserDisplayName,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
