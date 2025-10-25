import { AppData } from 'shears-shared/src/AppData/AppNavigation.js';
import LoginPage from '../screens/auth/LoginPage';
import SplashPage from '../screens/SplashPage';
import MainNavigator from './MainNavigator';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import Register from '../screens/auth/RegisterScreen';
import { CURRENT_APP, CURRENT_WHITE_LABEL } from 'shears-shared/src/config/currentapp';
import { getAppConfig } from 'shears-shared/src/config/getAppConfig';
import { AppLogos } from '../config/appLogos';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

function AppRoutes() {
  const { isLoggedIn } = useContext(AuthContext); // ✅ get login state
  const appConfig = getAppConfig(CURRENT_APP, CURRENT_WHITE_LABEL);
  const logo = AppLogos[CURRENT_APP][CURRENT_WHITE_LABEL];

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<SplashPage appConfig={appConfig} logo={logo} />} />
      <Route path="/login" element={<LoginPage appConfig={appConfig} logo={logo} />} />
      <Route path="/register" element={<Register appConfig={appConfig} logo={logo} />} />

      {/* Protected Routes */}
      {isLoggedIn ? (
        <Route path="/*" element={<MainNavigator appConfig={appConfig} logo={logo} />} />
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default function AppNavigator() {
  return (
       <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
