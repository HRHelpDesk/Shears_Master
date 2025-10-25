// BasePage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

export default function BasePage({ appConfig, name, viewData = [] }) {
  const isFocused = useIsFocused();
  const theme = useTheme();
  const { token, user } = useContext(AuthContext);

  const route = appConfig.mainNavigation.find((r) => r.name === name);
  const views = route?.views || [];

  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map view components safely
  const activeViews = views.map((view) => {
    const Component = COMPONENTS[view.mobileComponent];
    if (!Component) {
      console.warn(`⚠️ Missing component: ${view.mobileComponent}. Using fallback.`);
    }
    return { ...view, component: Component || FallbackComponent };
  });

  const activeView = activeViews[activeTab] || null;
  const fieldsFromConfig = activeView?.fields || viewData[activeTab]?.fields || [];
  const mappedFields = mapFields(fieldsFromConfig);

  /**
   * ✅ Fetch records
   * - `isRefresh = true` → only updates list (no page reload)
   * - `isRefresh = false` → used for initial load
   */
  const fetchRecords = useCallback(
    async (isRefresh = false) => {
      if (!token || !user?.subscriberId) return;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

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
        else setLoading(false);
      }
    },
    [token, user, name]
  );

  // 🔄 Auto-fetch when screen comes into focus
  useEffect(() => {
    if (isFocused) fetchRecords(false);
  }, [isFocused, fetchRecords]);

  const dynamicProps = {
    name: activeView?.displayName || name,
    fields: mappedFields,
    data,
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <PageHeader title={name} appConfig={appConfig} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderTopWidth: 0.5 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
