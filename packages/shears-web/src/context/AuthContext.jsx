import React, { createContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import Cookies from 'js-cookie';
import {
  login as loginService,
  getCurrentUser
} from 'shears-shared/src/Services/Authentication';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = Cookies.get('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => Cookies.get('token') || null);

  const isLoggedIn = !!user && !!token;

  // Wrap the shared login function
  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token: authToken } =
        await loginService(email, password);

      setUser(loggedInUser);
      setToken(authToken);

      Cookies.set('user', JSON.stringify(loggedInUser), {
        expires: 7,
        secure: true,
        sameSite: 'Strict',
      });

      Cookies.set('token', authToken, {
        expires: 7,
        secure: true,
        sameSite: 'Strict',
      });

      navigate('/dashboard', { replace: true });

    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  /* ---------------------------------------
     REFRESH USER FROM /me
  --------------------------------------- */
  const refreshUser = useCallback(async () => {
    if (!token) return null;

    try {
      const updatedUser = await getCurrentUser(token);

      setUser(updatedUser);

      Cookies.set('user', JSON.stringify(updatedUser), {
        expires: 7,
        secure: true,
        sameSite: 'Strict',
      });

      return updatedUser;

    } catch (err) {
      console.error('Refresh user failed:', err.message);

      // Only logout on actual 401 Unauthorized
      if (err.response?.status === 401) {
        logout();
      }

      return null;
    }
  }, [token]);

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('user');
    Cookies.remove('token');
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser, // 👈 added
        isLoggedIn,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
