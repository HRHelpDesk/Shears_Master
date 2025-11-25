// src/screens/BasePage.js
import React, {
  useState,
  lazy,
  Suspense,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Fade,
} from '@mui/material';
import TabBar from '../components/UI/TabBar';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { AuthContext } from '../context/AuthContext';
import { getRecords } from 'shears-shared/src/Services/Authentication';

/* -------------------------------------------------------------
   Local minimal fallback component
------------------------------------------------------------- */
function FallbackComponent({ name }) {
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
        {name}
      </Typography>

      <Typography variant="subtitle1" color="text.secondary">
        Loading component…
      </Typography>
    </Box>
  );
}

export default function BasePage({ appConfig, name, viewData = [] }) {
  const route = appConfig.mainNavigation.find((r) => r.name === name);
  const views = route?.views || [];

  const [activeTab, setActiveTab] = useState(0);

  // Data, loading, error states
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Component dynamic loading
  const [ViewComponent, setViewComponent] = useState(() => FallbackComponent);
  const [loadingComponent, setLoadingComponent] = useState(true);

  const { user, token } = useContext(AuthContext);
  const activeView = viewData[activeTab] || null;

  /* -------------------------------------------------------------
     1. Reset activeTab when viewData changes
  ------------------------------------------------------------- */
  useEffect(() => {
    setActiveTab(0);               // always start on the first tab
  }, [viewData]);                  // <-- runs when a new field set is loaded

  /* -------------------------------------------------------------
     2. Fetch Records
  ------------------------------------------------------------- */
  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      if (!token || !user?.subscriberId) {
        setError('Authentication required');
        setLoadingData(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoadingData(true);

        const response = await getRecords({
          recordType: name.toLowerCase(),
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
        });

        setData(response || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load records:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoadingData(false);
      }
    },
    [token, user, name]
  );

  // Initial fetch
  useEffect(() => {
    fetchRecords(false);
  }, [fetchRecords]);

 /* -------------------------------------------------------------
   3. Load the dynamic view component – THIS ONE ACTUALLY WORKS
------------------------------------------------------------- */
useEffect(() => {
  if (!activeView?.component) {
    setViewComponent(() => FallbackComponent);
    setLoadingComponent(false);
    return;
  }

  setLoadingComponent(true);

  // This is the magic that tells Vite to include EVERY file under src/components
  const modules = import.meta.glob('../components/**/*.jsx');

  const path = `../components/${activeView.component}.jsx`;

  console.log('Trying to load:', path);

  const importer = modules[path];

  if (!importer) {
    console.warn('Component not matched in glob:', activeView.component);
    // List what is actually available (very helpful while developing)
    console.log('Available components:', Object.keys(modules));
    setViewComponent(() => FallbackComponent);
    setLoadingComponent(false);
    return;
  }

  importer()
    .then((mod) => {
      setViewComponent(() => mod.default || mod);
    })
    .catch((err) => {
      console.error('Failed to load component', path, err);
      setViewComponent(() => FallbackComponent);
    })
    .finally(() => {
      setLoadingComponent(false);
    });
}, [activeView]);

  /* -------------------------------------------------------------
     4. Props passed to the loaded view
  ------------------------------------------------------------- */
  const dynamicProps = {
    name: activeView?.displayName || name,
    fields: mapFields(activeView?.fields),
    refreshing,
    onRefresh: () => fetchRecords(true),
    data,
    appConfig,
  };

  /* -------------------------------------------------------------
     5. UI: Loaders + retry handling
  ------------------------------------------------------------- */
  const showMainLoader = loadingComponent || loadingData;

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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* MAIN LOADER OVERLAY */}
        {showMainLoader && (
          <Fade in={true}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          </Fade>
        )}

        {/* Error State */}
        {error && !showMainLoader && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" onClick={() => fetchRecords(false)}>
              Retry
            </Button>
          </Box>
        )}

        {/* MAIN COMPONENT WHEN READY */}
        {!error && (
          <Suspense fallback={<CircularProgress sx={{ m: 'auto' }} />}>
            <ViewComponent
              key={activeView?.component || 'fallback'}
              {...dynamicProps}
            />
          </Suspense>
        )}
      </Box>
    </Box>
  );
}