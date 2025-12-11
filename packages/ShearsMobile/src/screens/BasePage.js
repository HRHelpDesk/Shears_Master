// BasePage.js
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import TabBar from '../components/UI/TabBar';
import PageHeader from '../components/UI/PageHeader';
import COMPONENTS from '../config/component-mapping/ComponentMap';
import { mapFields } from 'shears-shared/src/config/fieldMapper';
import { getRecords } from 'shears-shared/src/Services/Authentication';
import { AuthContext } from '../context/AuthContext';

const FallbackComponent = () => (
  <View style={styles.fallback}>
    <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>
      ⚠️ Component not found. Check your component mapping.
    </Text>
  </View>
);

export default function BasePage({ appConfig, name, viewData = [], displayName, settings = [], subNav, recordType }) {
  const isFocused = useIsFocused();
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);
  const route = subNav 
    ? appConfig.subNavigation.find((r) => r.name === name)
    : appConfig.mainNavigation.find((r) => r.name === name);
  
  const views = route?.views || [];

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map view components safely - memoize to prevent recalculation
  const activeViews = useMemo(() => {
    return views.map((view) => {
      const Component = COMPONENTS[view.mobileComponent];
      if (!Component) {
        console.warn(`⚠️ Missing component: ${view.mobileComponent}. Using fallback.`);
      }
      return { ...view, component: Component || FallbackComponent };
    });
  }, [views]);

  const activeView = activeViews[activeTab] || null;
  const fieldsFromConfig = route?.fields || viewData[activeTab]?.fields || [];
  const mappedFields = mapFields(fieldsFromConfig);

  /**
   * ✅ Calculate date filters based on active view name
   */
  const getDateFiltersForActiveView = (viewName) => {
    if (!viewName) return {};

    const now = new Date();
    console.log('Calculating date filters for view:', viewName);

    // Calendar List = next 30 days
    if (viewName === "CalendarList") {
      const startDate = now;
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30);
      return { startDate, endDate };
    }

    // Today view = today only
     if (viewName === "CalendarToday" || viewName === "CalendarHourly") {
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 10);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 10);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

    // Calendar Month View = start/end of current month
    if (viewName === "Calendar") {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { startDate, endDate };
    }

    return {};
  };

  /**
   * ✅ Fetch records with date filters
   */
  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      if (!token || !user?.subscriberId) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const dateFilters = getDateFiltersForActiveView(activeView?.name);

        const response = await getRecords({
          recordType: recordType.toLowerCase(),
          token,
          subscriberId: user.subscriberId,
          userId: user.userId,
          ...dateFilters,
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
    [token, user, name, activeView?.name] // Only depend on the view NAME, not the whole object
  );

  // ✅ Reset to first tab when views change
  useEffect(() => {
    setActiveTab(0);
  }, [viewData]); // Use viewData instead of views

  // 🔄 Initial load only
  useEffect(() => {
    if (!hasLoadedOnce) {
      fetchRecords(false);
      setHasLoadedOnce(true);
    }
  }, [fetchRecords, hasLoadedOnce]);

  // 🔄 Refresh when screen comes into focus (but NOT on initial mount)
  useEffect(() => {
    if (isFocused && hasLoadedOnce) {
      fetchRecords(true);
    }
  }, [isFocused, hasLoadedOnce]); // Removed fetchRecords and activeTab

  // 🔄 Refresh when active tab changes (but not on initial mount)
  useEffect(() => {
    if (hasLoadedOnce) {
      fetchRecords(true);
    }
  }, [activeTab]); // Only activeTab dependency

  const dynamicProps = {
    name: activeView?.displayName || name,
    recordType: recordType.toLowerCase() || name.toLowerCase(),
    fields: mappedFields,
    data: data,
    appConfig,
    refreshing,
    onRefresh: () => fetchRecords(true),
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.fallback, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurface }}>⚠️ {error}</Text>
      </View>
    );
  }

  const ActiveComponent = activeViews[activeTab]?.component || FallbackComponent;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <PageHeader 
        title={displayName} 
        appConfig={appConfig} 
        settings={settings || null}
      />

      {activeViews.length > 1 ? (
        <TabBar
          views={activeViews}
          dynamicProps={dynamicProps}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      ) : (
        <ActiveComponent {...dynamicProps} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderTopWidth: 0.5 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});