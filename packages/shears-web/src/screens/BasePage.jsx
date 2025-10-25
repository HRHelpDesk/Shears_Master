// src/screens/BasePage.js
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import TabBar from '../components/UI/TabBar';
import { dummyUsers } from 'shears-shared/src/AppData/dummy-data/dummydata';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { dummyServices } from 'shears-shared/src/AppData/dummy-data/dummyServices';

export default function BasePage({ appConfig, name, viewData = [] }) {
  const route = appConfig.mainNavigation.find((r) => r.name === name);
  const views = route?.views || [];
  const [activeTab, setActiveTab] = useState(0);
  const [ViewComponent, setViewComponent] = useState(() => FallbackComponent);

  const activeView = views[activeTab] || null;

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
    console.group(`🧭 BasePage: ${name}`);
    console.log("Route:", route);
    console.log("ViewData:", viewData);
    console.log("Views:", views);
    console.log("Active View:", activeView);
    console.log("dummy data", dummyServices)
    console.groupEnd();
  }, [name, viewData, views, activeView]);

  // Dynamic import of component
  useEffect(() => {
    if (activeView?.component) {
      import(`../components/${activeView.component}`)
        .then((mod) => setViewComponent(() => mod.default))
        .catch(() => setViewComponent(() => FallbackComponent));
    } else {
      setViewComponent(() => FallbackComponent);
    }
  }, [activeView]);

  // 🔹 Map fields through fieldMapper
  const fieldsFromConfig = activeView?.fields || viewData[activeTab]?.fields || [];
  const mappedFields = mapFields(fieldsFromConfig);

console.log(dummyServices)
  const dynamicProps = {
    name: route?.displayName || name,
    fields: mappedFields,
    data:name === 'Contacts' ? dummyUsers : dummyServices,
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
