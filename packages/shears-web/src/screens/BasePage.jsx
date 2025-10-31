// src/screens/BasePage.js
import React, { useState, lazy, Suspense, useEffect, useContext, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import TabBar from '../components/UI/TabBar';
import { dummyUsers } from 'shears-shared/src/AppData/dummy-data/dummydata';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { dummyServices } from 'shears-shared/src/AppData/dummy-data/dummyServices';
import { AuthContext } from '../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';
export default function BasePage({ appConfig, name, viewData = [] }) {
  const route = appConfig.mainNavigation.find((r) => r.name === name);
  const views = route?.views || [];
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]); // Added data state
  const [loading, setLoading] = useState(true); // Loading state
  const [refreshing, setRefreshing] = useState(false); // Added refreshing state
  const [error, setError] = useState(null); // Added error state    

  const [ViewComponent, setViewComponent] = useState(() => FallbackComponent);
 const {user, token} = useContext(AuthContext);
  const activeView = viewData[activeTab] || null;

  function FallbackComponent() {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          p: 4,
        }}
      >
        <Typography variant="h5" gutterBottom color="text.secondary">
          {activeView?.displayName || name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Component: {activeView?.component || 'None'}
        </Typography>
      </Box>
    );
  }

  // 🔍 Debug logs
  useEffect(() => {
  console.log("Active View")
  console.log(activeView)
  }, []);

  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      console.log(user)
      if (!token || !user?.subscriberId) {
        alert('Authentication required');
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const response = await getRecords({
          recordType: name.toLowerCase(),
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });

        console.log('Fetched records:', response);

        setData(response || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load records:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token, user, name]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchRecords(false);
  }, [fetchRecords]);

  // Dynamic import of component
  useEffect(() => {
     console.log("viewData Component")
    console.log(activeView.component)
    if (activeView?.component) {
      import(`../components/${activeView.component}`)
        .then((mod) => setViewComponent(() => mod.default))
        .catch(() => setViewComponent(() => FallbackComponent));
    } else {
      setViewComponent(() => FallbackComponent);
    }
  }, [activeView]);

  // 🔹 Map fields through fieldMapper
  


  const dynamicProps = {
    name: activeView?.displayName || name,
    fields: mapFields(activeView.fields),
    refreshing, // Added for refresh state
    onRefresh: () => fetchRecords(true), // Added for manual refresh
    data: data,
    appConfig,
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
    
      {views.length > 0 && (
        <TabBar views={views} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 1,
          overflow: 'hidden',
        }}
      >
        <Suspense fallback={<CircularProgress sx={{ m: 'auto' }} />}>
          <ViewComponent
            key={activeView?.component || 'fallback'}
            {...dynamicProps}
          />
        </Suspense>
      </Box>
    </Box>
  );
}
