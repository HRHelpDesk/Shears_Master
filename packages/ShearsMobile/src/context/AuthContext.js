import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService } from 'shears-shared/src/Services/Authentication';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // loading initial storage

  useEffect(() => {
    // Load user & token from AsyncStorage on app start
    const loadStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Failed to load user from storage', err);
      } finally {
        setLoading(false);
      }
    };
    loadStorage();
  }, []);

  const isLoggedIn = !!user && !!token;

  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token: authToken } = await loginService(email, password);

      // Save in state
      setUser(loggedInUser);
      setToken(authToken);

      // Persist in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      await AsyncStorage.setItem('token', authToken);

      return true;
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
