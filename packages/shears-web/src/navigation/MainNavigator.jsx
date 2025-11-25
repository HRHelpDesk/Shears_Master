// packages/web/src/navigation/MainNavigator.js
import React, { useContext, useEffect, useState } from 'react';
import {
  Link,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router';
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

import { styled, useTheme } from '@mui/material/styles';
import SettingsDrawer from '../components/BaseUI/SettingsDrawer';
import StripeSuccess from '../components/Stripe/StripeSuccess';
import StripeReauth from '../components/Stripe/StripeReauth';
import { AuthContext } from '../context/AuthContext';
import SmartProfileCard from '../components/BaseUI/SmartWidgets/SmartProfileCard';

const drawerWidth = 250;
const collapsedWidth = 72;

/* ✅ MUI-styled drawer for mini-variant behavior */
const DrawerContainer = styled(Drawer)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    overflowX: 'hidden',
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
  },
}));

export default function MainNavigator({ appConfig, logo }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const {user, token} = useContext(AuthContext);
  const [open, setOpen] = useState(true);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  const toggleDrawer = () => setOpen((prev) => !prev);

  /* ==========================================================================
     Normalize view data for BasePage
  ========================================================================== */
  const normalizeViewData = (routes) =>
    routes.reduce((acc, route) => {
      const fields = route.fields || [];
      const views = route.views?.length
        ? route.views.map((view) => ({
            ...view,
            displayName: view.displayName || view.name,
            fields,
            data: view.data || [],
            icon: route.icon || {},
          }))
        : [
            {
              displayName: route.displayName || route.name,
              component: route.component || null,
              fields,
              data: route.data || [],
              icon: route.icon || {},
            },
          ];

      acc[route.name] = views;
      return acc;
    }, {});

  const mainViewData = normalizeViewData(appConfig.mainNavigation);
  const settingsViewData = normalizeViewData(appConfig.settings.flat());

  /* ==========================================================================
     Settings selection
  ========================================================================== */
  const handleSelectSetting = (item) => {
    navigate(`/settings/${item.name}`);
    setSettingsDrawerOpen(false);
  };

  /* ==========================================================================
     Render
  ========================================================================== */
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* ====================== APP BAR ================================ */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Left side */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={toggleDrawer} color="inherit" edge="start" sx={{ mr: 2 }}>
              <i className="fa fa-bars" />
            </IconButton>
          </Box>

          {/* Right side */}
          <Box>
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => setSettingsDrawerOpen(true)}>
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

      {/* ====================== SIDEBAR DRAWER ================================ */}
      <DrawerContainer
        variant="permanent"
        sx={{
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            background: `linear-gradient(
              180deg,
              ${theme.palette.primary.main} 0%,
              ${theme.palette.secondary.main} 100%
            )`,
            color: theme.palette.primary.contrastText,
          },
        }}
      >
       {/* Logo */}
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 2,
    mt: 8,
  }}
>
  <SmartProfileCard user={user} open={open}/>
</Box>
        <Divider sx={{ bgcolor: theme.palette.divider, my: 1 }} />

        {/* NAVIGATION LIST */}
        <List sx={{ mt: 1 }}>
          {appConfig.mainNavigation.filter(item => {
        // If no permissions array → allow it
        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((route) => {
            const routePath = `/${route.name.toLowerCase()}`;
            const selected = location.pathname === routePath;

            return (
              <Tooltip
                key={route.name}
                title={!open ? route.displayName : ''}
                placement="right"
              >
                <ListItemButton
                  component={Link}
                  to={routePath}
                  selected={selected}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2 : 1.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: theme.palette.primary.contrastText,
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
          {appConfig.subNavigation.filter(item => {
        // If no permissions array → allow it
        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((route) => {
            console.log(route)
            console.log(route.name)
            const routePath = `/${route.name.toLowerCase()}`;
            const selected = location.pathname === routePath;

            return (
              <Tooltip
                key={route.name}
                title={!open ? route.displayName : ''}
                placement="right"
              >
                <ListItemButton
                  component={Link}
                  to={routePath}
                  selected={selected}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    justifyContent: open ? 'initial' : 'center',
                    px: open ? 2 : 1.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.action.selected,
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: theme.palette.primary.contrastText,
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

     {/* ====================== MAIN CONTENT ================================ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          ml: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          p: 3,
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
          height: 'calc(100vh - 64px)',
        }}
      >
        <Routes>

          {/* ✅ MAIN NAVIGATION ROUTES */}
          {appConfig.mainNavigation.filter(item => {
        // If no permissions array → allow it
        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((route) => {
            const viewData = mainViewData[route.name];

            return (
              <Route
                key={route.name}
                path={`/${route.name.toLowerCase()}`}
                element={
                  <BasePage
                    appConfig={appConfig}
                    name={route.name}
                    viewData={viewData}
                  />
                }
              />
            );
          })}

          {/* ✅ ✅ SUB NAVIGATION ROUTES (FIXED) */}
          {appConfig.subNavigation?.filter(item => {
        // If no permissions array → allow it
        if (!item.permissions) return true;

        // If permissions exist, check user.role
        return item.permissions.includes(user.role);
      }).map((route) => {
            // Normalize view data for this single route
            const subViewData = normalizeViewData([route])[route.name];

            return (
              <Route
                key={route.name}
                path={`/${route.name.toLowerCase()}`}
                element={
                  <BasePage
                    appConfig={appConfig}
                    name={route.name}
                    viewData={subViewData}
                  />
                }
              />
            );
          })}

          {/* ✅ SETTINGS ROUTES */}
          <Route
            path="/settings/:name"
            element={
              (() => {
                const routeName = location.pathname.split('/').pop();
                const settingData = settingsViewData[routeName] || [];

                if (!settingData.length)
                  return <Navigate to={`/${appConfig.defaultRoute.toLowerCase()}`} />;

                return (
                  <BasePage
                    appConfig={appConfig}
                    name={routeName}
                    viewData={settingData}
                  />
                );
              })()
            }
          />

          {/* ✅ DEFAULT REDIRECT */}
          <Route
            path="*"
            element={<Navigate to={`/${appConfig.defaultRoute.toLowerCase()}`} />}
          />
        </Routes>

        {/* ====================== SETTINGS DRAWER ================================ */}
        {settingsDrawerOpen && (
          <SettingsDrawer
            onClose={() => setSettingsDrawerOpen(false)}
            settings={appConfig.settings}
            onSelectSetting={handleSelectSetting}
          />
        )}
      </Box>

    </Box>
  );
}
