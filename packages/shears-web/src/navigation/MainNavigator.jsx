// packages/web/src/navigation/MainNavigator.js
import React, { useState } from 'react';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router';
import BasePage from '../screens/BasePage';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const drawerWidth = 250;
const collapsedWidth = 72;

// Styled Drawer
const DrawerContainer = styled(Drawer)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    overflowX: 'hidden',
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
    color: 'white',
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

// Precompute viewData



export default function MainNavigator({ appConfig, logo }) {
  const location = useLocation();
  const { primary, secondary } = appConfig.themeColors;

  const [open, setOpen] = useState(true);
  const toggleDrawer = () => setOpen((prev) => !prev);

  const viewData = appConfig.mainNavigation.reduce((acc, route) => {
  // If the route has views, map each view by index or name
  if (route.views) {
    acc[route.name] = route.views.map((view) => ({
      displayName: view.displayName || view.name,
      component: view.component,
      fields: view.fields || [],
      data: view.data || [],
      icon: route.icon, // optional
    }));
  } else {
    // If no views, just put route-level info
    acc[route.name] = [
      {
        displayName: route.name,
        component: route.component || null,
        fields: route.fields || [],
        data: route.data || [],
        icon: route.icon,
      },
    ];
  }
  return acc;
}, {});

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: primary,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={toggleDrawer} color="inherit" edge="start" sx={{ mr: 2 }}>
              <i className="fa fa-bars" />
            </IconButton>
          </Box>
          <Box>
            <Tooltip title="Settings">
              <IconButton color="inherit">
                <i className="fa fa-cog" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Profile">
              <IconButton color="inherit" component={Link} to="/profile">
                <i className="fa fa-user-circle" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <DrawerContainer
        variant="permanent"
        sx={{
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            background: `linear-gradient(180deg, ${primary} 0%, ${secondary} 100%)`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            mt: 8,
          }}
        >
          <img
            src={logo}
            alt="App Logo"
            style={{
              width: open ? '70%' : '40px',
              borderRadius: 8,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 1 }} />

        {/* Nav List */}
        <List sx={{ mt: 1 }}>
          {appConfig.mainNavigation.map((route) => {
            const routePath = `/${route.name.toLowerCase()}`;
            const selected = location.pathname === routePath;
            return (
              <Tooltip key={route.name} title={!open ? route.name : ''} placement="right">
                <ListItemButton
                  component={Link}
                  to={routePath}
                  selected={selected}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    color: '#fff',
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2 : 1.5,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: 'inherit',
                      minWidth: 0,
                      mr: open ? 1.5 : 0,
                      justifyContent: 'center',
                    }}
                  >
                    {route.icon.web ? (
                      <i className={route.icon.web} style={{ fontSize: 18 }} />
                    ) : (
                      <span />
                    )}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={route.displayName}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </DrawerContainer>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          transition: (theme) =>
            theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          ml: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
          p: 3,
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          height: 'calc(100vh - 64px)',
        }}
      >
        <Routes>
          {appConfig.mainNavigation.map((route) => (
            <Route
              key={route.name}
              path={`/${route.name.toLowerCase()}`}
              element={<BasePage appConfig={appConfig} name={route.name} viewData={viewData[route.name]} />}
            />
          ))}
          <Route
            path="*"
            element={<Navigate to={`/${appConfig.defaultRoute.toLowerCase()}`} />}
          />
        </Routes>
      </Box>
    </Box>
  );
}
