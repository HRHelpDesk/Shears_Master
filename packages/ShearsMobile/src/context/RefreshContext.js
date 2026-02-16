// src/context/RefreshContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext(undefined);

export function RefreshProvider({ children }) {
  const [refreshVersion, setRefreshVersion] = useState({});

  const triggerRefresh = useCallback((key) => {
    setRefreshVersion((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshVersion, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useTriggerRefresh() {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useTriggerRefresh must be used within RefreshProvider');
  }
  return context.triggerRefresh;
}

export function useRefreshVersion(key) {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefreshVersion must be used within RefreshProvider');
  }
  return context.refreshVersion[key] || 0;
}