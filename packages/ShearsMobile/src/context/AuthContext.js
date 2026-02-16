import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login as loginService,
  getCurrentUser
} from 'shears-shared/src/Services/Authentication';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------------
     LOAD FROM STORAGE ON APP START
  --------------------------------------- */
  useEffect(() => {
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

  /* ---------------------------------------
     LOGIN
  --------------------------------------- */
  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token: authToken } =
        await loginService(email, password);

      setUser(loggedInUser);
      setToken(authToken);

      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      await AsyncStorage.setItem('token', authToken);

      return true;
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  /* ---------------------------------------
     REFRESH USER FROM SERVER
  --------------------------------------- */
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const updatedUser = await getCurrentUser(token);

      setUser(updatedUser);
      await AsyncStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );

      return updatedUser;

    } catch (err) {
      console.error('Refresh user failed:', err.message);

      // If token expired or invalid → logout
      await logout();
    }
  }, [token]);

  /* ---------------------------------------
     LOGOUT
  --------------------------------------- */
  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser, // 👈 added here
        isLoggedIn,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
