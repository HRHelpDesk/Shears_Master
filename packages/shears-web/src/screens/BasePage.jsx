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

export default function BasePage({
  appConfig,
  name,
  recordType,      // ⭐ NEW — passed from navigator
  viewData = [],
}) {
  const { user, token } = useContext(AuthContext);

  /* -------------------------------------------------------------
       Determine the correct recordType
       Fallback: use route name lowercase
  ------------------------------------------------------------- */
  const resolvedRecordType =
    recordType ||
    name?.toLowerCase() ||
    null;

  /* -------------------------------------------------------------
       Get route views from navigation or settings
  ------------------------------------------------------------- */
  const route =
    appConfig.mainNavigation.find((r) => r.name === name) ||
    appConfig.subNavigation.find((r) => r.name === name) ||
    null;

  const views = viewData || [];
  const [activeTab, setActiveTab] = useState(0);

  // data + UI state
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // dynamic component loading
  const [ViewComponent, setViewComponent] = useState(() => FallbackComponent);
  const [loadingComponent, setLoadingComponent] = useState(true);

  const activeView = viewData[activeTab] || null;

  /* -------------------------------------------------------------
     Reset tab when switching screens
  ------------------------------------------------------------- */
  useEffect(() => {
    setActiveTab(0);
  }, [viewData]);

  /* -------------------------------------------------------------
     Date Filters — Calendar systems
  ------------------------------------------------------------- */
  const getDateFiltersForActiveView = () => {
    if (!activeView) return {};
    const now = new Date();

    // Calendar List = next 30 days
    if (activeView.name === "CalendarList") {
      const startDate = now;
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30);
      return { startDate, endDate };
    }

    // Today = only today
    if (activeView.name === "CalendarToday") {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      return { startDate, endDate };
    }

    // Month view
    if (activeView.name === "Calendar") {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate, endDate };
    }

    return {};
  };

  /* -------------------------------------------------------------
     Fetch Records (now 100% recordType-driven)
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

        const dateFilters = getDateFiltersForActiveView();

        console.log("📦 Fetching:", {
          resolvedRecordType,
          dateFilters,
        });
console.log('Using record type:', resolvedRecordType);
const isAdmin = user.role === "admin";

        const response = await getRecords({
          recordType: resolvedRecordType,  // ⭐ Clean + dynamic
          token,
          subscriberId: user.subscriberId,
          userId: isAdmin ? undefined : user.userId,
          ...dateFilters,
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
    [token, user, resolvedRecordType, activeView]
  );

  /* Initial load */
  useEffect(() => {
    fetchRecords(false);
  }, [fetchRecords]);

  /* -------------------------------------------------------------
     Dynamic Component Loader (Vite glob mapping)
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!activeView?.component) {
      setViewComponent(() => FallbackComponent);
      setLoadingComponent(false);
      return;
    }

    setLoadingComponent(true);

    const modules = import.meta.glob('../components/**/*.jsx');
    const path = `../components/${activeView.component}.jsx`;

    console.log('🔍 Trying to load:', path);

    const importer = modules[path];

    if (!importer) {
      console.warn('Component not matched in glob:', activeView.component);
      console.log('Available modules:', Object.keys(modules));
      setViewComponent(() => FallbackComponent);
      setLoadingComponent(false);
      return;
    }

    importer()
      .then((mod) => setViewComponent(() => mod.default || mod))
      .catch((err) => {
        console.error('Dynamic import error:', err);
        setViewComponent(() => FallbackComponent);
      })
      .finally(() => setLoadingComponent(false));
  }, [activeView]);

  /* -------------------------------------------------------------
     Props passed to loaded view
  ------------------------------------------------------------- */
  const dynamicProps = {
    name: activeView?.name,
    displayName: activeView?.displayName,
    fields: mapFields(activeView?.fields),
    refreshing,
    recordType: resolvedRecordType,   // ⭐ Pass recordType into child view
    onRefresh: () => fetchRecords(true),
    data,
    appConfig,
  };

  const showMainLoader = loadingComponent || loadingData;

  /* -------------------------------------------------------------
     UI Output
  ------------------------------------------------------------- */
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* TABS */}
      {views.length > 0 && (
        <TabBar views={views} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* CONTENT CONTAINER */}
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
        {/* LOADER OVERLAY */}
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

        {/* ERROR STATE */}
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

        {/* MAIN COMPONENT */}
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
