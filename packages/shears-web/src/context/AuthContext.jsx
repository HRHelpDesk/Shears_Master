import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router';
import Cookies from 'js-cookie'; // Import js-cookie
import { login as loginService } from 'shears-shared/src/Services/Authentication';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = Cookies.get('user'); // Get user from cookie
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => Cookies.get('token') || null); // Get token from cookie

  const isLoggedIn = !!user && !!token;

  // Wrap the shared login function
  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token: authToken } = await loginService(email, password);

      // Save in state
      setUser(loggedInUser);
      setToken(authToken);

      // Save in cookies with expiration (e.g., 7 days to match JWT)
      Cookies.set('user', JSON.stringify(loggedInUser), { expires: 7, secure: true, sameSite: 'Strict' });
      Cookies.set('token', authToken, { expires: 7, secure: true, sameSite: 'Strict' });

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('user'); // Remove user cookie
    Cookies.remove('token'); // Remove token cookie
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};